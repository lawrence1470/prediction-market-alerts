import { z } from "zod";
import { EventsApi, Configuration } from "kalshi-typescript";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Use the public elections API (no auth required)
const configuration = new Configuration({
  basePath: "https://api.elections.kalshi.com/trade-api/v2",
});

const eventsApi = new EventsApi(configuration);

// Simple in-memory cache for events list
interface CachedEvents {
  data: EventWithVolume[];
  timestamp: number;
}

interface EventWithVolume {
  eventTicker: string;
  title: string;
  subTitle: string;
  category: string;
  totalVolume: number;
  marketCount: number;
}

let eventsCache: CachedEvents | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const kalshiRouter = createTRPCRouter({
  getEvent: publicProcedure
    .input(z.object({ eventTicker: z.string().min(1) }))
    .query(async ({ input }) => {
      const response = await eventsApi.getEvent(input.eventTicker, true);
      return response.data;
    }),

  // Fetch open events, sorted by popularity (total volume)
  getEvents: publicProcedure.query(async () => {
    // Check cache
    if (eventsCache && Date.now() - eventsCache.timestamp < CACHE_TTL_MS) {
      return eventsCache.data;
    }

    // Fetch ALL events using pagination
    type KalshiEvent = {
      event_ticker?: string;
      title?: string;
      sub_title?: string;
      category?: string;
      markets?: { volume?: number }[];
    };
    const allEvents: KalshiEvent[] = [];
    let cursor: string | undefined = undefined;
    const MAX_PAGES = 10; // Safety limit
    let pageCount = 0;

    while (pageCount < MAX_PAGES) {
      const response = await eventsApi.getEvents(
        200, // limit (max per request)
        cursor,
        true, // with_nested_markets
        false, // with_milestones
        "open", // status - only open events
      );

      const events = response.data.events ?? [];
      allEvents.push(...events);

      // Check if there's a next page
      cursor = response.data.cursor ?? undefined;
      if (!cursor || events.length < 200) {
        break; // No more pages
      }
      pageCount++;
    }

    // Transform and calculate total volume per event
    const eventsWithVolume: EventWithVolume[] = allEvents.map((event) => {
      const markets = event.markets ?? [];
      const totalVolume = markets.reduce(
        (sum, market) => sum + (market.volume ?? 0),
        0,
      );

      return {
        eventTicker: event.event_ticker ?? "",
        title: event.title ?? "",
        subTitle: event.sub_title ?? "",
        category: event.category ?? "",
        totalVolume,
        marketCount: markets.length,
      };
    });

    // Sort by total volume (most popular first)
    eventsWithVolume.sort((a, b) => b.totalVolume - a.totalVolume);

    // Update cache
    eventsCache = {
      data: eventsWithVolume,
      timestamp: Date.now(),
    };

    return eventsWithVolume;
  }),
});
