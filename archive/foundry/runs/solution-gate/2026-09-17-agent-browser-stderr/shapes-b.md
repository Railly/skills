# Blind Shapes B: Owned Chrome stderr liveness

## Source constraints

Chrome pipes stderr, polls DevToolsActivePort first, then uses stderr fallback under one 30-second attempt deadline (`chrome.rs:825–904`). Fallback is line/UTF-8 dependent with an unlimited `Vec<String>` (`chrome.rs:958–1041`). `ChromeProcess` owns `Child` and cleanup (`chrome.rs:13–24,61–130`); Windows exposes the same `Option<File>` boundary beside Job Object ownership (`windows_process.rs:43–51,119–181`). Launch runs in `spawn_blocking` (`browser.rs:501–518`).

## A: Lifetime synchronous output pump

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Immediately take each launched child’s stderr and start one attempt-owned blocking worker that continuously reads byte chunks. | |
| A2 | Parse complete newline-delimited readiness records incrementally across chunks. Preserve a completed URL event separately; invalid diagnostic bytes render lossily and oversized unterminated records are consumed/discarded without stopping. | |
| A3 | Keep an internal fixed 256 KiB budget: 192 KiB rolling diagnostic tail plus 64 KiB error/sandbox excerpts. Record dropped-byte/record counts and emit an explicit truncation notice in launch errors. No public setting. | |
| A4 | Keep DevToolsActivePort primary. The launch coordinator polls the file/process as today and consults the worker’s completed stderr URL/error snapshot for fallback, all against the existing attempt deadline. | |
| A5 | Transfer worker ownership into `ChromeProcess` on success so draining continues after readiness. Keep retries isolated. | |
| A6 | Worker uses bounded platform polling plus a private stop signal, not blocking line/EOF completion. Kill/close signals stop and joins it; inherited writers cannot retain the worker. Unix process groups and Windows `Child`/Job ownership remain unchanged. | ⚠️ |

A6 lacks proof that Windows anonymous-pipe reads can be cancelled without changing `Child`/Job ownership.

## B: Tokio-integrated asynchronous drain

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Convert stderr into a runtime-readable stream and run one async drain task per attempt, using A2/A3 parsing and retention. | ⚠️ |
| B2 | Race file readiness, process status, stderr events and the existing attempt deadline in async coordination. | |
| B3 | Store cancellation/task ownership with the browser manager so drain coverage continues after `spawn_blocking` returns. | ⚠️ |
| B4 | On close/failure, cancel and await the task before releasing attempt state. | ⚠️ |

Flags: stderr is synchronous `File`; Windows is not runtime-registerable as shown. Synchronous `ChromeProcess` cleanup crosses async task ownership.

## C: Owned collector sidecar

| Part | Mechanism | Flag |
|---|---|:---:|
| C1 | Spawn one private internal collector process per attempt; Chrome stderr goes to it, and it continuously maintains A2/A3 bounded state. | |
| C2 | Parent receives only bounded readiness/diagnostic messages over a control channel; DevToolsActivePort stays primary and the 30-second deadline stays authoritative. | |
| C3 | Collector persists for the owned Chrome lifetime and is explicitly stopped on failure/close/retry. No durable or global log. | |
| C4 | Supervise collector failure so Chrome can never continue writing into an undrained pipe or silently lose required fallback diagnostics. | ⚠️ |
| C5 | Preserve atomic Windows Chrome Job assignment and Unix Chrome group semantics while separately owning/reaping the collector. | ⚠️ |

Flags: post-readiness collector failure and cross-platform handle/process ownership are unresolved.

## Full fit check

| Req | Requirement | Status | A | B | C |
|---|---|---|:---:|:---:|:---:|
| R0 | Log-output volume must not backpressure a managed Chrome launch before readiness or prevent commands after readiness | Core | ✅ | ❌ | ❌ |
| R1 | Preserve DevToolsActivePort as primary readiness and the existing DevTools listening on stderr detection/fallback semantics; do not silently remove either | Must | ✅ | ❌ | ❌ |
| R2 | Failed startup preserves process status and useful bounded Chrome diagnostics; exact unlimited output is not promised | Must | ✅ | ❌ | ❌ |
| R3 | Ordinary same-session commands retain PID, target, URL and application state; no new restart/clear semantics from omitted flags | Must | ✅ | ✅ | ✅ |
| R4 | Logging handling has finite byte/storage and per-launch thread/descriptor costs; does not block lifecycle completion on an inherited writer staying open | Must | ❌ | ❌ | ❌ |
| R5 | stdout/JSON schema remains clean; no default forwarding of unlimited browser logs to terminal or durable global storage | Must | ✅ | ✅ | ✅ |
| R6 | Preserve owned-vs-attached distinction, group/Job Object and profile cleanup, existing retry and idle policy | Must | ❌ | ❌ | ❌ |
| R7 | Scope is Chrome output/readiness, not original CPU spin, ffmpeg, Lightpanda, providers, general CDP timeout redesign or a new reaper | Must | ✅ | ✅ | ✅ |
| R8 | Arbitrary chunks, long/no-newline diagnostics and invalid bytes do not cause the consumer to stop servicing output or grow without bound | Derived | ✅ | ❌ | ✅ |
| R9 | Any new output wait/cleanup path respects the existing attempt deadline without waiting indefinitely for a line or EOF | Derived | ❌ | ❌ | ✅ |
| R10 | Output handling follows browser/attempt lifetime, not a temporary Tokio launch worker, and does not mix retries or sessions | Derived | ✅ | ❌ | ❌ |

Notes: every requirement dependent on a flag fails. A fails R4/R6/R9 pending Windows cancellation proof. B fails R0–R2/R4/R6/R8–R10 pending stream registration and task cleanup. C fails R0–R2/R4/R6/R10 pending collector supervision and ownership.

## Recommendation

Advance A only for discriminator work. It retains the `File` seam, keeps ownership in `ChromeProcess`, and names finite diagnostics. It is not selectable until A6 clears D7 and Windows design review; mandatory requirements still fail.

## Mechanism-linked forward effects

1. A adds one worker and stop primitive per owned Chrome. Healthy branch: stable finite counts. Harmful branch: failed cancellation leaks one thread/descriptor per relaunch and eventually recreates resource exhaustion.
2. A3 bounds memory and exposes truncation. Healthy branch: tail plus classified excerpts preserve actionable failures. Harmful branch: classification misses an early novel diagnostic, leaving only tail/truncation notice and degrading R2.
3. A4 records stderr readiness concurrently but keeps file precedence. Healthy branch: split complete markers survive later fallback. Harmful branch: accepting partial/oversized records as URLs connects incorrectly, or delaying fallback beyond the existing deadline hides a lifecycle bug.

## Cheapest discriminator probes

| Probe | Falsifies |
|---|---|
| Pure parser test: every split point of a valid marker; invalid bytes; >256 KiB burst; long unterminated record; assert bounded state and truncation accounting | A2/A3, B1, C1 |
| Fake executable wrapper: burst beyond pipe capacity before real Chrome exec, then sustained post-readiness burst; verify D2/D3 continuity | Any startup-only drain or late worker |
| Failure wrapper: noisy error plus exit status, and separately a quiet inherited writer; verify useful bounded error and bounded worker teardown | A6, B4, C4; D4/D7 |
| Repeated launch/close loop: compare PID/page markers and thread/descriptor counts across retries/relaunches | R3/R4/R10 leaks or mixing |
| Windows source harness around current `Child::stderr`: prove stop interrupts quiet open pipe without altering Job ownership; runtime pass remains delivery-gated | A6 versus B1/B4/C5 |
