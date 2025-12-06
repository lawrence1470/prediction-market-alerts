/**
 * Query Generator Service (Fallback)
 *
 * Parses Kalshi event tickers and generates Superfeedr track feed queries.
 * This is used as a fallback when LLM-based generation is unavailable.
 *
 * Kalshi Ticker Hierarchy:
 * - Series: KXBTC (market category)
 * - Event: KXBTC-25DEC05 (specific date/event)
 * - Market: KXBTC-25DEC05-T95 (specific bet outcome)
 *
 * Note: Sports events are blocked at the API level and not supported.
 */

import {
  CRYPTO_ASSETS,
  ECONOMIC_EVENTS,
  QUERY_EXCLUSIONS,
  SERIES_CATEGORIES,
} from "~/server/constants/entity-mappings";

export interface ParsedTicker {
  series: string;
  eventDate?: string;
  entities: string[];
  eventTicker: string;
  marketTicker?: string;
  category?: string;
}

/**
 * Parse a Kalshi market or event ticker into its components
 *
 * Examples:
 * - "KXBTC-25DEC05" -> { series: "KXBTC", eventDate: "25DEC05", entities: ["BTC"], ... }
 * - "KXFED-25JAN" -> { series: "KXFED", eventDate: "25JAN", entities: ["FED"], ... }
 *
 * @param ticker - The full market ticker or event ticker
 * @returns Parsed ticker components
 */
export function parseEventTicker(ticker: string): ParsedTicker {
  const parts = ticker.split("-");

  if (parts.length === 0 || !parts[0]) {
    throw new Error(`Invalid ticker format: ${ticker}`);
  }

  const series = parts[0];
  let eventDate: string | undefined;
  const entities: string[] = [];
  let eventTicker = series;
  let marketTicker: string | undefined;

  // Determine category from series prefix
  const category = Object.entries(SERIES_CATEGORIES).find(([prefix]) =>
    series.startsWith(prefix),
  )?.[1];

  if (parts.length >= 2 && parts[1]) {
    const eventPart = parts[1];

    // Crypto format: 25DEC05 (just date, asset derived from series)
    if (category === "crypto") {
      eventDate = eventPart;
      // Extract crypto asset from series (e.g., KXBTC -> BTC)
      const assetMatch = /KX([A-Z]+)/.exec(series);
      if (assetMatch?.[1] && CRYPTO_ASSETS[assetMatch[1]]) {
        entities.push(assetMatch[1]);
      }
      eventTicker = `${series}-${eventPart}`;
    }
    // Economic format: similar to crypto
    else if (category === "economic") {
      eventDate = eventPart;
      const eventMatch = /KX([A-Z]+)/.exec(series);
      if (eventMatch?.[1] && ECONOMIC_EVENTS[eventMatch[1]]) {
        entities.push(eventMatch[1]);
      }
      eventTicker = `${series}-${eventPart}`;
    }
    // Unknown format: just use series and first part
    else {
      eventTicker = `${series}-${eventPart}`;
    }
  }

  // If there's a third part, it's the market outcome
  if (parts.length >= 3) {
    marketTicker = ticker;
  }

  return {
    series,
    eventDate,
    entities,
    eventTicker,
    marketTicker: marketTicker ?? ticker,
    category,
  };
}

/**
 * Generate a Superfeedr track query for an event ticker
 *
 * @param eventTicker - The Kalshi event ticker
 * @returns The search query string for Superfeedr
 */
export function generateQuery(eventTicker: string): string {
  const parsed = parseEventTicker(eventTicker);
  const searchTerms: string[] = [];

  // Build search terms based on category
  if (parsed.category === "crypto") {
    for (const entity of parsed.entities) {
      const asset = CRYPTO_ASSETS[entity];
      if (asset) {
        searchTerms.push(`"${asset.searchTerms[0]}"`);
      }
    }
  } else if (parsed.category === "economic") {
    for (const entity of parsed.entities) {
      const event = ECONOMIC_EVENTS[entity];
      if (event) {
        // Economic events often need OR for multiple terms
        const terms = event.searchTerms.slice(0, 2).map((t) => `"${t}"`);
        searchTerms.push(`(${terms.join(" | ")})`);
      }
    }
  }

  // Fallback: if no entities were found, use the event ticker itself as a search term
  // This ensures unique topic URLs even for unsupported event types
  if (searchTerms.length === 0) {
    searchTerms.push(`"${eventTicker}"`);
  }

  // Add exclusions to reduce noise
  const exclusions = QUERY_EXCLUSIONS.join(" ");

  // Add popularity filter for quality
  const query = `${searchTerms.join(" ")} ${exclusions} popularity:medium`;

  return query.trim();
}

/**
 * Build the full Superfeedr track feed topic URL
 *
 * @param query - The search query string
 * @returns The complete topic URL for Superfeedr subscription
 */
export function buildTopicUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `http://track.superfeedr.com/?query=${encodedQuery}`;
}

/**
 * Extract the event ticker from a market ticker
 *
 * @param marketTicker - Full market ticker (e.g., "KXBTC-25DEC05-T95")
 * @returns Event ticker (e.g., "KXBTC-25DEC05")
 */
export function extractEventTicker(marketTicker: string): string {
  const parts = marketTicker.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return marketTicker;
}
