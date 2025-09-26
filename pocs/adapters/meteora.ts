import { getJson } from "../common/http.js";
import { PoolMeta } from "../common/types.js";

const BASE = "https://dlmm-api.meteora.ag";
const METEORA_DLMM_PROGRAM = "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";

type Page = {
  pairs?: any[];
  total?: number;
} & Record<string, unknown>;

export default async function fetch(): Promise<PoolMeta[]> {
  const result: PoolMeta[] = [];
  const seen = new Set<string>();
  const limit = 200;

  for (let page = 0; page < 20; page++) {
    const url = `${BASE}/pair/all_with_pagination?page=${page}&limit=${limit}`;
    const response = await getJson<Page>(url);
    const pairs = Array.isArray(response?.pairs) ? response.pairs : [];

    if (pairs.length === 0) {
      break;
    }

    for (const pair of pairs) {
      const address = pair.address ?? "";
      if (!address || seen.has(address)) {
        continue;
      }

      seen.add(address);

      const mintX = pair.mint_x ?? pair.tokenXMint ?? "";
      const mintY = pair.mint_y ?? pair.tokenYMint ?? "";
      const binStep = Number(pair.bin_step ?? pair.binStep ?? 0);

      let feeBps = 0;
      const bfs =
        typeof pair.base_fee_percentage === "string"
          ? pair.base_fee_percentage.trim()
          : "";

      if (bfs) {
        let feeStr = bfs.endsWith("%") ? bfs.slice(0, -1) : bfs;
        const feeValue = parseFloat(feeStr);

        if (!Number.isNaN(feeValue)) {
          feeBps =
            feeValue <= 1
              ? Math.round(feeValue * 10_000)
              : Math.round(feeValue * 100);
        }
      }

      result.push({
        dex_id: "meteora",
        pool_type: "dlmm",
        pair_address: String(address),
        base_mint: String(mintX),
        quote_mint: String(mintY),
        fee_tier_bps: feeBps,
        lp_mint_address: null,
        pair_created_at: null,
        extra: {
          binStep,
          programId: METEORA_DLMM_PROGRAM,
        },
      });
    }
  }

  return result;
}
