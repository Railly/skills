# Contract A — owned Chrome stderr liveness (blind, contract only)

Isolated base: `agent-browser-stderr-shape-a` @ aff6125 (0.38.1). Inputs: frozen packet, Shaping skill, this source tree only. No shapes proposed.

## Verified base mechanism (source lines)

- `chrome.rs:825–831` spawn: stdin/stdout null, `stderr(Stdio::piped())`. `882–904`: primary `wait_for_devtools_active_port`; only the **error** branch does `child.stderr.take()`.
- P1 (primary success): `child.stderr` stays `Some` inside `ChromeProcess.child` and **no code reads it** (grep `stderr` over `cli/src`: Chrome's pipe is read only at `886–892`). Pipe fills → Chrome blocks in `write`; matches 185/185 `write` frames and the >64 KiB file-case log.
- P2 (fallback success): the `BufReader` is moved into `wait_for_ws_url_until` and dropped on return → read end closed → later writes see EPIPE, not backpressure. **The two readiness paths leave different post-readiness stderr states.**
- `chrome.rs:958–983`: deadline is tested only *after* `reader.lines()` yields, so a silent non-exiting Chrome blocks past 30 s unbounded; `972`: a non-UTF-8 byte fails the launch ("Failed to read Chrome stderr"); `963,976`: `Vec<String>` grows unbounded; `985–1041`: keyword filter, else last 5 lines, else hint.
- Precedent, not a proposal: `lightpanda.rs:14,93–99,208–215,218–228` bounded `VecDeque` (`MAX_LOG_LINES = 40`) fed by drain threads.
- `browser.rs:511–515` launch on `spawn_blocking`; `chrome.rs:850–853` documents Tokio reaping idle blocking threads (~10 s, issue #1157).
- `browser.rs:1306–1333` `close()` awaits `Browser.close` with **no timeout**; the 5 s `wait_or_kill` runs only after. `FAILED_INITIALIZATION_CLOSE_TIMEOUT = 1 s` (`450`) covers failed init only.
- `chrome.rs:61–75,107–130` kill = child kill + `killpg` + `wait`, Drop removes temp profile. `windows_process.rs:50,120–122,171`: Windows keeps an equally unread anonymous-pipe `stderr: Option<File>` → same stall class.
- `chrome.rs:450–461` `--args` pass through unfiltered (only `--enable-features` merged); `--enable-logging` appears nowhere in the repo (0 grep matches) → reachable via ordinary passthrough.
- Daemon auto-spawn nulls its own stdio (`daemon.rs:855–857`, `main.rs:1118–1120`); a directly started daemon inherits the caller's stderr; no `foreground` flag exists in `cli/src`. No unit test covers `wait_for_ws_url_until` or stderr retention.

## R table

| R | Requirement | Status |
|---|---|---|
| R0 | Ordinary supported Chrome logging must not prevent startup or later commands from progressing | Settled (core goal) |
| R1 | Preserve file-based readiness **and** the stderr URL fallback; no silent removal of a launch path | Settled must-have |
| R2 | Failed startup still returns Chrome diagnostics + process status, not a bare timeout | Settled must-have |
| R3 | Same-session continuity; normal close/relaunch; no new restart trigger from flag omission | Settled must-have |
| R4 | No trading pipe backpressure for unbounded memory/disk/thread/descriptor growth; budgets explicit | Settled must-have; budgets Undecided |
| R5 | stdout/JSON stays clean; no new unrestricted forwarding of browser logs to terminal or global log by default | Settled must-have |
| R6 | Keep local-vs-attached ownership, Unix group cleanup, Windows Job Object; no new reaper/idle/GPU policy | Settled must-have |
| R7 | Scope to managed Chrome output/readiness; no high-CPU or ffmpeg/Lightpanda/provider claims | Settled must-have |
| R8 | Post-readiness stderr disposition defined and equivalent for **both** readiness paths (P1 retained pipe vs P2 closed pipe) | Derived (882–904) |
| R9 | Startup terminates in bounded wall time even when Chrome is silent and does not exit | Derived (965–971) |
| R10 | Non-UTF-8 / split / newline-less output must not convert a viable launch into failure or unbounded wait | Derived (972); fix-vs-preserve Undecided |
| R11 | `close` on an output-blocked owned browser reaches termination and cleanup in bounded time | Derived (browser.rs:1306–1333); scope Undecided |
| R12 | Capture resources owned by ChromeProcess lifetime: released on exit/kill/Drop, no per-launch leak, not dependent on a reapable Tokio blocking thread | Derived (107–130, 850–853) |
| R13 | Windows anonymous-pipe stderr carries the same exposure; parity covered or explicitly out of scope | Derived (windows_process.rs:50,120–122,171) |
| R14 | No fix by filtering, rejecting, or rewriting user logging args | Derived (450–461); Leaning yes |
| R15 | Verifiable without launching a real browser | Derived; Undecided as gate |

## Observable success

Launch returns a ws URL and PID; `open`/`snapshot` return within the same bound as the file-control case (exit 0), with cumulative Chrome stderr **well past 64 KiB**; `close` returns and the process group plus temp profile are gone; startup failure text still names an error/exit-code line; JSON stdout byte-identical to today; retained-bytes and thread/fd counts stay flat across repeated launches.

## Must-not-change set

DevToolsActivePort primary readiness and its 30 s attempt budget; the `DevTools listening on ` fallback contract; 3-attempt retry and temp-profile ownership transfer (`chrome.rs:758–792`); error-selection keywords and sandbox hint (`985–1041`); kill/`killpg`/Drop cleanup; `wait_or_kill(5s)`; attached-browser disconnect-without-kill (`browser.rs:1313–1318`); daemon idle policy (`daemon.rs:175–204`); unfiltered `--args`; stdout JSON shape.

## Lifecycle / trust / compatibility boundaries

Owned Chrome only: capture starts at spawn, ends at exit/kill/Drop; per attempt, no cross-attempt or cross-session mixing, no durable default storage. Attached browsers must never gain kill or log-capture authority. Retained diagnostics are untrusted browser bytes: bounded, never executed, never widening stdout. Arg omission on a later invocation must not clear or restart anything.

## Discriminator matrix (case × observable that separates plausible fixes)

| Case | Discriminating observable |
|---|---|
| Quiet startup, heavy logging after readiness (P1) | Commands progress past ≫64 KiB; retained bytes bounded |
| Fallback readiness then heavy logging (P2) | Same progress guarantee despite closed/taken pipe; no EPIPE-driven Chrome death |
| Noisy startup failure | Error/exit-code lines still surfaced; peak retention bounded during the 30 s window |
| Stderr-only readiness (no DevToolsActivePort) | URL still found after primary error; diagnostics unlost |
| Silent Chrome, never exits | Bounded failure time (R9), not indefinite block |
| Split write / no trailing newline | Readiness still detected; no wait for EOF |
| Invalid UTF-8 byte mid-log | No launch abort, no stall (R10) |
| Inherited/quiet writer (daemon auto-spawn null vs directly started daemon) | No new terminal leakage (R5); blockage still absent when the inherited fd is itself a slow pipe |
| Close while output-blocked | Close returns, group killed, temp profile removed (R11/R12) |
| Relaunch × N in one session | Flat fd/thread counts; no residual capture (R12) |
| Attached external browser | External PID alive; no capture attempted (R6) |

## Key disagreements / unknowns

1. **Causal attribution is inferential, not instrumented.** Source makes the unread-pipe path near-certain, but the packet concedes the blocking write's fd was not identified; P1/P2 asymmetry means a same-live-process recovery test is needed before claiming mechanism-independent success.
2. **"Preserve current diagnostics" is not a safe baseline.** The current fallback buffer is already unbounded (`chrome.rs:963,976`); R4 and R2 conflict unless a retention budget is chosen deliberately.
3. **Close hang may be partly independent.** `close()` has no CDP timeout at all; the 8 s non-response is consistent with a blocked browser *and* with an unbounded await. Whether R11 is in scope or a separate defect is unresolved.
4. **R9 silent-Chrome unbounded wait** is a real liveness hole in the same function but was not in the observed trial; in-scope or deferred is a judgment call.
5. **Windows parity (R13)** is untested here and the packet gives no Windows evidence.
6. **Acceptance without browser execution (R15)** is undefined: no existing test seam covers readiness/stderr.
