# Vercel Desktop usage-report migration: frozen packet

## Run

- Mode: greenfield.
- Trigger: the migration changes API contract, authentication authority, response shape, request lifecycle, caching, and time-window behavior.
- Target repository: `vercel-labs/vercel-desktop` at `1c3d4c76dd47043945ae3362cc7f7dc05533d84e`.
- Upstream API repository: `vercel/api` at `341a3deea8845a939924cdf4584cc5c090034eab`.

## Frame

Vercel Desktop currently assembles managed-key spend from several calls to the older report endpoint. A new usage-report endpoint is available and materially faster. The desired outcome is to adopt the new report without changing which spend the current Desktop UI represents, weakening authorization, losing existing metrics, or claiming a local-day definition the endpoint does not provide.

## Settled requirements

| ID | Status | Requirement |
|---|---|---|
| R0 | Core goal | Desktop obtains the current managed key's 30-day spend report from `GET /ai-gateway/usage-report`. |
| R1 | Must-have | The headline, charts, ranges, and model rows remain scoped to the exact durable managed `keyId`; key names are never identity. |
| R2 | Must-have | Today, past week, and past 30 days preserve their current UTC-day semantics and displayed reset boundary. This slice must not claim local-calendar-day accuracy. |
| R3 | Must-have | Today, week, and month continue exposing spend, requests, total tokens, and daily/hourly chart buckets at the granularity the new endpoint actually supports. |
| R4 | Must-have | Production responses that omit optional `billedSpend` and `succeededRequests` remain readable. No total may silently become zero because an optional field is absent. |
| R5 | Must-have | A signed-in caller can read only data authorized by the endpoint. Desktop must not send its AI Gateway secret to `api.vercel.com`. |
| R6 | Must-have | Existing CLI-session and Desktop-OAuth-session sign-in paths continue to work, including token refresh and sign-out behavior. |
| R7 | Must-have | Existing managed-key creation, inventory, quota read/write, agent setup, persisted report fallback, refresh, and account switching remain functional. |
| R8 | Must-have | Failed, truncated, stale, or out-of-order report responses do not replace the last good report or a newly selected key's report. |
| R9 | Must-have | Empty usage is a successful zero report, distinct from malformed, unauthorized, or failed responses. |
| R10 | Must-have | The client uses one authoritative 30-day snapshot per refresh wherever the API response can supply the existing UI values consistently. |
| R11 | Must-have | The change is independently mergeable and revertible without coupling it to personal `scope=user` reporting or fx OAuth attribution. |

## Must not change

- PR #14's coding-agent delegation behavior and agent configuration state.
- Managed AI Gateway key storage in macOS Keychain.
- API key inventory and identity reconciliation by durable key ID.
- Key quota reads and writes through the existing AI Gateway endpoints.
- Account and team selection, CLI sign-in, Desktop OAuth sign-in, refresh-token recovery, and sign-out.
- Last-good report persistence and rejection of stale responses after key/account changes.
- The product distinction between managed-key spend and future signed-in-user spend.
- Release metadata and version.

## Unknowns for shaping

| ID | Unknown |
|---|---|
| U1 | Which existing Vercel-session authority should own report reads for both sign-in paths without introducing two report implementations? |
| U2 | Whether the new endpoint's daily rows are sufficient to preserve the current 24-hour Today chart, because the endpoint exposes day buckets only. |
| U3 | Whether `spend` or optional `billedSpend` should drive the UI while production does not yet return `billedSpend`. |
| U4 | Whether model and key ranking sections can replace the current independent model and top-spender reads without changing their key-scoped/team-scoped meaning. |
| U5 | Whether one 30-day response should atomically publish all windows or preserve the current incremental Today-first behavior. |
| U6 | Exact failure behavior when the Vercel session expires during a background report refresh on each sign-in path. |

## Temporal contract

| State | Scope and owner | Initial default | `unset → set` | `set → omitted` | `set → same` | `set → changed` | `set → explicit clear` | Reuse, restart, or migrate | Continuity observables |
|---|---|---|---|---|---|---|---|---|---|
| Selected account/team | Desktop persisted state | none | selection starts reporting for that account | ordinary refresh preserves selection | preserves report target | new account invalidates old target before publishing new data | sign-out clears session-facing account state | reuse for refresh; migrate on account selection | account label, team ID, managed key ID, shown report |
| Managed key ID | Desktop persisted state | none until inventory resolves it | resolved ID enables exact key report | omission from a response does not erase stored identity | same ID may reuse last-good report | changed ID invalidates old report and caches | key removal clears key and report | reuse same target; migrate on key change | key badge, report target ID, headline and chart |
| Vercel access authority | CLI session or Desktop OAuth session | signed out | sign-in enables authorized account APIs | an ordinary report call does not clear the session | reuse authority | refreshed token preserves the logical session | sign-out explicitly clears or logs out | reuse across refreshes; refresh expired OAuth token | selected account, teams, report availability, no picker loop |
| Last-good report | Desktop persisted state, keyed by report target ID | absent | first valid response publishes | failed/omitted refresh preserves it and marks stale | valid same-target response replaces it | target change rejects old response and cache | managed-key removal clears it | reuse on transient failures; replace atomically per accepted snapshot | headline, charts, updated timestamp, stale indicator |

## Evidence handles

| Handle | Evidence |
|---|---|
| E1 | `src/app.zig:3247-3287`, `3485-3591`, `3594-3649`: current Desktop issues separate `/v1/report` calls for Today, closed windows, models, and top spenders. |
| E2 | `src/app.zig:1454-1462`, `2576-2644`, `2663-2706`: report persistence is bound to the durable managed key ID and last-good state. |
| E3 | `src/app.zig:3676-3684`, `3768-3792`: Desktop supports CLI-owned sessions and direct OAuth sessions. |
| E4 | `src/app.zig:2713-2777`, `4889-4911`, `5370-5477`: OAuth access tokens are ephemeral, refresh tokens recover the session, and sign-out has distinct CLI/OAuth paths. |
| E5 | `vercel/api services/api-ai-gateway/src/endpoints/usage-report/schema.ts:7-189`: `start` and `end` are inclusive UTC dates only; max range is 92 days; default scope is user; `keyId` and response sections are supported. |
| E6 | `vercel/api services/api-ai-gateway/src/endpoints/usage-report/get.ts:30-242`: the endpoint uses Vercel account auth, ACL-gates broad/self reads, verifies self-owned key filters, and filters the warehouse by `keyId`. |
| E7 | `vercel/api services/api-ai-gateway/src/lib/usage-report/fold.ts:38-150`: response totals and daily/model fields; `billedSpend` and `succeededRequests` are optional. |
| E8 | `vercel/api services/api-ai-gateway/src/lib/usage-report/cache.ts:11-16`, `77-143`, `164-230`: server cache TTL is 60 seconds and filters, including `keyId`, partition cache entries. |
| P1 | Production probe on 2026-08-24 via Vercel CLI session: a 30-day key-filtered team request returned HTTP success with `totals`, 30 `daily` rows, `topModels`, and cache metadata. The response omitted optional `billedSpend` and `succeededRequests`. No IDs, names, or amounts were recorded. |
| P2 | Production probe on 2026-08-24 using the managed AI Gateway secret against `api.vercel.com`: HTTP 404 `not_found`. No secret or response body was recorded. |
| P3 | Upstream PR #87145 states `billedSpend`/`succeededRequests` complete parity with the old query, but P1 shows those optional fields are not yet present in the observed production response. |

## Reviewer output contract

Produce a complete Shaping artifact from this packet only:

1. Full R table, preserving settled requirements and labeling any derived requirements.
2. At least two materially distinct shapes, each with concrete mechanism parts and flags for unknown mechanisms.
3. Binary R × Shape fit check with failure notes.
4. Recommended survivor, rejected alternatives, and cheapest required probes.
5. Do not inspect another reviewer's output or any candidate implementation branch.
