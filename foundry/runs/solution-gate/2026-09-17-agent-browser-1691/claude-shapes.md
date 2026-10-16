Todo verificado; aquí está la propuesta a ciegas. / Everything verified; here is the blind proposal artifact.

---

# Browser Use V4 Repair — Blind Shaping Proposal

**Resumen en español:** Esta propuesta da forma a la reparación del proveedor Browser Use. La evidencia del código muestra que la creación actual incrusta la API key en la URL wss sin obtener un ID de sesión (`providers.rs:384-391`), que la limpieza descarta todos los errores (`let _ =` en `providers.rs:140-152`, `daemon.rs:333/350`), y que el stderr del daemon no es visible durante el apagado. Se presentan dos formas: **A** (máquina de estados de propiedad en memoria con stop que devuelve Result) y **B** (libro mayor duradero en disco con reconciliación al arranque). Se recomienda la forma **A**; la forma **B** falla R7 y R11. Sondas baratas requeridas abajo. El cuerpo técnico sigue en inglés.

## Grounding evidence (source probes performed)

- `cli/src/native/providers.rs:384-391` — `connect_browser_use()` returns `wss://connect.browser-use.com?apiKey={key}` with `session: None`. No session ID is ever obtained, so ownership, cleanup, and stop are structurally impossible today, and the key rides in a URL that can leak into errors (R6 exposure).
- `cli/src/native/providers.rs:140-152` — cleanup PATCHes `api.browser-use.com/api/v2/browsers/{id}` with `{"action":"stop"}` but ignores the result (`let _ =`), silently no-ops when the key env var is missing, and uses a `reqwest::Client` with **no timeout** (R0/R8 stall risk).
- `cli/src/native/actions.rs:2067-2093` — `close_active_provider_session` unconditionally `take()`s the session before the stop call, so a failed stop discards the ID (violates R1/R10); `close_current_browser` reports only local-close errors.
- `cli/src/native/daemon.rs:333,350` — idle and signal shutdown discard cleanup errors; per contract probe, `connection.rs:889-910` pipes daemon stderr and drops it at readiness, so **shutdown stderr is not user-visible** (D4).
- `provider-openapi.json` — POST `/browsers` create (billed upfront, refunded on stop), PATCH `/browsers/{session_id}` with required `action`, response carries `status`, `cdpUrl` (nullable), `liveUrl`; lifecycle note: "A completed run or closed CDP connection does not immediately stop its cloud browser."

## Requirements (R) — full table

| ID | Requirement | Status |
|----|-------------|--------|
| R0 | Browser Use create/read/attach/stop is finite, returns truthful failures, and releases the existing serialized daemon so commands and shutdown regain progress. Immediate preemption is not required. | Settled |
| R1 | A known owned browser is retained until acknowledged stop, or explicit actionable provider/ID recovery information reaches the operator. Stop failure must not report success. | Settled |
| R2 | Plain subsequent commands with omitted provider options preserve the same browser, target, URL and DOM state. | Settled |
| R3 | Failed setup after allocation, explicit close, auto/explicit relaunch, restore-key changes, internal shutdown, idle and signal shutdown account for the Browser Use resource. | Settled |
| R4 | Local and external CDP browsers, other built-in providers and plugins keep their existing ownership, behavior and options. External browsers are detached without remote stop. | Settled |
| R5 | Browser Use aliases, required credentials and V4 profile/proxy/recording options remain supported. | Settled |
| R6 | Keys, token URLs and echoed secrets never enter new errors or recovery artifacts. Recovery records must contain only validated resource identity and safe instructions. | Settled |
| R7 | No automatic durable retries or forced-death cleanup guarantees. Bounded orderly cleanup plus operator recovery is sufficient. | Scoped |
| R8 | Compose create, attachment and rollback deadlines inside the normal 30-second minimum CLI response budget, with margin. A response-body stall must be bounded. | Derived accepted |
| R9 | Do not automatically replay a non-idempotent create after unknown remote outcome. Clearly direct operator to inspect Cloud if no ID was received. | Settled |
| R10 | Missing/null/unusable cdpUrl after a known ID requires cleanup or actionable recovery. Failed active stop remains retryable with the same ID; new launch cannot overwrite pending ownership. | Derived accepted |
| R11 | Preserve omission/same/changed/explicit-clear semantics. No new setting equality or relaunch behavior is introduced. | Derived accepted |

---

## A: In-memory ownership state machine with Result-bearing stop

Amend the existing in-process lifecycle. Ownership lives in `DaemonState`; stop becomes fallible and truthful; shutdown paths emit an operator-visible recovery record because stderr is proven invisible.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | Browser Use REST create: POST `/api/v2/browsers` with `X-Browser-Use-API-Key` header (key out of URLs), V4 profile/proxy/recording fields passed through; parse `id` before `cdpUrl`. `id` present but `cdpUrl` null/missing → one bounded stop attempt, else error carrying `id` + "stop via Cloud" instructions. No ID received on ambiguous transport failure → error states outcome unknown, directs operator to inspect Cloud, never re-sends create (R9). | |
| **A2** | Dedicated `reqwest::Client` for the browser-use arm with connect timeout ~5s and total request timeout ~15s (`Client::builder().timeout(...)`), bounding CONNECT/header/body stalls; create + CDP attach + rollback compose under the 30s budget with margin (R8). | |
| **A3** | `close_provider_session_with_plugins` returns `Result<(), String>` for the browser-use arm; only a 2xx PATCH acknowledgment clears ownership. 4xx/5xx/timeout/missing-key → `Err` with provider name + session ID (never key or URL). `close_active_provider_session` stops `take()`-ing eagerly: peek, call stop, remove only on `Ok`, so the same ID stays retryable (R1, R10). Non-browser-use arms keep returning `Ok(())` fire-and-forget, preserving R4. | |
| **A4** | Pending-ownership guard: while a browser-use `ActiveProviderSession` exists (including after failed stop), launch/relaunch of a new provider browser is refused with the retained ID and a retry instruction; explicit `close` retries stop with the same ID. Plain commands with omitted options never touch the session (R2, R11 — reuses the existing `launch_hash` omission semantics unchanged). | |
| **A5** | Recovery record for silent paths: idle timeout, signal shutdown, restore-key close, and auto-relaunch call the Result-bearing A3; on `Err` they write `browser-use-recovery.json` in the session state dir containing only `{provider, sessionId, stoppedAt: null, instructions}` and still proceed with shutdown (bounded orderly cleanup, R7). Explicit close/relaunch propagate the error in the CLI response instead. Record is deleted on later acknowledged stop. | |
| **A6** | 404-on-stop handling: treat as stop failure that retains the ID and produces the recovery message "session not found; verify in Browser Use Cloud" — never silently mark success. | ⚠️ |

A6 flag: hosted semantics for repeated stop / stop-after-expiry (does a 404 mean already-stopped-and-refunded, or wrong ID?) are unverified without a live key — carried evidence limit from the contract, not resolvable by code probe.

## B: Durable owned-browser ledger with startup reconciliation

Ground truth on disk instead of in memory. Create writes a ledger file before attach; stop deletes it only on acknowledgment; daemon startup and each launch reconcile stale ledgers by retrying stop.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | On acknowledged create (ID parsed), write `owned-browser.json` (provider, sessionId, createdAt) in the session dir before CDP attach; fsync before proceeding. | |
| **B2** | Stop: PATCH with bounded client (same as A2); delete ledger only on 2xx; failure leaves ledger and returns error. | |
| **B3** | Reconciliation: daemon startup and every new `launch` check for a stale ledger; if found, automatically retry stop before proceeding; refuse new create until the retry succeeds or the operator clears the ledger. | ⚠️ |
| **B4** | Same REST create and ambiguous-outcome messaging as A1. | |
| **B5** | Same timeout client as A2. | |

B3 flag: automatic stop replay across daemon restarts against unverified hosted repeated-stop/billing semantics; also survives forced death, which drifts toward guarantees the contract excludes.

---

## Fit Check

| Req | Requirement | Status | A | B |
|-----|-------------|--------|---|---|
| R0 | Finite create/read/attach/stop, truthful failures, daemon regains progress | Settled | ✅ | ✅ |
| R1 | Owned browser retained until acknowledged stop or actionable recovery; stop failure not reported as success | Settled | ✅ | ✅ |
| R2 | Plain subsequent commands preserve browser/target/URL/DOM | Settled | ✅ | ✅ |
| R3 | All eight lifecycle paths account for the resource | Settled | ✅ | ✅ |
| R4 | Other providers/plugins/local/external CDP unchanged; no remote stop of unowned browsers | Settled | ✅ | ✅ |
| R5 | Aliases, credentials, V4 profile/proxy/recording options supported | Settled | ✅ | ✅ |
| R6 | No keys/token URLs/echoed secrets in new errors or artifacts | Settled | ✅ | ✅ |
| R7 | No automatic durable retries or forced-death guarantees; bounded cleanup + operator recovery | Scoped | ✅ | ❌ |
| R8 | Deadlines compose inside 30s budget; body stalls bounded | Derived accepted | ✅ | ✅ |
| R9 | No blind create replay after unknown outcome; direct operator to Cloud | Settled | ✅ | ✅ |
| R10 | Null cdpUrl → cleanup/recovery; failed stop retryable same ID; no overwrite of pending ownership | Derived accepted | ✅ | ✅ |
| R11 | Preserve omission/same/changed/explicit-clear semantics; no new relaunch behavior | Derived accepted | ✅ | ❌ |

**Notes:**
- **B fails R7:** B3 is exactly the automatic durable retry across process death that R7 scopes out; it also implicitly promises forced-death cleanup, an invented guarantee.
- **B fails R11:** startup/launch-time reconciliation introduces new relaunch-path behavior (a launch can trigger a remote stop of a prior daemon's session), changing omission semantics the contract says must not change. B3's ⚠️ independently forces ❌ under the flagged-unknown rule.
- **A6's ⚠️ does not fail A on any R:** A treats 404 conservatively as a failure with recovery guidance, which satisfies R1/R10 under either true hosted semantics; the flag affects only message wording and is probe-resolvable. If reviewers judge this too generous, R10 for A becomes ❌ pending Probe P2.

## Recommended survivor

**Shape A.** It amends the existing repair in place, keeps other providers byte-identical (single `match` arm changes), satisfies the scoped R7 by choosing operator recovery over durable retries, and answers the D4 discriminator (stderr invisibility) with a minimal recovery record rather than a persistence subsystem. B's ledger is strictly more machinery to fail two requirements.

## Flags and required cheap probes

| # | Probe | Resolves |
|---|-------|----------|
| P1 | Read the full `provider-openapi.json` create/stop schemas and the repo's existing V4 option plumbing (`flags.rs`, `output.rs`, `doctor/providers.rs`) to confirm exact field names for profile/proxy/recording passthrough and the alias set (`browser-use`/`browseruse`). Static, no network. | A1 field fidelity (R5) |
| P2 | Against the OpenAPI stop-response and error-schema definitions (lines ~206-300), enumerate documented 4xx codes for PATCH stop; check whether a distinct "already stopped" status exists versus generic 404. Static. | A6 ⚠️ message wording |
| P3 | Grep all call sites of `close_provider_session*` and `close_current_browser` (explicit close, relaunch, restore-key, idle, signal, failed-attach rollback at `actions.rs:3574`, `4543`) to confirm every path routes through A3/A5 and none double-stops. Static. | R3 coverage completeness |
| P4 | Verify `reqwest` version in `Cargo.toml`/lockfile supports per-client `connect_timeout` + `timeout` as assumed. Static. | A2 (R8) |

All probes are read-only and local; none require a live Browser Use credential. The carried limit stands: tests can prove client conformance to the official schema but not Cloud billing/recording effects.