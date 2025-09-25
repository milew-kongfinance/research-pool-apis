import { env } from "../common/env.js";
import { getJson } from "../common/http.js";
import { PoolMeta } from "../common/types.js";
import { listProgramAccounts } from "../common/solana.js";

const BASE = "https://api-v3.raydium.io";
const PROGRAMS = [
  { id: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", type: "amm" as const },
  { id: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", type: "clmm" as const },
];

export default async function fetch(args?: {
  ids?: string[];
  onchain?: string;
}): Promise<PoolMeta[]> {
  let result: PoolMeta[] = [];
  const ids =
    Array.isArray(args?.ids) && args?.ids.length ? args.ids : undefined;

  if (ids) {
    const url = `${BASE}/pools/info/ids?ids=${ids.join(",")}`;
    const response = await getJson<{ data: any[] }>(url);

    result = response.data.map((p) => {
      const type = p.type === "clmm" ? "clmm" : "amm";
      return {
        dex_id: "raydium",
        pool_type: type,
        pair_address: p.id,
        base_mint: p.baseMint ?? "",
        quote_mint: p.quoteMint ?? "",
        fee_tier_bps: Number(p.feeBps ?? 0),
        lp_mint_address: p.lpMint ?? null,
        pair_created_at: p.createdAt ?? null,
        extra: {
          programId: type === "clmm" ? PROGRAMS[1].id : PROGRAMS[0].id,
        },
      };
    });
  }

  const wantOnchain = String(args?.onchain ?? "false") === "true";
  if (wantOnchain && env.SOLANA_RPC && result.length < 100) {
    for (const program of PROGRAMS) {
      const addresses = await listProgramAccounts(program.id, { limit: 300 });
      result = result.concat(
        addresses.map((a) => ({
          dex_id: "raydium",
          pool_type: program.type,
          pair_address: a,
          base_mint: "",
          quote_mint: "",
          fee_tier_bps: 0,
          lp_mint_address: program.type === "amm" ? "" : null,
          pair_created_at: null,
          extra: { programId: program.id },
        }))
      );
    }
  }

  return result;
}
