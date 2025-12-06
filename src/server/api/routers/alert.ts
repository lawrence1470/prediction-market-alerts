/**
 * Alert Router
 *
 * Manages user news alerts for Kalshi events.
 * All procedures use protectedProcedure - authenticated users only.
 * Users can only view/modify their own alerts.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { EventsApi, Configuration } from "kalshi-typescript";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  subscribe,
  unsubscribe,
  generateSecret,
  SuperfeedrSubscriptionError,
  SuperfeedrTimeoutError,
} from "~/server/services/superfeedr";
import { extractEventTicker } from "~/server/services/query-generator";
import { getTopicUrlForEventWithLLM } from "~/server/services/llm-query-generator";

// Kalshi API client
const kalshiConfig = new Configuration({
  basePath: "https://api.elections.kalshi.com/trade-api/v2",
});
const kalshiEventsApi = new EventsApi(kalshiConfig);

// Categories not supported by our platform
const UNSUPPORTED_CATEGORIES = ["Sports"];

// Build the webhook callback URL
const getWebhookCallbackUrl = () => {
  // Priority: NEXT_PUBLIC_APP_URL (explicit) > VERCEL_URL (auto) > localhost
  // This ensures we use a stable production URL, not preview deployment URLs
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:4000");
  return `${baseUrl}/api/webhooks/superfeedr`;
};

export const alertRouter = createTRPCRouter({
  /**
   * Get all alerts for the current user
   */
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    const alerts = await ctx.db.userAlert.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        eventWebhook: {
          select: {
            eventTicker: true,
            status: true,
            searchQuery: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return alerts;
  }),

  /**
   * Add a new alert for a market ticker
   *
   * Flow:
   * 1. Extract event ticker from market ticker
   * 2. Check if EventWebhook exists
   * 3. If not, create Superfeedr subscription and EventWebhook
   * 4. Create UserAlert record
   * 5. Increment subscriber count
   */
  addAlert: protectedProcedure
    .input(
      z.object({
        marketTicker: z.string().min(1),
        eventTitle: z.string().optional(), // Event title from Kalshi API for better query generation
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const eventTicker = extractEventTicker(input.marketTicker);
      const userId = ctx.session.user.id;

      // Fetch event from Kalshi API to check category
      try {
        const response = await kalshiEventsApi.getEvent(eventTicker);
        const category = response.data.event?.category;

        if (category && UNSUPPORTED_CATEGORIES.includes(category)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${category} events are not currently supported. We focus on crypto, economic, and political markets.`,
          });
        }
      } catch (error) {
        // If it's our own TRPCError, rethrow it
        if (error instanceof TRPCError) {
          throw error;
        }
        // Log but don't block if Kalshi API fails - allow alert creation to proceed
        console.warn("[Alert] Could not verify event category from Kalshi API:", {
          eventTicker,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Check if user already has an alert for this market
      const existingAlert = await ctx.db.userAlert.findUnique({
        where: {
          userId_marketTicker: {
            userId,
            marketTicker: input.marketTicker,
          },
        },
      });

      if (existingAlert) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an alert for this market",
        });
      }

      // Check if EventWebhook exists for this event
      let eventWebhook = await ctx.db.eventWebhook.findUnique({
        where: { eventTicker },
      });

      if (!eventWebhook) {
        // Generate query and topic URL using LLM (with fallback to rule-based)
        const { query, topicUrl } = await getTopicUrlForEventWithLLM(
          eventTicker,
          input.eventTitle,
        );
        const secret = generateSecret();
        const callbackUrl = getWebhookCallbackUrl();

        // Track whether Superfeedr subscription succeeded
        let superfeedrStatus: "ACTIVE" | "PENDING" = "PENDING";

        // Subscribe to Superfeedr - if auth fails (401), continue with PENDING status
        try {
          await subscribe(topicUrl, callbackUrl, secret);
          superfeedrStatus = "ACTIVE";
        } catch (error) {
          if (error instanceof SuperfeedrSubscriptionError) {
            // 401 = credentials not configured - allow in dev with PENDING status
            if (error.statusCode === 401) {
              console.warn(
                "[Alert] Superfeedr credentials not configured. Creating alert with PENDING status.",
                { eventTicker },
              );
            } else {
              // Other Superfeedr errors - throw
              console.error("[Alert] Failed to subscribe to Superfeedr:", {
                eventTicker,
                error: error.message,
              });
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create alert. Please try again.",
              });
            }
          } else if (error instanceof SuperfeedrTimeoutError) {
            console.error("[Alert] Superfeedr timeout:", {
              eventTicker,
              error: error.message,
            });
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create alert. Please try again.",
            });
          } else {
            throw error;
          }
        }

        // Create EventWebhook with appropriate status
        eventWebhook = await ctx.db.eventWebhook.create({
          data: {
            eventTicker,
            superfeedrTopic: topicUrl,
            superfeedrSecret: secret,
            searchQuery: query,
            status: superfeedrStatus,
            subscriberCount: 0, // Will be incremented below
          },
        });
      }

      // Create UserAlert and increment subscriber count atomically
      const [userAlert] = await ctx.db.$transaction([
        ctx.db.userAlert.create({
          data: {
            userId,
            eventTicker,
            marketTicker: input.marketTicker,
            status: "ACTIVE",
          },
        }),
        ctx.db.eventWebhook.update({
          where: { eventTicker },
          data: {
            subscriberCount: { increment: 1 },
          },
        }),
      ]);

      console.log("[Alert] Created alert:", {
        userId,
        eventTicker,
        marketTicker: input.marketTicker,
      });

      return userAlert;
    }),

  /**
   * Remove an alert
   *
   * Flow:
   * 1. Verify ownership and delete UserAlert
   * 2. Decrement subscriber count
   * 3. If count reaches 0, unsubscribe from Superfeedr
   */
  removeAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Find the alert and verify ownership
      const alert = await ctx.db.userAlert.findUnique({
        where: { id: input.alertId },
        include: {
          eventWebhook: true,
        },
      });

      if (!alert) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alert not found",
        });
      }

      if (alert.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own alerts",
        });
      }

      // Delete the alert and decrement subscriber count atomically
      const [, updatedWebhook] = await ctx.db.$transaction([
        ctx.db.userAlert.delete({
          where: { id: input.alertId },
        }),
        ctx.db.eventWebhook.update({
          where: { eventTicker: alert.eventTicker },
          data: {
            subscriberCount: { decrement: 1 },
          },
        }),
      ]);

      // If no more subscribers, unsubscribe from Superfeedr
      if (updatedWebhook.subscriberCount <= 0) {
        try {
          const callbackUrl = getWebhookCallbackUrl();
          await unsubscribe(alert.eventWebhook.superfeedrTopic, callbackUrl);

          // Update status
          await ctx.db.eventWebhook.update({
            where: { eventTicker: alert.eventTicker },
            data: { status: "UNSUBSCRIBED" },
          });

          console.log("[Alert] Unsubscribed from Superfeedr:", {
            eventTicker: alert.eventTicker,
          });
        } catch (error) {
          // Log but don't fail the deletion - cleanup can happen later
          console.error("[Alert] Failed to unsubscribe from Superfeedr:", {
            eventTicker: alert.eventTicker,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      console.log("[Alert] Removed alert:", {
        userId,
        alertId: input.alertId,
        eventTicker: alert.eventTicker,
      });

      return { success: true };
    }),

  /**
   * Toggle alert status (ACTIVE/PAUSED)
   */
  toggleAlert: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Find the alert and verify ownership
      const alert = await ctx.db.userAlert.findUnique({
        where: { id: input.alertId },
      });

      if (!alert) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alert not found",
        });
      }

      if (alert.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only modify your own alerts",
        });
      }

      // Toggle status
      const newStatus = alert.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

      const updatedAlert = await ctx.db.userAlert.update({
        where: { id: input.alertId },
        data: { status: newStatus },
      });

      console.log("[Alert] Toggled alert:", {
        userId,
        alertId: input.alertId,
        newStatus,
      });

      return updatedAlert;
    }),
});
