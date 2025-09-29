import { env } from "../../common/env.js";
import { PoolMeta } from "../../common/types.js";
import { BIRDEYE_PAIR_URL } from "./constants.js";
import { sleep, toNumberOrDefault } from "../../common/utils.js";
import {
  normalizeFeeBps,
  filterPairsByOwner,
  fetchProgramAccounts,
  fetchBirdeyePairOverview,
  deduplicateByPairAddress,
  fetchDexScreenerPairsExpanded,
} from "./helpers.js";

export default async function fetch(): Promise<PoolMeta[]> {
  let pairs = await fetchDexScreenerPairsExpanded();
  if (pairs.length < 100) {
    try {
      const onchainPairs = await fetchProgramAccounts(env.PUMPSWAP_PROGRAM);
      pairs = deduplicateByPairAddress([...pairs, ...onchainPairs]);
    } catch {}
  }

  if (env.PUMPSWAP_PROGRAM) {
    pairs = await filterPairsByOwner(pairs, env.PUMPSWAP_PROGRAM);
  }

  const limitedPairs = pairs.slice(0, 500);
  const poolMetas: PoolMeta[] = [];

  for (const [_, pair] of limitedPairs.entries()) {
    let vendorCreatedAtIso: string | null = null;
    let createdAtSource: "dexscreener" | "birdeye" | undefined;
    let vendorFeeBps: number | null = null;

    let extraFields: Record<string, unknown> = {
      programId: env.PUMPSWAP_PROGRAM,
      url: pair.url,
      baseSymbol: pair.baseToken?.symbol,
      quoteSymbol: pair.quoteToken?.symbol,
      liquidityUsd: pair.liquidity?.usd,
      volume24hUsd: pair.volume?.h24,
    };

    if (pair.createdAt) {
      vendorCreatedAtIso = new Date(pair.createdAt as any).toISOString();
      createdAtSource = "dexscreener";
    }

    if (pair.pairAddress && env.BIRDEYE_API_KEY) {
      const birdeyeUrl = `${BIRDEYE_PAIR_URL}?address=${pair.pairAddress}`;
      try {
        const birdeyeResponse = await fetchBirdeyePairOverview(birdeyeUrl);
        if (birdeyeResponse?.success && birdeyeResponse?.data) {
          const data = birdeyeResponse.data;
          const liquidityUsd = toNumberOrDefault(data.liquidity, null);
          const volume24hUsd =
            toNumberOrDefault(data.volume_24h, null) ??
            toNumberOrDefault(data.volume24h, null) ??
            (extraFields.volume24hUsd as number | null);

          const feeBps = toNumberOrDefault(data.fee_bps ?? data.feeBps, null);
          if (feeBps != null) {
            vendorFeeBps = feeBps;
          }

          if (!vendorCreatedAtIso && data.created_at) {
            vendorCreatedAtIso = new Date(data.created_at).toISOString();
            createdAtSource = "birdeye";
          }

          extraFields = {
            ...extraFields,
            ...(liquidityUsd != null ? { liquidityUsd } : {}),
            ...(volume24hUsd != null ? { volume24hUsd } : {}),
            ...(feeBps != null ? { feeBps } : {}),
          };
        }
      } catch {}

      await sleep(1_200 + Math.floor(Math.random() * 700));
    }

    if (vendorCreatedAtIso) {
      extraFields.vendorCreatedAt = vendorCreatedAtIso;
      if (createdAtSource) {
        extraFields.createdAtSource = createdAtSource;
      }
    }

    if (vendorFeeBps != null) {
      (extraFields as any).feeSource = "birdeye";
    } else if (pair.liquidityFee != null) {
      (extraFields as any).feeSource = "dexscreener";
    }

    if ((extraFields as any).feeSource == null) {
      (extraFields as any).feeSource = "unknown";
    }

    poolMetas.push({
      dex_id: "pumpswap",
      pool_type: "amm",
      pair_address: pair.pairAddress ?? "",
      base_mint: pair.baseToken?.address ?? "",
      quote_mint: pair.quoteToken?.address ?? "",
      fee_tier_bps: normalizeFeeBps(vendorFeeBps, pair.liquidityFee),
      lp_mint_address: null,
      pair_created_at: null,
      extra: extraFields,
    });
  }

  return poolMetas;
}
