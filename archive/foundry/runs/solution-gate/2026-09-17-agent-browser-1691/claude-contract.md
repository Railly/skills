He revisado el packet, la skill de shaping y el código base (`cli/src/native/daemon.rs`, `cli/src/native/providers.rs`, `cli/src/native/actions.rs`, `observed-failures.json`). A continuación entrego el artefacto de primera pasada: tabla completa de requisitos y matriz de discriminadores, sin diseñar soluciones. / I reviewed the packet, the shaping skill, and the clean base source. Below is the first-pass artifact: full requirements table and discriminator matrix, no solutions.

---

# Provider Lifecycle Truthfulness — First-Pass Shaping (Requirements + Discriminators)

**Scope note / Nota de alcance:** This is the shaping-phase "R" artifact only. No shapes (S), no fit checks against solutions, no mechanisms proposed. Base-source references are to the clean snapshot.

---

## 1. Frame (restated from frozen packet)

**Problem:** A stalled provider HTTP request can wedge the session daemon (state lock held across `execute_command`, `daemon.rs:552-560`), blocking concurrent commands, idle shutdown, and cleanup. A failed remote stop can be reported as success while the only copy of the session identity is discarded (`close_active_provider_session` takes and drops the session unconditionally, `actions.rs:2067-2069`; all provider stop calls swallow errors with `let _ =`, `providers.rs:105-179`).

**Outcome:** Finite, truthful lifecycle outcomes for provider setup and cleanup, without disturbing ordinary local/CDP/plugin browser workflows.

---

## 2. Requirements (R)

Full table; status labels are `settled`, `derived`, or `undecided` per the frozen packet. Sub-requirements (Rx.y) are decompositions I extracted so each row is independently testable; they inherit their parent's settled status unless marked otherwise.

| ID | Requirement | Status | Grounding |
|----|-------------|--------|-----------|
| **R0** | Provider setup or cleanup failures produce finite, truthful command outcomes and never permanently block the session daemon. | Settled, core | E1: `open` blocked >36 s, concurrent `close` >5 s, daemon outlived a 1 s idle budget while a proxy stalled. `daemon.rs` holds one `Mutex<DaemonState>` across `execute_command`; idle/shutdown paths contend on the same lock. |
| R0.1 | An outbound provider request (create, stop) completes or fails within a bounded time that fits inside the caller's lifecycle budget (CLI socket read timeout ≥30 s with transient retry). | Settled (derived decomposition) | Packet "Evidence": CLI 30 s read floor; exact new deadline explicitly not settled (see U2). |
| R0.2 | A stalled provider request must not prevent the daemon from processing other commands, idle shutdown, or signal-driven shutdown. | Settled (derived decomposition) | E1: `daemon_survived: true` despite `daemon_idle_budget_ms: 1000`. |
| R0.3 | The outcome reported to the CLI reflects what actually happened remotely (success only when acknowledged; ambiguity reported as ambiguity, not success or silent failure). | Settled (derived decomposition) | E2: `close_success: true` while `total_stop_attempts: 1` failed at transport. |
| **R1** | A known owned browser is not forgotten as successfully stopped until the stop is acknowledged, or explicit actionable recovery information (at minimum the session ID and provider) has been returned to the operator. | Settled, must-have | E2: `session_retained: false` after failed stop; base `close_active_provider_session` drops identity before knowing the result. Temporal contract row "Failed owned stop". |
| R1.1 | Retrying the same stop after a failed attempt is safe (does not double-charge or target a different resource) and actually reaches the provider. | Settled (derived decomposition) | Temporal contract "retry same stop safely"; E2 shows only one attempt ever reached the proxy despite two success reports. Idempotency evidence is a limit (see U3). |
| R1.2 | Unknown live ownership is not silently replaced: a new provider launch while a pending unacknowledged stop exists must be blocked or explicitly accounted. | Settled (derived decomposition) | Temporal contract "block replacing unknown live ownership unless explicitly accounted". |
| **R2** | Commands can reuse one remote browser across invocations; an ordinary command with omitted provider settings preserves that browser, its targets, and page state. | Settled, must-have | Temporal contract rows 1 and 3: "set → omitted" = retain ownership / running session unchanged; continuity oracle = session ID, target, URL, page state; `.provider` file convention in `daemon.rs:89`. |
| **R3** | Failed attachment after successful provisioning, explicit close, relaunch, and orderly daemon shutdown all account for owned provider resources (stop, or surface recovery per R1). | Settled, must-have | Base already attempts cleanup at these points (`actions.rs:3530, 3575, 4477, 4544`, shutdown paths in `daemon.rs:332-334, 347-351`) but fire-and-forget. "Account for" ≠ "guarantee stop" — R1 defines the fallback. |
| **R4** | Existing local browser, user-attached CDP browser, other-provider, and plugin workflows are preserved. A user-attached browser is not owned and is never remotely stopped. | Settled, must-have | Temporal contract row 2; base distinguishes attached browsers in default-idle exemption (`daemon.rs:167-175`). Shared code (`ProviderSession`, `close_provider_session_with_plugins`) serves five built-in providers plus plugins — any change must be scoped against all callers. |
| **R5** | Documented provider aliases (`browser-use`/`browseruse`, case-insensitivity), required-API-credential behavior (missing key → immediate error for browserbase/browserless/browser-use; optional for kernel; AWS chain for agentcore), and supported profile/proxy/recording settings are preserved. | Settled, must-have | `providers.rs:51-101` (aliases), per-provider env handling; temporal contract row 3 (no new mid-session config behavior in scope). |
| **R6** | Credential values (API keys, AWS signatures/tokens, tokenized URLs) never enter error messages, persisted recovery files, or review artifacts. | Settled, must-have | Note the tension: browserless `session_id` **is** a stop URL that embeds a token-bearing endpoint (`providers.rs:368-380`), and browser-use's ws URL embeds the API key (`providers.rs:388`). Any persisted or displayed recovery identity must respect this. |
| **R7** | Whether recovery of a pending stop must survive forced daemon death (kill -9) automatically/durably, or whether bounded best-effort at exit plus explicit session-ID/operator recovery is sufficient. No background platform may be invented to resolve it. | Derived, **undecided** | Temporal contract: "forced-death recovery undecided", "restart rules require explicit shape". This is the principal open product decision (see A1). |
| **R8** | Never blindly replay a non-idempotent create after an ambiguous outcome (no resource ID received → remote outcome unknown). Preserve the distinction between recovering a known ID and an ambiguous create. | Settled (extracted from packet constraints) | Packet "Specified" bullets 3–4; provider-openapi.json: create returns id/cdpUrl; CDP disconnect does not stop billing. |

**Extraction notes:** R8 and the sub-requirements are standalone restatements of packet constraints so the discriminator matrix can test them independently; they introduce no new scope.

---

## 3. Discriminator Matrix

Each discriminator is an observable test that separates a compliant implementation from the current base (CURRENT fails where noted) and from plausible wrong fixes. All are runnable without a live provider credential except where marked **[live-limit]**.

| ID | Discriminator (observable test) | Pass condition | CURRENT | Evidence basis |
|----|--------------------------------|----------------|---------|----------------|
| D0a | `open` against a loopback CONNECT proxy that accepts but never answers, dummy credential. | Command returns a truthful error within a bounded time that fits the CLI's 30 s-floor budget; no infinite hang. | ❌ (>36 s, unbounded) | E1 |
| D0b | While D0a's open is stalled, issue concurrent `close` on the same session. | Close is processed within its own bounded budget; not serialized behind the stalled request indefinitely. | ❌ (>5 s and growing) | E1; `daemon.rs` single state lock |
| D0c | Same stall with a short explicit idle timeout configured. | Daemon idle/signal shutdown still fires and accounts for owned resources per R3. | ❌ (daemon survived 1 s budget) | E1 |
| D0d | After the proxy is released (late success or late failure), daemon state is coherent: no phantom "open" browser, no double-owned session. | State matches the reported outcome; a late-arriving create result with an ID is not silently leaked. | ⚠️ untested in base | Packet ambiguity constraint; U3 |
| D1a | Seed an owned remote session (fixture), force stop transport failure (CONNECT 502), run production `close`. | Close does **not** report plain success; it either retries to acknowledgment or returns error + recovery info containing provider and session ID. Session identity is not lost. | ❌ (success reported, identity dropped, 1 attempt) | E2 |
| D1b | After D1a, a subsequent stop attempt (retry or operator-driven) actually reaches the wire with the **same** session ID. | Second attempt observed at the mock proxy with identical target. | ❌ (impossible; identity gone) | E2 (`immediate_retry_success: true` shows retry would have worked) |
| D1c | With a pending unacknowledged stop, request a new provider launch on the same session. | Blocked or explicitly accounted (both resources tracked); never silent replacement of unknown live ownership. | ❌ (state simply overwritten) | Temporal contract row 4 |
| D2a | `open --provider X`, then a plain command (e.g. `get url`) with no provider flags/env. | Same remote browser, same target, same URL and page state; no new create call observed at mock. | ✅ must stay ✅ | Temporal contract rows 1, 3 |
| D2b | Same-settings repeated command; changed-settings relaunch. | Reuse in the first case; current explicit relaunch semantics (old session accounted per R3) in the second. | ✅/partial (relaunch cleanup is fire-and-forget) | Temporal contract |
| D3a | Provisioning succeeds (mock returns id/cdpUrl) but CDP attach fails. | Exactly one stop attempt observed at mock for that ID, or R1 recovery surfaced. | partial (`let _ =` swallow; unverified delivery) | `actions.rs:3530`; E2 pattern |
| D3b | Orderly daemon shutdown (SIGTERM) and explicit `close` with an owned session and healthy transport. | Stop observed at mock; truthful success reported. | ✅ (happy path works) | `daemon.rs:347-351` |
| D4a | User-attached CDP browser (real local Chrome as producer): run `close`, idle expiry, daemon shutdown. | No provider stop call is ever issued; browser process and targets remain alive; detach only. | ✅ must stay ✅ | Temporal contract row 2; `daemon.rs:167-175` |
| D4b | Local launched browser and each other built-in provider plus a stdio plugin provider exercise open/close. | Behavior unchanged from base (aliases, plugin cleanup protocol `browser.close` request shape). | ✅ must stay ✅ | `providers.rs` tests at lines 953-1102 |
| D5a | Missing required API key per provider; documented alias spellings; kernel without key; profile/proxy/recording env vars set. | Same errors/acceptance as base, byte-compatible where documented. | ✅ must stay ✅ | `providers.rs:251-480` |
| D6a | Grep all error output, any persisted recovery artifact, and review files produced during D1a/D3a runs for the dummy credential value and for token-bearing URLs (browserless stop URL, browser-use ws URL). | Zero occurrences of secret material. | ⚠️ at risk (browserless `session_id` **is** a URL; browser-use ws URL embeds key) | R6 grounding |
| D7a | Kill the daemon with SIGKILL while an owned session exists; restart. | **Cannot be adjudicated yet** — pass condition depends on the R7 decision (durable auto-recovery vs. documented operator recovery via surfaced session ID). | n/a | R7 undecided |
| D8a | Force a create where the transport fails after send but before any response (no ID received); then re-run open. | No automatic blind replay of the create; ambiguity surfaced distinctly from "known ID recovery". | ⚠️ untested | Packet "Specified" bullet 4 |

**Orthogonality check:** D0* discriminate boundedness/non-blocking (a fix that only adds timeouts passes D0 but fails D1); D1* discriminate truthfulness/retention (a fix that only retains state passes D1 but fails D0); D2/D4/D5 discriminate non-regression (an over-aggressive fix that stops browsers eagerly or drops reuse fails these while passing D0/D1); D6 discriminates leakage introduced *by* the recovery mechanism itself; D8 discriminates create-ambiguity handling from stop-retry handling.

---

## 4. Irreducible Product Ambiguities

| ID | Ambiguity | Why irreducible at this stage |
|----|-----------|-------------------------------|
| A1 (= R7) | Forced-death durability: must a pending stop survive `kill -9` and be retried automatically on restart (implies persisted recovery state), or is best-effort at orderly exit plus operator-visible session ID enough? | Product cost/UX tradeoff; packet forbids inventing a background platform; interacts with A3 (persisting identity may persist secrets). Human decision required. |
| A2 | Exact timeout budget: packet fixes only bounds (fit within caller lifecycle, ≥ full request/response; CLI floor 30 s) but no number, and whether budgets differ for create vs. stop vs. cleanup-during-shutdown. | Packet explicitly says "no exact new deadline is settled". |
| A3 | Recovery-identity representation vs. R6: for browserless the only stop handle is a token-bearing URL; for browser-use there is no session at all (key-in-URL, `session: None`). What counts as "actionable recovery information" that is also credential-free? | Wire-format reality conflicts with the no-secrets rule; needs a product ruling on redaction vs. reference-by-provider-and-alias. |
| A4 | Semantics of `close` under pending-stop: should `close` return failure (truthful but breaks scripts that treat close as best-effort), or success-with-warning-and-recovery-payload? R0.3 and R1 permit either reading. | Affects every CI consumer of exit codes; product-level compatibility call. |
| A5 | Blocking vs. accounting for D1c: when unacknowledged ownership exists, is a new launch refused (safe, disruptive) or allowed with both sessions tracked (permissive, more state)? Temporal contract allows "explicitly accounted" without choosing. | Explicit "unless explicitly accounted" escape hatch left open in the packet. |

---

## 5. Minimum Independent Evidence Needed

Facts that discriminators cannot establish from mocks/schema alone, kept as limits per the packet's Unknowns section:

| ID | Evidence needed | Why | How obtainable |
|----|-----------------|-----|----------------|
| E-A | HTTP 404 semantics of provider stop: does 404 on stop mean "already stopped" (safe to treat as acknowledged) or "wrong ID" (must surface)? Per provider. | Determines whether retry-until-ack can terminate on 404; wrong guess either leaks billing or spams operators. | **[live-limit]** requires the hosted service, or an authoritative doc statement beyond provider-openapi.json. |
| E-B | Stop idempotency: is repeating the same stop for the same ID harmless on each provider (billing, errors)? | R1.1 depends on it; packet says idempotency "needs explicit evidence". | **[live-limit]**; mock can only encode the assumption. |
| E-C | Ambiguous-create remote outcome: when transport dies mid-create, does the provider sometimes allocate anyway (orphan with billing)? | Bounds how bad R8 ambiguity is and whether operators need a "list sessions" recovery hint. | **[live-limit]**; schema is silent. |
| E-D | Whether the observed lock-convoy is the sole blocking mechanism (vs. additional blocking inside reqwest/plugin stdio paths). | Confirms D0 discriminators cover all stall modes, including plugin providers (child-process stdio has its own hang mode). | Obtainable locally: extend the E1 fixture to the plugin stdio path and to `close_provider_session` calls. |
| E-E | Exact CLI-side budget interaction: confirm the 30 s socket read floor and transient-retry behavior against a daemon that returns a bounded error, so daemon-side budgets can be chosen to nest inside it (feeds A2). | Local: read/measure `connection` layer with a mock daemon. |

---

## 6. Status Summary

- **Settled and testable now:** R0–R6, R8 — every one has at least one mock-runnable discriminator; CURRENT demonstrably fails D0a–D0c, D1a–D1c and is at risk on D3a, D6a, D8a.
- **Undecided (needs human/product input before shaping):** R7/A1, plus A2–A5.
- **Live-service limits (do not block shaping, must be labeled as assumptions in any shape):** E-A, E-B, E-C.

---

**Resumen en español:** El artefacto reconstruye los 9 requisitos (R0–R8, con R7 como único no decidido) desde el packet congelado, anclados al código base: el candado único de estado en `daemon.rs` explica el bloqueo observado (E1), y `close_active_provider_session` en `actions.rs:2067` descarta la identidad de sesión antes de conocer el resultado del stop (E2). La matriz de discriminadores (D0–D8) separa acotamiento, veracidad, retención de identidad y no-regresión de forma ortogonal, casi toda ejecutable con mocks locales. Quedan cinco ambigüedades de producto irreducibles (durabilidad ante kill -9, presupuesto exacto de timeout, representación de la identidad de recuperación sin credenciales —crítico para browserless, cuyo identificador **es** una URL con token—, semántica del exit code de `close`, y bloquear vs. contabilizar ante ownership pendiente) y tres hechos que solo el servicio real puede confirmar (semántica de 404, idempotencia del stop, y si un create ambiguo asigna recursos).