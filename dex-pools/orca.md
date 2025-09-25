# Orca Whirlpools — Pools Research (CLMM)

## Official Resources

- API docs hub: `https://api.orca.so/docs`
- Program ID (mainnet/devnet): `whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc`

## Discovery Endpoints (Examples)

- `GET /v1/whirlpool/list` — list whirlpools (returns a large list; treat as paginable feed for ops)
- `GET /v1/whirlpool/<POOL_PUBKEY>` — **optional / unstable**: in some regions returns a diagnostic wrapper (e.g., Cloudflare 1016) instead of pool JSON. Prefer the list endpoint or SDK/on-chain for per-pool reads.

### Fields of Interest (HTTP list)

- `address` → **pair_address**
- `tokenA.mint`, `tokenB.mint` → **base_mint**, **quote_mint**
- `feeRateBps` (if present) or `lpFeeRate * 10_000` → **fee_tier_bps**
- `tickSpacing` → `extra.tickSpacing`
- `status` (not strictly required for PoC)

## Sample Responses (trimmed)

```json
{
  "address": "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE",
  "tokenA": { "mint": "So11111111111111111111111111111111111111112" },
  "tokenB": { "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  "feeRateBps": 4,
  "tickSpacing": 4
}
```

```json
{
  "address": "C9U2Ksk6KKWvLEeo5yUQ7Xu46X7NzeBJtd9PBfuXaUSM",
  "tokenA": { "mint": "So11111111111111111111111111111111111111112" },
  "tokenB": { "mint": "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump" },
  "feeRateBps": 16,
  "tickSpacing": 16
}
```

```json
{
  "address": "HxA6SKW5qA4o12fjVgTpXdq2YnZ5Zv1s7SB4FFomsyLM",
  "tokenA": { "mint": "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij" },
  "tokenB": { "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" },
  "feeRateBps": 4,
  "tickSpacing": 4
}
```

## Mapping → PoolMeta

```json
{
  "dex_id": "orca",
  "pool_type": "clmm",
  "pair_address": "<address>",
  "base_mint": "<tokenA.mint>",
  "quote_mint": "<tokenB.mint>",
  "fee_tier_bps": "<feeRateBps or Math.round(lpFeeRate*10000)>",
  "lp_mint_address": null,
  "pair_created_at": null,
  "extra": {
    "tickSpacing": "<tickSpacing>",
    "programId": "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"
  }
}
```

## Dedup Rules

- Canonical key = whirlpool account address (`pair_address`).
- Ignore aggregator aliases or marketId-like alternate identifiers.

## On-chain Fallback (optional)

- `getProgramAccounts` on `whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc`; decode with `@orca-so/whirlpools`.
- In the PoC we gate scanning behind `--onchain=true` and skip gracefully if the RPC disallows scans.

## Notes

- PoC returned 14,983 pools from HTTP during testing.
- CLMM has no LP mint → `lp_mint_address = null`.
