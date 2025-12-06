/**
 * Subscription Router
 *
 * Manages user subscriptions and Stripe integration.
 * Handles checkout, billing portal, and subscription status.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { stripe, TIER_LIMITS, STRIPE_PRICES } from "~/server/stripe/client";
import { env } from "~/env";

export const subscriptionRouter = createTRPCRouter({
  /**
   * Get current user's subscription status
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    let subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    // Create free tier subscription if none exists
    if (!subscription) {
      subscription = await ctx.db.subscription.create({
        data: {
          userId: ctx.session.user.id,
          tier: "FREE",
          status: "ACTIVE",
          maxAlerts: TIER_LIMITS.FREE.maxAlerts,
          maxNotificationsPerAlert: TIER_LIMITS.FREE.maxNotificationsPerAlert,
        },
      });
    }

    return subscription;
  }),

  /**
   * Get usage stats for current billing period
   */
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const alertCount = await ctx.db.userAlert.count({
      where: { userId: ctx.session.user.id },
    });

    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    return {
      alertCount,
      maxAlerts: subscription?.maxAlerts ?? TIER_LIMITS.FREE.maxAlerts,
      tier: subscription?.tier ?? "FREE",
    };
  }),

  /**
   * Create Stripe checkout session for Pro subscription
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        interval: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Stripe is not configured",
        });
      }

      const priceId =
        input.interval === "yearly"
          ? STRIPE_PRICES.PRO_YEARLY
          : STRIPE_PRICES.PRO_MONTHLY;

      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Price ID not configured",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        include: { subscription: true },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Create or retrieve Stripe customer
      let customerId = user.subscription?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;

        // Update subscription record with customer ID
        await ctx.db.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            stripeCustomerId: customerId,
            tier: "FREE",
            status: "ACTIVE",
            maxAlerts: TIER_LIMITS.FREE.maxAlerts,
            maxNotificationsPerAlert: TIER_LIMITS.FREE.maxNotificationsPerAlert,
          },
          update: {
            stripeCustomerId: customerId,
          },
        });
      }

      // Create checkout session
      const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000";
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/dashboard?checkout=success`,
        cancel_url: `${appUrl}/pricing?checkout=canceled`,
        metadata: {
          userId: user.id,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
      });

      return { sessionId: session.id, url: session.url };
    }),

  /**
   * Create billing portal session for managing subscription
   */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!stripe) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe is not configured",
      });
    }

    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active subscription found",
      });
    }

    const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000";
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return { url: session.url };
  }),

  /**
   * Cancel subscription at period end
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!stripe) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe is not configured",
      });
    }

    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active subscription found",
      });
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await ctx.db.subscription.update({
      where: { userId: ctx.session.user.id },
      data: { cancelAtPeriodEnd: true },
    });

    console.log("[Subscription] Canceled at period end:", {
      userId: ctx.session.user.id,
    });

    return { success: true };
  }),

  /**
   * Resume canceled subscription (if still in billing period)
   */
  resumeSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    if (!stripe) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe is not configured",
      });
    }

    const subscription = await ctx.db.subscription.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No subscription to resume",
      });
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await ctx.db.subscription.update({
      where: { userId: ctx.session.user.id },
      data: { cancelAtPeriodEnd: false },
    });

    console.log("[Subscription] Resumed:", {
      userId: ctx.session.user.id,
    });

    return { success: true };
  }),
});
