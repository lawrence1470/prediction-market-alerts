/**
 * Entity Mappings for Superfeedr Query Generation
 *
 * These mappings are used by the fallback rule-based query generator
 * when LLM-based generation is unavailable (no OpenAI API key).
 *
 * Note: Sports events (NFL, NBA) are blocked at the API level and not supported.
 */

// Crypto Asset Codes → Search Terms
export const CRYPTO_ASSETS: Record<string, { name: string; searchTerms: string[] }> =
  {
    BTC: { name: "Bitcoin", searchTerms: ["bitcoin", "btc"] },
    ETH: { name: "Ethereum", searchTerms: ["ethereum", "eth", "ether"] },
    SOL: { name: "Solana", searchTerms: ["solana", "sol"] },
    XRP: { name: "Ripple", searchTerms: ["ripple", "xrp"] },
    DOGE: { name: "Dogecoin", searchTerms: ["dogecoin", "doge"] },
    ADA: { name: "Cardano", searchTerms: ["cardano", "ada"] },
  };

// Economic/Policy Event Mappings
export const ECONOMIC_EVENTS: Record<string, { name: string; searchTerms: string[] }> =
  {
    FED: {
      name: "Federal Reserve",
      searchTerms: ["federal reserve", "fed rate", "interest rate", "fomc"],
    },
    CPI: {
      name: "Consumer Price Index",
      searchTerms: ["cpi", "inflation", "consumer price"],
    },
    GDP: {
      name: "Gross Domestic Product",
      searchTerms: ["gdp", "economic growth", "gross domestic product"],
    },
  };

// Base query exclusions applied to all queries
export const QUERY_EXCLUSIONS = [
  "-fantasy",
  "-mock",
  "-draft",
  '-"all time"',
  "-history",
  "-reddit",
  "-rumor",
];

// Category-specific exclusions for more targeted filtering
export const CATEGORY_EXCLUSIONS: Record<string, string[]> = {
  crypto: [
    "-airdrop",
    "-giveaway",
    "-scam",
    '-"how to buy"',
    "-tutorial",
    "-beginner",
    "-reddit",
    "-rumor",
    "-meme",
    "-spam",
  ],
  economic: [
    '-"for dummies"',
    "-tutorial",
    "-textbook",
    "-history",
    "-reddit",
    "-coursera",
    "-khan academy",
    "-investopedia",
  ],
  politics: [
    "-reddit",
    "-rumor",
    "-opinion",
    "-editorial",
    "-history",
    "-throwback",
  ],
  other: [
    "-reddit",
    "-rumor",
    "-history",
  ],
};

// Series Prefix → Category Mapping
export const SERIES_CATEGORIES: Record<string, string> = {
  KXBTC: "crypto",
  KXETH: "crypto",
  KXFED: "economic",
  KXCPI: "economic",
  KXGDP: "economic",
};
