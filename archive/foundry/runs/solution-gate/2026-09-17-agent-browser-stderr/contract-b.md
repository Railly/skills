# Contract B: Owned Chrome stderr liveness

## Evidence basis

Contract-only review of frozen packet and isolated 0.38.1 source. The archive has no Git metadata, so `aff6125…` is accepted from packet lines 3–7; version is corroborated by `cli/Cargo.toml:1–4`. The demonstrated violation is pipe backpressure, not sustained CPU: pipe commands exceeded harness bounds while file-control commands passed and Chrome sampled in `write` (packet 17–23, 32–33).

## Requirements (R)

| ID | Requirement | Status | Observable success |
|---|---|---|---|
| R0 | Supported managed-Chrome logging cannot prevent startup or later commands from progressing. | Settled, core | Under output beyond pipe capacity, launch and ordinary commands complete within the selected contract bound. |
| R1 | Preserve DevToolsActivePort readiness and stderr-only `DevTools listening on` fallback. | Settled, must | Either readiness source can establish a usable CDP session. |
| R2 | Failed startup reports process status plus useful Chrome diagnostics, not only a generic timeout. | Settled, must | Early exit/status and retained diagnostic marker(s) appear in the returned error. |
| R3 | Preserve same-session continuity and normal close/relaunch; omission of launch flags on a later command gains no reset meaning. | Settled, must | PID, target, URL and page marker survive ordinary commands; close ends ownership; relaunch is fresh. |
| R4 | Prevent unbounded memory, disk, thread and descriptor growth while removing backpressure. | Settled, must | Sustained output remains within explicit resource bounds and capture resources disappear at lifecycle end. |
| R5 | Keep stdout/JSON clean; do not forward unrestricted Chrome logs to terminal or a global durable log by default. | Settled, must | Protocol output remains parseable and browser chatter is absent from default user streams/global storage. |
| R6 | Preserve local-versus-attached ownership, Unix process-group cleanup, Windows Job Object lifetime, and temporary-profile cleanup. | Settled, must | Owned trees terminate and temporary resources clear; attached external PID remains alive after disconnect. |
| R7 | Limit claims and scope to managed Chrome output/readiness. No CPU, ffmpeg, Lightpanda, provider, idle-policy, GPU, or global-reaper claim/change. | Settled, must | Diff, validation, and release claim remain within this boundary. |
| R8 | Liveness applies both before and after readiness for the full owned-browser lifetime. | Derived | Output bursts during startup and after a successful command cannot block the next command or close. |
| R9 | Progress/deadline enforcement cannot depend on newline or EOF from every writer. | Derived | A quiet inherited writer, partial line, or open pipe cannot defer the selected bound indefinitely. |
| R10 | Stream handling tolerates arbitrary chunking and invalid bytes without stall or panic while preserving status and useful diagnostics. | Derived | Split readiness marker is recognized; no-newline/invalid-byte input terminates predictably with status/diagnostics. |
| R11 | Attempts and sessions do not mix diagnostic state or leak capture resources. | Derived | Each retry has isolated retained output; success/failure/close releases attempt-owned resources. |
| R12 | Exact launch/diagnostic timing budget. | Undecided | A documented finite bound is selected and demonstrated for quiet and noisy cases. |
| R13 | Exact byte retention, truncation, ordering, and invalid-byte presentation policy. | Undecided | A documented finite policy preserves actionable tail/error evidence and signals truncation. |
| R14 | Cross-platform implementation details beneath equivalent Unix/Windows behavior. | Undecided | Same contract cases pass on supported platforms without changing ownership semantics. |

## Source-grounded boundaries

- Non-Windows Chrome currently uses null stdin/stdout and piped stderr (`chrome.rs:825–831`); Windows also exposes an anonymous-pipe stderr reader while separately owning the Job Object (`windows_process.rs:43–51,119–172`).
- Startup has one 30-second attempt deadline, file polling first, then stderr fallback (`chrome.rs:876–904`). Current line iteration checks time only after a line arrives and retains an unbounded `Vec<String>` (`chrome.rs:958–983`), making quiet/no-newline writers a contract discriminator.
- Diagnostics select error-like lines, otherwise the last five (`chrome.rs:985–1041`). Preserve usefulness, not unlimited historical text.
- Launch retries three times and transfers temporary-profile ownership only on success (`chrome.rs:755–791`). Owned close sends `Browser.close`, then waits or kills; attached close only disconnects (`browser.rs:1306–1336`). Unix group kill and profile cleanup are in `chrome.rs:61–130`.
- Omitted local launch flags need not send launch configuration (`main.rs:250–280`); existing code explicitly avoids omission flipping/relaunching a session (`main.rs:1916–1929`). Daemon identity/restart rules remain existing compatibility behavior (`connection.rs:592–680,792–827`).

## Must-not-change workflows

1. Managed launch via file readiness, including retries and useful failure output.
2. Managed launch via stderr-only readiness.
3. Ordinary commands reusing the same browser/page when flags are omitted.
4. Explicit close followed by clean relaunch.
5. Attached-browser disconnect without kill or capture authority.
6. Unix process-tree, Windows Job Object, and temporary-profile cleanup.

## Discriminator matrix

| Case | Contract pass | Distinguishes from superficially plausible fixes |
|---|---|---|
| Noisy before readiness | Readiness/diagnostic failure remains bounded; resources bounded | Startup-only ignore, blocked pipe, unbounded buffering |
| Noisy after readiness | Next command and close progress with same PID/page | Read-until-ready then abandon pipe |
| Noisy startup failure | Status plus useful bounded diagnostics | Drain-and-discard or generic timeout |
| Stderr-only readiness | Split marker establishes usable session | Removing fallback or matching only whole reads |
| No newline / invalid bytes | No stall/panic; deadline and diagnostics policy hold | Line/UTF-8-dependent readers |
| Quiet inherited writer | Attempt ends at bound despite open descriptor | EOF-dependent completion |
| Same-session ordinary command | PID/target/URL/page marker unchanged | Omission-triggered restart/clear |
| Close then relaunch | Old tree/resources gone; new attempt has no old diagnostics | Cross-session leakage or ownership regression |

## Key disagreements and unknowns

No mechanism disagreement is admissible yet. Open product decisions are R12–R14. Evidence gaps remain: ordinary-CLI reproduction, same-live-process recovery, and direct identification of the blocked descriptor were not exercised (packet 32–33). The original high-CPU incident remains unrelated and unreproduced (packet 11–13).
