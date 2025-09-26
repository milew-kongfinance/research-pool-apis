# Meteora DLMM — Pools Research

## Official Resources

- API docs (Swagger UI): `https://dlmm-api.meteora.ag/swagger-ui/`
- DLMM Program (mainnet): `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`

## Discovery Endpoints (HTTP, stable today)

- `GET /pair/all_with_pagination?page=<n>&limit=<m>` — **recommended** (paged)
- `GET /pair/all` — full list (not paged)
- `GET /pair/{address}` — details by pool address

> Note: The older `/pools/*` paths are **not** the public DLMM endpoints. Use `/pair/*`.

### Fields of Interest (mapping → PoolMeta)

- `address` → **pair_address**
- `mint_x` / `mint_y` → **base_mint** / **quote_mint**
- `bin_step` → `extra.binStep`
- `base_fee_percentage` (string) → `fee_tier_bps` (integer bps; see notes)
- `status` (if present) → optional validation field
- No classic LP mint for DLMM → `lp_mint_address = null`
- `pair_created_at` not provided → leave `null` (indexer backfills from first init/swap)

### Fee conversion notes

`base_fee_percentage` is a string. If it looks like `"0.002"`, treat as **fraction** → `0.002 * 10_000 = 20 bps`.  
If it looks like `"0.2"` or `"0.2%"`, treat as **percent** → `0.2 * 100 = 20 bps`.

## Sample Responses (trimmed)

```json
{
  "address": "9d9mb8kooFfaD3SctgZtkxQypkshx6ezhbKio89ixyy2",
  "mint_x": "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",
  "mint_y": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "bin_step": 50,
  "base_fee_percentage": "10"
}
```

```json
{
  "address": "BGm1tav58oGcsQJehL9WXBFXF7D27vZsKefj4xJKD5Y",
  "mint_x": "So11111111111111111111111111111111111111112",
  "mint_y": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "bin_step": 10,
  "base_fee_percentage": "10"
}
```

```json
{
  "address": "HTvjzsfX3yU6BUodCjZ5vZkUrAxMDTrBs3CJaq43ashR",
  "mint_x": "So11111111111111111111111111111111111111112",
  "mint_y": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "bin_step": 1,
  "base_fee_percentage": "1"
}
```

## Mapping → PoolMeta (example)

```json
{
  "dex_id": "meteora",
  "pool_type": "dlmm",
  "pair_address": "<address>",
  "base_mint": "<mint_x>",
  "quote_mint": "<mint_y>",
  "fee_tier_bps": 20,
  "lp_mint_address": null,
  "pair_created_at": null,
  "extra": {
    "binStep": 1,
    "programId": "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"
  }
}
```

## Dedup / Canonicalization

- Canonical id = pool account address
- If a pair appears on multiple pages, dedupe on `address`

## On-chain Fallback

- `getProgramAccounts` on the DLMM program
- Decode with `@meteora-ag/dlmm` layouts
- RPC providers often restrict large scans — prefer HTTP discovery for breadth; on-chain for verification

---
