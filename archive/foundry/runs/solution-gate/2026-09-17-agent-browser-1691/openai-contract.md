# First contract pass: bounded, truthful provider lifecycle

## Evidence boundary and base findings

This reconstruction uses the supplied packet, API schema, observations, and base excerpts. No candidate is available; no solution or satisfaction claim is made. Full CLI retry code, browser-close implementation, and configuration documentation are not supplied.

- **E1 establishes blocking, not a deadline:** open exceeded 36 seconds; concurrent close exceeded 5 seconds; explicit 1-second idle configuration did not terminate the daemon. Releasing the proxy restored progress.
- **E2 establishes false cleanup success:** two close calls succeeded, ownership information disappeared, and only one stop attempt occurred.
- **`daemon.rs`:** `handle_connection` holds the state mutex across `execute_command`. Drain, idle, and signal branches also await that mutex inside the selected branch, preventing the loop from selecting other work while waiting. Completion refreshes activity before unlocking; idle is therefore not an in-flight command deadline. Idle/signal cleanup errors are discarded. Successful closed responses trigger daemon exit.
- **`providers.rs`:** cleanup returns no outcome; transport failures, HTTP statuses, missing credentials, and plugin cleanup errors are ignored. Browser Use currently returns a credential-bearing WebSocket URL and **no owned session**, unlike the normative browser-create contract. Browserless cleanup identity is a URL; plugin identity is serialized cleanup data—not necessarily a safe printable ID.
- **`actions.rs:2001,2421,3501,4321`:** active ownership is taken before stop completes. Failed attachment cleanup is not retained in daemon state. Restore-key transitions and automatic relaunch discard close errors; explicit relaunch propagates `close_current_browser` errors, but that function cannot receive provider-stop failures.
- **API:** create returns `201` with required `id`; `cdpUrl` is optional/nullable. Explicit stop is PATCH with `{"action":"stop"}`. Disconnect does not stop billing. Stop `404` says only “Session not found”; retry/idempotency guarantees are absent.

## Complete requirements table

“Derived” identifies consequences of the frozen contract, not newly negotiated scope.

| ID | Status | Requirement |
|---|---|---|
| R0 | Settled — core | Provider setup or cleanup failures must produce finite, truthful command outcomes and must not permanently block the session daemon. |
| R1 | Settled — must-have | A known owned browser must not be forgotten as successfully stopped until stop is acknowledged, or explicit actionable recovery information has been returned to the operator. Recovery disclosure is not a claim that remote stop succeeded. |
| R2 | Settled — must-have | Commands can reuse one remote browser across invocations. An ordinary command with omitted provider settings must preserve that browser, target, URL and page state, apart from the command’s intended effects. |
| R3 | Settled — must-have | Failed attachment after successful provisioning, explicit close, relaunch and orderly daemon shutdown must all account for owned provider resources. |
| R4 | Settled — must-have | Preserve existing local browser, user-attached CDP browser, other provider and plugin workflows. User-attached browsers remain externally owned and must not be remotely stopped. |
| R5 | Settled — must-have | Preserve documented provider aliases, required API credential behavior, and supported profile/proxy/recording settings. Browser Use accepts `browser-use` and `browseruse` and requires `BROWSER_USE_API_KEY`. |
| R6 | Settled — must-have | Credential values must not enter errors, persisted recovery files or review artifacts, including through URLs, echoed response bodies, or opaque cleanup data. |
| R7 | Derived — undecided | Decide whether recovery across forced daemon death must be automatic/durable or whether bounded best-effort cleanup plus explicit session-ID/operator recovery suffices. No background platform is implied. |
| R8 | Derived from R0 and timing constraint | Bounds must cover the full provider request/response, including body consumption, and fit the caller’s lifecycle budget across setup, attachment, cleanup, and retries. Exact deadlines remain undecided. |
| R9 | Settled — explicit constraint | Creation is not assumed idempotent. After an ambiguous create without a received resource identifier, report unknown remote outcome and never blindly replay creation. Do not equate this case with recovery of a known ID. |
| R10 | Derived from R1/R3 and temporal contract | Known allocation remains accountable even without a usable CDP endpoint. Failed stop preserves sufficient identity for a subsequent same-resource stop attempt; omission does not clear it. Replacement cannot silently supersede unresolved live ownership. Acknowledged stop clears ownership. |
| R11 | Derived from R2/R4/R5 and temporal contract | Initially no provider session or external attachment exists. Allocation establishes provider ownership; user CDP attachment does not. Same settings preserve permitted reuse; omitted settings preserve the running environment. Changed settings follow existing explicit relaunch/reconnect semantics; explicit clear follows existing stop/new-session or detach behavior. No new mid-session configuration behavior is required. |
| R12 | Derived from R3/R4 and base callers | Lifecycle accounting includes automatic and explicit launch, restore-key transitions, attachment/policy/network-control rollback, browser-exit cleanup, confirmed/internal close, idle and signal shutdown. Shared lifecycle contracts must be checked against Browserbase, Browserless, Kernel, AgentCore and plugins, preserving registry affinity, direct-page behavior and metadata. |

## Discriminator matrix

These distinguish contract outcomes, not proposed shapes. No binary fit check is possible without a candidate.

| Discriminator | Required observable distinction | Minimum independent evidence |
|---|---|---|
| Stalled transport versus completed request (R0/R8) | CONNECT, response-header and response-body stalls end finitely and truthfully; concurrent commands and cleanup regain progress without releasing the stalled peer. | Built CLI/daemon timings, responses and local server trace; repeat E1 with each stall phase. |
| Known allocation versus ambiguous create (R1/R3/R9/R10) | Known ID survives absent/null/unusable CDP URL or failed attachment; no-ID ambiguity is disclosed without blind create replay. | Schema-conforming wire cases plus production caller state/output and create counts, including CLI transient retry. |
| Stop acknowledgment versus failure (R0/R1/R10) | Valid stop acknowledgment differs from transport failure, missing credentials, non-success HTTP, malformed/truncated body, or contradictory status. Failure is not successful stop. | Caller-level outcomes and ownership inspection paired with wire trace; stop-acknowledgment semantics evidence. |
| First failed close versus second close (R1/R10) | Second call attempts the same pending resource rather than reporting an empty successful close; replacement cannot lose that identity. | Repeat E2 with resource ID, request count, operator output and relaunch attempt. |
| Same/omitted versus changed/cleared settings (R2/R5/R11) | Plain subsequent commands preserve browser and page continuity; explicit transitions retain base semantics. | Mock API with real local Chrome: session/target IDs, URL, DOM/input sentinel and create/stop counts across invocations. |
| Lifecycle entry points (R3/R12) | Every listed acquisition/rollback/close/shutdown path accounts for ownership, including cleanup failure during shutdown. | Production caller cases for each distinct path; observable recovery output and remote request trace. |
| Owned versus external/local/other backend (R4/R12) | External CDP remains alive without remote stop; ordinary local, WebDriver, other-provider and plugin behavior remains intact. | Backend regression cases; plugin registry/options/direct-page/metadata checks and cleanup traces. |
| Configuration and secrets (R5/R6) | Aliases and credential validation remain compatible; supported settings retain omission/default/clear meaning; secret sentinels never escape. | Base docs/config inventory, serialized requests, captured errors and recovery artifacts. |
| Orderly versus forced death (R7) | Orderly shutdown remains accountable; forced-death expectations are judged only after product decision. | Death-point cases before/after ID receipt, attachment and stop acknowledgment; restart observations. |

## Minimum unresolved facts

1. **Product: timing promise.** Set command and orderly-shutdown budgets, including acceptable waiting by concurrent commands. Neither the observed 36/5 seconds nor the 30-second-minimum CLI socket timeout defines the new deadline.

2. **Product: recovery handoff.** Decide R7 and what constitutes actionable, received recovery information—especially unattended idle/signal shutdown, failed response delivery, and permission to replace unresolved ownership. An unwitnessed stderr message is not evidence of operator receipt.

3. **Provider semantics:** obtain authoritative clarification or hosted observations for repeated stop, stop `404`, and what response proves acknowledgment. The supplied schema alone cannot settle these. Hosted evidence is also required to establish actual provisioning readiness, stop/billing cessation, and profile/proxy/recording effects; local mocks prove only client behavior against the schema.

4. **Missing base facts:** inspect complete CLI retry/deadline logic, command omission/hash/config resolution, browser detach semantics, documentation and all shared lifecycle callers. These establish exact replay exposure and compatibility boundaries, including supported setting names/defaults. Do not infer undocumented support from API fields.

No live credential is available. Hosted claims remain explicit validation limits, not assumed passes.