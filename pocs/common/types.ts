export type DexId = "raydium" | "orca" | "meteora" | "pumpswap";
export type PoolType = "amm" | "clmm" | "dlmm" | "bonding";

export type PoolMeta = {
  dex_id: DexId;
  pool_type: PoolType;
  pair_address: string;
  base_mint: string;
  quote_mint: string;
  fee_tier_bps: number;
  lp_mint_address: string | null;
  pair_created_at: string | null;
  extra: Record<string, unknown>;
};
