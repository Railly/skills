# Shaping Document: Usage-Report Migration

## Requirements (R)

The following requirements are derived from the settled requirements, temporal contract, and production evidence in the frozen packet.

| ID | Status | Requirement |
|----|--------|-------------|
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
| R12 | Must-have | *(Derived from U2/E5)* The Today chart safely renders the single UTC-day bucket returned by the endpoint rather than claiming 24-hour hourly precision, as the endpoint only supports daily granularity. |
| R13 | Must-have | *(Derived from U3/P1)* Calculations fallback safely to `spend` and `totalRequests` when `billedSpend` and `succeededRequests` are absent from the production payload. |
| R14 | Must-have | *(Derived from U1/P2)* The request is authenticated via the existing Vercel Access Authority (CLI or OAuth) rather than the managed AI Gateway Secret, which 404s on the new endpoint. |

---

## Shapes (Solution Options)

### A: Unified Atomic 30-day Snapshot via Vercel Session Auth

This shape shifts the authentication authority from the AI Gateway secret to the Vercel Session and uses a single 30-day request to populate all UI elements synchronously.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Auth Routing**: Divert `/ai-gateway/usage-report` network calls to use the `Vercel Access Authority` (CLI/OAuth Bearer token) instead of the AI Gateway secret client. | |
| **A2** | **Single 30-Day Query**: Fetch `GET /ai-gateway/usage-report?start=<UTC-30d>&end=<UTC-now>&keyId=<managed_key_id>&teamId=<team>` in one request. | |
| **A3** | **Data Parsing & Fallback**: Parse `totals`, `daily`, and `topModels`. Compute UI models: Month = `totals`. Week = aggregate last 7 days of `daily`. Today = last element of `daily`. Use `billedSpend ?? spend` and `succeededRequests ?? totalRequests` for all values. | |
| **A4** | **Atomic State Publish**: Replace the current incremental report persistence (which loads Today first, then others) with a single atomic update to the `last-good report` state, publishing all windows simultaneously to the UI. | |

### B: Incremental Multi-Window Fetches via Vercel Session Auth

This shape preserves the existing UI loading sequence (Today, then Week, then Month) by making three separate calls to the new endpoint, authenticating via Vercel Session.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | **Auth Routing**: Route `/ai-gateway/usage-report` via Vercel Access Authority (same as A1). | |
| **B2** | **Multi-Query Fetches**: Execute three distinct network requests with different `start` parameters (UTC-now, UTC-7d, UTC-30d) and the `keyId` filter. | |
| **B3** | **Data Parsing & Fallback**: Read only the `totals` block from each of the three responses, applying the `??` fallbacks for optional fields. | |
| **B4** | **Incremental State Publish**: Publish Today to the store, then Week, then Month as each request resolves, maintaining legacy render staging. | |

### C: Naive Endpoint Swap via AI Gateway Secret

This shape attempts a minimal code change by swapping the endpoint URL but keeping the existing AI Gateway secret for authentication.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **C1** | **Query Formulation**: Fetch single 30-day `GET /ai-gateway/usage-report?keyId=<managed_key_id>` via existing network client. | |
| **C2** | **Data Parsing**: Map `totals` and `daily` to UI state as in Shape A. | |
| **C3** | **Secret Acceptance**: The `api.vercel.com` endpoint accepts the AI Gateway managed secret for authorization instead of a user access token. | ⚠️ |

---

## Fit Check

| Req | Requirement | Status | A | B | C |
|-----|-------------|--------|---|---|---|
| R0 | Desktop obtains the current managed key's 30-day spend report from `GET /ai-gateway/usage-report`. | Core goal | ✅ | ✅ | ✅ |
| R1 | The headline, charts, ranges, and model rows remain scoped to the exact durable managed `keyId`; key names are never identity. | Must-have | ✅ | ✅ | ✅ |
| R2 | Today, past week, and past 30 days preserve their current UTC-day semantics and displayed reset boundary. | Must-have | ✅ | ✅ | ✅ |
| R3 | Expose spend, requests, tokens, and daily/hourly chart buckets at the granularity the new endpoint actually supports. | Must-have | ✅ | ✅ | ✅ |
| R4 | Production responses that omit optional `billedSpend` and `succeededRequests` remain readable. | Must-have | ✅ | ✅ | ✅ |
| R5 | Desktop must not send its AI Gateway secret to `api.vercel.com`. | Must-have | ✅ | ✅ | ❌ |
| R6 | Existing CLI-session and Desktop-OAuth-session sign-in paths continue to work. | Must-have | ✅ | ✅ | ✅ |
| R7 | Existing managed-key creation, inventory, quota read/write, agent setup, persisted report fallback... remain functional. | Must-have | ✅ | ✅ | ✅ |
| R8 | Failed, truncated, stale, or out-of-order report responses do not replace the last good report. | Must-have | ✅ | ✅ | ✅ |
| R9 | Empty usage is a successful zero report, distinct from malformed, unauthorized, or failed responses. | Must-have | ✅ | ✅ | ✅ |
| R10 | The client uses one authoritative 30-day snapshot per refresh wherever the API response can supply values consistently. | Must-have | ✅ | ❌ | ✅ |
| R11 | The change is independently mergeable and revertible. | Must-have | ✅ | ✅ | ✅ |
| R12 | The Today chart safely renders the single UTC-day bucket returned by the endpoint rather than claiming 24-hour hourly precision. | Must-have | ✅ | ✅ | ✅ |
| R13 | Calculations fallback safely to `spend` and `totalRequests` when optional fields are absent. | Must-have | ✅ | ✅ | ✅ |
| R14 | The request is authenticated via the existing Vercel Access Authority (CLI or OAuth). | Must-have | ✅ | ✅ | ❌ |

**Notes:**
- **Shape B fails R10**: B issues three distinct queries for Today, Week, and Month to preserve the UI loading sequence, violating the mandate for a single authoritative 30-day snapshot per refresh.
- **Shape C fails R5 and R14 (and Flag C3 is invalid)**: C3 attempts to send the AI Gateway secret to `api.vercel.com`. P2 explicitly proves this results in a 404 `not_found`, and R5 explicitly bans sending the secret to this API. Flagged unknowns that conflict with proven evidence and requirements result in failure.

---

## Recommendations

### Recommended Survivor
**Shape A (Unified Atomic 30-day Snapshot via Vercel Session Auth)** is the only viable path. It complies with the single authoritative snapshot mandate (R10), correctly maps authentication to the Vercel Session (R5/R14) to satisfy P2 evidence, and gracefully manages the missing production fields (R4/R13).

### Rejected Alternatives
- **Shape B**: Rejected because making multiple calls purely to simulate the old incremental UI loading sequence violates R10, which strictly requires single-snapshot utilization for consistency.
- **Shape C**: Rejected because relying on the AI Gateway secret for the new usage-report endpoint is proven to fail (P2) and violates security constraints (R5).

### Spikes / Probes Required
- **U6 Background Expiry Spike**: We need a local spike to test the exact failure behavior described in **U6** ("Exact failure behavior when the Vercel session expires during a background report refresh").
  - *Goal*: We can describe the exact error code/state the Zig client encounters when the background loop fires with an expired OAuth token, allowing us to ensure R8 (failed refreshes don't wipe the last-good report) behaves correctly.
