# Raydium — Pools Research (AMM/CLMM)

## Official Resources
- API v3 base: `https://api-v3.raydium.io/` (Swagger lists pool endpoints)
- Programs (mainnet):
  - CPMM: `CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C`
  - CLMM: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`
  - Legacy AMM: `675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8`

## Discovery Endpoints (Examples)
- `GET /pools/info/ids?ids=<POOL_ID1,POOL_ID2>`
- `GET /pools/info/lps?lps=<LP_MINT1,LP_MINT2>`

### Fields of Interest
- `id` (pool pubkey) → **pair_address**
- `type` → `pool_type` (`amm` or `clmm`)
- `baseMint`, `quoteMint`
- `feeBps` → `fee_tier_bps`
- `lpMint` (for CPMM) → `lp_mint_address` (CLMM = `null`)
- `status`
- `createdAt` (if present; not guaranteed)

## Sample Responses (trimmed)
```json
{
  "data": [
    {
      "id": "CjYx...poolPubkey",
      "type": "cpmm",
      "baseMint": "So11111111111111111111111111111111111111112",
      "quoteMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "feeBps": 25,
      "lpMint": "9abcd...LPmint",
      "status": "enabled"
    }
  ]
}
```
```json
{
  "data": [
    {
      "id": "7x...clmmPool",
      "type": "clmm",
      "baseMint": "So1111...",
      "quoteMint": "EPjFWd...",
      "feeBps": 10,
      "status": "enabled"
    }
  ]
}
```
```json
{
  "data": [
    {
      "id": "Fg...pool2",
      "type": "cpmm",
      "baseMint": "EPjFWd...",
      "quoteMint": "So1111...",
      "feeBps": 0,
      "lpMint": "LP1...",
      "status": "disabled"
    }
  ]
}
```

## Mapping → PoolMeta
```json
{
  "dex_id": "raydium",
  "pool_type": "amm|clmm",
  "pair_address": "<id>",
  "base_mint": "<baseMint>",
  "quote_mint": "<quoteMint>",
  "fee_tier_bps": "<feeBps>",
  "lp_mint_address": "<lpMint|null>",
  "pair_created_at": null,
  "extra": { "programId": "CPMMoo…|CAMMCz…" }
}
```

## Dedup Rules
- Canonical key = **pool account address** (`id`).
- Ignore legacy market/route aliases.

## On-chain Fallback
- `getProgramAccounts` on CPMM/CLMM; decode with Raydium layouts.
- Derive base/quote mints, fee tier; CPMM exposes `lp_mint` in state.

## Rate Limit / ToS Notes
- Treat as best-effort; cache + exponential backoff.
