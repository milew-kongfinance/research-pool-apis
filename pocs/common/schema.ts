import { z } from "zod";

export const PoolMetaSchema = z.object({
  dex_id: z.enum(["raydium", "orca", "meteora", "pumpswap"]),
  pool_type: z.enum(["amm", "clmm", "dlmm", "bonding"]),
  pair_address: z.string().min(32),
  base_mint: z.string().min(32),
  quote_mint: z.string().min(32),
  fee_tier_bps: z.number().int().nonnegative(),
  lp_mint_address: z.string().min(32).nullable(),
  pair_created_at: z.string().datetime().nullable(),
  extra: z.record(z.string(), z.unknown()),
});

export const PoolMetaArraySchema = z.array(PoolMetaSchema);
