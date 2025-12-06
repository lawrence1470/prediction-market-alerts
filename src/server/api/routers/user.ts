/**
 * User Router
 *
 * Manages user preferences and settings.
 * All procedures use protectedProcedure - authenticated users only.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Simple phone validation regex (E.164 format or common US formats)
const phoneRegex = /^(\+1)?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

export const userRouter = createTRPCRouter({
  /**
   * Get current user's preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        wantsSportsAlerts: true,
        phone: true,
        phonePromptDismissedAt: true,
        phonePromptDismissCount: true,
      },
    });

    return user;
  }),

  /**
   * Update sports alerts interest
   * Sets whether user wants to be notified when sports alerts become available
   */
  setSportsInterest: protectedProcedure
    .input(z.object({ interested: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { wantsSportsAlerts: input.interested },
        select: { wantsSportsAlerts: true },
      });

      console.log("[User] Updated sports interest:", {
        userId: ctx.session.user.id,
        wantsSportsAlerts: input.interested,
      });

      return user;
    }),

  /**
   * Set phone number for SMS alerts
   * Normalizes phone to E.164 format before storing
   */
  setPhoneNumber: protectedProcedure
    .input(
      z.object({
        phone: z
          .string()
          .regex(phoneRegex, "Please enter a valid US phone number"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Normalize to digits only, then add +1 prefix
      const digitsOnly = input.phone.replace(/\D/g, "");
      const normalized = digitsOnly.startsWith("1")
        ? `+${digitsOnly}`
        : `+1${digitsOnly}`;

      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          phone: normalized,
          phonePromptDismissedAt: null,
          phonePromptDismissCount: 0,
        },
        select: { phone: true },
      });

      console.log("[User] Phone number set:", {
        userId: ctx.session.user.id,
        phone: normalized,
      });

      return user;
    }),

  /**
   * Remove phone number
   */
  removePhoneNumber: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { phone: null },
    });

    console.log("[User] Phone number removed:", {
      userId: ctx.session.user.id,
    });

    return { success: true };
  }),

  /**
   * Dismiss phone prompt (user clicked "Maybe Later")
   * Tracks dismissal count to avoid over-prompting
   */
  dismissPhonePrompt: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: {
        phonePromptDismissedAt: new Date(),
        phonePromptDismissCount: { increment: 1 },
      },
      select: { phonePromptDismissCount: true },
    });

    console.log("[User] Phone prompt dismissed:", {
      userId: ctx.session.user.id,
      dismissCount: user.phonePromptDismissCount,
    });

    return user;
  }),
});
