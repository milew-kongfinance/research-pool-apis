import { env } from "../common/env.js";
import { PoolMeta } from "../common/types.js";
import { listProgramAccounts } from "../common/solana.js";

const DLMM_PROGRAM = "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";

export default async function fetch(args?: {
  onchain?: string;
}): Promise<PoolMeta[]> {
  const wantOnchain = String(args?.onchain ?? "false") === "true";
  if (!wantOnchain) {
    throw new Error(
      "Meteora PoC currently uses on-chain fallback only. Run with --onchain=true or wire the HTTP /pools endpoint."
    );
  }

  if (!env.SOLANA_RPC) {
    throw new Error("SOLANA_RPC is required for Meteora on-chain discovery");
  }

  const addresses = await listProgramAccounts(DLMM_PROGRAM, { limit: 400 });
  return addresses.map<PoolMeta>((a) => ({
    dex_id: "meteora",
    pool_type: "dlmm",
    pair_address: a,
    base_mint: "",
    quote_mint: "",
    fee_tier_bps: 0,
    lp_mint_address: null,
    pair_created_at: null,
    extra: { binStep: 0, programId: DLMM_PROGRAM },
  }));
}
