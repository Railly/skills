# Reviewer Fable — Shaping Review: Vercel Desktop usage-report migration

**Basis:** frozen packet only. Base snapshot `vercel-labs/vercel-desktop @ 1c3d4c76dd47043945ae3362cc7f7dc05533d84e`; upstream `vercel/api @ 341a3deea8845a939924cdf4584cc5c090034eab`. No branch, transcript, or other reviewer output inspected.

---

## Requirements (R)

Settled requirements R0–R11 are preserved verbatim. R12–R17 are **derived** from the packet's unknowns, evidence, and frame ("without … losing existing metrics"), and are standalone (not shape-dependent).

| ID | Requirement | Status | Origin |
|----|-------------|--------|--------|
| R0 | Desktop obtains the current managed key's 30-day spend report from `GET /ai-gateway/usage-report`. | Core goal | Settled |
| R1 | The headline, charts, ranges, and model rows remain scoped to the exact durable managed `keyId`; key names are never identity. | Must-have | Settled |
| R2 | Today, past week, and past 30 days preserve their current UTC-day semantics and displayed reset boundary. This slice must not claim local-calendar-day accuracy. | Must-have | Settled |
| R3 | Today, week, and month continue exposing spend, requests, total tokens, and daily/hourly chart buckets at the granularity the new endpoint actually supports. | Must-have | Settled |
| R4 | Production responses that omit optional `billedSpend` and `succeededRequests` remain readable. No total may silently become zero because an optional field is absent. | Must-have | Settled |
| R5 | A signed-in caller can read only data authorized by the endpoint. Desktop must not send its AI Gateway secret to `api.vercel.com`. | Must-have | Settled |
| R6 | Existing CLI-session and Desktop-OAuth-session sign-in paths continue to work, including token refresh and sign-out behavior. | Must-have | Settled |
| R7 | Existing managed-key creation, inventory, quota read/write, agent setup, persisted report fallback, refresh, and account switching remain functional. | Must-have | Settled |
| R8 | Failed, truncated, stale, or out-of-order report responses do not replace the last good report or a newly selected key's report. | Must-have | Settled |
| R9 | Empty usage is a successful zero report, distinct from malformed, unauthorized, or failed responses. | Must-have | Settled |
| R10 | The client uses one authoritative 30-day snapshot per refresh wherever the API response can supply the existing UI values consistently. | Must-have | Settled |
| R11 | The change is independently mergeable and revertible without coupling it to personal `scope=user` reporting or fx OAuth attribution. | Must-have | Settled |
| R12 | Exactly one report implementation exists, fed by one session-token authority that serves both CLI-session and OAuth-session sign-in paths. | Must-have | **Derived** from U1, R6, E3/E4 |
| R13 | Every report request is tagged with its target (durable `keyId` + account epoch + monotonic sequence); a response is published atomically only if its tag matches the current target and is the newest sequence. | Must-have | **Derived** from R8, E2, E8 (60 s cache means out-of-order responses are realistic) |
| R14 | `totals.spend` drives all displayed spend; `billedSpend` and `succeededRequests` are parsed as optional and do not drive the headline while production omits them. | Must-have | **Derived** from U3, P1, P3, E7 |
| R15 | Window requests use the endpoint's inclusive UTC date parameters: Today = `start=end=<current UTC date>`; month = `start=<UTC today−29d>&end=<UTC today>`; the displayed reset boundary is unchanged. | Must-have | **Derived** from R2, E5 |
| R16 | Session expiry during a background report refresh triggers at most one token-refresh attempt; on failure the last-good report is preserved with a stale marker — never a sign-out, picker loop, or blank report. | Must-have | **Derived** from U6, E4, temporal contract rows "Vercel access authority" and "Last-good report" |
| R17 | The model breakdown remains key-scoped and the top-spender list remains team-scoped; neither metric is dropped or silently rescoped. | Must-have | **Derived** from U4 and frame ("without … losing existing metrics") |

---

## Shapes

### CURRENT (baseline, for reference)

Per E1: four separate `/v1/report` calls per refresh — hourly Today (`src/app.zig:3247-3287`), closed windows (`3485-3591`), models and top spenders (`3594-3649`) — with last-good persistence keyed by durable key ID (E2) and dual session paths (E3/E4).

---

### A: Full cutover — one keyId snapshot drives everything, second team-scope call for top spenders

All legacy `/v1/report` call sites are deleted. One keyId-scoped 30-day snapshot supplies headline, windows, charts, and models; a second usage-report call at team scope supplies top spenders. The Today chart degrades to the endpoint's daily granularity.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | `fetchUsageReport(target)` in `src/app.zig`: single `GET api.vercel.com/ai-gateway/usage-report?teamId=<team>&keyId=<durable keyId>&start=<UTC today−29d>&end=<UTC today>` with Vercel bearer token (E5, E6). | |
| **A2** | Session authority adapter `vercelToken()`: returns CLI session token (E3) or OAuth access token; on 401, one refresh-token retry via existing recovery (E4 `src/app.zig:2713-2777`, `4889-4911`); replaces per-callsite token plumbing. | |
| **A3** | Optional-tolerant decoder: `totals.spend/requests/tokens` required; `billedSpend`, `succeededRequests` decoded as optional-absent (E7, P1); empty `daily` array + zero totals = valid zero report distinct from parse/auth failure (R9). | |
| **A4** | Window derivation from one snapshot: Today = daily row where `date == current UTC date` (synthesized zero row if absent); week = last 7 daily rows; month = all rows; headline from `totals`. | |
| **A5** | Today chart rendered at endpoint granularity: single daily bucket; hourly axis removed. | |
| **A6** | Model rows read from `topModels` in the same keyId-scoped snapshot (E5, P1). | |
| **A7** | Second call: team-scope usage-report **without** `keyId`, `topKeys` section, for the top-spender list. | ⚠️ E6 ACL-gates broad reads; whether Desktop's CLI/OAuth sessions pass that gate, and whether a `topKeys` section is returned, is unverified (P1 only probed a key-filtered request). |
| **A8** | Snapshot guard per R13: tag (keyId, accountEpoch, seq) at request time; atomic publish only on tag match + newest seq; reuses last-good persistence keyed by report target ID (E2 `src/app.zig:1454-1462`, `2576-2644`). | |
| **A9** | Delete legacy `/v1/report` call sites (E1: `3247-3287`, `3485-3591`, `3594-3649`). | |

---

### B: Hybrid authority — snapshot owns the numbers, legacy endpoint retained only where the snapshot cannot supply the value

One keyId-scoped 30-day usage-report snapshot is the sole numeric authority (headline, Today/week/month spend, requests, tokens, model rows). Exactly two legacy `/v1/report` calls are retained for values the new endpoint provably cannot supply: hourly Today chart buckets (E5: day buckets only) and the team-scoped top-spender list.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | Same single fetch as A1: one keyId-scoped 30-day usage-report call per refresh. | |
| **B2** | Session authority adapter, identical to A2 (satisfies R12, R16). | |
| **B3** | Optional-tolerant decoder, identical to A3 (satisfies R4, R9, R14). | |
| **B4** | Window derivation identical to A4; the snapshot is the **only** source for every displayed number. | |
| **B5** | Retain legacy hourly Today call (E1 `3247-3287`) for chart bucket shape only; hourly buckets never override snapshot numbers — chart sums are display-only, headline stays snapshot-driven, preventing cross-source disagreement. | |
| **B6** | Retain legacy team top-spender call (E1 within `3594-3649`) unchanged, preserving its team-scoped meaning (R17). | |
| **B7** | Model rows from snapshot `topModels`; the legacy model-breakdown call is removed. | |
| **B8** | Snapshot guard per R13 applied uniformly to the snapshot **and** both retained legacy responses, reusing the existing key-ID-bound rejection machinery (E2). Publish order: snapshot atomically first; chart/top-spender annotations attach only if their tag matches the published snapshot's target (resolves U5: atomic numbers, additive decoration). | |
| **B9** | Revert seam: the snapshot path is gated by one constant/flag at the fetch dispatcher; a single revert restores the four-call CURRENT flow (R11). No `scope=user` or fx-OAuth coupling anywhere. | |

---

### C: Incremental per-window swap — keep the four-call lifecycle, point each call at usage-report

Preserves the current Today-first incremental publish lifecycle; each existing `/v1/report` call is individually replaced by a scoped usage-report call.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **C1** | Replace closed-window calls with per-window usage-report calls: Today `start=end=<UTC today>`; week `start=<UTC today−6d>`; month `start=<UTC today−29d>` (E5). | |
| **C2** | Separate keyId-scoped usage-report call for `topModels`. | |
| **C3** | Top spenders retained on legacy `/v1/report` (as B6). | |
| **C4** | Existing Today-first incremental publish lifecycle unchanged. | |
| **C5** | Decoder and session authority adapter shared with A/B (A2, A3). | |

---

## Fit Check

Binary only. A flagged mechanism cannot back a ✅ (a flag means "what, not how").

| Req | Requirement | Status | A | B | C |
|-----|-------------|--------|---|---|---|
| R0 | Desktop obtains the current managed key's 30-day spend report from `GET /ai-gateway/usage-report`. | Core goal | ✅ | ✅ | ✅ |
| R1 | The headline, charts, ranges, and model rows remain scoped to the exact durable managed `keyId`; key names are never identity. | Must-have | ✅ | ✅ | ✅ |
| R2 | Today, past week, and past 30 days preserve their current UTC-day semantics and displayed reset boundary. This slice must not claim local-calendar-day accuracy. | Must-have | ✅ | ✅ | ✅ |
| R3 | Today, week, and month continue exposing spend, requests, total tokens, and daily/hourly chart buckets at the granularity the new endpoint actually supports. | Must-have | ✅ | ✅ | ✅ |
| R4 | Production responses that omit optional `billedSpend` and `succeededRequests` remain readable. No total may silently become zero because an optional field is absent. | Must-have | ✅ | ✅ | ✅ |
| R5 | A signed-in caller can read only data authorized by the endpoint. Desktop must not send its AI Gateway secret to `api.vercel.com`. | Must-have | ✅ | ✅ | ✅ |
| R6 | Existing CLI-session and Desktop-OAuth-session sign-in paths continue to work, including token refresh and sign-out behavior. | Must-have | ✅ | ✅ | ✅ |
| R7 | Existing managed-key creation, inventory, quota read/write, agent setup, persisted report fallback, refresh, and account switching remain functional. | Must-have | ✅ | ✅ | ✅ |
| R8 | Failed, truncated, stale, or out-of-order report responses do not replace the last good report or a newly selected key's report. | Must-have | ✅ | ✅ | ✅ |
| R9 | Empty usage is a successful zero report, distinct from malformed, unauthorized, or failed responses. | Must-have | ✅ | ✅ | ✅ |
| R10 | The client uses one authoritative 30-day snapshot per refresh wherever the API response can supply the existing UI values consistently. | Must-have | ✅ | ✅ | ❌ |
| R11 | The change is independently mergeable and revertible without coupling it to personal `scope=user` reporting or fx OAuth attribution. | Must-have | ✅ | ✅ | ✅ |
| R12 | Exactly one report implementation, fed by one session-token authority serving both sign-in paths. | Must-have | ✅ | ✅ | ✅ |
| R13 | Requests tagged with (keyId + account epoch + sequence); publish atomically only on tag match and newest sequence. | Must-have | ✅ | ✅ | ✅ |
| R14 | `totals.spend` drives displayed spend; optional fields never drive the headline while absent in production. | Must-have | ✅ | ✅ | ✅ |
| R15 | Window requests use inclusive UTC date parameters; displayed reset boundary unchanged. | Must-have | ✅ | ✅ | ✅ |
| R16 | Session expiry mid-refresh: at most one refresh attempt; failure preserves last-good with stale marker, never sign-out/picker loops. | Must-have | ✅ | ✅ | ✅ |
| R17 | Model breakdown remains key-scoped; top-spender list remains team-scoped; neither metric dropped or rescoped. | Must-have | ❌ | ✅ | ✅ |

**Notes:**

- **A fails R17:** the top-spender list depends on A7, which is flagged. E6 shows the endpoint ACL-gates broad (non-self) reads, and P1 only demonstrates a key-filtered success. Whether Desktop's sessions clear the team-scope gate — and whether `topKeys` is even returned — is unknown. A ✅ is a claim of knowledge; A cannot claim it.
- **C fails R10:** C issues four usage-report calls per refresh where one keyId snapshot can supply Today/week/month/models. E8 partitions the 60-second server cache by filter set, so each window can be served from a different cache generation, allowing visible inconsistencies (e.g., week total momentarily below Today total). This is precisely the multi-call inconsistency R10 exists to eliminate, and it also forfeits most of the speed motive in the frame.
- **A passes R3 only on the letter of the requirement:** R3 explicitly licenses "the granularity the new endpoint actually supports," so a daily-bucket Today chart is compliant. It is nevertheless a product regression relative to CURRENT's hourly chart, recorded here as a rejection reason rather than a fit-check failure.

---

## Decision

### Recommended survivor: **Shape B — Hybrid authority**

- Only shape with a clean row: no ❌, no flagged parts on any required mechanism.
- Satisfies R0/R10 with exactly one authoritative snapshot for every number the endpoint can supply, while E5's day-bucket limitation and E6's ACL gate make the two retained legacy calls the only non-speculative way to satisfy R3-as-currently-rendered and R17.
- B8 resolves U5 concretely: atomic snapshot publish for numbers, tag-guarded additive decoration for the hourly chart and top spenders — no torn states, no Today-first inconsistency.
- B9 gives a single-flag revert (R11) and leaves Shape A available as a later slice once probes clear A7.
- Honors the temporal contract directly: last-good replacement is atomic per accepted snapshot, keyed by report target ID; target changes reject in-flight responses (B8/E2); the authority adapter (B2) preserves the session-continuity observables.

### Rejected alternatives

| Shape | Reason for rejection |
|-------|---------------------|
| **A: Full cutover** | Fails R17 on a flagged unknown (team-scope ACL + `topKeys` availability, per E6 vs. P1's key-filtered-only evidence). Also degrades the Today chart from hourly to one daily bucket — compliant with R3's letter but a user-visible regression the frame ("without … losing existing metrics") does not sanction. Viable as a follow-up slice only after Probe 1 passes. |
| **C: Incremental per-window swap** | Fails R10: four filter-distinct calls against a 60 s filter-partitioned cache (E8) can publish mutually inconsistent windows in one refresh, and the multi-call lifecycle discards the latency win that motivates the migration. |

### Cheapest required probes

Ordered by cost; 1–3 record status codes and boolean section-presence only — no IDs, names, or amounts (matching P1/P2 discipline).

| # | Probe | Resolves | Cost |
|---|-------|----------|------|
| 1 | One team-scope `usage-report` request **without** `keyId` using an existing Desktop CLI session token, then repeat with an OAuth session token; record HTTP status and whether a `topKeys` section is present. | U4; A7's flag; whether Shape A becomes viable as a follow-up slice. | Two HTTP calls |
| 2 | Two keyId-scoped requests for `start=end=<current UTC date>`, ≥61 s apart; compare presence/monotonicity of the current-day daily row and cache metadata (E8). | U2's residual question: is the snapshot's Today total fresh enough intra-day to be the numeric authority behind B4/B5. | Two HTTP calls + a timer |
| 3 | One report request with a deliberately expired OAuth access token (and the CLI-path analog); record error status/shape and confirm E4's refresh path recovers without sign-out. | U6; validates B2/R16 mechanism. | One or two HTTP calls |
| 4 | Local unit fixture built from P1's observed shape (`billedSpend`/`succeededRequests` absent; separately, empty `daily` + zero totals) run against the B3 decoder. | Locks R4, R9, R14 permanently; zero network. | One unit test |

**Unknowns disposition:** U1 → resolved by R12/B2. U2 → hourly cannot come from the new endpoint (E5); B5 retains the legacy hourly source; Probe 2 confirms Today-total freshness. U3 → resolved by R14 (`spend` drives; revisit when P3's parity fields appear in production). U4 → Probe 1. U5 → resolved by B8 (atomic snapshot + guarded decoration). U6 → Probe 3.
