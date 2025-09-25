import { PoolMetaArraySchema } from "./common/schema.js";

export function validatePools(
  name: string,
  pools: unknown,
  { min = 1 }: { min?: number } = {}
) {
  const parsed = PoolMetaArraySchema.parse(pools);
  const seen = new Set<string>();

  for (const p of parsed) {
    if (seen.has(p.pair_address)) {
      throw new Error(`${name}: duplicate pair_address ${p.pair_address}`);
    }

    seen.add(p.pair_address);
  }

  if (parsed.length < min) {
    throw new Error(
      `${name}: expected at least ${min} pools, got ${parsed.length}`
    );
  }

  return parsed;
}
