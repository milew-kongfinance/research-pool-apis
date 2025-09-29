# Risks & Caveats (Wave 1 Pools)

## Summary

This document outlines gaps or instabilities in official endpoints and how we mitigate them with on-chain fallbacks and monitoring.

## Key Risks

1. **Endpoint Drift / Schema Changes**

   - _Mitigation_: Contract tests for `PoolMeta`, Slack alert when JSON schema differs; weekly smoke tests against Swagger roots.

2. **Real-time Freshness**

   - _Mitigation_: Subscribe to streaming (vendor/gRPC) for discovery; confirm via on-chain and then cache to DB.

3. **PumpSwap Discovery**

   - _Risk_: No official public "all pools" index; third-party (PumpPortal) incurs cost and ToS constraints.
   - _Mitigation_: Primary = on-chain scan; Secondary = PumpPortal WS for discovery; vendor abstraction layer with circuit breaker.

4. **Rate Limits and Fair Use**

   - _Risk_: Rate limits are not always published.
   - _Mitigation_: Exponential backoff; ETag/If-None-Match; pagination with cursors; staggered schedules; cache hydration jobs.

5. **Schema Nuances (CLMM/DLMM)**

   - _Risk_: No LP mint for CLMM/DLMM; bin/tick params differ by DEX.
   - _Mitigation_: Normalize to `PoolMeta` with `extra.tickSpacing` or `extra.binStep`, set `lp_mint_address = null`.

6. **CreatedAt Unavailability**

   - _Risk_: `pair_created_at` often not exposed.
   - _Mitigation_: Indexer backfill via first initialize / first swap signature scan.

---

## PumpSwap-Specific Risks

### Discovery Path

- _Mitigation_: Sharded DS search + dedupe; optional Birdeye enrichment with backoff/pacing; optional paid WS for freshness.
- Keep `pair_created_at = null` and store vendor `created_at` only in `extra.vendorCreatedAt`.

### API Limits / Backoff

- _Risk_: 429s and intermittent 5xx from enrichment endpoints.
- _Mitigation_: Exponential backoff on retriable statuses and 1.2–1.9s jitter between calls (as implemented in the adapter).

### On-chain Fallback

- _Risk_: Raw `getProgramAccounts` returns many accounts; decoding layout is non-trivial.
- _Mitigation_: Use fallback only to hit target coverage; plan decoder work in the indexer to validate/derive mints.

---

## Monitoring Plan

- Nightly run: compare field set vs last known schema; notify on diff.
- Status pings: 200/latency histograms for each endpoint; alert on deviation.
- Vendor key health checks for PumpPortal (quota, billing).
