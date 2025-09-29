export type DexScreenerPair = {
  pairAddress?: string;
  url?: string;
  dexId?: string;
  chainId?: string;
  baseToken?: { address?: string; symbol?: string };
  quoteToken?: { address?: string; symbol?: string };
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  liquidityFee?: number | string;
  createdAt?: number | string | null;
};
