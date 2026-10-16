# Direct verification

Reviewed repository: `vercel-labs/agent-browser`

Base: `118af8eef1eebe21b949c3cf677d468330da7a46`

Head: `ae889c7d8d6a069971bb134ce7be790c91838313`

Isolated checkout: `/tmp/review-gate-agent-browser-1749.X6gErs/repo`

Environment: macOS 26.6.2 arm64, rustc 1.98.0, cargo 1.98.0.

## Exact-state checks

- Detached checkout HEAD matched the frozen head before and after execution.
- Checkout status remained clean.
- GitHub PR head and base matched the frozen SHAs before and after execution.
- Changed paths digest: `sha256:a975df85939e68c0e3c4ba622b10e4a1f4e24fd85dd22563c7ebb4db0d3f5483`.
- Diff digest: `sha256:a5b50a6cfd03331b3774e3a576722d7aa1de76071be61d56f27d5acee71fbc6c`.

## Build and test evidence

- `cargo fmt --check`: pass.
- `cargo clippy -- -D warnings`: pass.
- Full Rust tests: 1,188 passed, 105 ignored, 0 failed.
- `gate.sh style`: pass.
- `gate.sh timings`: pass.
- `gate.sh siblings session_busy`: pass.
- `gate.sh surfaces`: finding. `skill-data/core/references/commands.md` was required by the surface map and absent from the diff.
- Radius Impact Map completed with 71 changed symbols. Visibility boundary: 2,451 unresolved calls and 81 SCIP-unmapped symbols, so it is attention guidance only.

## Built-artifact probes

### Unvalidated PID termination

A namespaced exact-head daemon was started and its advisory owner lock remained held by the real daemon. The diagnostic PID sidecar was then changed to the PID of a separate `sleep` process. `agent-browser close --all` could not reach the session endpoint, entered the fallback at `cli/src/main.rs:1268-1285`, killed the unrelated `sleep`, and left the real lock owner alive.

This proves that `walk_daemons` returning a PID and a held ownership lock do not cause `run_close_all` to validate that the PID is the lock owner before sending `SIGKILL`. The same raw-PID signaling pattern exists in `cli/src/connection.rs:839-883`.

### Dropped close client strands the daemon

A namespaced exact-head daemon received a valid raw `close` request over its Unix socket, then the client disconnected before reading the response. Browser cleanup completed, but `writer.write_all` failed at `cli/src/native/daemon.rs:982-984`, so the connection task skipped `close_notify` at lines 986-995.

The daemon process, Unix socket, PID sidecar, and ownership lock remained. Normal requests returned `session_closing`. A second close request replayed the terminal response and allowed the daemon to exit.

### Cancellation publication race

Direct source and dependency verification confirmed the race:

- A normal command checks `is_closing` at `cli/src/native/daemon.rs:491`, takes the state guard at line 512, checks again at line 515, and subscribes only at line 526.
- `begin_closing` publishes with `watch::Sender::send(true)` at line 424.
- Tokio 1.53.1 documents and implements that `send` returns an error and does not retain the value when the receiver count is zero. `send_replace` is the retained-publication operation.

A close that wins in the gap before subscription can discard its cancellation signal, then wait forever on the state guard held by the uncancelled command. The Vercel Agent Review independently reported the same exact-head race.

## Candidate dispositions

- `cli/src/native/recording.rs:117,201-208`: unverified medium candidate. The PR changes from `wait_with_output` to `wait` while stderr remains piped, then converts the two-second timeout into a successful `Ok(())`. The pipe-fill and silent-truncation mechanism is credible, but a long real recording or controlled pipe-fill producer was not executed.
- `cli/src/native/daemon.rs:545-552`: unverified medium candidate. Concurrent close waiters have a seven-second ceiling while graceful close can consume five seconds and the forced provider, WebDriver, and Appium cleanup path can add sequential two-second waits. A delayed-backend substrate was unavailable.
- Normal `confirm` and `deny` can receive `session_busy`: reviewed as an advertised compatibility consequence, not elevated without a reproducer showing a broken confirmation flow.
- Five-second empty-marker grace: reviewed as a narrow, self-healing startup window. No sustained failure was confirmed.

## Specialist receipt boundary

No exact-head Test Strength, Resilience Audit, or Security Review receipt was available. The checks and probes above are Review Gate evidence only and do not synthesize any specialist pass.
