# Cancellation final B

## Verdict

**No Pass yet. Hold at shape validation, not Return to contract.** The human already settled C1: cancellation must terminate the consumer even while external writers remain open. The combined Unix wake-fd plus Windows cancellation-retry shape is practical and strongly evidenced on Unix, but native Windows termination remains unproved and its persistent-failure behavior can still wait forever.

This is not authorization to edit production, commit, merge, or publish.

## Combined shape U+W

| Part | Mechanism | Flag |
|---|---|:---:|
| U1 | `ChromeProcess` privately owns `StderrDrain`; drain owns stop state, wake/control resource, stderr reader, and `JoinHandle`. | |
| U2 | Unix sets stderr `O_NONBLOCK`; worker blocks in `poll(stderr, UnixStream wake)`, drains fixed 8 KiB chunks, and checks stop before every read. Drain Drop sets stop, shuts down wake, and joins. | |
| U3 | Unix launcher constructs the process owner before fallible drain setup, so setup errors unwind through child/group/profile cleanup. Existing kill completes child/group wait before dropping drain. | |
| W1 | Windows worker manually reads fixed 4 KiB chunks and checks an atomic stop flag before every synchronous read. | |
| W2 | Windows Drain owns the `JoinHandle`; stop borrows its thread handle, repeatedly calls `CancelSynchronousIo`, sleeps 1 ms, waits for `is_finished`, then joins. `ERROR_NOT_FOUND` is treated as a race, not completion. | ⚠️ |
| W3 | Add pinned `windows-sys` `Win32_System_IO` feature and integrate the drain with the existing `windows_process::Child` `File` and Job ownership without changing fallback authority. | ⚠️ |
| X1 | Preserve Simon Ellefsen’s post-primary-readiness insertion and byte sink; fallback, startup, retries, session semantics, and public APIs remain unchanged. | |

`PeekNamedPipe` is not an acceptable simplification: official documentation warns it may block for synchronous handles in multithreaded applications. `CancelSynchronousIo` is also only a cancellation request. The retry loop addresses the observed check-to-read race conceptually, but it has no termination proof if cancellation is unsupported, persistently denied, never completes, or the worker never finalizes.

## Evidence

macOS production-launcher spike: all 24 ordinary/external-writer kill/Drop cycles returned immediately to exact `2 threads / 0 readers / 4 fds` baseline while 1–12 external writer fds remained open. Quiet drain made one poll over 300 ms; stop/join was 69 µs. Continuous stop/join was 75 µs. Two setup-failure stages returned process/profile resources to baseline.

Exact 72-line Unix primitive on Linux aarch64: 32 quiet, 32 fixed-burst, and 32 continuous cycles; fd/task counts returned to 4/2 after every mode; all 97 children were reaped. Maximum quiet and continuous Drop observations were 552 µs and 326 µs. This is primitive runtime proof, not full Linux launcher integration.

Windows: pinned APIs and five tests cross-typecheck for x86_64-pc-windows-msvc, exit 0. They were **not linked or run**. No Windows/Wine runtime exists in the available Darwin/Linux-arm64 environment. The quiet retained-writer, delayed-entry `ERROR_NOT_FOUND`, burst, continuous, and 32-cycle tests therefore provide test design only.

The original post-ready regression is removal-sensitive; isolated-target candidate Chrome suite now passes all 55 tests and canonical verification is PASS. The earlier shared-cache failure remains excluded. That validates Simon’s base drain, not amended Windows cancellation.

## Full C0–C7 fit check

| Req | Requirement | Status | U+W |
|---|---|---|:---:|
| C0 | Consume post-primary-readiness Chrome stderr continuously as bytes, including invalid UTF-8 and unterminated bursts, so ordinary commands remain responsive. | Core | ✅ |
| C1 | Release the post-ready consumer and read descriptor on ChromeProcess kill/Drop even if a writer outside the owned process group/Job stays open; do not wait for EOF. | Must | ❌ |
| C2 | Preserve primary readiness, untouched stderr fallback/status/diagnostics, launch retry policy, attached-vs-owned distinction, group/Job/profile cleanup and daemon idle behavior. | Must | ✅ |
| C3 | Omitted flags retain session PID/target/URL/marker; explicit close/relaunch keeps existing reset semantics. | Must | ✅ |
| C4 | Bounded buffers and per-browser worker/fd costs; no default durable logs, stdout pollution, busy loop, or new public logging API. | Must | ✅ |
| C5 | Consumer lifetime belongs to ChromeProcess, not the temporary launch worker/runtime. Construction failure must not leave a launched process or capture resource without its owner. | Must | ✅ |
| C6 | The production design covers Unix and Windows using the repository’s existing child and Job interfaces; runtime verification must be stated per platform. | Must | ❌ |
| C7 | Removal-sensitive regression on the real launch path, plus same-host repeated resource accounting with retained external writers, proves the amended mechanism. | Must | ❌ |

C1 fails only on Windows proof and failure semantics; Unix passes. C6 distinguishes compile compatibility from native runtime and production Job integration. C7 lacks native Windows execution, repeated handle/thread accounting, and amended-mechanism removal sensitivity.

## S1–S13

| S | Disposition |
|---|---|
| S1 Over-reach | No hit; private post-ready cancellation only. |
| S2 Under-reach | **Open on Windows** until termination is native-proven. |
| S3 Direction inheritance | No hit; fallback remains separate. |
| S4 Proxy property | Typecheck is not treated as runtime proof. |
| S5 Unregistered peer | Addressed by owned drain and join; Windows completion unproved. |
| S6 Peer-version blindness | Pinned API compiles; host behavior remains unknown. |
| S7 Wrong layer | Unix uses real launcher; Windows standalone still needs integration. |
| S8 Guard-derived cells | External writer and race cells predate final scoring. |
| S9 Wrong test | Unix resources measured; Windows tests are not credited as run. |
| S10 Claim from prose | Official API limitations retained as blockers. |
| S11 Asymmetric consumers | No hit; fallback is untouched. |
| S12 Primitive mismatch | Unix resolved; Windows cancellation request is not completion. |
| S13 Invocation collapse | No hit; lifecycle/session semantics unchanged. |

## Exact remaining blocker

Run the five Windows tests on native x86_64 Windows, then integrate with the real `windows_process::Child`/Job launch path and demonstrate repeated retained-external-writer kill/Drop returns thread and handle counts to baseline. The test must also falsify removal and exercise `ERROR_NOT_FOUND`; persistent unsupported/denied cancellation must have a defined terminating outcome rather than an endless retry. Until that evidence and mechanism exist, C1/C6/C7 remain red and no Pass is earned.
