import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

const MarketSchema = z.object({
  ticker: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  yes_sub_title: z.string().optional(),
  no_sub_title: z.string().optional(),
  status: z.string(),
  market_type: z.string(),
  close_time: z.string(),
  expiration_time: z.string(),
  last_price: z.number(),
  yes_bid: z.number(),
  yes_ask: z.number(),
  no_bid: z.number(),
  no_ask: z.number(),
  volume: z.number(),
  volume_24h: z.number(),
  open_interest: z.number(),
  event_ticker: z.string(),
});

const EventSchema = z.object({
  event_ticker: z.string(),
  series_ticker: z.string(),
  title: z.string(),
  sub_title: z.string().optional(),
  category: z.string(),
  mutually_exclusive: z.boolean(),
  markets: z.array(MarketSchema).optional(),
});

const EventResponseSchema = z.object({
  event: EventSchema,
  markets: z.array(MarketSchema).optional(),
});

export const kalshiRouter = createTRPCRouter({
  getEvent: publicProcedure
    .input(z.object({ eventTicker: z.string() }))
    .query(async ({ input }) => {
      const url = new URL(`${KALSHI_API_BASE}/events/${input.eventTicker}`);
      url.searchParams.set("with_nested_markets", "true");

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: { message?: string } };
        throw new Error(errorData.error?.message ?? "Failed to fetch event");
      }

      return EventResponseSchema.parse(await response.json());
    }),
});
