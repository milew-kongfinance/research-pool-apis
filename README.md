# Research Pool APIs (Wave 1)

This repo contains research notes and **minimal discovery PoCs** for Solana DEX pools (Wave 1: Orca Whirlpools, Meteora DLMM, PumpSwap).

---

## Folder Layout

```
dex-pools/          # DEX research sheets + comparison matrix + risks
pocs/               # Minimal TS scripts that return PoolMeta[] (discovery baseline)
postman/            # Postman collection with example HTTP/WS calls
.env-example        # Environment variables used by PoCs
```

---

## Data Contract (returned by PoCs)

```ts
type PoolMeta = {
  dex_id: "orca" | "meteora" | "pumpswap";
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

---

## Setup

- Clone the repo:

  ```bash
  git clone https://github.com/milew-kongfinance/research-pool-apis
  cd research-pool-apis
  ```

- Install the deps and check if the project compiles:

  ```bash
  npm i
  npm run typecheck
  ```

- Create an `.env` file in the root. Check the `.env-example`:

  ```env
  SOLANA_RPC=https://api.mainnet-beta.solana.com
  PUMPSWAP_PROGRAM=pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA
  BIRDEYE_API_KEY=foo
  ```

  - How to get the exact values?

    - `SOLANA_RPC` - the Solana HTTPS RPC endpoint used for on-chain queries and fallback.

      - This is a URL to a Solana JSON-RPC node (e.g., https://api.mainnet-beta.solana.com).
      - You can use the public endpoint above, or obtain a private endpoint from providers like QuickNode, Alchemy, or Triton for higher rate limits and reliability.

    - `PUMPSWAP_PROGRAM` - the PumpSwap AMM program id on Solana mainnet.

      - Identified by inspecting known PumpSwap pool accounts and swap transactions and confirming the program owner used by those instructions.
      - Current mainnet id we use: `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA`.

    - `BIRDEYE_API_KEY` - the Birdeye public API key used to call their pair overview endpoint for enrichment.
      - Obtained by creating a key in the Birdeye developer ([dashboard security section](https://bds.birdeye.so/user/security)).

---

## Orca

The Orca adapter **only** uses the **list** endpoint and maps to `PoolMeta[]`:

- Endpoint: `GET https://api.orca.so/v1/whirlpool/list`
- Fields used: `address`, `tokenA.mint`, `tokenB.mint`, `feeRateBps` (or `lpFeeRate * 10_000`), `tickSpacing`
- `lp_mint_address = null` (CLMM has no classic LP mint)
- `pair_created_at = null` (HTTP list doesn’t expose it)

> **Note:** The **details** route (`/v1/whirlpool/<address>`) can return a **diagnostic wrapper** (e.g., Cloudflare 1016) depending on region/provider. We **do not** rely on it in the PoC. See `dex-pools/orca.md` for details.

### Usage

To print the first ~200 items to the stdout:

```bash
npm run orca
```

To save them in `orca.json` in the root:

```powershell
npm run orca --silent | Out-File -Encoding utf8 orca.json
```

(Or if you are using Linux):

```bash
npm run orca --silent > orca.json
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

### Usage

Print to the stdout or save to `meteora.json` in the root:

```powershell
npm run meteora
npm run meteora --silent | Out-File -Encoding utf8 meteora.json
```

Or in Linux:

```bash
npm run meteora
npm run meteora --silent > meteora.json
```

---

## PumpSwap

The PumpSwap adapter uses DexScreener search (sharded queries) for discovery, then optionally enriches with Birdeye.
If the list is still short, it falls back to on-chain `getProgramAccounts` on a configured AMM program id.

Returned `PoolMeta[]` sets:

- `lp_mint_address = null`
- `pair_created_at = null`
- Any vendor-reported timestamp is stored in `extra.vendorCreatedAt`.

### Endpoints

- DexScreener search

  - `GET https://api.dexscreener.com/latest/dex/search?q=<term>`
  - (we shard terms like `pumpswap a`, `pumpswap 1`).

- Birdeye enrichment

  - `GET https://public-api.birdeye.so/defi/v3/pair/overview/single?address=<pair>`
  - (requires `X-API-KEY` + `x-chain: solana`).

- On-chain fallback
  - Solana JSON-RPC `getProgramAccounts` on the PumpSwap program id.

### Usage

Print to the stdout or save to `pumpswap.json` in the root:

```powershell
npm run pumpswap
npm run pumpswap --silent | Out-File -Encoding utf8 pumpswap.json
```

Or in Linux:

```bash
npm run pumpswap
npm run pumpswap --silent > pumpswap.json
```

---
