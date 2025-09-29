export const DEX_SCREENER_BASE_URL =
  "https://api.dexscreener.com/latest/dex/search";

export const BIRDEYE_PAIR_URL =
  "https://public-api.birdeye.so/defi/v3/pair/overview/single";

export const DEX_SCREENER_QUERIES: string[] = (() => {
  const searchTerms = [
    "pumpswap",
    "pump swap",
    "pumpswap solana",
    "pumpswap SOL",
    "pump SOL swap",
    "pump.fun swap",
    "pumpswap usdc",
    "pumpswap sol/usdc",
  ];

  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  for (const letter of letters) {
    searchTerms.push(`pumpswap ${letter}`);
  }

  const digits = "0123456789".split("");
  for (const digit of digits) {
    searchTerms.push(`pumpswap ${digit}`);
  }

  const suffixes = ["aa", "ee", "oo", "ra", "pe", "ga", "ko", "ny"];
  for (const suffix of suffixes) {
    searchTerms.push(`pumpswap ${suffix}`);
  }

  return searchTerms;
})();
