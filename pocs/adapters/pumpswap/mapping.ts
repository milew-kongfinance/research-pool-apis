import { DexScreenerPair } from "./types.js";

export function toDexScreenerPair(account: any): DexScreenerPair {
  return {
    pairAddress: account.pubkey,
    baseToken: { address: "", symbol: "" },
    quoteToken: { address: "", symbol: "" },
    liquidityFee: 0,
    createdAt: null,
    url: `https://solscan.io/account/${account.pubkey}`,
  };
}
