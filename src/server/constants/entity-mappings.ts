/**
 * Entity Mappings for Superfeedr Query Generation
 *
 * Maps Kalshi event ticker codes to search-friendly entity names
 * for generating Superfeedr track feed queries.
 */

// NFL Team Codes → Full Names and Search Terms
export const NFL_TEAMS: Record<string, { name: string; searchTerms: string[] }> =
  {
    ARI: { name: "Arizona Cardinals", searchTerms: ["arizona cardinals", "cardinals"] },
    ATL: { name: "Atlanta Falcons", searchTerms: ["atlanta falcons", "falcons"] },
    BAL: { name: "Baltimore Ravens", searchTerms: ["baltimore ravens", "ravens"] },
    BUF: { name: "Buffalo Bills", searchTerms: ["buffalo bills", "bills"] },
    CAR: { name: "Carolina Panthers", searchTerms: ["carolina panthers", "panthers"] },
    CHI: { name: "Chicago Bears", searchTerms: ["chicago bears", "bears"] },
    CIN: { name: "Cincinnati Bengals", searchTerms: ["cincinnati bengals", "bengals"] },
    CLE: { name: "Cleveland Browns", searchTerms: ["cleveland browns", "browns"] },
    DAL: { name: "Dallas Cowboys", searchTerms: ["dallas cowboys", "cowboys"] },
    DEN: { name: "Denver Broncos", searchTerms: ["denver broncos", "broncos"] },
    DET: { name: "Detroit Lions", searchTerms: ["detroit lions", "lions"] },
    GB: { name: "Green Bay Packers", searchTerms: ["green bay packers", "packers"] },
    HOU: { name: "Houston Texans", searchTerms: ["houston texans", "texans"] },
    IND: { name: "Indianapolis Colts", searchTerms: ["indianapolis colts", "colts"] },
    JAX: { name: "Jacksonville Jaguars", searchTerms: ["jacksonville jaguars", "jaguars"] },
    KC: { name: "Kansas City Chiefs", searchTerms: ["kansas city chiefs", "chiefs"] },
    LAC: { name: "Los Angeles Chargers", searchTerms: ["los angeles chargers", "chargers"] },
    LAR: { name: "Los Angeles Rams", searchTerms: ["los angeles rams", "rams"] },
    LV: { name: "Las Vegas Raiders", searchTerms: ["las vegas raiders", "raiders"] },
    MIA: { name: "Miami Dolphins", searchTerms: ["miami dolphins", "dolphins"] },
    MIN: { name: "Minnesota Vikings", searchTerms: ["minnesota vikings", "vikings"] },
    NE: { name: "New England Patriots", searchTerms: ["new england patriots", "patriots"] },
    NO: { name: "New Orleans Saints", searchTerms: ["new orleans saints", "saints"] },
    NYG: { name: "New York Giants", searchTerms: ["new york giants", "giants"] },
    NYJ: { name: "New York Jets", searchTerms: ["new york jets", "jets"] },
    PHI: { name: "Philadelphia Eagles", searchTerms: ["philadelphia eagles", "eagles"] },
    PIT: { name: "Pittsburgh Steelers", searchTerms: ["pittsburgh steelers", "steelers"] },
    SEA: { name: "Seattle Seahawks", searchTerms: ["seattle seahawks", "seahawks"] },
    SF: { name: "San Francisco 49ers", searchTerms: ["san francisco 49ers", "49ers", "niners"] },
    TB: { name: "Tampa Bay Buccaneers", searchTerms: ["tampa bay buccaneers", "buccaneers", "bucs"] },
    TEN: { name: "Tennessee Titans", searchTerms: ["tennessee titans", "titans"] },
    WAS: { name: "Washington Commanders", searchTerms: ["washington commanders", "commanders"] },
  };

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

// Query Exclusion Patterns
// These terms are excluded from all queries to reduce noise
export const QUERY_EXCLUSIONS = [
  "-fantasy",
  "-mock",
  "-draft",
  '-"all time"',
  "-history",
  "-reddit",
  "-rumor",
];

// NBA Team Codes → Full Names and Search Terms
export const NBA_TEAMS: Record<string, { name: string; searchTerms: string[] }> =
  {
    ATL: { name: "Atlanta Hawks", searchTerms: ["atlanta hawks", "hawks"] },
    BOS: { name: "Boston Celtics", searchTerms: ["boston celtics", "celtics"] },
    BKN: { name: "Brooklyn Nets", searchTerms: ["brooklyn nets", "nets"] },
    CHA: { name: "Charlotte Hornets", searchTerms: ["charlotte hornets", "hornets"] },
    CHI: { name: "Chicago Bulls", searchTerms: ["chicago bulls", "bulls"] },
    CLE: { name: "Cleveland Cavaliers", searchTerms: ["cleveland cavaliers", "cavaliers", "cavs"] },
    DAL: { name: "Dallas Mavericks", searchTerms: ["dallas mavericks", "mavericks", "mavs"] },
    DEN: { name: "Denver Nuggets", searchTerms: ["denver nuggets", "nuggets"] },
    DET: { name: "Detroit Pistons", searchTerms: ["detroit pistons", "pistons"] },
    GSW: { name: "Golden State Warriors", searchTerms: ["golden state warriors", "warriors"] },
    HOU: { name: "Houston Rockets", searchTerms: ["houston rockets", "rockets"] },
    IND: { name: "Indiana Pacers", searchTerms: ["indiana pacers", "pacers"] },
    LAC: { name: "Los Angeles Clippers", searchTerms: ["los angeles clippers", "clippers"] },
    LAL: { name: "Los Angeles Lakers", searchTerms: ["los angeles lakers", "lakers"] },
    MEM: { name: "Memphis Grizzlies", searchTerms: ["memphis grizzlies", "grizzlies"] },
    MIA: { name: "Miami Heat", searchTerms: ["miami heat", "heat"] },
    MIL: { name: "Milwaukee Bucks", searchTerms: ["milwaukee bucks", "bucks"] },
    MIN: { name: "Minnesota Timberwolves", searchTerms: ["minnesota timberwolves", "timberwolves", "wolves"] },
    NOP: { name: "New Orleans Pelicans", searchTerms: ["new orleans pelicans", "pelicans"] },
    NYK: { name: "New York Knicks", searchTerms: ["new york knicks", "knicks"] },
    OKC: { name: "Oklahoma City Thunder", searchTerms: ["oklahoma city thunder", "thunder"] },
    ORL: { name: "Orlando Magic", searchTerms: ["orlando magic", "magic"] },
    PHI: { name: "Philadelphia 76ers", searchTerms: ["philadelphia 76ers", "76ers", "sixers"] },
    PHX: { name: "Phoenix Suns", searchTerms: ["phoenix suns", "suns"] },
    POR: { name: "Portland Trail Blazers", searchTerms: ["portland trail blazers", "trail blazers", "blazers"] },
    SAC: { name: "Sacramento Kings", searchTerms: ["sacramento kings", "kings"] },
    SAS: { name: "San Antonio Spurs", searchTerms: ["san antonio spurs", "spurs"] },
    TOR: { name: "Toronto Raptors", searchTerms: ["toronto raptors", "raptors"] },
    UTA: { name: "Utah Jazz", searchTerms: ["utah jazz", "jazz"] },
    WAS: { name: "Washington Wizards", searchTerms: ["washington wizards", "wizards"] },
  };

// Series Prefix → Category Mapping
export const SERIES_CATEGORIES: Record<string, string> = {
  KXNFLSPREAD: "nfl",
  KXNFLOU: "nfl",
  KXNFLML: "nfl",
  KXNFLGAME: "nfl",
  KXNBAGAME: "nba",
  KXNBASPREAD: "nba",
  KXNBAOU: "nba",
  KXNBAML: "nba",
  KXBTC: "crypto",
  KXETH: "crypto",
  KXFED: "economic",
  KXCPI: "economic",
  KXGDP: "economic",
};

