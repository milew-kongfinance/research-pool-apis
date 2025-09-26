# Research Pool APIs (Wave 1)

This repo contains research notes and **minimal discovery PoCs** for Solana DEX pools (Wave 1: Raydium AMM/CLMM, Orca Whirlpools, Meteora DLMM, PumpSwap).

---

## Folder Layout

```
dex-pools/          # DEX research sheets + comparison matrix + risks
pocs/               # Minimal TS scripts that return PoolMeta[] (discovery baseline)
postman/            # Postman collection with example HTTP/WS calls
.env.example        # Environment variables used by PoCs
```

---

## Data Contract (returned by PoCs)

```ts
type PoolMeta = {
  dex_id: "raydium" | "orca" | "meteora" | "pumpswap";
  pool_type: "amm" | "clmm" | "dlmm" | "bonding";
  pair_address: string;
  base_mint: string;
  quote_mint: string;
  fee_tier_bps: number;
  lp_mint_address: string | null;
  pair_created_at: string | null; // ISO8601 or null if unknown
  extra: Record<string, unknown>; // e.g. { tickSpacing: number, binStep?: number, programId: string }
};
```

The schema is enforced in `pocs/common/schema.ts` (Zod).

---

## Requirements

- Node.js **18+** (20+ recommended)
- Optional: a Solana HTTPS RPC for on-chain fallback (`SOLANA_RPC`), though **Orca & Meteora HTTP do not require it**

---

## Setup

```bash
cp .env.example .env
# If you want on-chain fallbacks later:
#   - Set SOLANA_RPC to a HTTPS endpoint (e.g. https://api.mainnet-beta.solana.com or a paid provider)
#   - Set PUMPSWAP_PROGRAM only when you actually know the AMM program id you want to scan
```

`.env` example:

```env
SOLANA_RPC=https://api.mainnet-beta.solana.com
PUMPSWAP_PROGRAM=
```

Install deps:

```bash
npm i
```

Type-check:

```bash
npm run typecheck
```

---

## Orca

The Orca adapter **only** uses the **list** endpoint and maps to `PoolMeta[]`:

- Endpoint: `GET https://api.orca.so/v1/whirlpool/list`
- Fields used: `address`, `tokenA.mint`, `tokenB.mint`, `feeRateBps` (or `lpFeeRate * 10_000`), `tickSpacing`
- `lp_mint_address = null` (CLMM has no classic LP mint)
- `pair_created_at = null` (HTTP list doesn’t expose it)

> **Note:** The **details** route (`/v1/whirlpool/<address>`) can return a **diagnostic wrapper** (e.g., Cloudflare 1016) depending on region/provider. We **do not** rely on it in the PoC. See `dex-pools/orca.md` for details.

To print the first ~200 items to the stdout:

```bash
npm run fetch -- orca
```

To save them in `orca.json` in the root:

```bash
npm run fetch --silent -- orca | Out-File -Encoding utf8 orca.json
```

---

## Meteora

The Meteora adapter uses **HTTP discovery** (no RPC required) via the DLMM public API:

- Endpoints:
  - `GET https://dlmm-api.meteora.ag/pair/all_with_pagination?page=<n>&limit=<m>` (recommended, paginated)
  - `GET https://dlmm-api.meteora.ag/pair/{address}` (details)
- Mapping:
  - `address → pair_address`
  - `mint_x / mint_y → base_mint / quote_mint`
  - `bin_step → extra.binStep`
  - `base_fee_percentage` (string) → `fee_tier_bps` (integer bps; best‑effort conversion)
- DLMM has **no LP mint** → `lp_mint_address = null`
- `pair_created_at` is not exposed by HTTP → left `null` (indexer backfills from first init/swap)
- The adapter deduplicates duplicates across pages.

Print to the stdout or save to `meteora.json` in the root:

```bash
npm run fetch -- meteora
npm run fetch --silent -- meteora | Out-File -Encoding utf8 meteora.json
```

---
