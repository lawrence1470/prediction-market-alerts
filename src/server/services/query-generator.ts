/**
 * Query Generator Service
 *
 * Parses Kalshi event tickers and generates Superfeedr track feed queries.
 *
 * Kalshi Ticker Hierarchy:
 * - Series: KXNFLSPREAD (market category)
 * - Event: KXNFLSPREAD-25DEC04DALDET (specific matchup/event)
 * - Market: KXNFLSPREAD-25DEC04DALDET-DET9 (specific bet outcome)
 *
 * We subscribe at the EVENT level for news alerts.
 */

import {
  NFL_TEAMS,
  NBA_TEAMS,
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
 * - "KXNFLSPREAD-25DEC04DALDET-DET9" -> { series: "KXNFLSPREAD", eventDate: "25DEC04", entities: ["DAL", "DET"], ... }
 * - "KXBTC-25DEC05" -> { series: "KXBTC", eventDate: "25DEC05", entities: ["BTC"], ... }
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

    // NFL format: 25DEC04DALDET (date + team codes)
    if (category === "nfl") {
      // Extract date (first 7 chars: YYMMMDD)
      const dateMatch = /^(\d{2}[A-Z]{3}\d{2})/.exec(eventPart);
      if (dateMatch?.[1]) {
        eventDate = dateMatch[1];
        // Extract team codes (remaining chars, 3 each)
        const teamsPart = eventPart.slice(7);
        if (teamsPart.length >= 6) {
          const team1 = teamsPart.slice(0, 3);
          const team2 = teamsPart.slice(3, 6);
          // Handle 2-char team codes like GB, KC, SF, TB, NE, NO, LV
          if (NFL_TEAMS[team1]) {
            entities.push(team1);
          } else {
            // Try 2-char code
            const twoChar1 = teamsPart.slice(0, 2);
            if (NFL_TEAMS[twoChar1]) {
              entities.push(twoChar1);
              const remaining = teamsPart.slice(2);
              if (remaining.length >= 3) {
                entities.push(remaining.slice(0, 3));
              } else if (remaining.length >= 2 && NFL_TEAMS[remaining.slice(0, 2)]) {
                entities.push(remaining.slice(0, 2));
              }
            }
          }
          if (entities.length < 2 && NFL_TEAMS[team2]) {
            entities.push(team2);
          }
        }
      }
      eventTicker = `${series}-${eventPart}`;
    }
    // NBA format: 25DEC05LALBOS (date + team codes)
    else if (category === "nba") {
      // Extract date (first 7 chars: YYMMMDD)
      const dateMatch = /^(\d{2}[A-Z]{3}\d{2})/.exec(eventPart);
      if (dateMatch?.[1]) {
        eventDate = dateMatch[1];
        // Extract team codes (remaining chars, 3 each)
        const teamsPart = eventPart.slice(7);
        if (teamsPart.length >= 6) {
          const team1 = teamsPart.slice(0, 3);
          const team2 = teamsPart.slice(3, 6);
          if (NBA_TEAMS[team1]) {
            entities.push(team1);
          }
          if (NBA_TEAMS[team2]) {
            entities.push(team2);
          }
        }
      }
      eventTicker = `${series}-${eventPart}`;
    }
    // Crypto format: 25DEC05 (just date, asset derived from series)
    else if (category === "crypto") {
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
  if (parsed.category === "nfl") {
    const teamTerms: string[] = [];
    for (const entity of parsed.entities) {
      const team = NFL_TEAMS[entity];
      if (team) {
        // Use quoted full name for precision
        teamTerms.push(`"${team.searchTerms[0]}"`);
      }
    }
    if (teamTerms.length > 0) {
      // OR the team names together
      searchTerms.push(`(${teamTerms.join(" | ")})`);
    }
  } else if (parsed.category === "nba") {
    const teamTerms: string[] = [];
    for (const entity of parsed.entities) {
      const team = NBA_TEAMS[entity];
      if (team) {
        // Use quoted full name for precision
        teamTerms.push(`"${team.searchTerms[0]}"`);
      }
    }
    if (teamTerms.length > 0) {
      // OR the team names together
      searchTerms.push(`(${teamTerms.join(" | ")})`);
    }
  } else if (parsed.category === "crypto") {
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
 * @param marketTicker - Full market ticker (e.g., "KXNFLSPREAD-25DEC04DALDET-DET9")
 * @returns Event ticker (e.g., "KXNFLSPREAD-25DEC04DALDET")
 */
export function extractEventTicker(marketTicker: string): string {
  const parts = marketTicker.split("-");
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return marketTicker;
}
