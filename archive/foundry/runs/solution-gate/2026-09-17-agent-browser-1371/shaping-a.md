# Independent blind shaping — agent-browser #1371 (reviewer A)

**Reviewer model:** `anthropic/claude-opus-5`, selected by the parent launch metadata for this run, executing under the `fx` CLI harness. Self-reported exact model id is unavailable to the running agent; the selected id above is the authoritative record.

**Inputs read:** frozen packet `frozen-input.md`, and only the isolated source tree `/Users/raillyhugo/Programming/vercel/agent-browser-1371-shape-a` at base `aff6125c023b810ea3f2e5deec5379e9a4270bdc` (v0.38.1). No sibling reviewer artifacts, no candidate patch, no PR diff, no network fetch of the issue. No implementation, no browser-executing tests, no repository memory writes.

---

## 1. Frame

A locally owned headless Chrome tree plus its temporary profile can outlive the daemon that owns them, indefinitely, when the daemon dies by uncatchable termination. Desired outcome: an owned browser cannot indefinitely outlive its dead lifetime owner, without collapsing the multi-command session model into one CLI invocation, and without ever touching an attached or user-owned browser.

## 2. What the isolated source actually shows (CURRENT)

Facts I verified in this tree, each usable as a shape constraint:

| # | Observation | Handle |
|---|---|---|
| S1 | Unix cleanup is `killpg(-pgid, SIGKILL)` plus temp-profile `remove_dir_all`, reached only from `ChromeProcess::kill` / `Drop`. Both run **inside the daemon image**. | `cdp/chrome.rs:61-131` |
| S2 | Chrome is spawned into its own process group via `pre_exec(setpgid(0,0))`; `PR_SET_PDEATHSIG` was deliberately removed because it is thread-scoped and Tokio reaps blocking threads (#1157). | `cdp/chrome.rs:846-865`, `browser.rs:511-515` |
| S3 | **Windows already has the invariant this issue asks for.** Chrome is created inside a Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, and only the daemon holds the job handle, so forced daemon termination kills the whole Chrome tree via the kernel. | `cdp/windows_process.rs:1-9, 60-90` |
| S4 | The defect is therefore a **platform asymmetry**, not a missing concept: Unix has no equivalent kernel-held lifetime handle. | S1 + S3 |
| S5 | Transport is WebSocket only: `--remote-debugging-port=0` + `DevToolsActivePort`. `--remote-debugging-pipe` appears nowhere in the repo. | `cdp/chrome.rs:464, 879-904`; repo-wide count 0 |
| S6 | Temp profile is `TMPDIR/agent-browser-chrome-<uuid>`, and `temp_user_data_dir` is `Some` **only** when no explicit `--profile` was given; an explicit user profile yields `None` and is never deleted. | `cdp/chrome.rs:530-542` |
| S7 | Ownership discriminator for "do not kill the user's browser" already exists: `browser_process.is_some()`. Attached/external browsers disconnect only. | `browser.rs:1306-1336` |
| S8 | The daemon is spawned `setsid()`-detached with piped stderr; per-session sidecars are `.pid`, `.sock`, `.stream`, `.version`, `.config`, `.engine`, `.provider`, `.extensions`. There is **no sidecar recording the owned browser**. | `connection.rs:878-892`, `daemon.rs:66-67, 146-159` |
| S9 | `walk_daemons()` already sweeps stale sidecars (orphaned `.sock` without `.pid`) on ordinary invocations — an existing, proven sweep hook, but it knows nothing about Chrome. | `connection.rs:330-360` |
| S10 | **The product manufactures its own orphans**: `close --all` SIGKILLs any session daemon whose socket is unreachable, and `kill_stale_daemon` escalates SIGTERM→SIGKILL. On Unix each of those paths can leave the exact orphan tree in the report. | `main.rs:1279-1296`, `connection.rs:715-750` |
| S11 | Idle policy: default 1h, explicit `0` disables, default exempts headed/WebDriver/attached via `blocks_default_idle_shutdown()`. All shutdown paths still execute **in-daemon**. | `daemon.rs:167-204, 299-352` |

S1+S3+S10 are the core diagnosis: cleanup authority is entirely in-process on Unix, while the product itself routinely terminates that process uncatchably.

---

## 3. Requirements (R)

### Settled (from the frozen packet)

| ID | Requirement | Status |
|---|---|---|
| R0 | A local Chrome tree must not remain indefinitely after confirmed daemon death, including uncatchable termination | Core goal |
| R1 | Normal multi-command sessions retain process/target/page state across successful CLI exits and caller disconnects while the daemon lives | Must-have |
| R2 | No cleanup action may kill an attached/user-owned browser or another session, nor delete a user-supplied persistent profile | Must-have |
| R3 | Keep normal `close` and SIGTERM cleanup and configured restore behavior; do not regress the 1h idle default or explicit `0` opt-out | Must-have |
| R4 | Fix must respect process lifetime, not Tokio worker-thread lifetime; worker idleness must not terminate Chrome | Must-have |
| R5 | Lifecycle and CPU claims stay separate; no claim of fixing blank-page/omnibox CPU spin without evidence | Must-have |

### Derived from this source inspection

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| R6 | Cleanup agency must exist outside the daemon process image or in the kernel, since SIGKILL leaves no in-process hook to run | Must-have | S1, S11 |
| R7 | Any pid/pgid-targeted kill must be gated by owner identity that survives pid/pgid reuse (recorded pgid + profile path + start-time token), not by pgid alone | Must-have | S1, R2 |
| R8 | Must not perturb the daemon readiness/reuse contract: `.pid` must remain the daemon pid, config fingerprint and version checks unchanged, `walk_daemons` must not see new pseudo-sessions | Must-have | S8, S9, `connection.rs:592-700` |
| R9 | Must preserve the existing Windows job-object guarantee and must not reintroduce thread-scoped lifetime on Linux | Must-have | S2, S3 |
| R10 | Cleanup after hard death must also dispose of the owned temp profile, and only directories recorded as owned temp profiles | Must-have | S1, S6 |
| R11 | Must preserve the existing CDP surface: WS endpoint reuse, stream/inspect servers, extensions, discovery, `--cdp`/auto-connect attach | Must-have | S5, S7 |
| R12 | The product's own forced-kill paths (`close --all`, `kill_stale_daemon`) must stop producing orphan trees | Must-have | S10 |

### Undecided (flagged, not resolved by this evidence)

| ID | Question | Status |
|---|---|---|
| U1 | Bounded cleanup latency target: immediate (kernel), seconds (sentinel poll), or next-invocation | Undecided |
| U2 | Whether cleanup authority should also cover a wedged-but-alive daemon | Undecided |
| U3 | After hard death, delete the temp profile vs. mark it for durable later cleanup | Undecided |
| U4 | Cross-invocation idle-timeout override semantics (packet records this as unmeasured) | Undecided, out of this defect's scope |

### Out of scope

- Instant Chrome kill on ordinary CLI completion (conflicts with the established multi-command workflow; contradicts R1).
- Root cause of near-100% CPU on blank tabs / omnibox (R5).

---

## 4. Shapes

### CURRENT — in-process cleanup only
Drop/kill inside the daemon; Windows job object; no owner record on disk.

### A: Kernel lifeline descriptor (Chrome dies when the owner's fd closes)

| Part | Mechanism | Flag |
|---|---|---|
| A1 | Give Chrome a descriptor whose only writer is the daemon process, so daemon death closes it at the kernel level | |
| A1-A | Full switch of CDP transport to `--remote-debugging-pipe` (fds 3/4), replacing the WS client | ⚠️ |
| A1-B | Keep `--remote-debugging-port=0` + WS, add `--remote-debugging-pipe` purely as a dead-man switch the daemon never writes to | ⚠️ |
| A2 | FD hygiene: mark the lifeline write end `CLOEXEC`, ensure no CLI/child (setsid daemon spawn, stderr pipe readers) inherits it | |
| A3 | Retain existing killpg/Drop as the fast, graceful path | |

Both A1 variants are flagged: Chrome's documented behaviour on pipe disconnect (browser shutdown) is not verified in this tree or in this source, and dual-transport acceptance in Chrome 148+ is unverified. A1-A additionally rewrites the client used by stream/inspect/discovery (R11 risk).

### B: Out-of-process sentinel (reaper) per launched Chrome

| Part | Mechanism | Flag |
|---|---|---|
| B1 | At launch, the daemon spawns a minimal sentinel (same binary, `AGENT_BROWSER_REAPER=1`, own session) holding the read end of an anonymous pipe whose write end only the daemon holds; the sentinel blocks on `read()` and wakes on EOF, which the kernel delivers on any daemon death including SIGKILL | |
| B2 | Ownership record handed to the sentinel at spawn (argv/env, no sidecar file): chrome pid, pgid, temp profile path, chrome start-time token, owner daemon pid | |
| B3 | On EOF: re-verify identity (pgid still alive, leader pid matches recorded start time) then `killpg(TERM)` → grace → `killpg(KILL)`; delete the profile dir only if it equals the recorded `agent-browser-chrome-*` temp path | |
| B4 | Sentinel also waits on Chrome liveness and exits silently when Chrome exited first (normal `close`, SIGTERM, idle expiry) | |
| B5 | Unix-only; Windows compiles to a no-op because the job object already provides the guarantee | |
| B6 | Sentinel writes no session sidecars and is excluded from `walk_daemons` discovery | |

Every primitive here is already used in this repo (`setpgid`, `killpg`, `kill(pid,0)` liveness at `stream/discovery.rs:111`, `setsid` spawn), so no part is a sketch.

### C: Lazy reconciliation sweep (owner registry + sweep on next invocation)

| Part | Mechanism | Flag |
|---|---|---|
| C1 | Write `<session>.browser` sidecar at launch (chrome pid, pgid, start time, owned temp profile path, owner daemon pid); remove on clean close | |
| C2 | Extend `walk_daemons()` to find records whose owner daemon pid is dead, verify identity per R7, then killpg and remove the owned temp profile | |
| C3 | Same sweep at daemon startup for its own session before launching | |

### D: Browser-side self-termination watchdog

| Part | Mechanism | Flag |
|---|---|---|
| D1 | Injected extension/page script that closes the browser when a daemon heartbeat stops | ⚠️ |
| D2 | In-daemon process-exit observer (kqueue/`EVFILT_PROC`) that reaps Chrome | ⚠️ |

D2 is structurally void: the observer dies with the observer's process. D1 cannot reliably terminate a browser from page/extension context, and headless blank-page sessions may have no live page to run it.

### E: Ownership inversion — supervisor parent owns Chrome

| Part | Mechanism | Flag |
|---|---|---|
| E1 | `AGENT_BROWSER_DAEMON` entry forks a thin supervisor that owns the Chrome group while a child worker runs the Tokio daemon; supervisor reaps on worker death | |
| E2 | Keep `.pid`/`.version`/`.config` readiness pointing at the addressable daemon, not the supervisor | ⚠️ |
| E3 | Residual: SIGKILL of the supervisor (or `close --all` killing the wrong pid) reproduces the defect | ⚠️ |

### F: Composed — sentinel guarantee, lifeline upgrade, sweep backstop

**F = B1–B6 + C1–C3 + (A1-B, A2 gated behind probe P1)**

| Part | Mechanism | Flag |
|---|---|---|
| F1 | Sentinel reaper (B1–B6) provides the unconditional Unix guarantee | |
| F2 | Owner registry + sweep (C1–C3) cleans pre-existing orphans, profile garbage, and any case where the sentinel itself was killed | |
| F3 | Optional kernel lifeline (A1-B) adopted only if probe P1 confirms behaviour; if adopted it makes the sentinel a fallback rather than the primary path | ⚠️ |
| F4 | Windows unchanged (job object); Linux unchanged w.r.t. thread lifetime | |

No requirement in F depends solely on the flagged F3; R0 is delivered by F1.

---

## 5. Fit check (binary)

| Req | Requirement | Status | CURRENT | A | B | C | D | E | F |
|---|---|---|---|---|---|---|---|---|---|
| R0 | Chrome tree must not remain indefinitely after confirmed daemon death, including uncatchable termination | Core goal | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| R1 | Multi-command sessions retain state across CLI exits while the daemon lives | Must-have | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| R2 | Never kill an attached/user-owned browser or another session, never delete a user profile | Must-have | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| R3 | Keep close/SIGTERM cleanup, restore behavior, 1h idle default and explicit 0 opt-out | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| R4 | Respect process lifetime, not Tokio worker-thread lifetime | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| R5 | Keep lifecycle and CPU claims separate | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| R6 | Cleanup agency outside the daemon image or in the kernel | Must-have | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| R7 | Kills gated by owner identity surviving pid/pgid reuse | Must-have | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| R8 | Do not perturb daemon readiness/reuse contract or session discovery | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| R9 | Preserve Windows job-object guarantee; no thread-scoped Linux lifetime | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| R10 | Dispose of the owned temp profile after hard death, only owned dirs | Must-have | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| R11 | Preserve WS/CDP surface: stream, inspect, extensions, discovery, attach | Must-have | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| R12 | `close --all` / `kill_stale_daemon` forced kills stop producing orphans | Must-have | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |

**Notes**

- CURRENT fails R0/R6/R10/R12 on Unix only; Windows already satisfies them (S3).
- **A fails R0, R11, R12 by flag, not by argument.** Both A1 variants are ⚠️: Chrome's shutdown-on-pipe-disconnect behaviour and dual-transport acceptance are unverified in this tree. Per the fit-check rule, an unresolved mechanism is ❌. A also fails R10 even if the flag clears: the kernel kills processes, nobody deletes `agent-browser-chrome-<uuid>`.
- **B passes all rows.** R8 passes only because B6 keeps the sentinel out of sidecars and discovery; P3 must confirm it. R2/R7 rest on B2/B3 identity verification and on S7 (no record is written for attached browsers).
- **C fails R0 and R12**: latency is unbounded when the user never runs the CLI again, which is exactly the reported "leaked daemons running for days" pattern. C is a valid backstop, not a fix.
- **D fails broadly**: D2 dies with the daemon (R6), D1 has no reliable termination mechanism and would inject surface into every session (R11), and heartbeat-driven self-close cannot distinguish an attached browser (R2) or a deliberately long-lived session (R1).
- **E fails R8 by flag** (pid/readiness/version contract for a two-process daemon is not worked out) and fails R0 because a supervisor SIGKILL — including from the product's own `close --all` — reproduces the defect with one extra hop.
- **F passes all rows on B's strength.** F3 remains flagged; if P1 refutes it, F degrades to B+C with no requirement lost.

---

## 6. Recommendation

Select **F**, implemented in the order sentinel → registry/sweep → optional lifeline.

Reasoning:

1. The defect is a platform asymmetry (S3/S4): the invariant is already product policy on Windows, so Unix needs an equivalent *kernel-observable* owner-death signal, not more in-daemon logic.
2. Pipe EOF after owner death is the only Unix primitive that is both uncatchable-safe and zero-latency, and it is the same primitive class the repo already uses (`setsid`, `killpg`, pid liveness).
3. The sentinel (B) carries the guarantee without touching CDP transport, keeping R11 and R3 cheap.
4. The sweep (C) stays worthwhile under B: it clears pre-existing orphans and sentinel-killed cases, and decides U3 in one place.
5. The lifeline (A1-B) is the simplest end state if P1 clears, since it removes a process per session, but it must not be assumed.

High-risk boundaries this shape must hold: the reaper kills only a pgid recorded at launch, only after identity re-verification, and deletes only the recorded `agent-browser-chrome-<uuid>` path; no record is written for attached/`--cdp` browsers or explicit `--profile` launches (S6, S7). U1 (latency target) and U2 (wedged-alive daemon) stay open; F deliberately does **not** fire on a wedged live daemon, because the lifeline is still open.

---

## 7. Required refutation probes (cheap, falsifiable, none run here)

| # | Probe | Prediction that would confirm | Refutes |
|---|---|---|---|
| P1 | Launch Chrome with both `--remote-debugging-port=0` and `--remote-debugging-pipe` from a throwaway parent holding fds 3/4; SIGKILL the parent | Chrome accepts both flags, WS endpoint still works, whole tree exits within ~2s of parent death | F3 / all of A |
| P2 | Minimal C/Rust harness: parent holds pipe write end, `setsid` child blocks on read; SIGKILL parent on macOS arm64 | Child observes EOF in <100ms with no polling | B1 |
| P3 | With a sentinel alive, run `agent-browser status`, `close --all`, and `walk_daemons`-driven paths | No new session entries, no sidecar churn, daemon reuse fingerprint unchanged | B6 / R8 |
| P4 | Dry-run the reaper decision with a recorded pgid whose leader has exited and been recycled by an unrelated process | Reaper refuses to signal; logs identity mismatch | B2/B3 / R7 |
| P5 | Attach to an external browser via `--cdp`, then SIGKILL the daemon | External browser and its profile survive; no record was ever written | R2 |
| P6 | After a successful P1, inspect `TMPDIR` | `agent-browser-chrome-*` directory still present | Whether C2 is still required (expected: yes) |
| P7 | Normal multi-command session (open → set marker → snapshot → read) across CLI exits, then `close`, then SIGTERM, with idle default unchanged | State continuity preserved; idle default still 1h; explicit `0` still disables | R1, R3 |
| P8 | SIGSTOP the daemon instead of killing it | Lifeline/sentinel do **not** fire | Documents U2 as out of scope rather than accidentally covered |

P1, P2, P4 and P5 are the gating four: P1 decides whether the simple end state exists, P2 validates the guarantee mechanism on the reported platform, and P4/P5 protect the high-risk kill authority.

## 8. Explicit non-claims

- No claim that this shape addresses the near-100% CPU reports (R5). The CPU symptom may persist after the lifecycle fix and must be tracked separately.
- No candidate patch or other reviewer output was read; the diagnosis above is reconstructed from source and the frozen packet only.
- Windows and Linux behaviour was reasoned from source, not executed; this host validated neither.
