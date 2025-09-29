# PumpSwap - Pools Research

## Reality Check

There’s no official public “all pools” index for PumpSwap.

### Practical sources we use in the PoC:

- **DexScreener** `latest/dex/search`  
  (we shard queries like `pumpswap a`, `pumpswap 1`, etc., then dedupe by `pairAddress`).

- **Birdeye pair overview**  
  (optional enrichment: liquidity, 24h volume, fee bps, created_at).  
  Requires API key + `x-chain: solana`.
  The rate limit is usually 60 rpm (the bussiness logic already checks it).

- **On-chain fallback**: `getProgramAccounts` on the PumpSwap AMM program id (from `.env`), used only when discovery count is low.

- (Optional alt/streaming) **PumpPortal WS** for real-time token listings (paid).
  _Not used in this PoC; we document it for WS availability but rely on DexScreener + on-chain fallback to meet coverage._

---

## What the PoC returns

- `pool_type`: `"amm"` (we treat post-bonding pools; bonding itself is out of scope here)
- `lp_mint_address`: `null` (AMM has no classic LP mint exposed via these sources)
- `pair_created_at`: `null` (we don’t trust vendor timestamps as canonical; we place any vendor timestamp in `extra.vendorCreatedAt`)

## Sample Responses

```json
{
  "dex_id": "pumpswap",
  "pool_type": "amm",
  "pair_address": "ATS4H3AnceUhLifUn8Gh8tLtuF4XZprXYV4b9RbFe2wM",
  "base_mint": "5ThrLJDFpJqaFL36AvAX8ECZmz6n4vZvqMYvpHHkpump",
  "quote_mint": "So11111111111111111111111111111111111111112",
  "fee_tier_bps": 0,
  "lp_mint_address": null,
  "pair_created_at": null,
  "extra": {
    "programId": "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
    "url": "https://dexscreener.com/solana/ats4h3anceuhlifun8gh8tltuf4xzprxyv4b9rbfe2wm",
    "baseSymbol": "nl",
    "quoteSymbol": "SOL",
    "liquidityUsd": 364210.653256409,
    "volume24hUsd": 13600253.096986188,
    "vendorCreatedAt": "2025-09-25T23:54:06.404Z",
    "createdAtSource": "birdeye",
    "feeSource": "unknown"
  }
}
```

```json
{
  "dex_id": "pumpswap",
  "pool_type": "amm",
  "pair_address": "6aFu19S55zHo2M4Szrcfuy4WuPih7CfQS2BfHqgR1LT6",
  "base_mint": "AhdriVFckrSmt6xfXVdNcKA545bKvKgJQuk1LAnApump",
  "quote_mint": "So11111111111111111111111111111111111111112",
  "fee_tier_bps": 0,
  "lp_mint_address": null,
  "pair_created_at": null,
  "extra": {
    "programId": "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
    "url": "https://dexscreener.com/solana/6afu19s55zho2m4szrcfuy4wupih7cfqs2bfhqgr1lt6",
    "baseSymbol": "TILLY",
    "quoteSymbol": "SOL",
    "liquidityUsd": 112494.30118685914,
    "volume24hUsd": 3266572.705880912,
    "vendorCreatedAt": "2025-09-28T05:15:31.267Z",
    "createdAtSource": "birdeye",
    "feeSource": "unknown"
  }
}
```

```json
{
  "dex_id": "pumpswap",
  "pool_type": "amm",
  "pair_address": "xj9p7D3Yij1tkB9NUSr45GQYyx7qqJExijt5EnH5NF9",
  "base_mint": "BqndqeBCNSEftBKmbTbLVx1RX5zd5J3AGL9sG55Jpump",
  "quote_mint": "So11111111111111111111111111111111111111112",
  "fee_tier_bps": 0,
  "lp_mint_address": null,
  "pair_created_at": null,
  "extra": {
    "programId": "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
    "url": "https://dexscreener.com/solana/xj9p7d3yij1tkb9nusr45gqyyx7qqjexijt5enh5nf9",
    "baseSymbol": "Q4",
    "quoteSymbol": "SOL",
    "liquidityUsd": 107220.83261001071,
    "volume24hUsd": 1025769.3164181332,
    "vendorCreatedAt": "2025-09-25T12:01:24.955Z",
    "createdAtSource": "birdeye",
    "feeSource": "unknown"
  }
}
```

**Mapping → PoolMeta:**

```json
{
  "dex_id": "pumpswap",
  "pool_type": "amm",
  "pair_address": "<pairAddress>",
  "base_mint": "<baseToken.address>",
  "quote_mint": "<quoteToken.address>",
  "fee_tier_bps": 0,
  "lp_mint_address": null,
  "pair_created_at": null,
  "extra": {
    "programId": "<PUMPSWAP_PROGRAM from .env>",
    "url": "<dexscreener url>",
    "baseSymbol": "<baseToken.symbol>",
    "quoteSymbol": "<quoteToken.symbol>",
    "liquidityUsd": "<from DS/Birdeye>",
    "volume24hUsd": "<from DS/Birdeye>",
    "feeBps": "<from Birdeye if present>",
    "vendorCreatedAt": "<ISO8601 if vendor reported>",
    "createdAtSource": "dexscreener|birdeye"
  }
}
```

## Discovery Strategy (as implemented)

### DexScreener search sweep

- Build ~50+ queries (`"pumpswap"`, `"pumpswap a"` … `"pumpswap 9"`, a few bigrams).
- Merge **all pairs**.
- Keep only **Solana** (via `chainId==='solana'` or URL contains `/solana/`).
- **Dedupe by `pairAddress`**.
- Prefer `dexId==='pumpswap'` if we still have plenty of pairs.

### Birdeye enrichment (optional)

- For each pair address, call **pair overview**.
- Read: `liquidity`, `volume_24h/volume24h`, `fee_bps/feeBps`, and `created_at`.
- Store in `extra`.
- Keep `pair_created_at=null` to reserve canonical creation for indexer backfill.
- Use polite pacing + retries (429/5xx backoff).

### On-chain fallback

- If `<100` pairs from DS, run `getProgramAccounts` on `PUMPSWAP_PROGRAM`.
- Append raw accounts (only addresses and a Solscan URL).
- No parsing/decoding in PoC.

### Owner / Program Verification

When `PUMPSWAP_PROGRAM` is set, we verify each discovered pool account via
`getMultipleAccounts` and keep only those with `owner === PUMPSWAP_PROGRAM`.
This runs before slicing to the top 500.

---

## Dedup Rules

- **Canonical key**: `pair_address` (Solana account address of the pool on the AMM program).
- If multiple vendors report the same pool, unify on that key and keep a single record.

---

## On-chain Notes

- **Fallback call**: `getProgramAccounts` with `encoding: "base64"` over the configured program id.
- In a future hardening pass, parse pool state to extract mints/fees directly on-chain.
- For now we rely on vendor discovery + Birdeye enrichment.

---
