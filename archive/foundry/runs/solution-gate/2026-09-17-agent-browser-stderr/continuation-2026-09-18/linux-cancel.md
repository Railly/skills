# Linux cancellation primitive probe

Status: PRIMITIVE-ONLY TESTS SUCCEEDED. Not gate Pass, C6 validation, or production integration.

Exact command (exit 0 on corrected run):

```sh
sh /Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/unix-cancellation-probe/run.sh
```

The script records the exact Docker invocation: `--rm --pull never --network none`, image `rust:1.97-bookworm`, Linux aarch64, rustc/cargo 1.97.1. Its process-group watchdog is `timeout --signal=TERM --kill-after=5s 90s`. Inside the container:

```sh
cargo build --offline --bin writer --target-dir /probe/target
cargo test --offline --locked --lib --target-dir /probe/target -- --nocapture --test-threads=1
```

Both succeeded. Test output: `1 passed; 0 failed`, 7.68 seconds. No watchdog intervention.

The original 72-line, 2,873-byte `resource-cancellation-probe/source/cli/src/native/cdp/stderr_drain.rs` was copied byte-identically into the tiny standalone crate and imported under cfg(test). Original and copy still share SHA-256 `0e5365eb1f352641e464f316d98a5fc5c513f1dacb7a304b066bafb3da64cca3`. New Rust harness/writer: 136 lines; including shell runner: 148 lines.

Cached path dependency, mounted read-only: `/Users/raillyhugo/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/libc-0.2.189`. Probe sources were also mounted read-only. The target belongs exclusively to this probe. No network, installs, environment/credential mounts, shared targets, original source changes, detached jobs, or GitHub access.

Results, 32 cycles per mode using real `Command` child stderr:

- Quiet: child retained the same stderr pipe and remained alive 20 ms after drain Drop. Poll count stayed exactly 1 across each 100 ms idle window and join. Maximum Drop: 552 µs.
- Fixed burst: all 8 MiB writes completed and each child exited successfully. Maximum completion observation: 18 ms.
- Continuous: each writer advanced during a 50 ms window, minimum 28,114,944 additional `/proc/PID/io` wchar bytes. Maximum Drop: 326 µs, below the asserted 1-second threshold.
- After every mode, `/proc/self/fd` and task counts settled to baseline 4/2. Counts include the fd enumeration descriptor. All 97 children were RAII-reaped, including an intentional assertion-unwind check. Its caught panic is expected in the successful log. Docker container removal verified.

Initial attempt exited 101: the harness buffered its readiness byte until the quiet child exited at 60 seconds. `attempt-1.log` is retained; only writer stdout flushing was corrected.

Evidence: probe `cargo.log`, `final-validation.json`, `preservation-before.json`, `run.sh`, and adjacent `linux-cancel.json`.

Limits: Linux primitive only, not full Chrome, Job, or CLI verification. Finite scheduling observations are not hard cancellation bounds; no fault injection or watchdog-escalation validation. Parent macOS real-launcher evidence and Windows compile-only runtime blocker remain unchanged and were not rerun.
