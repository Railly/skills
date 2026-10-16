# Review A — initial, post-reveal continuation (narrowed contract)

Status: **interim. No final verdict, no Pass to detail, no production implementation authorization.** This document is written to be superseded by the parent's evidence update (production-launch-path regression + repeated lifecycle measurement in a separate source copy).

## Provenance and limits of this pass

Continues `final-a.md`; it is not a second blind audit. `contract-a.md`, `shapes-a.md` and `final-a.md` stand unchanged as written; everything below is an update against the **narrowed** R set in `continuation-2026-09-18/input.md`, not a rewrite of the frozen broad contract in `../contract.md`.

- Read: `input.md`, `../contract.md`, `../final-a.md`, `../decision.md`, and only these files under `…/agent-browser-stderr-gate/candidate`: `cli/src/native/cdp/chrome.rs`, `cli/src/native/cdp/windows_process.rs`, `cli/src/native/browser.rs` (launch call site + test seam).
- Not read: sibling reviewer output (`final-b.md`, `contract-b.md`, `shapes-b.md`), `verification.json` receipts, environment, credentials, private directories, network, PR page, preview.
- Not done: no source edits, no test runs, no build, no GitHub action, no process launched.
- All source claims below are **static reads** of the candidate copy at the line numbers given. Where I reason from Rust/POSIX/Win32 semantics rather than from an executed cell, the claim is tagged `mechanism (unexecuted)`.

Identity unchanged from the parent: main `aff6125…`, PR head `f89be85…`, OPEN/REVIEW_REQUIRED, candidate is exactly +19/-0 in `cli/src/native/cdp/chrome.rs`.

---

## 1. Narrowed R (verbatim from input.md)

| R | Requirement | Status |
|---|---|---|
| R0a | After primary readiness succeeds, browser stderr volume must not block later commands, including long unterminated output and invalid bytes | Core goal |
| R0b | Pre-readiness output and existing stderr fallback redesign are separate follow-up work. Do not improve, worsen, or claim them fixed here | Out (scope fence) |
| R1 | Preserve primary readiness and fallback detection/status/diagnostics. No new bounded-diagnostic promise for the untouched fallback | Must-have |
| R2 | Preserve existing owned-vs-attached process/group/Job/profile cleanup, retries, idle policy and platform interfaces | Must-have |
| R3 | Omitted launch flags preserve PID/target/URL/application state. Explicit close/relaunch resets browser state according to existing semantics | Must-have |
| R4 | Post-ready output consumption retains bounded bytes and no default durable logs or stdout pollution | Must-have |
| R5 | Measure worker/fd release during repeated launch/kill/drop, including a quiet writer in the owned process group. Do not infer a leak from detached-thread syntax alone, or confuse an unjoined worker with a blocked caller. Any retention by writers outside that ownership boundary must be disclosed, not silently scoped out or accepted by implication | Must-have |
| R6 | Windows runtime and Linux runtime cannot be claimed from macOS. No Unix-only production implementation hidden behind a common API | Must-have |
| R7 | A maintainable regression must exercise the production launch path and fail if the consumption mechanism is removed. No new runtime abstraction merely to make tests possible | Must-have |

---

## 2. Shape K (candidate), parts re-read against the narrowed R

`chrome.rs:906–923`, inserted between the readiness `match` (`882–904`) and `ChromeProcess` construction (`933–942`).

| Part | Mechanism | Flag |
|---|---|:--:|
| **K1** | After readiness resolves, `child.stderr.take()`; if `Some`, move it into a named `std::thread` running `io::copy(&mut stderr, &mut io::sink())` (`916–922`) | |
| **K2** | Discard semantics: fixed-buffer byte copy, no UTF-8 decode, no line framing, no retention. O(1) memory regardless of chunk size, line length or invalid bytes | |
| **K3** | One drain per **successful** attempt. Every failed attempt returns at `886–902` via `terminate_launched_chrome` + `cleanup_temp_dir` before reaching `916`, so the retry loop (`758–784`) never creates a second drain for the same browser and never carries one across attempts | |
| **K4** | Thread is detached: `JoinHandle`, `copy` result and `Builder::spawn` result are all discarded. No registration in `ChromeProcess`, no stop signal, no join in `kill()` (`62–75`) or `Drop` (`107–131`) | ⚠️ |
| **K5** | Termination is by EOF only. EOF arrives when the last write end closes | ⚠️ |
| **K6** | Fallback-readiness sessions: stderr already moved into `BufReader` at `886–891` and dropped, so `take()` yields `None` and no second consumer is added. "Chrome tolerates EPIPE" asserted in the comment only | ⚠️ |
| **K7** | Not `cfg`-gated. Unix `ChildStderr` and Windows `Child.stderr: Option<File>` (`windows_process.rs:50`) both satisfy `Read`; one implementation over a common API | ⚠️ |

K3 is new information relative to `final-a.md`. My blind-phase R10 concern ("mixes retries or sessions") is **not supported by the code**: the drain is created strictly on the success path, exactly once per returned `ChromeProcess`. I withdraw that half of the concern.

---

## 3. Fit check (R × K), narrowed contract

| Req | Requirement | Status | K |
|---|---|---|---|
| R0a | After primary readiness succeeds, browser stderr volume must not block later commands, including long unterminated output and invalid bytes | Core goal | ✅ |
| R0b | Pre-readiness output and existing stderr fallback redesign are separate follow-up work. Do not improve, worsen, or claim them fixed here | Out (scope fence) | ✅ |
| R1 | Preserve primary readiness and fallback detection/status/diagnostics. No new bounded-diagnostic promise for the untouched fallback | Must-have | ✅ |
| R2 | Preserve existing owned-vs-attached process/group/Job/profile cleanup, retries, idle policy and platform interfaces | Must-have | ✅ |
| R3 | Omitted launch flags preserve PID/target/URL/application state. Explicit close/relaunch resets browser state according to existing semantics | Must-have | ✅ |
| R4 | Post-ready output consumption retains bounded bytes and no default durable logs or stdout pollution | Must-have | ✅ |
| R5 | Measure worker/fd release during repeated launch/kill/drop, including a quiet writer in the owned process group. Do not infer a leak from detached-thread syntax alone, or confuse an unjoined worker with a blocked caller. Any retention by writers outside that ownership boundary must be disclosed, not silently scoped out or accepted by implication | Must-have | ❌ |
| R6 | Windows runtime and Linux runtime cannot be claimed from macOS. No Unix-only production implementation hidden behind a common API | Must-have | ✅ |
| R7 | A maintainable regression must exercise the production launch path and fail if the consumption mechanism is removed. No new runtime abstraction merely to make tests possible | Must-have | ❌ |

**Notes.**

- **R0a ✅** rests on K1+K2 plus three measured sessions (open 2.76 s / 1.13 s / 1.35 s, five commands exit 0, 15 s post-ready hold) against a base that never answered `open` in 12 s. The "long unterminated output and invalid bytes" clause is satisfied by construction, not by a returned cell: `io::copy` never calls `lines()`, never decodes UTF-8 and never accumulates, so there is no input shape that can stop it or grow it. The byte-shape cells that exist (`stream-spike.py`) probed a *different* shape in Python and do not transfer. §6 T2 converts the mechanical argument into evidence; if T2 ever failed, R0a would flip.
- **R0b ✅** means the fence is respected, not that pre-readiness is fixed. Preburst failed identically on both sides (12 s, both). The drain is unreachable before readiness by placement, so the candidate cannot have improved or worsened it. Per S12, post-ready coverage is **not** relabelled as R0 coverage.
- **R1 ✅**: the insertion is strictly after the readiness `match` arms; the fallback arm returns or errors out at `886–902`. The `None` case at `916` is the fallback lane and is handled. Status-42 diagnostics measured identical (exit 1, 1.40 s base vs 1.45 s candidate). The untouched fallback keeps its unbounded `Vec` (`982`) and its post-line-only deadline check (`984–990`); nothing here promises otherwise.
- **R2 ✅**: no new field on `ChromeProcess`, no change to `kill()` (`62–75`), `Drop` (`107–131`), `pgid` derivation (`925–931`), `setpgid` pre-exec (`854–865`), profile cleanup, the 3-attempt retry loop, or the attach path. Per K3, failed attempts create no drain.
- **R3 ✅**: nothing in command dispatch or `ws_url` derivation changes; the corrected `normal-e31a6653` cells kept PID family, marker 1371, one owned group and the same launch hash across five commands with flags passed only to `open`.
- **R4 ✅**: `io::sink()` retains zero bytes, writes no file, adds no flag, touches no stdout or JSON. Strictly better than the fallback lane's unbounded `Vec`.
- **R5 ❌ — this is a *measurement and disclosure* failure, not an observed leak.** See §4. The release argument is sound inside the ownership boundary and unproven outside it; the required measurement (`decision.md` §138: thread/fd flatness across many relaunches explicitly not measured) does not yet exist, and the out-of-boundary case is currently undisclosed in the comment. This is the cell the parent's evidence update can flip.
- **R6 ✅** as a boundary rule, not as a runtime pass. K7 is a single non-`cfg`-gated implementation over `Read`; there is no Unix-only production behaviour hidden behind a common API. Windows/Linux runtime remains an unclaimed delivery gate, and the Windows EOF path is flagged in §4.3.
- **R7 ❌**: the PR adds no test. It is ❌ today and cheaply satisfiable — §6 shows the seam already exists in-tree, so no new runtime abstraction is needed.

**Delta vs `final-a.md` (broad contract).** Broad-R failures were R0, R4, R8, R9, R10. Under the narrowed contract only R5 and R7 remain open. No fact changed; the contract's domain changed. R8/R9/R10 dissolve because the defects they named live in the untouched fallback lane (R0b) or in the retry-mixing hypothesis that K3 refutes. I am flagging this explicitly so the narrowing is visible as a decision, not absorbed as a quiet pass.

---

## 4. Exact resource-lifecycle risk vs the defects actually observed

### 4.1 What was actually observed

| Observed cell | Where it lives | Attributable to K? |
|---|---|---|
| Base `open` no response at 12 s, returncode -15 (harness SIGTERM) | pre-candidate defect | fixed by K |
| Candidate open + 5 commands exit 0 ×3 sessions, 15 s hold, no relaunch | post-ready lane | K working |
| Preburst ~1.2 MB before exec: 12 s no response on **both** sides | pre-readiness lane | no |
| Quiet writer: no response at 35.0 s on **both** sides | **fallback lane**, `wait_for_ws_url_until` | no |
| Status 42 diagnostics identical | fallback/diagnostic lane | no regression |
| Thread/fd count across repeated relaunch | **never measured** | unknown |

The quiet-writer cell deserves precision because it is the cell most easily misread as a drain defect. In that fixture the initial process exits without writing `DevToolsActivePort`, so `wait_for_devtools_active_port` sees `try_wait() == Some(status)` and returns `Err` (`952–964`); control enters the **fallback** at `886`, which builds a `BufReader` and calls `reader.lines()`. The deadline is checked *inside* the loop body, after a line is yielded (`984–990`) — a writer that holds the pipe open and writes nothing yields no line, so the deadline is never evaluated and the **caller** blocks past its own 30 s budget. The drain at `916` is never reached in that scenario. This is a pre-existing fallback defect (R0b), and it is a *caller block*, categorically different from the drain's risk, which is an *unjoined worker*. R5 names this distinction; it holds.

### 4.2 The drain's actual risk, stated exactly

`mechanism (unexecuted)`, from the code and platform semantics:

1. The daemon's read end lives **only** in the drain thread after `916` (`child.stderr` is `None` thereafter; nothing else in `browser.rs` or elsewhere reads it — grep for `stderr` in `browser.rs` returns nothing).
2. `io::copy` returns when `read` returns 0, i.e. when the **last** write end of the pipe closes.
3. Inside the ownership boundary this is guaranteed: `ChromeProcess::kill()` issues `child.kill()` then `libc::kill(-pgid, SIGKILL)` (`68–73`), and every Chrome helper is in that group by the `setpgid(0,0)` pre-exec (`854–865`). SIGKILL is uncatchable, exit closes every inherited fd, the pipe hits EOF, `copy` returns, the thread exits. `Drop` calls `kill()`, so normal close/relaunch releases the drain. On Windows the analogue is `TerminateJobObject` (`windows_process.rs:179–182`, `Drop` at `208–213`), and the parent's duplicated write handles are locals dropped at the end of `spawn`, so only the job's processes hold write ends.
4. Outside the ownership boundary it is **not** guaranteed: any process holding the inherited write end that survives the group/job kill — e.g. a descendant that `setsid`s away, or an fd passed to an unrelated process — leaves `read` blocked forever. `io::copy` has no deadline and no stop path.
5. Cost of one such escape, order-of-magnitude and **unmeasured**: 1 detached OS thread (2 MiB reserved stack by Rust default, small RSS), 1 file descriptor, 1 kernel pipe buffer (~64 KiB). It is **not** a tokio blocking-pool slot — the drain is a raw `std::thread`, not work on the `spawn_blocking` pool, so it cannot exhaust tokio's pool and the launch task returns immediately. For a long-lived daemon the binding limit is almost certainly the fd table, not threads.
6. Therefore: **no caller ever blocks on the drain**, no matter what the writer does. The failure mode is monotonic accumulation, one unit per escaped browser, silent and uncapped.

This is exactly the "do not infer a leak from detached-thread syntax alone, and do not confuse an unjoined worker with a blocked caller" instruction in R5, applied in both directions: the syntax alone proves nothing, and the release argument alone proves nothing either.

### 4.3 Where the argument is still flagged

- **K5 (Windows EOF).** The release argument on Windows needs `File::read` on an anonymous pipe to surface `ERROR_BROKEN_PIPE` as `Ok(0)` rather than an error loop. That is the expected std behaviour, but it is `mechanism (unexecuted)` and cannot be claimed from macOS (R6). Either outcome is bounded — an error also ends `copy` — so this flag sizes the confidence, not the blast radius.
- **K6 (EPIPE).** "Chrome tolerates EPIPE" is the contributor's prose (S10), unexecuted here. It matters for the fallback lane and for the spawn-failure path in §5.
- **K4 (measurement).** In-boundary flatness across repeated relaunch is asserted, never measured.

---

## 5. Does ignored spawn failure retain an unread pipe, or drop the captured reader?

**It drops the captured reader.** The pipe is not left unread-and-open, and the 64 KiB backpressure mode cannot recur through this path.

Chain, from the types (`chrome.rs:916–922`), `mechanism (unexecuted)`:

1. `child.stderr.take()` moves the handle out of the `Child` into a local binding. After this line `child.stderr` is `None` regardless of what happens next.
2. The local is moved into the closure passed to `Builder::spawn`.
3. `Builder::spawn<F, T>(self, f: F) -> io::Result<JoinHandle<T>>`. The error variant carries an `io::Error` only. The closure is consumed by the call and cannot escape through `Err`, so on failure it is dropped inside `spawn`.
4. Dropping the closure drops the captured `ChildStderr` / `File`, which closes the daemon's read end.
5. Consequence: Chrome's next stderr write fails fast (`EPIPE` / `ERROR_BROKEN_PIPE`) instead of blocking on a full pipe. That is the **same disposition the fallback lane already has**, which the comment at `913–915` already calls tolerable.

So the correct characterisation of `let _ =` at `917` is not "retains an unread pipe" and not "leaks a reader". It is:

- **zero** resource retention on failure (strictly less than success — no thread, no fd);
- **silent** degradation to a disposition whose safety rests on the unverified `K6` EPIPE claim;
- **undiagnosable**: nothing is logged, so a daemon in thread-exhaustion (`EAGAIN`) would quietly change Chrome's stderr disposition with no signal. Thread-spawn failure is rare and implies the host is already degraded.

The proportionate ask — if the parent wants one at all — is a one-line bounded warning in the file's existing style (`writeln!(std::io::stderr(), …)` as at `774` and `120`), not ownership machinery. I am not selecting it; it is an option, and "leave as-is with the failure mode written down" is a legitimate alternative.

Correction to `final-a.md`: that document listed "silent ignore of spawn failure, which degrades to today's blocking behaviour with no signal" as a structural risk. The "blocking behaviour" half is **wrong** — it degrades to the non-blocking EPIPE disposition. Only the "no signal" half survives.

---

## 6. Is requiring owned cancellation warranted, or overreach?

**My position: as a merge blocker, it is overreach. I am retracting that specific demand from `final-a.md`.** What is warranted is a *disclosed, domain-limited guarantee plus measurement*.

### 6.1 The case that it is overreach

1. **It is redundant inside the boundary the product already owns.** §4.2(3): after `kill()`, EOF is guaranteed by SIGKILL of the group / `TerminateJobObject` of the job. Cancellation would add a second mechanism to achieve what the existing ownership already achieves on every path that `Drop` takes.
2. **It is not cheap, and the cheap version does not work.** The prior probe already established that a stop flag does not unblock a `read(2)` in progress. Real cancellation needs, per platform: a self-pipe/`poll` loop or `O_NONBLOCK` + `select` on Unix; `CancelIoEx`/`CancelSynchronousIo` or overlapped I/O on Windows, which `std::io::pipe` does not provide. Closing the fd from another thread while a reader is blocked on it is an fd-reuse hazard, not a fix.
3. **That is the new runtime abstraction R7 forbids and S1 warns about.** A cross-platform cancellable reader is a materially larger surface than 19 lines, introduced to defend against an escape that has not been observed. Demanding it here would be me committing the over-reach failure I upheld as S1.
4. **The escape is out of the ownership boundary by definition.** A writer that survives SIGKILL of the owned group is, by the product's own owned-vs-attached model (R2), not a process this code claims authority over.

### 6.2 The case that it is warranted

1. The daemon is long-lived and relaunches repeatedly; the accumulation is uncapped, silent and permanent for the process lifetime.
2. The escape is not exotic. The gate's own quiet-writer fixture demonstrates a descendant holding an inherited stderr after the initial process exits. **Whether such a descendant also survives `killpg` is the untested discriminator** — if the parent's probe shows the escapee dies with the group in every realistic case, the risk is near-zero; if it survives, the count is unbounded.
3. Silence is the real defect: today a user hitting this has no counter, no warning and no way to attribute a slow fd leak to browser relaunches.

### 6.3 Domain-limited guarantee vs silently accepting a leak

R5 forbids exactly one of these three, and the distinction is the substance of this review:

| Disposition | What is claimed | R5 |
|---|---|---|
| **D-1 Domain-limited guarantee, disclosed** | "The drain terminates when every write end inside the owned process group / Job Object closes, which `kill()`/`Drop` force. A writer that escapes that boundary retains one thread and one fd for the daemon's lifetime; this is a known, stated limit of the owned-vs-attached model." Written in the code comment, backed by measured in-boundary flatness (§7 T3) and a sized out-of-boundary case (§7 T4). | satisfied |
| **D-2 Silent acceptance** | Merge as-is. The comment states only the EPIPE tolerance; out-of-boundary retention appears nowhere. A reader of the code cannot discover the limit. | **violates** "must be disclosed, not silently scoped out or accepted by implication" |
| **D-3 Engineered cancellation** | Owned, cancellable, cross-platform lifetime. Eliminates the class. Larger surface, new abstraction, Windows design work, out of the narrowed scope. | satisfied, at over-reach cost |

D-1 and D-3 are both legitimate scopes. I am **not selecting** between them — that is the parent's/Hunter's scope decision, and it is the same fork `decision.md` §118 left open. What I will say is that D-2 is ruled out by the narrowed contract itself, and that D-1's cost is one comment plus the measurements that R5 already demands, while D-3's cost is a new mechanism that R7's second sentence discourages. If the parent's measurement shows non-flatness **inside** the boundary, D-1 collapses and D-3 becomes the only option; that is the falsification condition.

---

## 7. Test and probe acceptance

### 7.1 The seam already exists — R7 needs no new abstraction

`cli/src/native/browser.rs:3321–3336` (`initialization_process`, `#[cfg(unix)]`) already builds a fake `chrome` shell script in a tempdir, parses `--user-data-dir=` out of its own argv, writes `DevToolsActivePort`, records its pid and `exec sleep 60`. `browser.rs:3390` already calls the real `launch_chrome(&options)` with it, and `3339–3362` already asserts group reaping via `kill(pid,0)`/`waitpid`. `launch_chrome` reaches the drain through the production path (`711 → 759 → 794 → 882 → 916`), and it does **not** connect to CDP, so no server is needed to exercise the drain.

This is decisive for R7: a regression is a near-clone of an existing helper. Any proposal that adds a trait, an injection point, or a `pub` testing API to make this testable should be rejected as unnecessary.

### 7.2 Required oracle property (the easy way to get this wrong)

Because `DevToolsActivePort` is written *before* the flood, `launch_chrome` returns `Ok` whether or not the drain exists. **A test asserting only that launch succeeds is worthless.** The oracle must observe the *writer's* progress:

> fake writes `DevToolsActivePort` → writes N bytes (N ≫ pipe capacity, e.g. 4 MiB) to stderr → creates a `flooded` marker file → exits.
> Test asserts the marker appears within a bounded wait after `launch_chrome` returns.

Without the drain the fake blocks in `write(2)` at ~64 KiB, the marker never appears, the test fails. With the drain the marker appears promptly. That is the "fails if the consumption mechanism is removed" property R7 demands.

### 7.3 Acceptance criteria

| ID | Item | Accept when |
|---|---|---|
| **T1** | In-tree regression, `#[cfg(unix)]`, modelled on `initialization_process` | Drives `launch_chrome` (not a helper); flood ≫ pipe capacity; oracle is the writer-progress marker of §7.2, not launch success; bounded timeout; tempdir and process cleaned up; no new production abstraction, no new `pub` API, no real Chrome, no network |
| **T2** | Byte-shape variants of T1 | Passes with (a) 1 MiB single line with **no** trailing newline, (b) invalid UTF-8 bytes interleaved, (c) many small unterminated chunks. Converts R0a's mechanical argument into evidence. Failure of any variant flips R0a to ❌ |
| **T3** | In-boundary lifecycle measurement, separate source copy | N ≥ 50 launch → kill → drop cycles in one process; fd count and thread count sampled at cycle 1 and cycle N; **flat within a stated tolerance**, not merely "no crash". Measurement method stated with its platform limit (`/dev/fd` or `/proc/self/fd`; thread count on macOS needs an out-of-process reading — declare it, do not fake portability). Fake's writer must be in the owned group, mirroring the quiet-writer case R5 names |
| **T4** | Out-of-boundary escapee probe, separate source copy | Fake spawns a session-detached quiet writer holding stderr, then the initial process exits; after readiness, kill/drop the browser; measure whether the drain thread and fd persist. **Either outcome is a pass for the probe** — its job is to size the disclosure in §6.3 D-1, not to be green. Note macOS has no `setsid(1)`; use `python3 -c 'import os; os.setsid(); …'` or equivalent |
| **T5** | Negative control | With the 19-line drain block deleted in the throwaway copy, T1 **fails** (and T3 is not claimed). Without T5, T1 is not evidence |
| **T6** | Disclosure artifact | If the parent chooses D-1, the code comment states the boundary condition (EOF requires every in-group/in-job write end to close) and the out-of-boundary retention cost. If D-3, a separate shape is opened; this gate does not authorize it |

Explicitly **not** acceptable as substitutes: a unit test on a extracted drain function that bypasses `launch_chrome`; `ps`-based thread-name matching as the only lifecycle oracle; a CLI-harness script alone (it is good corroboration, but R7 asks for a maintainable in-tree regression); any Windows or Linux claim derived from a macOS run (R6).

### 7.4 What each result changes

- T1 + T2 + T5 green → R7 ✅, R0a evidence-backed.
- T3 flat → R5's in-boundary half satisfied. T3 non-flat → the release argument in §4.2(3) is **false**, D-1 collapses, and the verdict moves toward D-3 or rejection.
- T4 shows retention → D-1's disclosure text must state it; it does not by itself block, because the writer is outside the ownership boundary the product claims.
- T4 shows no retention → the §6.2 case weakens substantially and D-1 becomes near-free.

---

## 8. Interim position

**Not a verdict.** Against the narrowed contract, K fails only R5 (measurement + disclosure) and R7 (regression). Both are additive and both are precisely the work the parent reports in progress. Nothing in this pass found a new measured defect, and two items from my broad-phase review are corrected here: the retry/session-mixing concern (refuted by K3) and the "spawn failure degrades to blocking" claim (refuted by §5 — it degrades to EPIPE with zero retention).

Contributor credit stands as written in `final-a.md`: correct root cause, correct insertion point, minimal surface, measured swing from "no response in 12 s" to three clean sessions.

Open for the parent, presented neutrally and not ranked:

1. **D-1** — disclosed domain-limited guarantee + T1/T2/T3/T4/T5 + comment text. Keeps the 19 lines.
2. **D-3** — owned cancellable lifetime as a separate shape. Larger surface, Windows design owed, conflicts with R7's second sentence if justified only by testability.
3. **Scope fork from `decision.md` §118** — narrow #1527 fix vs full spawn-to-cleanup stderr contract. Unchanged and still Hunter's to make.

Awaiting the evidence update (production-launch-path regression + repeated lifecycle measurement) before any final verdict. No Pass to detail. No production implementation authorized by this document.
