# Independent blind shaping B: agent-browser #1371

**Date:** 2026-09-17  
**Source base:** frozen source archive identified by the packet as `aff6125c023b810ea3f2e5deec5379e9a4270bdc`, version 0.38.1  
**Model:** fx runtime using an OpenAI model; the exact model identifier is not exposed to this run  
**Independence:** only the frozen packet and `/Users/raillyhugo/Programming/vercel/agent-browser-1371-shape-b` were inspected. No candidate or sibling artifacts, PR diffs, live issue content, or repository memory were read.

## Evidence boundary

The archive has no `.git`; `cli/Cargo.toml` reports packet-consistent version 0.38.1.

Unix Chrome gets a separate process group, but group kill and temporary-profile deletion occur only in `ChromeProcess::kill` and `Drop` (`cli/src/native/cdp/chrome.rs:61-130`). External CDP connections have no owned process (`browser.rs:625-672`). Graceful close targets only a locally owned browser (`browser.rs:1306-1336`), and daemon close, idle, and signal branches run cleanup (`daemon.rs:249-352`), but SIGKILL cannot.

Chrome launches inside `tokio::task::spawn_blocking` (`browser.rs:501-518`). Source rejects Linux `PR_SET_PDEATHSIG` there because it follows the spawning thread, which Tokio may retire (`chrome.rs:846-865`). The daemon is deliberately detached with `setsid` (`connection.rs:873-895`) for multi-command continuity.

Windows already atomically assigns local Chrome to a kill-on-close Job Object (`windows_process.rs:1-4, 63-181`). The gap is Unix, especially macOS.

## Requirements (R)

| ID | Requirement | Status | Basis |
|---|---|---|---|
| R0 | A locally launched Chrome tree must not remain indefinitely after confirmed daemon death, including uncatchable termination. | Core goal | Settled packet requirement |
| R1 | Successful CLI exits and caller disconnects must preserve the named daemon session’s process, target, page, and JavaScript state while the daemon remains alive. | Must-have | Settled packet requirement |
| R2 | Cleanup must never kill an attached or user-owned browser, another session’s browser, or delete a user-supplied persistent profile. | Must-have | Settled packet requirement |
| R3 | Normal close, SIGTERM cleanup, configured restore behavior, the default one-hour idle policy, and explicit zero opt-out must retain their current semantics. | Must-have | Settled packet requirement |
| R4 | The ownership mechanism must follow daemon process lifetime, not the lifetime of the Tokio blocking worker that happened to launch Chrome. Ordinary worker idleness must not end Chrome. | Must-have | Settled packet requirement |
| R5 | The lifecycle correction must make no claim to fix blank-page, omnibox, animation, or other pathological CPU activity without separate evidence. | Must-have | Settled packet requirement |
| R6 | Hard-death authority must be established before a newly launched local Chrome can escape cleanup; daemon death during launch or registration must not create a permanent orphan window. | Must-have | Derived from uncatchable termination plus launch ordering |
| R7 | Cleanup authority must be scoped from source-held ownership data: the exact local Chrome process group and only its agent-browser-created temporary profile. | Must-have | Derived safety requirement from existing PGID and profile ownership |
| R8 | The selected shape must cover macOS and Linux Unix behavior without weakening the existing Windows Job Object behavior. | Must-have | Reported host plus source platform split |
| R9 | Cleanup of a daemon that is still alive but wedged is not part of this defect unless separately shaped with evidence. | Out | Packet boundary |
| R10 | Exact hard-death cleanup latency is not selected, but the mechanism must have a finite, testable bound that does not depend on a future CLI invocation. | Undecided | Packet leaves latency open; “indefinitely” excludes next-run-only cleanup |
| R11 | After hard death, an owned temporary profile must either be deleted safely or durably marked for bounded later deletion; user profiles must remain untouched. | Undecided | Packet explicitly leaves delete versus durable marking open |
| R12 | Death detection must not rely on PID existence alone; PID reuse, stale metadata, or another session must not confer kill authority. | Must-have | Derived from high-risk cleanup authority |

## A: Post-launch lease reaper

A separate Unix helper watches a daemon lease and cleans an already launched Chrome group.

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Keep current daemon-side Chrome spawn and separate PGID creation. | |
| A2 | After spawn, start a helper or register with a helper using an EOF lease plus `{pgid, owned_temp_profile}`. | ⚠️ |
| A3 | On lease EOF, helper sends SIGKILL to the registered negative PGID and deletes or marks only the registered temporary path. | |
| A4 | Bypass registration for `browser_process: None` attached connections and for user-supplied profile paths. | |
| A5 | Preserve existing graceful close as the primary path; disarm the helper after the local tree exits. | |

A2 is flagged because registration occurs after Chrome exists. If the daemon is SIGKILLed between spawn and registration, the exact observed leak survives. Moving registration earlier cannot name a not-yet-created PGID or transfer profile ownership reliably without changing who launches Chrome. The flag therefore forces R0 and R6 failures.

## B: Per-browser launch guardian

Each locally launched Unix Chrome is created and owned by a small guardian process. The daemon owns only a control and lifetime channel to that guardian.

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Add an internal guardian mode to the existing executable. The daemon starts it with a dedicated duplex control channel whose daemon end is close-on-exec for Chrome. | |
| B2 | The guardian builds the local launch, creates any temporary profile, starts Chrome in a fresh process group, waits for `DevToolsActivePort`, and returns the WebSocket URL plus Chrome identity to the daemon. | |
| B3 | The guardian retains the Chrome child handle, PGID, and optional owned temporary-profile path. It never accepts an attached CDP endpoint or user profile as cleanup authority. | |
| B4 | The guardian polls its control channel and Chrome child. EOF means daemon death: kill the retained group, reap Chrome, clean or mark the retained temporary profile, then exit. Chrome exit means clean owned temporary state and exit. | |
| B5 | Normal `Browser.close` remains daemon-driven. `wait_or_kill`, explicit close, SIGTERM, restore save, and idle expiry ask the guardian to wait or terminate, preserving current higher-level policy. | |
| B6 | Windows keeps its existing atomic Job Object path. Unix no longer depends on the Tokio launch thread after the guardian starts. | |

This closes the launch race because Chrome does not exist before the guardian owns both the lease channel and cleanup metadata. If the daemon dies during launch, EOF is already observable by the guardian. Ordinary CLI exits do not close the daemon-to-guardian channel, so session continuity remains daemon-scoped.

## C: Session supervisor owns daemon and local browsers

A single supervisor per session becomes the OS owner of the daemon and all locally launched browser trees.

| Part | Mechanism | Flag |
|---|---|:---:|
| C1 | `ensure_daemon` starts a session supervisor; the supervisor starts the detached daemon and retains its child identity and a private IPC channel. | |
| C2 | The daemon requests local Chrome launches through supervisor IPC. The supervisor creates temporary state, launches each Chrome group, and returns its CDP endpoint. | |
| C3 | The supervisor retains every local child handle, PGID, and owned temporary-profile path. Attached browsers bypass this launch registry entirely. | |
| C4 | Confirmed daemon child exit or channel loss causes the supervisor to terminate all registered local groups and clean or mark their owned temporary profiles. | |
| C5 | Normal close unregisters one browser after graceful exit; normal daemon shutdown closes all registrations after existing save and close logic. | |
| C6 | PID/config files continue to identify the daemon, not the supervisor, so existing ready-daemon reuse and configuration fingerprint behavior remains authoritative. | |
| C7 | Windows retains Job Objects; the supervisor path is Unix-only unless later evidence justifies unification. | |

C closes the registration window but moves daemon spawning and every local launch across IPC, broadening high-risk cleanup authority.

## D: Durable orphan manifest and next-run scavenger

| Part | Mechanism | Flag |
|---|---|:---:|
| D1 | Before or after launch, write a session manifest containing daemon identity, Chrome PGID, and owned temporary-profile path. | ⚠️ |
| D2 | On later CLI startup, scan manifests, decide whether the recorded daemon is dead, kill surviving owned groups, and delete or mark temporary paths. | ⚠️ |
| D3 | Keep current runtime and graceful cleanup unchanged. | |

D cannot provide a finite bound without a future command. PID-only validation is unsafe, while portable process birth identity and atomic manifest ordering are unresolved. It is useful only as defense in depth after a primary lifetime mechanism, not as the selected fix.

## Binary fit check

| Req | Requirement | Status | A | B | C | D |
|---|---|---|---|:---:|:---:|:---:|:---:|
| R0 | A locally launched Chrome tree must not remain indefinitely after confirmed daemon death, including uncatchable termination. | Core goal | ❌ | ✅ | ✅ | ❌ |
| R1 | Successful CLI exits and caller disconnects must preserve the named daemon session’s process, target, page, and JavaScript state while the daemon remains alive. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R2 | Cleanup must never kill an attached or user-owned browser, another session’s browser, or delete a user-supplied persistent profile. | Must-have | ✅ | ✅ | ✅ | ❌ |
| R3 | Normal close, SIGTERM cleanup, configured restore behavior, the default one-hour idle policy, and explicit zero opt-out must retain their current semantics. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R4 | The ownership mechanism must follow daemon process lifetime, not the lifetime of the Tokio blocking worker that happened to launch Chrome. Ordinary worker idleness must not end Chrome. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R5 | The lifecycle correction must make no claim to fix blank-page, omnibox, animation, or other pathological CPU activity without separate evidence. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R6 | Hard-death authority must be established before a newly launched local Chrome can escape cleanup; daemon death during launch or registration must not create a permanent orphan window. | Must-have | ❌ | ✅ | ✅ | ❌ |
| R7 | Cleanup authority must be scoped from source-held ownership data: the exact local Chrome process group and only its agent-browser-created temporary profile. | Must-have | ✅ | ✅ | ✅ | ❌ |
| R8 | The selected shape must cover macOS and Linux Unix behavior without weakening the existing Windows Job Object behavior. | Must-have | ✅ | ✅ | ✅ | ❌ |
| R9 | Cleanup of a daemon that is still alive but wedged is not part of this defect unless separately shaped with evidence. | Out | ✅ | ✅ | ✅ | ✅ |
| R10 | Exact hard-death cleanup latency is not selected, but the mechanism must have a finite, testable bound that does not depend on a future CLI invocation. | Undecided | ✅ | ✅ | ✅ | ❌ |
| R11 | After hard death, an owned temporary profile must either be deleted safely or durably marked for bounded later deletion; user profiles must remain untouched. | Undecided | ✅ | ✅ | ✅ | ❌ |
| R12 | Death detection must not rely on PID existence alone; PID reuse, stale metadata, or another session must not confer kill authority. | Must-have | ✅ | ✅ | ✅ | ❌ |

### Failure notes

- A fails R0 and R6 because its flagged post-launch registration leaves the critical SIGKILL window open.
- D fails R0 and R10 because cleanup requires another invocation. It fails R2, R7, R11, and R12 because its ownership and stale-identity mechanics are flagged rather than established.
- No flagged mechanism is counted as a pass.

## Recommendation

Select **B, per-browser launch guardian**, subject to the refutation probes below. It is the narrowest shape that establishes cleanup authority before Chrome exists, works on macOS without pretending Linux thread-bound `PR_SET_PDEATHSIG` is process-bound, and preserves the existing attached-browser distinction. It leaves the Windows Job Object solution untouched and does not alter idle policy or configuration fingerprints.

C also fits, but centralizes authority over every browser and changes daemon launch without evidence that helper count is a problem. B does not authorize user-facing flags, live-daemon wedge detection, generalized supervision, or CPU tuning.

For R11, delete only the exact path the guardian created after group termination and reaping. If deletion cannot be bounded safely, use an atomic tombstone and narrowly scoped retry worker. Never infer ownership from the `agent-browser-chrome-*` name alone.

## Cheap refutation probes required before implementation

1. **EOF lifetime probe, no browser:** build a tiny test helper using the proposed inherited channel. Keep the daemon-side writer alive across multiple simulated CLI subprocess exits, then SIGKILL only the daemon holder. Refute B if the guardian does not observe EOF within a selected bound on both macOS and Linux.
2. **Launch-race matrix, no browser:** use a sleep process in a fresh PGID as the Chrome stand-in. SIGKILL the daemon before guardian spawn, during guardian startup, before child spawn, immediately after child spawn, and after readiness response. Every state in which a child exists must end with zero group members. Refute B on any orphan window.
3. **Thread-idleness probe, no browser:** initiate the guardian from `spawn_blocking`, allow the Tokio blocking worker to retire, and confirm the stand-in remains alive while the daemon lease remains open. This directly protects R4 and the #1157 regression boundary.
4. **Authority isolation probe, no browser:** run two session guardians plus an unregistered external stand-in. Kill one daemon lease. Only its registered PGID may die; the second session and external process must survive. Include deliberately reused/stale manifest text to prove it has no authority.
5. **Profile ownership probe:** give the guardian one directory it creates and one caller-created directory with a sentinel. On daemon hard death, only the guardian-created directory may be removed or tombstoned. Repeat with profile-name copy semantics, which source currently converts into an owned temporary copy.
6. **Graceful precedence probe, no browser:** send normal close, simulated SIGTERM cleanup, and idle-expiry close through the control protocol. Confirm graceful completion wins, the guardian exits, and no later EOF action targets a reused PGID.
7. **Guardian-crash probe:** kill the guardian while daemon and stand-in live. If the stand-in survives indefinitely, explicitly decide whether guardian death is within R0’s “lifetime owner” contract. Do not silently ship that residual leak. A Linux-only parent-death signal may harden this case, but it cannot substitute for the macOS daemon-death mechanism.
8. **Cross-platform compile and Windows regression probe:** compile Unix guardian code on macOS and Linux and compile the unchanged Windows Job Object path. No real browser is needed at this gate.

After these probes pass, browser validation should repeat the packet’s lifecycle, isolation, idle, and restore cells. CPU remains a separate investigation.
