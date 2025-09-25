import { env } from "../common/env.js";
import { getJson } from "../common/http.js";
import { PoolMeta } from "../common/types.js";
import { listProgramAccounts } from "../common/solana.js";

const ORCA_API = "https://api.orca.so";
const WHIRLPOOL_PROGRAM = "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc";

export default async function fetch(args?: {
  onchain?: string;
}): Promise<PoolMeta[]> {
  const pools = await getJson<{ whirlpools: any[] }>(
    `${ORCA_API}/v1/whirlpool/list`
  );

  const result: PoolMeta[] = pools.whirlpools.map((p) => ({
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

  const wantOnchain = String(args?.onchain ?? "false") === "true";
  if (wantOnchain && env.SOLANA_RPC) {
    const addresses = await listProgramAccounts(WHIRLPOOL_PROGRAM, {
      limit: 400,
    });

    const onchain = addresses.map<PoolMeta>((a) => ({
      dex_id: "orca",
      pool_type: "clmm",
      pair_address: a,
      base_mint: "",
      quote_mint: "",
      fee_tier_bps: 0,
      lp_mint_address: null,
      pair_created_at: null,
      extra: { tickSpacing: 0, programId: WHIRLPOOL_PROGRAM },
    }));

    result.push(...onchain);
  }

  return result;
}
