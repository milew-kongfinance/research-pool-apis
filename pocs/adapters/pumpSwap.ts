import { env } from "../common/env.js";
import { PoolMeta } from "../common/types.js";
import { listProgramAccounts } from "../common/solana.js";

export default async function fetch(args?: {
  onchain?: string;
}): Promise<PoolMeta[]> {
  const wantOnchain = String(args?.onchain ?? "false") === "true";
  if (!wantOnchain) {
    throw new Error(
      "PumpSwap PoC uses on-chain discovery. Run with --onchain=true and set PUMPSWAP_PROGRAM."
    );
  }

  if (!env.SOLANA_RPC) {
    throw new Error("SOLANA_RPC is required");
  }

  if (!env.PUMPSWAP_PROGRAM) {
    throw new Error("PUMPSWAP_PROGRAM is required");
  }

  const addresses = await listProgramAccounts(env.PUMPSWAP_PROGRAM, {
    limit: 500,
  });

  return addresses.map<PoolMeta>((a) => ({
    dex_id: "pumpswap",
    pool_type: "amm",
    pair_address: a,
    base_mint: "",
    quote_mint: "",
    fee_tier_bps: 0,
    lp_mint_address: null,
    pair_created_at: null,
    extra: { programId: env.PUMPSWAP_PROGRAM },
  }));
}
