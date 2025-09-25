# Research – Pool APIs (Wave 1)

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
- Optional: a Solana HTTPS RPC for on-chain fallback (`SOLANA_RPC`), though **Orca HTTP does not require it**

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

Run (stdout prints first ~200 items, stderr prints a summary):

```bash
npm run fetch -- orca
```

Capture to file and validate it parses as JSON:

```bash
npm run fetch -- orca 1> orca.json 2> /dev/null
node -e "console.log('pools:', JSON.parse(require('fs').readFileSync('orca.json','utf8')).length)"
```

PowerShell alternative:

```powershell
npm run fetch -- orca 1> orca.json 2> $null
node -e "const j=JSON.parse(require('fs').readFileSync('orca.json','utf8')); console.log('pools:', j.length)"
```

You should see something like:

```
orca: OK (14983 pools)
```

---

## Common Scripts / CLI

All PoCs use a single entrypoint:

```bash
npm run fetch -- <raydium|orca|meteora|pumpswap> [--onchain=true] [--ids=a,b]   # ids currently used by raydium only
```

- `--onchain=true` enables the on-chain scan path **when implemented and when your RPC allows scans**.

Examples:

```bash
npm run fetch -- orca
npm run fetch -- orca --onchain=true      # optional; requires SOLANA_RPC and a provider that allows scans
```

---
