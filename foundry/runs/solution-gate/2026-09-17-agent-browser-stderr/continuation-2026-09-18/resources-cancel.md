# Unix cancellation mechanism spike

2026-09-18. Disposable macOS evidence for cancellation-contract.md, not a production fix, C6 validation, or gate Pass.

Workspace P: `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/resource-cancellation-probe`. Created exclusively after scoped instructions and a reversible write probe. Source is the supplied main archive plus sealed Simon #1527, with the amendments below. Earlier resource-probe remains unchanged.

## Mechanism and changed locations

Only P contains source changes. In `source/cli/src/native/cdp/chrome.rs`, ChromeProcess gains a private Unix drain owner; kill drops it after the existing child/group kill and wait, and existing Drop calls kill. The launcher constructs ChromeProcess before fallible drain setup, so setup errors unwind through process/group/profile cleanup. Primary readiness, fallback and retry logic remain the existing implementation. One existing test initializer receives the new private field.

New `source/cli/src/native/cdp/stderr_drain.rs` is 72 lines. It sets stderr nonblocking with fcntl, creates an owned UnixStream wake pair, and starts a named worker with an 8 KiB discard buffer. The worker blocks in `poll([stderr, wake], -1)`, checks an atomic stop flag before every read, and handles EOF/errors/EINTR/WouldBlock. Drain Drop sets stop, shuts down the wake socket's write direction, and joins its owned JoinHandle. There is no runtime/executor dependency, timed polling, detached worker, or new public API. Non-Unix retains the original candidate path, not a cancellation implementation.

`source/cli/src/native/cdp/resource_probe.rs` contains the ignored internal test and test-only fault injection. `probe.py` reuses the observer/mock/SCM_RIGHTS harness, with its own target and TMPDIR. No new comments. Runtime delta: `P/runtime.diff`.

## Direct evidence

First run passed: **one host PID 70169**, 76 samples, 4.95 seconds. The original 24 cycles execute in that same process; each launch happens on a short-lived, joined launch thread, while the consumer survives until its ChromeProcess owner cancels it.

Five identical baseline samples: **2 threads / 0 readers / 4 fds**. Main plus test-harness thread and stdin/stdout/stderr/control socket are baseline overhead. ps -M counts every thread row; libproc independently measures threads, reader names and fds. All 76 thread totals agreed. Measurements are sequential, not atomic snapshots.

Twelve ordinary cycles cover six quiet writers and six 8 MiB invalid-UTF-8, unterminated bursts. All burst progress markers completed. Twelve further cycles retain external duplicated write descriptors in the tracked Python parent. Each half balances six explicit kill-then-Drop and six Drop-only cycles.

Every live browser has **3 threads / 1 reader / 7 fds**: one worker and three descriptors, including both wake endpoints. Every first post-kill/Drop sample returns to **2/0/4**. In every external cycle, the parent simultaneously verifies its retained descriptors are still open with fstat, accumulating from 1 to 12. Host baseline persists after another second with all twelve writers retained; their later closure is not needed for recovery.

Two extra real-launch probes cancel just the drain before killing the browser. Chrome and its quiet helper are still alive when baseline is measured. Quiet idle: **one poll call across 300 ms, still one after join; stop+join 69 µs**. Continuous writer: poll calls rise from **415 to 20,808**, then stop+join completes in **75 µs**. The stop check inside the read loop prevents dependence on reaching WouldBlock. These are observed durations, not hard scheduling bounds; observer sampling timers are separate from the drain.

Two injected construction errors, before fcntl and after wake-pair creation/before spawn, both return baseline and remove the launcher's automatically created temporary profiles. This tests ownership unwinding, not actual OS exhaustion or thread-spawn failure.

Cleanup: **28 Chrome launches, 28 helpers reaped, all helpers SIGKILL (-9), zero supervisor cleanup kills, 28 profiles removed**, including both automatic failure profiles. No helper remains in post-cleanup samples. A final query of only the 57 recorded host/mock/helper PIDs returns exit 1 with empty output. The private socket is removed.

## Commands, isolation and limits

From P, `cp -cR ../candidate/cli/target target`: exit 0. With `CARGO_TARGET_DIR=P/target`, from P/source/cli, `cargo clean --offline -p agent-browser`: exit 0, removed 4,156 files/5.2 GiB from the copied target only.

From P, `/usr/bin/python3 probe.py`: exit 0. The wrapper sets only `CARGO_TARGET_DIR=P/target` and `TMPDIR=P/tmp`, then runs from P/source/cli:

`cargo test --offline --locked --bin agent-browser native::cdp::chrome::resource_probe::resource_lifecycle_spike -- --ignored --exact --nocapture --test-threads=1`

Cargo exit 0: **1 passed, 0 failed, 1523 filtered out**. Final artifact/cleanup/hash assertions: exit 0. No retry or failed test in this spike. The private `target/debug/agent-browser` remains absent; only the binary's test target was built. Recorded archive, sealed patch, candidate source/runtime, post-ready source and prior resource-probe hashes are unchanged. No shared target writes, real-checkout writes, parent review/manifest edits, network or credential enumeration.

Raw ps/libproc/fd/profile/process receipts: `P/measurements.json`; output: `P/cargo.log`; cleanup and preservation assertions: `P/final-validation.json`; machine-readable summary: resources-cancel.json.

Limits: synthetic mock ownership, not proof of normal Chrome escape; macOS only, no Linux/Windows runtime verification or C6 claim. No CDP/session-state, fallback, retry, idle-policy, memory/RSS, or removal-sensitive regression proof here. This is a mechanism spike, not production approval or a gate decision.
