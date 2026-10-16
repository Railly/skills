# Windows cancellation compile-only spike

2026-09-18. Typecheck succeeded; native tests NOT RUN. Not production, not Solution Gate Pass. Simon Ellefsen retains credit for #1527's underlying post-ready byte drain; this isolated experiment investigates owned cancellation only.

## Artifact and check

Standalone crate: `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/windows-cancellation-probe`. Windows implementation plus tests: 172 physical lines in `src/lib.rs`, no added Rust comments. Fixed 4096-byte buffer, one owned reader thread, no accumulated logs. Cargo pins cached `windows-sys = "=0.52.0"` with `Win32_Foundation` and `Win32_System_IO`; generated lockfile retained.

From that directory:

```sh
cargo check --offline --target x86_64-pc-windows-msvc --tests --target-dir target
```

Exit 0, final output: `Finished dev profile [unoptimized + debuginfo] target(s) in 0.52s`. Full output: `typecheck.log`. Rust/Cargo 1.98.1. Only the probe's private `target/` was used. This checks test code but does not link a Windows executable or execute tests.

## Types and mechanism

Compiler confirms `JoinHandle<io::Result<usize>>: AsRawHandle`, returning Windows `RawHandle` (`*mut c_void`), cast to windows-sys `HANDLE` (`isize`). An explicit function-pointer assertion checks `CancelSynchronousIo: unsafe extern "system" fn(HANDLE) -> i32` (BOOL). `std::io::pipe()` reader converts through `OwnedHandle` into `File`, matching candidate `windows_process.rs`; that candidate separately owns its Job. Candidate Cargo.toml currently lacks `Win32_System_IO`. Neither candidate file was modified.

The worker checks `Arc<AtomicBool>` before every manual read. Stop sets it, borrows the owned JoinHandle's thread handle, repeatedly requests cancellation with 1 ms sleeps until `is_finished()`, then joins. `ERROR_NOT_FOUND` does not mean completion: the reader may have passed its stop check without entering the synchronous read yet. Successful cancellation requests likewise do not trigger an immediate blocking join. Unexpected cancellation errors are retained and returned only after joining; Drop cannot report them.

## Native tests: all NOT RUN

- Quiet writer retained across stop.
- Deterministic gate after the stop check: require `ERROR_NOT_FOUND`, release read entry, keep cancelling until completion.
- 128 KiB invalid-UTF-8, unterminated burst with retained writer.
- Continuous invalid-byte writer stopped during traffic.
- 32 repeated Drop cycles with writers kept open until Drop returns.

Each test has a coordinator and completion channel with `recv_timeout(5s)`; internal handshakes use 2 seconds. Timeout/disconnection aborts the whole test process, rather than unwinding into a hung Drop or reporting success after detaching. Successful paths join workers. This bounds ordinary test hangs, not pathological OS scheduling or thread-finalization failures.

## Unresolved boundary and handoff

Cancellation is a request, not completion. The primitive has no proven finite stop/Drop bound if cancellation is unsupported, persistently denied, never completes, or the worker never schedules. Repeated `ERROR_NOT_FOUND` also has no retry ceiling. Rust `is_finished()` does not establish a hard OS thread/TLS-finalization deadline. No leaked-worker detachment workaround is used. The 5-second harness abort is test containment, not a production C1 solution.

Concrete parent blocker: this Darwin host has no Windows runtime/Wine; Linux aarch64 Docker cannot execute MSVC Windows tests. Need a Windows x86_64 host/VM/runner with Rust and MSVC linking support. There, run:

```sh
cargo test --offline --locked --target x86_64-pc-windows-msvc --target-dir target -- --test-threads=1
```

This command is NOT RUN. Then obtain real launcher/Job integration, removal-sensitive regression, repeated handle/thread accounting, and cross-platform evidence for C1/C6/C7. Pipe-only cycles are not resource-accounting proof.

Read cancellation-contract.md and the specified candidate sources; no sibling shape reports, network, installations, credentials/environment inspection, or source-cache edits. Git inspection was unavailable for the external snapshots; the attempted diff compared unrelated files and is excluded as verification. Registry/index writes were excluded by the assigned ownership scope.

Official references supplied by parent, not fetched: [CancelSynchronousIo](https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelsynchronousio) marks pending I/O without waiting; [PeekNamedPipe](https://learn.microsoft.com/en-us/windows/win32/api/namedpipeapi/nf-namedpipeapi-peeknamedpipe) may block on synchronous handles in multithreaded applications. No PeekNamedPipe strategy is used.
