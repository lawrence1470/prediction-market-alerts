import { z } from "zod";
import { EventsApi, Configuration } from "kalshi-typescript";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Use the public elections API (no auth required)
const configuration = new Configuration({
  basePath: "https://api.elections.kalshi.com/trade-api/v2",
});

const eventsApi = new EventsApi(configuration);

export const kalshiRouter = createTRPCRouter({
  getEvent: publicProcedure
    .input(z.object({ eventTicker: z.string() }))
    .query(async ({ input }) => {
      const response = await eventsApi.getEvent(input.eventTicker, true);
      return response.data;
    }),
});
