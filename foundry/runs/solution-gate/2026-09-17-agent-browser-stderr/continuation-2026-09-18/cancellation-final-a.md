# Cancellation amendment — Final A

Read: `resources-cancel.{md,json}`, `linux-cancel.{md,json}`, `windows-cancel.{md,json}`, `resource-cancellation-probe/source/cli/src/native/cdp/stderr_drain.rs` (72 lines, sha `0e5365eb…`), prior artifacts. Not read: sibling shapes, env, credentials, network. No commands, tests, or edits. Lifetime boundary is human-settled (**Cerrar también ese límite**); this is not a Return to contract, and a typecheck is not a Pass. Simon retains credit for the underlying post-ready drain.

**Prototype under review:** Unix waker (`poll([stderr, wake], -1)`, `O_NONBLOCK` stderr, atomic stop checked before every read, `Drop` = stop → `shutdown(Write)` on the `UnixStream` pair → `join`) integrated into the **real launcher** and measured on macOS; the byte-identical primitive re-run on Linux aarch64; plus a **separate, unintegrated** Windows `CancelSynchronousIo` retry primitive that only typechecks.

## Fit check (C × prototype)

| Req | Requirement | Status | Prototype |
|---|---|---|---|
| C0 | Consume post-primary-readiness Chrome stderr continuously as bytes, including invalid UTF-8 and unterminated bursts, so ordinary commands remain responsive | Core | ✅ |
| C1 | Release the post-ready consumer and read descriptor on ChromeProcess kill/Drop even if a writer outside the owned process group/Job stays open; do not wait for EOF | Human-settled must | ❌ |
| C2 | Preserve primary readiness, untouched stderr fallback/status/diagnostics, launch retry policy, attached-vs-owned distinction, group/Job/profile cleanup and daemon idle behavior | Must | ✅ |
| C3 | Omitted flags retain session PID/target/URL/marker; explicit close/relaunch keeps existing reset semantics | Must | ✅ |
| C4 | Bounded buffers and per-browser worker/fd costs; no default durable logs, stdout pollution, busy loop, or new public logging API | Must | ✅ |
| C5 | Consumer lifetime belongs to ChromeProcess, not the temporary launch worker/runtime. Construction failure must not leave a launched process or capture resource without its owner | Derived must | ✅ |
| C6 | The production design covers Unix and Windows using the repository's existing child and Job interfaces; runtime verification must be stated per platform | Must | ❌ |
| C7 | Removal-sensitive regression on the real launch path, plus same-host repeated resource accounting with retained external writers, proves the amended mechanism | Must | ❌ |

**C0 ✅** — macOS: 6 quiet + 6 × 8 MiB invalid-UTF-8 unterminated bursts, all progress markers completed; Linux: 32 cycles/mode, continuous writers advancing ≥28,114,944 bytes.

**C1 ❌ — Unix satisfied, Windows not.** macOS real launcher: live `3 threads / 1 reader / 7 fds` → `2/0/4` after **every** kill/Drop while 1–12 external duplicated write fds stayed open and were `fstat`-verified open at each Drop; baseline held a further second without closing them. Direct stop with the browser and its quiet helper still alive: quiet **69 µs** (poll count 1 across 300 ms, still 1 after join), continuous **75 µs** (415 → 20,808 polls). Linux: max Drop 552 µs quiet / 326 µs continuous, fds and tasks back to `4/2` after every mode, 97 children reaped. That is release without EOF, exactly as C1 demands — on Unix. Windows keeps the **original detached candidate path** in production, so C1 is unimplemented there.

**C2 ✅** — readiness, fallback, retry untouched; only `ChromeProcess`, `kill`, and post-ready construction changed, plus one test initializer. Note the 55 passing Chrome tests belong to the **candidate**, not this prototype; they must be rerun against it.

**C4 ✅** — 8 KiB buffer, one worker, +3 fds live (stderr + both wake ends), no timed polling. One poll call across a 300 ms idle window is positive evidence of no busy loop.

**C5 ✅** — strongest cell. `ChromeProcess` constructed **before** fallible drain setup, so both injected setup faults (before `fcntl`; after wake-pair, before spawn) unwound through process/group/profile cleanup and returned to baseline; 28 launches, 28 helpers reaped (all −9), 28 profiles removed, 0 supervisor kills.

**C7 ❌** — the existing removal-sensitive regression covers C0 only. Cancellation evidence lives in `#[ignore]`d internal spikes and a standalone crate, not a maintainable regression; no Windows accounting at all.

## C6: three distinct gaps, only one is a runtime gap

1. **Design coverage — failing now.** Non-Unix "retains the original candidate path, not a cancellation implementation." A single API where only Unix cancels is precisely the Unix-only-behind-a-common-API that C6 forbids. The Windows primitive is a separate crate, never wired to `windows_process.rs`'s `Child`, and `candidate/cli/Cargo.toml` still lacks `Win32_System_IO`.
2. **Termination bound — failing by design, not by missing hardware.** `CancelSynchronousIo` is a *request*, not completion; `ERROR_NOT_FOUND` means the reader had not yet entered the read, and the retry loop spins until `is_finished()` with **no ceiling**; `is_finished()` is not an OS thread/TLS-finalization deadline. So there is no finite stop/Drop bound if cancellation is unsupported, denied, or never completes. **Running the five tests on Windows cannot fix this** — a green run would show the happy path, not a bound. The official `PeekNamedPipe` warning (may block on synchronous handles in multithreaded applications) also removes the cheap "peek before read" escape, correctly unused here.
3. **Runtime verification — failing, host-limited.** `cargo check --target x86_64-pc-windows-msvc --tests` exit 0 in 0.52 s, **not linked, not run**; no Windows/Wine on Darwin and Linux arm64 Docker cannot execute MSVC tests. Typecheck proves `JoinHandle<io::Result<usize>>: AsRawHandle` and the `CancelSynchronousIo` signature — type facts, not behaviour.

macOS is verified on the real launcher; Linux is verified **primitive-only**, not the launcher; Windows is unverified. C6 requires all three stated, and they are.

## S1–S13

S1 upheld: cancellation only, no collector. S2 n/a, pre-ready fenced out. S3 upheld: fallback untouched. S4 upheld: release measured with writers provably open, not inferred from EOF. S5 **resolved on Unix**: the peer now has an owner, a stop and a join. S6 upheld: no Windows runtime claim. S7 upheld: diagnostics unchanged. S8 upheld: quiet, burst, continuous, external-retained and fault cells all exercised. S9 partly unmet: C7 regression still missing. S10 open: Windows behaviour rests on documentation, not execution. S11 upheld: discard-only, no parsing. S12 upheld: Linux primitive success is not launcher success, and typecheck is not runtime. S13 upheld: continuity untouched.

## Verdict

**Unix leg: accept the mechanism.** C1 is met on Unix with real-launcher evidence, and C5 is met structurally. I would route the Unix implementation to detail.

**Overall: Pass to detail withheld.** Not Return to contract — the lifetime question is settled and the shape answers it. The gate stops on one blocker.

**Exact remaining blocker — C1/C6 on Windows, in three parts that must all close:**

1. **Design:** define a *finite* stop policy. Options, neutrally: (a) bounded cancel attempts / deadline, then loud, receipted detachment that reports the degradation instead of hiding it; (b) overlapped named pipe + `CancelIoEx` (race-free, needs `Win32_System_IO` + `Win32_System_Pipes` and touches the spawn allowlist); (c) keep unbounded retry and accept no proven bound — which contradicts C1 as written. I am not selecting.
2. **Integration:** wire the chosen mechanism into `windows_process.rs`'s `Child`/Job and add the Cargo feature; today nothing in the production path cancels on Windows.
3. **Runtime + C7:** on an x86_64 Windows host with MSVC, run the five NOT-RUN tests plus launcher/Job integration, then a removal-sensitive regression and repeated handle/thread accounting with retained external writers, on all three platforms.

No production edit, no merge, no Pass authorized here.
