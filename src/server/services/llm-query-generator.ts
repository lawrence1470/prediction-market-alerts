/**
 * LLM Query Generator Service
 *
 * Uses GPT-4o-mini to dynamically generate Superfeedr search queries
 * from Kalshi event tickers and titles. This eliminates the need for
 * hard-coded team/entity mappings.
 *
 * Cost: ~$0.00002 per query (~$0.02 per 1000 queries)
 */

import OpenAI from "openai";
import { env } from "~/env";
import { QUERY_EXCLUSIONS } from "~/server/constants/entity-mappings";
import {
  generateQuery as generateFallbackQuery,
  buildTopicUrl,
} from "./query-generator";

// Initialize OpenAI client (lazy initialization)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) {
    return null;
  }
  openaiClient ??= new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  return openaiClient;
}

export interface LLMQueryResult {
  query: string;
  searchTerms: string[];
  category: string;
  usedLLM: boolean;
}

const SYSTEM_PROMPT = `You are a search query generator for a news tracking system. Given information about a prediction market event, generate optimal search terms to find relevant breaking news.

Output ONLY valid JSON with this exact structure:
{
  "searchTerms": ["term1", "term2"],
  "category": "sports|crypto|economic|politics|other"
}

Rules:
1. Extract key entities (teams, people, assets, events)
2. Use full names for precision (e.g., "Dallas Cowboys" not just "Cowboys")
3. Include 2-4 search terms maximum
4. For sports: include both team full names
5. For crypto: include the asset name and symbol
6. For economic events: include the event name and related terms
7. Keep terms specific enough to avoid noise but general enough to catch relevant news`;

/**
 * Generate a search query using GPT-4o-mini
 *
 * @param eventTicker - The Kalshi event ticker (e.g., "KXNFLGAME-25DEC07CINBUF")
 * @param eventTitle - Optional event title from Kalshi API (e.g., "Cincinnati at Buffalo")
 * @returns Search query result with terms and metadata
 */
export async function generateQueryWithLLM(
  eventTicker: string,
  eventTitle?: string,
): Promise<LLMQueryResult> {
  const client = getOpenAIClient();

  // Fallback to rule-based if no API key
  if (!client) {
    console.log("[LLM Query] No OpenAI API key, using fallback generator");
    const fallbackQuery = generateFallbackQuery(eventTicker);
    return {
      query: fallbackQuery,
      searchTerms: extractSearchTermsFromQuery(fallbackQuery),
      category: detectCategory(eventTicker),
      usedLLM: false,
    };
  }

  try {
    const userPrompt = buildUserPrompt(eventTicker, eventTitle);

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3, // Low temperature for consistent outputs
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(content) as {
      searchTerms: string[];
      category: string;
    };

    if (!parsed.searchTerms || !Array.isArray(parsed.searchTerms)) {
      throw new Error("Invalid response format from OpenAI");
    }

    // Build the final query
    const query = buildQueryFromTerms(parsed.searchTerms);

    console.log("[LLM Query] Generated query:", {
      eventTicker,
      eventTitle,
      searchTerms: parsed.searchTerms,
      category: parsed.category,
    });

    return {
      query,
      searchTerms: parsed.searchTerms,
      category: parsed.category,
      usedLLM: true,
    };
  } catch (error) {
    console.error("[LLM Query] Error generating query:", error);

    // Fallback to rule-based generator on error
    const fallbackQuery = generateFallbackQuery(eventTicker);
    return {
      query: fallbackQuery,
      searchTerms: extractSearchTermsFromQuery(fallbackQuery),
      category: detectCategory(eventTicker),
      usedLLM: false,
    };
  }
}

// Context hints for ticker patterns
const TICKER_CONTEXT: Record<string, string> = {
  NFL: "This is an NFL football game.",
  NBA: "This is an NBA basketball game.",
  BTC: "This is about Bitcoin price.",
  ETH: "This is about Ethereum price.",
  FED: "This is about Federal Reserve policy.",
  CPI: "This is about inflation/CPI data.",
  GDP: "This is about GDP economic data.",
};

/**
 * Build the user prompt for the LLM
 */
function buildUserPrompt(eventTicker: string, eventTitle?: string): string {
  let prompt = `Event Ticker: ${eventTicker}`;

  if (eventTitle) {
    prompt += `\nEvent Title: ${eventTitle}`;
  }

  // Add context based on ticker pattern
  const contextKey = Object.keys(TICKER_CONTEXT).find((key) =>
    eventTicker.includes(key),
  );
  if (contextKey) {
    prompt += `\nContext: ${TICKER_CONTEXT[contextKey]}`;
  }

  return prompt;
}

/**
 * Build the final Superfeedr query from search terms
 */
function buildQueryFromTerms(searchTerms: string[]): string {
  // Quote each term for exact matching
  const quotedTerms = searchTerms.map((term) => `"${term}"`);

  // Join with OR for broader matching
  const searchPart =
    quotedTerms.length > 1
      ? `(${quotedTerms.join(" | ")})`
      : quotedTerms[0] ?? "";

  // Add exclusions
  const exclusions = QUERY_EXCLUSIONS.join(" ");

  // Add popularity filter
  return `${searchPart} ${exclusions} popularity:medium`.trim();
}

/**
 * Extract search terms from a query string (for fallback results)
 */
function extractSearchTermsFromQuery(query: string): string[] {
  const matches = query.match(/"([^"]+)"/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/"/g, ""));
}

// Category detection patterns
const CATEGORY_PATTERNS: [string[], string][] = [
  [["NFL", "NBA"], "sports"],
  [["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA"], "crypto"],
  [["FED", "CPI", "GDP"], "economic"],
];

/**
 * Detect category from event ticker
 */
function detectCategory(eventTicker: string): string {
  for (const [patterns, category] of CATEGORY_PATTERNS) {
    if (patterns.some((p) => eventTicker.includes(p))) {
      return category;
    }
  }
  return "other";
}

/**
 * Generate query and topic URL in one call
 */
export async function getTopicUrlForEventWithLLM(
  eventTicker: string,
  eventTitle?: string,
): Promise<{
  query: string;
  topicUrl: string;
  searchTerms: string[];
  category: string;
  usedLLM: boolean;
}> {
  const result = await generateQueryWithLLM(eventTicker, eventTitle);
  const topicUrl = buildTopicUrl(result.query);

  return {
    ...result,
    topicUrl,
  };
}
