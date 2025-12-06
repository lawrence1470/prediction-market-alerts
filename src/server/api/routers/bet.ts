import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EventsApi, Configuration } from "kalshi-typescript";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Kalshi API configuration (same as kalshi.ts)
const configuration = new Configuration({
  basePath: "https://api.elections.kalshi.com/trade-api/v2",
});
const eventsApi = new EventsApi(configuration);

// Cache for event status (avoid repeated API calls)
interface CachedEventStatus {
  isActive: boolean;
  result: string | null; // "yes" | "no" | null
  expiresAt: Date | null;
  timestamp: number;
}

const eventStatusCache = new Map<string, CachedEventStatus>();
const STATUS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getEventStatus(eventTicker: string): Promise<CachedEventStatus> {
  // Check cache first
  const cached = eventStatusCache.get(eventTicker);
  if (cached && Date.now() - cached.timestamp < STATUS_CACHE_TTL_MS) {
    return cached;
  }

  try {
    const response = await eventsApi.getEvent(eventTicker, true);
    const event = response.data.event;
    const markets = event?.markets ?? [];

    // Check if any market is still active
    const isActive = markets.some(
      (m: { status?: string }) => m.status === "active"
    );

    // Get result if resolved (check first market's result)
    const resolvedMarket = markets.find(
      (m: { result?: string }) => m.result && m.result !== ""
    );
    const result = resolvedMarket?.result ?? null;

    // Get latest expiration time
    const expiresAt = markets.reduce((latest: Date | null, m: { expiration_time?: string }) => {
      if (!m.expiration_time) return latest;
      const exp = new Date(m.expiration_time);
      return !latest || exp > latest ? exp : latest;
    }, null);

    const status: CachedEventStatus = {
      isActive,
      result,
      expiresAt,
      timestamp: Date.now(),
    };

    eventStatusCache.set(eventTicker, status);
    return status;
  } catch {
    // If API fails, assume still active (don't hide user's bets)
    return {
      isActive: true,
      result: null,
      expiresAt: null,
      timestamp: Date.now(),
    };
  }
}

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
      // Check if user already has this bet
      const existingBet = await ctx.db.bet.findFirst({
        where: {
          eventTicker: input.eventTicker,
          userId: ctx.session.user.id,
        },
      });

      if (existingBet) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already tracking this event.",
        });
      }

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
    const bets = await ctx.db.bet.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Enrich bets with current status from Kalshi API (parallelized)
    const enrichedBets = await Promise.all(
      bets.map(async (bet) => {
        const status = await getEventStatus(bet.eventTicker);
        return {
          ...bet,
          isActive: status.isActive,
          result: status.result,
          expiresAt: status.expiresAt,
        };
      })
    );

    return enrichedBets;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.bet.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
