# Lifecycle resource spike, 2026-09-18

Evidence only. No gate decision and no production source fix.

## Method

New disposable workspace: `/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/resource-probe` (P below). It did not previously exist. Read scoped AGENTS.md, extracted the supplied main archive, and applied sealed Simon #1527 (+19/-0). Disposable chrome.rs equals candidate chrome.rs except for four test-module lines. The ignored internal Rust test directly calls the real `try_launch_chrome`, `ChromeProcess::kill`, and Drop; it does not reimplement the drain. Probe code is 238 lines plus four module lines.

One Python supervisor runs Cargo, observes the Rust host, receives stderr descriptors using its private Unix socket and SCM_RIGHTS, and tracks/reaps helpers. The mock advertises DevToolsActivePort without opening a network listener. It waits for a post-launch go marker, optionally writes 8 MiB of unterminated invalid-UTF-8 bytes, closes its own stderr, and writes a progress marker. A supervisor-child helper joins the mock's actual owned process group and quietly holds the write end. This intentionally tests group cleanup, not a real Chrome descendant hierarchy. The supervisor closes its received duplicate in ordinary cycles, retaining it only in the external-writer experiment.

## Direct results

Final run: macOS 26.6.2, Rust 1.98.1; one Rust host PID **33712**, 24 sequential launches, 63 samples, 6.04-second test. No daemon or test-host restart within those cycles.

Five baseline samples were identical: **2 threads, 0 drain readers, 4 fds**. The threads are main and the test harness thread. Baseline fds are stdin, stdout, stderr, and the persistent probe control socket. Observer processes and their descriptors are outside the measured host. `/bin/ps -M -p PID` counts all thread rows, including continuation rows; libproc independently supplies thread count, names, and numeric descriptors. All 63 ps/libproc totals agreed. Readers are counted by the actual `chrome-stderr-drain` thread name and corresponding extra pipe descriptors, not by child.stderr, which is already None after take().

**Owned boundary: 12 cycles.** Six quiet and six 8 MiB bursts, balanced between explicit kill-then-Drop and Drop-only. Every live sample had **3 threads, 1 reader, 5 fds**. Every first post-kill/post-Drop sample returned to **2/0/4**, with no cumulative increase. Each burst reached its progress marker after all 8,388,608 bytes were written. Recovery was observed within **5.460–7.793 ms** from the preceding live sample. These are conservative observation bounds including RPC and ps/libproc overhead, not exact EOF-to-thread-exit timings or a join guarantee.

**Outside-boundary discriminator: 12 further cycles in that same PID.** The tracked Python parent retained one duplicated stderr write descriptor per launch, outside each Chrome group. Drop returned and owned helpers died, but each cycle added exactly **1 drain thread and 1 host fd**. After the twelfth Drop, **14 threads, 12 readers, 16 fds** remained, including after an additional one-second hold. Closing the parent's twelve duplicates restored **2/0/4** by the next sample, within a conservative **7.897 ms** observation bound. Baseline remained intact after another 250 ms. This demonstrates writer-dependent reader lifetime and accumulation while writers remain open. It is synthetic ownership evidence, not evidence that normal Chrome escapes its group, and not evidence of a blocked Drop caller.

All 24 helpers had PGID equal to their corresponding mock Chrome PID and exited with SIGKILL (-9). None required supervisor-finally kills. No helper remained alive in any post-action sample. After the test, a ps query limited to all 49 recorded host/mock/helper PIDs returned exit 1 with empty output: none remained. The private socket was removed. RAII handles Chrome/profile cleanup; supervisor finally closes retained descriptors and reaps tracked helpers.

## Commands and statuses

Reproduction: `cd /Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/resource-probe && /usr/bin/python3 probe.py`.

The final wrapper executed, from `P/source/cli`, with `CARGO_TARGET_DIR=/Users/raillyhugo/Programming/vercel/agent-browser-stderr-gate/candidate/cli/target`:

`cargo test --offline --locked --bin agent-browser native::cdp::chrome::resource_probe::resource_lifecycle_spike -- --ignored --exact --nocapture --test-threads=1`

Final wrapper and Cargo: **exit 0**. Output: `1 passed; 0 failed; 1523 filtered out`; wrapper: `{"cargo_exit": 0, "samples": 63, "helpers_reaped": 24}`. Reversible write probes passed in P and at the owned canonical resources.json path. `git apply --check ../../sealed/candidate.diff && git apply ../../sealed/candidate.diff`, from P/source: exit 0.

Initial attempts, retained rather than hidden: attempt-1 had a socket registration coalescing bug (wrapper 1, Cargo 101, no launches); attempt-2 miscounted ps continuation rows (wrapper/Cargo 101, one owned cycle, RAII cleanup confirmed); attempt-3 passed all 24 cycles (wrapper/Cargo 0). Their Cargo commands were the final command above without `--bin agent-browser`. Attempt-4 passed with the binary-only command (0/0). Attempt-5 used that same command but hit a non-atomic progress-marker race after 22 launches (101/101); all 22 helpers were reaped without supervisor kills. The marker is now published by atomic rename. The final corrected run passed. The wrapper sets only CARGO_TARGET_DIR and otherwise inherits the environment.

**Preservation incident:** those initial Cargo invocations also selected filtered integration targets and refreshed the shared debug runtime. This violated the intended runtime-preservation boundary. The original executable remained cached with SHA-256 `6d24863eef6216c684527fc6c1ffe5a084479020bec67ea01e5d7627ea595ead`; a hash-guarded copy restored its exact bytes (exit 0). The final binary-only invocation left that hash unchanged. See `P/runtime-restoration.json`; this correction does not erase the initial side effect. Archive, sealed patch and candidate source hashes stayed unchanged. Post-ready and the user's real checkout were not written. No production source or gate state changed.

## Evidence and limits

Raw per-sample ps output, libproc names/fds, timestamps and helper receipts: `P/measurements.json`. Final assertions and exact PID cleanup command: `P/final-validation.json`. Test output: `P/cargo.log`. Earlier attempts: `P/attempt-{1,2,3,4,5}/`. Code: `P/probe.py` and `P/source/cli/src/native/cdp/resource_probe.rs`. Machine-readable summary: adjacent resources.json.

Finite macOS mock measurements only. No claim about Linux/Windows, real Chrome helper inheritance, startup stderr fallback, retry policy, daemon idle behavior, CDP command success, memory bounds, or temporary profiles created by default launcher options (the probe supplies owned profiles). No candidate-removal differential was run here; the parent is adding the maintainable regression separately. Counts are sequential observations, not atomic kernel snapshots. No timing bound or normal-browser escape probability follows from this spike.
