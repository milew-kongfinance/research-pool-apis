import { getJson } from "../../common/http.js";
import { PoolMeta } from "../../common/types.js";
import { ORCA_ENDPOINT, WHIRLPOOL_PROGRAM } from "./constants.js";

export default async function fetch(): Promise<PoolMeta[]> {
  const pools = await getJson<{ whirlpools: any[] }>(ORCA_ENDPOINT);

  return pools.whirlpools.map((p) => ({
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
  }));
}
