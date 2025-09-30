import { env } from "../../common/env.js";
import { DexScreenerPair } from "./types.js";
import { sleep } from "../../common/utils.js";
import { getJson, postJson } from "../../common/http.js";
import { DEX_SCREENER_BASE_URL, DEX_SCREENER_QUERIES } from "./constants.js";
import { toDexScreenerPair } from "./mapping.js";

export async function fetchBirdeyePairOverview(
  url: string,
  attempt = 1
): Promise<any> {
  try {
    return await getJson<any>(url, {
      headers: {
        "X-API-KEY": env.BIRDEYE_API_KEY,
        "x-chain": "solana",
        Accept: "application/json",
      },
    });
  } catch (error: any) {
    const status = error?.status ?? error?.response?.status;
    const isRetriable = status === 429 || (status >= 500 && status < 600);
    const maxAttempts = 4;

    if (isRetriable && attempt < maxAttempts) {
      const backoffMs =
        Math.min(2_000 * attempt, 8_000) + Math.floor(Math.random() * 500);

      await sleep(backoffMs);
      return fetchBirdeyePairOverview(url, attempt + 1);
    }

    throw error;
  }
}

export async function fetchProgramAccounts(
  programId: string
): Promise<DexScreenerPair[]> {
  const rpcUrl = env.SOLANA_RPC;
  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "getProgramAccounts",
    params: [
      programId,
      {
        encoding: "base64",
      },
    ],
  };

  const response = await postJson<any, { result?: any[] }>(rpcUrl, requestBody);
  const accounts = response?.result ?? [];

  return accounts.map(toDexScreenerPair);
}

export function deduplicateByPairAddress<T extends { pairAddress?: string }>(
  items: T[]
): T[] {
  const seenAddresses = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    const addressKey = (item?.pairAddress ?? "").toLowerCase();
    if (!addressKey || seenAddresses.has(addressKey)) {
      continue;
    }

    seenAddresses.add(addressKey);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

export async function fetchDexScreenerPairsExpanded(): Promise<
  DexScreenerPair[]
> {
  const allPairs: DexScreenerPair[][] = [];
  let totalHits = 0;

  for (const [_, query] of DEX_SCREENER_QUERIES.entries()) {
    const url = `${DEX_SCREENER_BASE_URL}?q=${encodeURIComponent(query)}`;
    try {
      const response = await getJson<any>(url);
      const pairs: DexScreenerPair[] = (response?.pairs ?? []).filter(
        (pair: DexScreenerPair) => {
          if (pair?.chainId && pair.chainId.toLowerCase() !== "solana") {
            return false;
          }

          if (!pair?.chainId && !/\/solana\//i.test(pair?.url ?? "")) {
            return false;
          }

          return true;
        }
      );

      allPairs.push(pairs);

      totalHits += pairs.length;
    } catch {}

    await sleep(180 + Math.floor(Math.random() * 170));
  }

  let mergedPairs = deduplicateByPairAddress(allPairs.flat());
  const preferredPairs = mergedPairs.filter(
    (pair) => (pair as any)?.dexId === "pumpswap"
  );

  if (preferredPairs.length >= 50) {
    mergedPairs = preferredPairs;
  }

  return mergedPairs;
}

export function normalizeFeeBps(
  vendorFeeBps: unknown,
  liquidityFee: unknown
): number {
  const feeFromVendor = Number(vendorFeeBps);
  if (isFinite(feeFromVendor) && feeFromVendor >= 0) {
    return Math.round(feeFromVendor);
  }

  const rawFee =
    typeof liquidityFee === "string" ? liquidityFee.trim() : liquidityFee;

  if (rawFee === undefined || rawFee === null || rawFee === "") {
    return 0;
  }

  let feeValue = Number(
    typeof rawFee === "string" && rawFee.endsWith("%")
      ? rawFee.slice(0, -1)
      : rawFee
  );

  if (!isFinite(feeValue) || feeValue < 0) {
    return 0;
  }

  if (feeValue <= 1) {
    return Math.round(feeValue * 10_000);
  }

  if (feeValue <= 100) {
    return Math.round(feeValue * 100);
  }

  return Math.round(feeValue);
}

export async function filterPairsByOwner(
  pairs: DexScreenerPair[],
  programId: string
): Promise<DexScreenerPair[]> {
  if (!env.SOLANA_RPC || !programId) {
    return pairs;
  }

  const CHUNK = 100;
  const result: DexScreenerPair[] = [];

  for (let i = 0; i < pairs.length; i += CHUNK) {
    const slice = pairs.slice(i, i + CHUNK);

    const addresses = slice.map((p) => p.pairAddress).filter(Boolean);
    if (!addresses.length) {
      continue;
    }

    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getMultipleAccounts",
      params: [addresses, { encoding: "base64" }],
    };

    try {
      const response = await postJson<
        typeof body,
        { result?: { value: any[] } }
      >(env.SOLANA_RPC, body);

      const values = response?.result?.value ?? [];

      values.forEach((value, i) => {
        const owned = value?.owner === programId;
        if (owned) {
          result.push(slice[i]);
        }
      });
    } catch {
      result.push(...slice);
    }
  }

  return result;
}
