# Cancellation shape amendment B

## Context

This is a post-reveal amendment. Simon Ellefsen’s post-primary-readiness byte drain remains the useful core, and the removal-sensitive regression is established. The human decision now rejects EOF as the consumer lifetime boundary: `ChromeProcess` kill/Drop must release the reader even while an external writer remains open.

Current source gives `ChromeProcess` only `Child`; the drain `JoinHandle` is discarded. Unix has `libc`; Windows `Child` exposes stderr as `Option<File>` created by `io::pipe()` and owns the Job. Existing dependencies include standard threads/sync, Tokio, `libc`, and `windows-sys`; no collector crate is available or needed.

## A: Owned availability-driven drain

| Part | Mechanism | Flag |
|---|---|:---:|
| **A1** | Add private `StderrDrain` to `ChromeProcess`: stop control plus `JoinHandle`. It owns the post-ready stderr reader; no bytes are retained. | |
| **A2-U** | Unix worker sets stderr nonblocking and uses `libc::poll` on stderr plus a private wake fd. Read raw chunks while readable; stop wake wins without EOF. | |
| **A2-W** | Windows worker uses `PeekNamedPipe` on the existing `File`, reads at most the reported available bytes, and waits with timeout on a stop `Condvar` when empty. With one reader, no other consumer can remove the reported bytes before `Read`. | ⚠️ |
| **A3** | `ChromeProcess::kill` terminates/waits for child and group/Job, then signals drain stop and joins it. `StderrDrain::Drop` repeats stop/join idempotently as construction/unwind protection. | |
| **A4** | Drain construction returns `Result<StderrDrain, String>`. If control creation or thread spawn fails after Chrome launched, drop the reader, terminate the launched Chrome tree, clean its temporary profile, and return launch failure. | |
| **A5** | Fallback stays unchanged: it has already taken stderr, so no post-ready drain is constructed. No runtime/public logging API is added. | |

A2-W requires confirming the exact `windows-sys` module/feature for `PeekNamedPipe`; current features do not visibly include `Win32_System_Pipes`. Enabling another feature of the already pinned dependency may suffice, but that and anonymous-pipe behavior must be compiled and run on Windows. The idle timeout trades read latency against wakeups; the `Condvar` makes teardown immediate, but incoming data itself cannot notify it.

## B: Event-driven native cancellation

| Part | Mechanism | Flag |
|---|---|:---:|
| **B1** | Same private `StderrDrain` ownership, fallible construction, kill/Drop stop, and join semantics as A. | |
| **B2-U** | Unix uses nonblocking stderr plus `poll` on stderr and a wake fd. | |
| **B2-W** | Change only the private Windows capture boundary: create an overlapped-capable named-pipe pair, inherit only the writer into Chrome, and retain the reader plus read event and stop event. Worker waits for read completion or stop; stop cancels pending I/O, then joins and closes handles. | ⚠️ |
| **B3** | `windows_process::Child::spawn` still atomically assigns Chrome to its Job and returns `stderr: Option<File>` or a private capture type with equivalent `Read` support for fallback. | ⚠️ |
| **B4** | Post-ready data is discarded in fixed chunks. Fallback retains its existing blocking `BufReader` behavior and diagnostics. | |

B removes periodic idle wakeups and gives Windows a real waitable cancellation event. It is larger because `io::pipe()` does not express overlapped creation: exact `CreateNamedPipe`/`CreateFile`, `OVERLAPPED`, `CancelIoEx`, inheritance, fallback compatibility, and required `windows-sys` features need a Windows spike. It must not leak this platform machinery into public interfaces.

## C: Owned drain subprocess

| Part | Mechanism | Flag |
|---|---|:---:|
| **C1** | After primary readiness, transfer the stderr reader to a private helper process that copies bytes to its sink. `ChromeProcess` owns that helper process handle. | ⚠️ |
| **C2** | kill/Drop terminates and waits for the helper regardless of EOF, so an external writer cannot retain a daemon thread or reader fd. | |
| **C3** | Unix passes one inherited fd; Windows duplicates/allowlists the reader into the helper. Launch is transactional: helper-transfer failure terminates Chrome and closes all capture handles. | ⚠️ |
| **C4** | Helper has no logs, persistence, parser, network, or public mode; fallback remains in-process and untouched. | ⚠️ |

C makes forced cancellation mechanically strong but adds one OS process per owned browser, private executable-mode wiring, cross-platform handle transfer, and another process cleanup policy. Its cost is bounded, yet disproportionate unless thread cancellation proves unreliable.

## Full C × shape fit check

Flagged mechanisms fail binary fit until resolved.

| Req | Requirement | Status | A | B | C |
|---|---|---|:---:|:---:|:---:|
| C0 | Consume post-primary-readiness Chrome stderr continuously as bytes, including invalid UTF-8 and unterminated bursts, so ordinary commands remain responsive. | Core | ❌ | ❌ | ❌ |
| C1 | Release the post-ready consumer and read descriptor on ChromeProcess kill/Drop even if a writer outside the owned process group/Job stays open; do not wait for EOF. | Must | ❌ | ❌ | ✅ |
| C2 | Preserve primary readiness, untouched stderr fallback/status/diagnostics, launch retry policy, attached-vs-owned distinction, group/Job/profile cleanup and daemon idle behavior. | Must | ✅ | ❌ | ❌ |
| C3 | Omitted flags retain session PID/target/URL/marker; explicit close/relaunch keeps existing reset semantics. | Must | ✅ | ✅ | ✅ |
| C4 | Bounded buffers and per-browser worker/fd costs; no default durable logs, stdout pollution, busy loop, or new public logging API. | Must | ✅ | ✅ | ✅ |
| C5 | Consumer lifetime belongs to ChromeProcess, not the temporary launch worker/runtime. Construction failure must not leave a launched process or capture resource without its owner. | Must | ✅ | ✅ | ❌ |
| C6 | The production design covers Unix and Windows using the repository’s existing child and Job interfaces; runtime verification must be stated per platform. | Must | ❌ | ❌ | ❌ |
| C7 | Removal-sensitive regression on the real launch path, plus same-host repeated resource accounting with retained external writers, proves the amended mechanism. | Must | ❌ | ❌ | ❌ |

C0 is red for all because each new Windows read mechanism remains unproven under sustained over-capacity output; Simon’s existing EOF drain does not prove the amendment. C1 is conceptually strongest in C, but its transfer path remains flagged under C5/C6. No shape earns Pass.

## Practical smallest candidate

**A is the smallest candidate to falsify first.** It preserves `windows_process.rs` Job authority and existing `File` boundary, adds only private lifecycle ownership, and avoids pre-ready diagnostics or a generic collector. It is not selected until A2-W is resolved and measured.

Cheap falsifiers:

1. **A/Windows API spike:** against the existing `io::pipe()` reader, prove `PeekNamedPipe` plus bounded reads drains repeated multi-megabyte invalid/no-newline bursts, stays low-wakeup while quiet, and stop/join completes with an external duplicate writer held open. Compile against the pinned `windows-sys` configuration.
2. **A/Unix lifecycle:** adapt the established same-host probe so 12 externally retained writers remain open while each kill/Drop returns drain thread/fd counts immediately to baseline. Include quiet and continuous writers; sample idle CPU to reject a polling loop.
3. **B spike only if A fails:** prove overlapped pipe inheritance, fallback `Read`, stop-event cancellation, and Job teardown in one minimal Windows test before touching launcher design.
4. **C rejection probe only if native cancellation fails:** measure helper startup/teardown and demonstrate transactional fd/handle transfer. Reject if it needs a public CLI mode or alters daemon ownership.

## Three forward effects for A

1. Primary readiness succeeds → `StderrDrain` takes the reader → availability-driven raw reads discard all post-ready bytes → pipe capacity no longer stalls Chrome commands.
2. `ChromeProcess` kill/Drop → owned Chrome tree terminates → stop control wakes the worker independently of EOF → worker drops reader and join returns → external writer sees closure but retains no daemon thread/fd.
3. Control/thread construction fails → reader closes → launched Chrome tree is terminated and waited → temporary resources clean up → no ownerless process, worker, or capture survives the failed attempt.

Parent should probe these claims before implementation. This amendment grants no production, merge, or publication authorization.
