# Frozen evidence-only input: owned Chrome stderr liveness

## Source and authority

Hunter approved isolating and solution-gating the stderr blockage discovered while investigating agent-browser. This is not approval to change production, publish, commit, push, merge, or claim the high-CPU issue fixed.

Shared base: vercel-labs/agent-browser main aff6125c023b810ea3f2e5deec5379e9a4270bdc, version 0.38.1. Verified against live main on 2026-09-17. Reviewers have independent source-only archives of this base. No candidate artifact, candidate commit, candidate description, review, or contributor implementation is an input. Do not search for one.

## Frame

Observed property violation: output produced by a locally owned browser can prevent normal browser commands from progressing. Desired outcome: managed Chrome's own stderr emission must not stall startup or ongoing commands, while existing readiness, error reporting, session continuity and cleanup remain usable.

The original unexplained 85–100% per-helper idle CPU incident remains unreproduced. This work addresses a separate, low-CPU liveness failure.

## Observed evidence

Two macOS arm64 trials per configuration, Chrome for Testing 151.0.7922.71, source-built agent-browser 0.38.1:

- Args in both sides: `--enable-logging=stderr --v=1`.
- Pipe case: `open about:blank` did not respond within the experiment's 20-second observation bound. A subsequent close did not respond within 8 seconds. The harness terminated these CLI clients, exit 143. These are harness bounds, not claimed product timeout constants.
- File-control case: the same browser args and code with fd 2 redirected to a local file before Chrome exec. Open, snapshot and close succeeded, exit 0, twice. Log size exceeded 64 KiB.
- The first pipe trial's browser main thread had all 185 native stack samples end in `write` in libsystem_kernel. This was a wall-clock stack sample, not evidence of 100% CPU. Stable group CPU was ~1.84–2.09% in pipe trials.
- All test-owned processes and temporary profiles were cleaned. The source archive's 474 files remained byte-identical.

Evidence handles, for later verification by the orchestrator (reviewers do not need the raw files):
`/Users/raillyhugo/Programming/vercel/agent-browser-1371-repro/stderr-probe-data/stderr-pipe-32313/results.json`
`.../stderr-pipe-34657/results.json`
`.../stderr-file-32045/results.json`
`.../stderr-file-34335/results.json`
`.../stderr-pipe-32313/32323.sample.txt`, lines 24–70.

The test uses an exec wrapper that preserves PID and process group, and starts an owned foreground daemon with a matching daemon configuration fingerprint. The only intentional sink difference is fd 2 destination. A smaller ordinary-CLI reproduction and same-live-process recovery have not yet been exercised. The blocking write's descriptor was not instrumented directly.

## Base-source facts (verified source, not candidate claims)

All handles relative to each reviewer's isolated base:

- `cli/src/native/cdp/chrome.rs:61–130`: existing kill, wait and Drop own Chrome group termination and temporary-profile cleanup.
- `chrome.rs:711–792`: launch retries up to three attempts; named-profile temporary-copy ownership passes to successful ChromeProcess.
- `chrome.rs:825–831`: non-Windows launch redirects stdin/stdout to null and pipes stderr.
- `chrome.rs:876–923`: each attempt has an overall 30-second deadline. Primary readiness polls DevToolsActivePort. On primary error, fallback takes child.stderr and reads the DevTools URL. Successful ChromeProcess retains the Child.
- `chrome.rs:926–983`: primary checks process exit and polls the file. Stderr fallback scans lines for `DevTools listening on ` and tests deadline inside that scan.
- `chrome.rs:985–1041`: launch errors select error/fatal/sandbox/namespace/permission/cannot/failed/abort lines; otherwise show the last five lines, or a no-output hint. Current accumulation is a Vec of strings without an explicit byte bound.
- `cli/src/native/cdp/windows_process.rs:43–51,119–172`: Windows Child exposes stderr as Option<File>, created from an anonymous pipe, and owns Job Object/process lifetime separately.
- `cli/src/native/browser.rs:511–515`: actual Chrome launch runs through Tokio spawn_blocking. `1306–1336`: only locally owned browsers receive Browser.close; attached browsers disconnect without killing the external browser.
- `cli/src/native/daemon.rs:127–203,299–352`: default idle timeout and cleanup policy live in the daemon. They are not a fix for this output-progress failure and are outside the proposed change's scope.

## Initial requirements, independent of implementation

R0 Core goal: ordinary supported Chrome logging must not prevent startup or subsequent browser commands from making progress.
R1 Must-have: preserve file-based readiness and supported stderr URL fallback; do not silently remove a documented/implemented launch path.
R2 Must-have: failed startup still returns useful Chrome diagnostics and process status, without losing all explanation in a generic timeout.
R3 Must-have: preserve same-session command continuity and normal close/relaunch behavior. Do not restart or clear a session merely because a flag is omitted on the next invocation.
R4 Must-have: a fix must not replace pipe backpressure with unbounded memory, disk, thread or descriptor accumulation. Exact retention budgets are undecided, not silently selected.
R5 Must-have: keep stdout/JSON responses clean, and do not newly forward unrestricted browser logs to the user's terminal or a global log by default.
R6 Must-have: keep existing local-vs-attached ownership, Unix group cleanup and Windows Job Object behavior. No new global browser reaper, process ownership policy, idle policy or GPU flag changes.
R7 Must-have: scope to managed Chrome's output/readiness; do not claim to fix the original sustained high-CPU incident or expand to ffmpeg/Lightpanda/provider behavior without evidence.

The exact timing budget, stderr retention/truncation policy and cross-platform implementation details remain open. Preserve useful diagnostics rather than assuming exact current unbounded text is a product requirement.

## Temporal contract

| State | Owner/scope | Initial default | Unset to set | Set to omitted | Same | Changed | Explicit clear | Reuse/restart | Observables |
|---|---|---|---|---|---|---|---|---|---|
| Local Chrome and its stdio | Owned browser lifetime within daemon | Created on managed launch | Launch owns process and streams | Ordinary commands keep same process/target | Keep | Existing launch compatibility rules apply | close ends owned browser | Do not add a new restart trigger | PID, target, URL, page marker, descriptor/thread counts |
| Browser args | Existing launcher/config contract | Existing defaults | Explicit requested args apply | Omission must not acquire a new meaning in this fix; current semantics outside scope | Preserve working reuse | Existing rules, not redesigned here | No new clearing syntax | Must-not-change set | effective args, PID and page continuity |
| Startup stderr diagnostics | Per launch attempt | Available to current fallback/error path | Browser writes logs | Continue existing attempt, no erase from a later CLI omission | Keep useful diagnostics | New attempt is separate | Owned lifecycle ends/cleans capture resources | No cross-session mixing or durable storage by default | error marker, status, bounded retained bytes, cleanup |
| Attached external browser | External browser owns lifetime | No owned child/stdout/stderr | Connect only | Reuse connection/session | Keep | Existing connection semantics | close disconnects | Never acquire kill or log-capture authority over external process | external PID remains alive |

## First isolated pass: contract only

Load Shaping. Independently reconstruct full R table with settled/derived/undecided status, observable success, must-not-change workflows, lifecycle/trust/compatibility boundaries and a discriminator matrix. Include cases where superficially plausible fixes differ: before readiness, after readiness, noisy startup failure, stderr-only readiness, split/no-newline/invalid-byte output, quiet inherited writer, close/relaunch and ordinary same-session commands. These are input-domain leads, not prescribed mechanisms.

Do not propose shapes yet. Do not read a candidate, sibling output, environment variables, credentials, auth configuration, prior agent transcripts or network sources. Use only this packet, the Shaping instructions, and your isolated source directory. Write only your contract artifact. The orchestrator will reconcile the two contracts before requesting shapes.
