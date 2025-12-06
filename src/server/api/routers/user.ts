/**
 * User Router
 *
 * Manages user preferences and settings.
 * All procedures use protectedProcedure - authenticated users only.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  /**
   * Get current user's preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        wantsSportsAlerts: true,
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
});
