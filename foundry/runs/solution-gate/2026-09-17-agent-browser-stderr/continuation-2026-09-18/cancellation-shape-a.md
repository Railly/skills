# Cancellation amendment — Shape A (independent)

Amendment only, no production code, no Pass. Read: `cancellation-contract.md`, my prior artifacts, `candidate/cli/{Cargo.toml,src/native/cdp/chrome.rs,src/native/cdp/windows_process.rs}`, `post-ready` test. Not read: sibling amendment, env, credentials, network. Simon's insertion point and byte-discard semantics are retained by every shape below; the amendment adds **ownership**, not a collector. No pre-ready or fallback work.

## Frozen platform facts

`libc 0.2` (unix), `windows-sys 0.52` with **Foundation, Threading, Storage_FileSystem, Security, JobObjects, StationsAndDesktops, Graphics_Gdi** — **no `Win32_System_IO`** (`CancelIoEx`, `CancelSynchronousIo`, `OVERLAPPED`, `GetOverlappedResult`) and **no `Win32_System_Pipes`** (`CreateNamedPipeW`). Windows cancellation therefore needs new *features*, not a new crate. `windows_process.rs:120` uses `std::io::pipe()` — a **synchronous** anonymous pipe, so overlapped reads on it are impossible. Job has `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` and no breakaway limit, so descendants cannot escape the job; an explicitly duplicated handle still can. `uuid` and `tempfile` are available.

## Shapes

**W — Containment only** (status quo + argument): rely on `killpg`/`TerminateJobObject`; declare out-of-boundary writers impossible. This is what the human rejected; kept as the comparison column.

**X — Waker around the existing transport.** Unix: `libc::poll` on `[ChildStderr raw fd, waker read fd]`, read on `POLLIN`, exit on waker. Windows: reader thread handle stored; cancel via `CancelSynchronousIo`.

**Y — Cancellable transport.** Windows: `CreateNamedPipeW` + `FILE_FLAG_OVERLAPPED`, `ReadFile` with `OVERLAPPED`, `WaitForMultipleObjects([io, cancel])`, `CancelIoEx`. Unix: `AF_UNIX` socketpair as the child's stderr, cancel by `shutdown(SHUT_RD)`.

**Z — Runtime-owned reader.** `tokio::io::unix::AsyncFd` + `oneshot`; no Windows equivalent.

**V = X-unix + Y-windows**, one owned `StderrDrain` type with two platform bodies.

## Fit check (C × shapes)

| Req | Requirement | Status | W | X | Y | Z | V |
|---|---|---|---|---|---|---|---|
| C0 | Consume post-primary-readiness Chrome stderr continuously as bytes, including invalid UTF-8 and unterminated bursts, so ordinary commands remain responsive | Core | ✅ | ✅ | ✅ | ✅ | ✅ |
| C1 | Release the post-ready consumer and read descriptor on ChromeProcess kill/Drop even if a writer outside the owned process group/Job stays open; do not wait for EOF | Human-settled must | ❌ | ❌ | ❌ | ❌ | ❌ |
| C2 | Preserve primary readiness, untouched stderr fallback/status/diagnostics, launch retry policy, attached-vs-owned distinction, group/Job/profile cleanup and daemon idle behavior | Must | ✅ | ✅ | ❌ | ✅ | ✅ |
| C3 | Omitted flags retain session PID/target/URL/marker; explicit close/relaunch keeps existing reset semantics | Must | ✅ | ✅ | ✅ | ✅ | ✅ |
| C4 | Bounded buffers and per-browser worker/fd costs; no default durable logs, stdout pollution, busy loop, or new public logging API | Must | ✅ | ✅ | ✅ | ✅ | ✅ |
| C5 | Consumer lifetime belongs to ChromeProcess, not the temporary launch worker/runtime. Construction failure must not leave a launched process or capture resource without its owner | Derived must | ❌ | ✅ | ✅ | ❌ | ✅ |
| C6 | The production design covers Unix and Windows using the repository's existing child and Job interfaces; runtime verification must be stated per platform | Must | ✅ | ✅ | ✅ | ❌ | ✅ |
| C7 | Removal-sensitive regression on the real launch path, plus same-host repeated resource accounting with retained external writers, proves the amended mechanism | Must | ❌ | ✅ | ✅ | ✅ | ✅ |

**Notes.** C1 is ❌ **everywhere by design of this amendment**: every cancellation leg still carries a flagged unknown, so no shape may claim it before the probes below. That is the point — the differentiator is *which single flag* each shape must clear. W is ❌ structurally, not pending. C2 ❌ for Y: on Unix, handing the child a socketpair means `Stdio::from(fd)` rather than `Stdio::piped()`, so **`child.stderr` is `None`** and the fallback at `chrome.rs:886` returns "Failed to capture Chrome stderr" — it breaks the untouched fallback, which C2 and R0b forbid. Windows is immune because `Child.stderr: Option<File>` is our own struct field (`windows_process.rs:50`). C5 ❌ for W (detached, unowned) and Z (Drop is synchronous and cannot await; runtime shutdown or blocking-thread reaping recreates the #1157 coupling the launcher already warns about at `chrome.rs:850–853`). C6 ❌ for Z: no `AsyncFd` on Windows, so the real mechanism would be Unix-only behind a common API.

## Parts

| Part | Mechanism | Flag |
|---|---|:--:|
| **V1** | `StderrDrain { handle: JoinHandle<()>, waker: Waker }` stored as a `ChromeProcess` field; `Drop for StderrDrain` signals then joins with a bounded wait | |
| **V2** | `ChromeProcess::kill()` signals the drain before `child.wait()`, so teardown never depends on EOF | |
| **V3** | Unix: `libc::poll(&mut [stderr_pollfd, waker_pollfd], -1)`; `read()` on `POLLIN`; return on waker byte or `POLLHUP`; waker is a second `std::io::pipe()` | |
| **V4** | Windows: named pipe `\\.\pipe\agent-browser-stderr-{uuid}`, `PIPE_ACCESS_INBOUND \| FILE_FLAG_OVERLAPPED \| FILE_FLAG_FIRST_PIPE_INSTANCE`; inheritable client via `CreateFileW` added to the existing allowlist at `windows_process.rs:125`; reader waits on `[ioEvent, cancelEvent]`, cancels with `CancelIoEx` + `GetOverlappedResult(…, TRUE)` | ⚠️ |
| **V5** | `Cargo.toml`: add `Win32_System_IO` and `Win32_System_Pipes` to the existing `windows-sys` feature list. No new crate | ⚠️ |
| **V6** | Failure ordering in `try_launch_chrome`: any post-drain early return drops `StderrDrain` before `terminate_launched_chrome`; RAII makes this structural, not a checklist | |
| **V7** | Regression: extend `test_stderr_drained_after_port_readiness` with a round 3 whose fixture leaks its stderr to a session-detached holder; after `drop(chrome)` assert reader count returns to baseline while that holder stays open | |
| **X4** | Windows alternative to V4: keep `std::io::pipe()`; store the reader thread handle via `JoinHandleExt::as_raw_handle`; cancel with `CancelSynchronousIo` in a bounded retry loop against `ERROR_NOT_FOUND` | ⚠️⚠️ |

## Three forward effects

1. Owned waker + bounded join (inferred) → `kill`/`Drop` stops depending on the writer (inferred) → the 12-cycle `14/12/16` accumulation in `resources.json` returns to `2/0/4` with writers still open (probe-measurable). **Harmful branch:** the bounded join adds latency to every close; if the wait expires the drain must detach *loudly*, degrading to today's behaviour with a receipt, never silently.
2. `StderrDrain` as a `ChromeProcess` field (inferred) → every early return after the drain exists must own it (inferred) → C5 holds only if RAII carries it. **Harmful branch:** a future early return placed between `916` and `933` reintroduces an unowned capture; V6 is the guard.
3. Windows transport swap (V4/V5, inferred) → the spawn allowlist and `inheritable()` duplication must carry exactly the new client handle → **harmful branch:** get it wrong and Chrome loses stderr entirely, silently disabling both the fallback and the drain; `FILE_FLAG_FIRST_PIPE_INSTANCE` also makes concurrent launches collide if the uuid is reused.

## Cheap falsifiers (probe before implementation)

- **F1 (Unix, standalone `rustc` file, no repo change):** blocked `poll`+`read` reader, external writer held open, assert return within 50 ms of the wake byte and the fd closed. Falsifies V3.
- **F2 (Windows host required):** 1000 iterations with randomised delays of `CancelSynchronousIo` against a thread blocked in `ReadFile` on a `std::io::pipe()` end; count `ERROR_OPERATION_ABORTED` vs `ERROR_NOT_FOUND`. This single number decides X4 vs V4.
- **F3 (Windows host required):** overlapped named pipe + `CancelIoEx` round trip, plus a child launched with the inherited client handle writing normally; also proves the two `windows-sys 0.52` features exist and compile.
- **F4 (10 lines, Unix):** confirm `Stdio::from(custom_fd)` leaves `child.stderr == None` — settles the C2 objection to Y-unix for the cost of one file.
- **F5 (repo-local, test-only):** V7 with the drain deleted must fail, mirroring the existing base-101 negative control.

## Recommendation and uncertainties

**Smallest practical candidate: X-unix (V3) + X4 on Windows** — roughly 40 + 25 lines, one `windows-sys` feature, no transport change, no spawn-boundary edit. It is the cheapest thing that can satisfy C1, and its whole risk is one measurable number from F2. **If F2 shows a meaningful `ERROR_NOT_FOUND` rate, V4 is the deterministic fallback** and the cost rises to the spawn boundary plus two features. I recommend running F2 before choosing; I am not selecting between X and V here.

Platform uncertainties, none resolvable from macOS: `CancelSynchronousIo` only cancels in-flight I/O (inherent race); `std::io::pipe()` cannot be read overlapped, so V4 must change the transport; exact `windows-sys 0.52` feature-to-symbol mapping unverified; Linux and Windows runtime passes remain delivery gates under C6; `libc::poll` + raw fd requires `unsafe`, and `ChildStderr` exposes no safe timed read. Contributor credit unchanged: this amends lifetime, not consumption.
