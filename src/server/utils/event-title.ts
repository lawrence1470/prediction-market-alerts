/**
 * Event Title Utilities
 *
 * Shared utilities for formatting Kalshi event tickers into human-readable titles.
 */

/**
 * Format an event ticker into a human-readable title
 *
 * @example "KXNFLSPREAD-25DEC04DALDET" -> "NFL: DAL vs DET"
 * @example "KXNBAGAME-25DEC05LALBOS" -> "NBA: LAL vs BOS"
 */
export function formatEventTitle(eventTicker: string): string {
  const parts = eventTicker.split("-");
  const series = parts[0] ?? "";

  // NFL format
  if (series.includes("NFL")) {
    const eventPart = parts[1] ?? "";
    // Extract team codes from event part (after 7-char date prefix)
    const teamsPart = eventPart.slice(7);
    if (teamsPart.length >= 6) {
      const team1 = teamsPart.slice(0, 3);
      const team2 = teamsPart.slice(3, 6);
      return `NFL: ${team1} vs ${team2}`;
    }
    return `NFL Event`;
  }

  // NBA format
  if (series.includes("NBA")) {
    const eventPart = parts[1] ?? "";
    const teamsPart = eventPart.slice(7);
    if (teamsPart.length >= 6) {
      const team1 = teamsPart.slice(0, 3);
      const team2 = teamsPart.slice(3, 6);
      return `NBA: ${team1} vs ${team2}`;
    }
    return `NBA Event`;
  }

  // Crypto format
  if (series.includes("BTC")) return "Bitcoin Price";
  if (series.includes("ETH")) return "Ethereum Price";
  if (series.includes("SOL")) return "Solana Price";

  // Economic format
  if (series.includes("FED")) return "Federal Reserve";
  if (series.includes("CPI")) return "CPI / Inflation";
  if (series.includes("GDP")) return "GDP Report";

  // Fallback
  return eventTicker;
}
