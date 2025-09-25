# Meteora DLMM — Pools Research

## Official Resources
- Swagger UI: `https://dlmm-api.meteora.ag/swagger-ui/`
- Program ID (mainnet): `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`

## Discovery Endpoints (Examples)
- `GET /pools?limit=500`
- `GET /pools/{address}`
- `GET /pools?tokenX=<mint>&tokenY=<mint>`

### Fields of Interest
- `address` → **pair_address**
- `tokenXMint`, `tokenYMint`
- `feeBps` → `fee_tier_bps`
- `binStep` → `extra.binStep`
- `status`

## Sample Responses (trimmed)
```json
{
  "address":"9Z...pool",
  "tokenXMint":"So1111...",
  "tokenYMint":"EPjFWd...",
  "feeBps":30,
  "binStep":1,
  "status":"enabled"
}
```
```json
{
  "address":"Af...pool2",
  "tokenXMint":"EPjFWd...",
  "tokenYMint":"So1111...",
  "feeBps":5,
  "binStep":4,
  "status":"enabled"
}
```
```json
{
  "address":"Bk...pool3",
  "tokenXMint":"Es9vMFrzaCERz...",
  "tokenYMint":"EPjFWd...",
  "feeBps":10,
  "binStep":8,
  "status":"disabled"
}
```

## Mapping → PoolMeta
```json
{
  "dex_id": "meteora",
  "pool_type": "dlmm",
  "pair_address": "<address>",
  "base_mint": "<tokenXMint>",
  "quote_mint": "<tokenYMint>",
  "fee_tier_bps": "<feeBps>",
  "lp_mint_address": null,
  "pair_created_at": null,
  "extra": { "binStep": "<binStep>", "programId": "LBUZKhRx…" }
}
```

## Dedup Rules
- Canonical key = **pool account**.
- Avoid duplicating wrappers/vault variants.

## On-chain Fallback
- `getProgramAccounts` on DLMM program; decode via `@meteora-ag/dlmm`.
