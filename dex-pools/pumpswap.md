# PumpSwap — Pools Research

## Reality Check
- There is **no official public “all pools” discovery list** equivalent to Raydium/Orca/Meteora.
- Options:
  1) **On-chain** scan of PumpSwap AMM program; parse pool state to derive base/quote mints.
  2) **PumpPortal** (3rd-party) REST/WS (keyed, paid per WS volume) for discovery streams.
  3) Other vendors (Bitquery/Shyft/Moralis/QuickNode Metis) for auxiliary discovery.

## Fields
- `lp_mint_address`: typically **N/A** (set `null`)
- `pool_type`: `"bonding"` for bonding-curve stage; `"amm"` once graduated.

## Sample Responses (illustrative)
_On-chain derived (minimal until decoder fills fields):_
```json
{
  "address":"Gd...pool",
  "baseMint":"",
  "quoteMint":"",
  "status":"enabled"
}
```
_Vendor discovery (fields vary by provider):_
```json
{
  "pool":"Hk...",
  "baseMint":"So1111...",
  "quoteMint":"EPjFWd...",
  "status":"enabled"
}
```

## Mapping → PoolMeta
```json
{
  "dex_id": "pumpswap",
  "pool_type": "amm|bonding",
  "pair_address": "<pool address>",
  "base_mint": "<baseMint>",
  "quote_mint": "<quoteMint>",
  "fee_tier_bps": 0,
  "lp_mint_address": null,
  "pair_created_at": null,
  "extra": { "programId": "<your-program-id>" }
}
```

## Dedup Rules
- Canonical key = **pool account**.
- For lifecycle tokens (bonding → AMM), keep **two** records, de-duplicated by `(dex_id, pair_address)`.

## On-chain Fallback
- `getProgramAccounts` on the PumpSwap program; verify owner; decode pool state to extract vault mints.
