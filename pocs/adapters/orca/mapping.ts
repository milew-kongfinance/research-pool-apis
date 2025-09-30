import { PoolMeta } from "../../common/types.js";
import { WHIRLPOOL_PROGRAM } from "./constants.js";

export function toPoolMeta(p: any): PoolMeta {
  return {
    dex_id: "orca",
    pool_type: "clmm",
    pair_address: p.address,
    base_mint: p.tokenA?.mint ?? "",
    quote_mint: p.tokenB?.mint ?? "",
    fee_tier_bps: Number(
      p.feeRateBps ?? Math.round((p.lpFeeRate ?? 0) * 10_000)
    ),
    lp_mint_address: null,
    pair_created_at: null,
    extra: { tickSpacing: p.tickSpacing, programId: WHIRLPOOL_PROGRAM },
  };
}
