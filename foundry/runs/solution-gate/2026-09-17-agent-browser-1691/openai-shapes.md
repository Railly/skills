# Browser Use repair — blind shaping proposal

## Frame and evidence

**Scope:** Browser Use lifecycle repair only. Keep serialized daemon execution; no immediate-preemption guarantee, general provider redesign, automatic durable retries, or forced-death guarantee.

**Evidence basis:** the reconciled contract, Shaping methodology, and BASE excerpts supplied in the prompt. No filesystem tools were available to inspect additional directory files. No candidate, network, edits, or subagents were used.

The BASE establishes these repair points:

- `providers.rs`: Browser Use currently returns a credential-bearing WebSocket URL without ownership; stop discards its outcome.
- `actions.rs:2035–2100`: ownership is removed before cleanup acknowledgment.
- `actions.rs:3501/4321`: provider ownership is remembered only after attachment succeeds.
- `actions.rs:2001/2421`: restore transitions and automatic relaunch discard close errors; explicit relaunch propagates them.
- `daemon.rs`: commands hold the state mutex; idle/signal shutdown discard cleanup errors. Shutdown stderr is **not operator recovery**.

The supplied BASE does not establish the V4 option mapping or official resource-ID schema. Those remain explicit proposal gates.

## Requirements and binary fit check

This is both the full R table and the single R × Shape comparison. ✅ means a concrete proposed mechanism exists, not that implementation has been tested.

| R | Status | Observable requirement | A | B |
|---|---|---|:---:|:---:|
| R0 | settled | Browser Use create/read/attach/stop is finite, returns truthful failures, and releases the existing serialized daemon so commands and shutdown regain progress. Immediate preemption is not required. | ✅ | ✅ |
| R1 | settled | A known owned browser is retained until acknowledged stop, or explicit actionable provider/ID recovery information reaches the operator. Stop failure must not report success. | ✅ | ✅ |
| R2 | settled | Plain subsequent commands with omitted provider options preserve the same browser, target, URL and DOM state. | ✅ | ✅ |
| R3 | settled | Failed setup after allocation, explicit close, auto/explicit relaunch, restore-key changes, internal shutdown, idle and signal shutdown account for the Browser Use resource. | ✅ | ✅ |
| R4 | settled | Local and external CDP browsers, other built-in providers and plugins keep their existing ownership, behavior and options. External browsers are detached without remote stop. | ✅ | ✅ |
| R5 | settled | Browser Use aliases, required credentials and V4 profile/proxy/recording options remain supported. | ❌ | ❌ |
| R6 | settled | Keys, token URLs and echoed secrets never enter new errors or recovery artifacts. Recovery records must contain only validated resource identity and safe instructions. | ❌ | ❌ |
| R7 | scoped | This repair does not introduce automatic durable retries or guarantee cleanup after forced death. Bounded orderly cleanup plus operator recovery is sufficient. | ✅ | ✅ |
| R8 | derived accepted | Compose create, attachment and rollback deadlines inside the normal 30-second minimum CLI response budget, with margin. A response-body stall must be bounded. | ✅ | ✅ |
| R9 | settled | Do not automatically replay a non-idempotent create after unknown remote outcome. Clearly direct operator to inspect Cloud if no ID was received. | ✅ | ✅ |
| R10 | derived accepted | Missing/null/unusable cdpUrl after a known ID requires cleanup or actionable recovery. Failed active stop remains retryable with the same ID; new launch cannot overwrite pending ownership. | ✅ | ✅ |
| R11 | derived accepted | Preserve omission/same/changed/explicit-clear semantics. No new setting equality or relaunch behavior is introduced. | ✅ | ✅ |

**Failure notes**

- **A and B fail R5:** the exact V4 profile/proxy/recording mapping is not established by the available BASE. P0 must resolve it without consulting a candidate.
- **A and B fail R6:** safe error construction is concrete, but accepting an echoed value as a resource ID requires the official identity schema. Until P0 resolves that validator, safe recovery identity is unproven.

## A: Daemon-owned lease with recovery receipt

Keep Browser Use ownership in `DaemonState`, separate from the detachable `BrowserManager`.

| Part | Concrete mechanism | Flag |
|---|---|:---:|
| A1 | Add a Browser Use-only API adapter: create once, bounded resource reads when needed, explicit stop returning `Result`. Preserve both aliases and credential checks. Map existing V4 options unchanged; validate IDs against the official schema before recording or using them in paths. | ⚠️ |
| A2 | Introduce `Empty → Allocated(id) → Attached(id) → StopPending(id)` ownership states. Store the validated ID **before** endpoint validation or CDP attachment. Attachment/setup errors call rollback against this state. Stop acknowledgment alone clears ownership; failures retain the same ID. | |
| A3 | Give the entire Browser Use lifecycle transaction a 24-second absolute deadline, with an initial allocation of 4s previous-resource cleanup, 6s create/read, 8s attachment/setup, 4s rollback, and 2s bookkeeping. Skip unused stages; never reset the deadline. Bound CONNECT, headers, bodies, CDP initialization, and Browser Use close/autosave prerequisites. Cancellation leaves the lease outside the cancelled future. | |
| A4 | Add a Browser Use receipt under the existing namespace/session directory, separate from disposable socket/provider markers. Preflight its destination before allocation; write validated provider/ID plus fixed Cloud inspection/stop instructions immediately after allocation. Do not report successful launch until written. Retain the receipt through daemon shutdown; remove it only after acknowledged stop. | |
| A5 | Route Browser Use setup rollback, explicit close, automatic/explicit relaunch, restore transitions, internal shutdown, idle and signals through A2/A3. Failed replacement cleanup returns an error before changing restore settings or allocating again. If receipt writing fails, attempt bounded rollback; on double failure retain ownership and return the safe ID/instructions directly. | |
| A6 | Preserve the existing Browser Use manager and effective launch identity when options are omitted. Feed the existing omission/same/changed/clear resolution into existing comparison logic; do not hash omitted defaults as replacement settings. Preserve target selection; do not reconnect or recreate a page on plain commands. | |
| A7 | Construct new Browser Use errors from fixed operation/outcome categories, numeric status and validated ID only—never raw HTTP bodies, endpoint strings, or nested transport/CDP errors. Disable create replay and redirects that could resend credentials or POST. Unknown outcome without ID says “inspect Browser Use Cloud before trying again.” | |
| A8 | CLI preflight reads retained receipts and surfaces their fixed recovery notice on subsequent invocations; document the receipt location for direct retrieval. Stale receipts are conservative notices, not retry jobs. Keep existing providers/plugins on their current cleanup and option paths. | |

**Receipt failure boundary:** if no durable receipt can be written and the initiating response cannot reach the operator, keep the live lease and refuse replacement. Do not silently take the ordinary shutdown exit while this ownership remains unhanded-off. Validate this exceptional path in P3; ordinary idle/signal failures use the already-written receipt.

## B: Browser Use lease worker

Move Browser Use resource ownership into a dedicated in-process worker. The existing daemon still serializes commands; this is not a new command scheduler.

| Part | Concrete mechanism | Flag |
|---|---|:---:|
| B1 | Use A1’s Browser Use-only API contract and schema validation inside a worker module. Other providers continue through the current dispatch paths. | ⚠️ |
| B2 | Start one worker per daemon with a bounded request channel. It owns the validated ID, acquisition state and recovery receipt; `DaemonState` owns only the worker handle and attached manager. Requests are acquire, commit-attachment, rollback, stop and shutdown. | |
| B3 | Worker acquisition records ownership and writes A4’s receipt before handing an endpoint to the daemon. An attachment lease has an absolute expiry: failure, caller disappearance or missing commit triggers one bounded rollback—not another create. Failed rollback becomes pending ownership, not an automatic retry loop. | |
| B4 | Propagate A3’s absolute transaction deadline through worker requests and daemon attachment. Reserve rollback time before attachment starts. Stop errors preserve worker state; reject acquire while pending. Shutdown waits only within its allotted deadline and leaves the prewritten receipt on failure. | |
| B5 | Route every lifecycle exit through the worker; keep BrowserManager attachment and A6’s existing settings/target reuse in `DaemonState`. Use A7’s safe errors and A8’s receipt discovery. Apply A5’s fail-closed behavior if receipt creation and rollback both fail. | |

**Material difference:** A relies on explicitly sequenced ownership transitions in the existing command task. B separates ownership from caller cancellation and uses an attachment-commit protocol. B introduces worker/channel failure states and a second lifecycle coordinator.

## Recommended survivor

**Advance A provisionally; do not route to implementation until P0 resolves its two failing rows.**

A places ownership beside the existing `active_provider_session` lifecycle and requires fewer new coordination mechanisms. B remains viable, particularly if cancellation probes reveal that direct in-task ownership cannot be maintained cleanly, but its worker protocol is unnecessary for the contract’s finite serialized execution promise.

Minimal wiring:

`CLI request → existing settings resolution → A2 lease → A1 API → A4 receipt → bounded CDP attach → existing manager`

`close/transition/shutdown → bounded stop → acknowledgment clears lease/receipt; failure retains ID and exposes recovery`

No slices are proposed before the flags and wiring are validated.

## Required cheap probes

These are **required follow-up probes, not tests claimed as executed**. Use offline fixtures and mocks; no live key is required.

| Probe | Question and required observation |
|---|---|
| **P0 — schema gate** | Read non-candidate local V4 documentation and frozen official schema fixtures. Establish exact aliases, credentials, option fields, ID grammar, create/read responses and stop acknowledgment. Test hostile ID/body/endpoint echoes. Resolve A1/B1 and R5/R6; if evidence is absent, retain the flags. |
| **P1 — deadline/cancellation** | Inject CONNECT/header/body stalls and stalled CDP setup. Include previous stop, setup failure, rollback, concurrent close and shutdown waiting on the mutex. Observe bounded lifecycle completion below 30s with margin, released daemon progress, retained ownership after cancellation, and exactly one create attempt. |
| **P2 — stop/state machine** | Exercise acknowledged 2xx, 404/other 4xx, 5xx, missing key, disconnect and timeout. Only acknowledgment clears ownership. A second close must send the same ID; invalid endpoint and failed setup must rollback; pending ownership must block replacement. |
| **P3 — visible handoff** | Fail stop during idle/signal/internal shutdown with stderr discarded. Retrieve the receipt after daemon exit and through the next CLI invocation. Inject unwritable storage, receipt removal failure and response disconnect; verify no silent ownership loss or false success. |
| **P4 — continuity/compatibility** | Open, set a DOM sentinel, issue plain commands, close: same session/target/URL/state, one create and one stop. Table-test omission/same/change/clear and restore transitions. Verify unchanged local, external-CDP, provider and plugin behavior, including no remote stop of external browsers. |

**Evidence limit:** mocks establish client behavior, not hosted repeated-stop, billing, profile persistence or recording effects. A 404 remains a stop failure; no live Cloud guarantees are asserted.