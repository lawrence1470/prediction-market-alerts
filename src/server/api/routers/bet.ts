import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const betRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        eventTicker: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
        category: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.bet.create({
        data: {
          eventTicker: input.eventTicker,
          title: input.title,
          subtitle: input.subtitle,
          category: input.category,
          userId: ctx.session.user.id,
        },
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.bet.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.bet.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
