# Vercel Desktop usage-report migration

Verdict: **Pass to detail**.

## Runs

| Reviewer | Family | Runtime | Result |
|---|---|---|---|
| Fable 5 | Anthropic | AI Gateway `anthropic/claude-fable-5`, high reasoning | Selected hybrid authority |
| Gemini 3.1 Pro | Google | AI Gateway `google/gemini-3.1-pro-preview`, high reasoning | Selected one atomic 30-day snapshot |

Cursor Grok 4.6 was attempted first. Cursor had reached its monthly limit, and the direct AI Gateway request was blocked by the team's xAI policy. Neither failed attempt contributed a proposal. Gemini supplied the second independent model family.

Both reviewers used the frozen packet at Desktop `1c3d4c7` and did not inspect a candidate branch or each other's output.

## Reconciled requirements

R0 through R11 in `packet.md` remain settled. The following derived requirements survived the probes:

| ID | Status | Requirement |
|---|---|---|
| R12 | Must-have | One parser and report state machine serves CLI-session and OAuth-session transports. |
| R13 | Must-have | A snapshot publishes only when its generation and durable key target still match. |
| R14 | Must-have | `totals.spend` is the spend authority while production may omit `billedSpend` and `succeededRequests`. |
| R15 | Must-have | The 30-day request uses inclusive UTC dates from today minus 29 days through today. |
| R16 | Must-have | A report auth or transport failure preserves last-good managed-key data and marks it stale. |
| R17 | Must-have | The existing hourly Today chart and top-spender behavior remain available until usage-report can replace them without losing information. |

## Selected shape H: hybrid authority

| Part | Mechanism | Flag |
|---|---|:---:|
| H1 | Request one key-filtered 30-day `usage-report` snapshot with `sections=daily` and `series=none`. | |
| H2 | OAuth sessions call `api.vercel.com` with `accessAuthHeader()`. CLI sessions call the same path through `vercel api --raw --scope <slug>`. Both feed one parser. | |
| H3 | Derive Today, 7-day, and 30-day spend, requests, tokens, and daily buckets from the accepted snapshot. Use `totals.spend`, `requests`, and `totalTokens`; optional fields do not control the UI. | |
| H4 | Publish all numeric windows atomically only for the active generation and durable `keyId`; preserve last-good state on failure. | |
| H5 | Keep the old hourly Today request as chart decoration only. It never controls totals, requests, or tokens. | |
| H6 | Keep the old team top-spender request unchanged. | |
| H7 | Keep model breakdown requests by selected range. `topModels` is an aggregate for the requested range and does not expose a daily per-model series, so one 30-day snapshot cannot preserve Today and 7-day model rows. | |
| H8 | On OAuth 401, retry once after the existing token refresh. Never invalidate the managed Gateway key because Vercel session auth failed. | |

## Probe evidence returned to Shaping

| Probe | Observation | Shape effect |
|---|---|---|
| P1 | Production returned one 8.8 KB key-filtered response with 30 daily rows, models, totals and cache metadata. Optional billed/succeeded fields were absent. API source confirms model rows have no daily per-model series. | Confirms H1, H3 and R14; preserves legacy range-specific model reads in H7. |
| P2 | The managed Gateway secret returned HTTP 404 at `api.vercel.com`. | Rejects secret-auth endpoint swaps; requires H2. |
| P3 | `sections=keys&topN=100` returned 101 rows and about 40 KB, but the managed key was outside the top 100. | Rejects replacing current-key top-spender behavior in this slice; keeps H6. |
| P4 | API source confirms inclusive UTC dates, 92-day maximum, key filtering and 60-second filter-partitioned cache. | Confirms H1, H3, R15. |

## Fit check

| Req | Requirement | Status | H |
|---|---|---|:---:|
| R0 | Desktop obtains the managed key's 30-day report from usage-report. | Core goal | ✅ |
| R1 | All reported identity remains bound to durable `keyId`. | Must-have | ✅ |
| R2 | UTC-day semantics and reset boundary remain unchanged. | Must-have | ✅ |
| R3 | Spend, requests, tokens and available chart buckets remain visible. | Must-have | ✅ |
| R4 | Optional billed/succeeded fields may be absent. | Must-have | ✅ |
| R5 | The Gateway secret is never sent to `api.vercel.com`. | Must-have | ✅ |
| R6 | CLI and OAuth sessions continue working. | Must-have | ✅ |
| R7 | Key, quota, setup, persistence and switching workflows remain unchanged. | Must-have | ✅ |
| R8 | Failed, truncated, stale and out-of-order responses cannot replace valid state. | Must-have | ✅ |
| R9 | Empty usage is a valid zero report. | Must-have | ✅ |
| R10 | One snapshot is authoritative wherever it can supply the current UI. | Must-have | ✅ |
| R11 | The migration is independent from `scope=user` and fx OAuth attribution. | Must-have | ✅ |
| R12 | One parser and state machine serves both transports. | Must-have | ✅ |
| R13 | Generation and durable target guard publication. | Must-have | ✅ |
| R14 | `totals.spend` remains authoritative. | Must-have | ✅ |
| R15 | Inclusive UTC dates are used correctly. | Must-have | ✅ |
| R16 | Auth and transport failure preserve last-good data. | Must-have | ✅ |
| R17 | Hourly chart and top-spender behavior are preserved. | Must-have | ✅ |

## Failure catalog S1 to S13

| Shape | Result |
|---|---|
| S1 Over-reach | Designed out by keeping legacy chart and top spenders. |
| S2 Under-reach | Covered by absent optional fields, empty usage, 30 rows, auth failure and target-switch tests. |
| S3 Direction inheritance | Both success replacement and failure preservation are explicit. |
| S4 Proxy property | Publication requires the actual durable target and generation, not key name or request success alone. |
| S5 Unregistered peer | No new persistent artifact or cleanup registry. |
| S6 Peer-version blindness | No cross-version protocol is introduced. |
| S7 Wrong layer | Both CLI and OAuth transports terminate in the same parser and report publisher. |
| S8 Guard-derived cells | Test matrix comes from API contract, auth modes, target state and response validity. |
| S9 Test pins wrong thing | Test Strength must remove optional-field fallback, target guard and failure preservation independently. |
| S10 Claim from prose | API source and production probes establish the response and auth contracts. |
| S11 Asymmetric validation | Both transports use the same parser and publication checks. |
| S12 Primitive mismatch | Vercel session auth is used for a Vercel account endpoint; Gateway key auth remains only on Gateway endpoints. |
| S13 Invocation-state collapse | Ordinary report omission/failure preserves selected account, managed key and last-good report. |

No catalog hit is accepted as residual risk. The auth transport seam is concrete, so the gate passes to detail.

## Forward effects

1. H1 filters by durable key ID, observed in API source and production. This prevents name collisions from changing report ownership.
2. H2 selects transport from the active Vercel session, inferred from existing CLI and OAuth paths. Both outputs reach H3, avoiding divergent semantics.
3. H3 derives all windows from one response, observed possible from 30 daily rows. H4 publishes them together, preventing cross-cache torn totals.
4. H5 can fail independently without changing numeric authority. The harmful branch is a stale hourly chart, bounded as decoration and rejected on target/generation mismatch.
5. H8 can fail after an expired grant. The harmful branch is unavailable Vercel account APIs, while the managed key and its last-good report remain intact and stale.

## Carried assumption

The production API may begin returning optional billed/succeeded fields later. This slice intentionally continues using `spend`, `requests`, and `totalTokens` until product explicitly chooses billed semantics.
