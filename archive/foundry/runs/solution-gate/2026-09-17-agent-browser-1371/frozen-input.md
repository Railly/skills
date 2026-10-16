# Frozen evidence packet: agent-browser #1371

## Source

> replicate this and if a problem, then $solution-gate it https://github.com/vercel-labs/agent-browser/issues/1371

## Identity and scope

2026-09-17. Base source: vercel-labs/agent-browser main aff6125c023b810ea3f2e5deec5379e9a4270bdc, version 0.38.1. Source-only archives, no candidate patch. Existing checkout is dirty on a different branch and is not an input. Mode: greenfield, high-risk because cleanup authority and cross-process lifetime can affect user-owned browsers. Scope is diagnosis and solution selection, not production implementation, PR, or GitHub mutation.

Issue reports macOS arm64 0.26.0 with Chrome 148 and several CPU-bound helpers after the caller ended. Comments also report persistent live daemons, including blank-page sessions. The latest comment suggests an omnibox busy loop. These are reported, not yet reproduced facts. Live issue remains open.

## Frame

A locally owned headless Chrome tree and temporary profile remain after their daemon has died. Desired outcome: an owned browser cannot indefinitely outlive its dead lifetime owner. This must not collapse the intended multi-command session into one CLI invocation. The reported pathological CPU cause is unresolved and not equivalent to this lifecycle failure.

## Observed evidence

Probe script: /Users/raillyhugo/Programming/vercel/agent-browser-1371-repro/repro-1371.ts. Running command: `bun repro-1371.ts`. Build: `cargo build --locked --manifest-path cli/Cargo.toml`, exit 0.

At packet freeze, these cells completed; full log is in that tree's probe-data/results.json:

- Normal `close`: zero owned group processes and temp profile absent at 2, 4, 6 seconds.
- Daemon SIGTERM: same cleanup result.
- Daemon SIGKILL: twelve Chrome group processes still present at 2, 4, 6 seconds; profile retained. Group CPU 0.4%, 0.4%, 0.5% respectively. Before kill, thirteen processes including daemon and 1.0% Chrome group CPU.
- Each session executes `open about:blank`, sets window.__probe1371=1371/title, takes a snapshot, then reads the same state. This verifies multi-command continuity before shutdown, beyond command exit codes.
- Harness launches the native daemon as an owned foreground subprocess rather than relying on CLI detachment. It writes the matching daemon-only config fingerprint using the unchanged source algorithm, then uses ordinary agent-browser CLI commands. First attempt omitted that sidecar, causing a daemon restart; that attempt was discarded and retained separately as attempt-1-harness-error.json. The corrected run verifies browser PPID and isolated PGID before signalling and cleanup.
- Test environment is Darwin 25.6.0 arm64, not original Chrome/macOS version. Browser version/renderer and animation/explicit-idle cells are being collected and will be returned as additional evidence, not silently folded into this frozen packet.

## Code evidence handles (relative to each isolated base source)

- cli/src/native/cdp/chrome.rs:61-130: process-group kill and profile cleanup live in ChromeProcess::kill / Drop.
- cli/src/native/cdp/chrome.rs:825-923: Chrome spawn, separate Unix process group, own process returned; 850-853 documents why thread-scoped Linux PR_SET_PDEATHSIG was removed.
- cli/src/native/browser.rs:511-515: actual launch caller is tokio::task::spawn_blocking.
- cli/src/native/browser.rs:1306-1336: close sends Browser.close only for a locally owned child; attached browsers disconnect without killing the external browser.
- cli/src/native/daemon.rs:127-203: default idle timeout is one hour, explicit 0 disables, explicit positive override; default exemptions include headed/user-attached sessions.
- cli/src/native/daemon.rs:250-352: socket loop, background work, idle expiry and signal branches; shutdown paths execute cleanup in the daemon.
- cli/src/main.rs:1346-1357: AGENT_BROWSER_DAEMON foreground entry.
- cli/src/connection.rs:592-600, 624-680: config fingerprint and ready-daemon reuse contract.
- Current default TTL was introduced by main commit 3cc7022, PR #1605. Adding a default TTL is not new work.

## Settled requirements

- R0, core goal: local Chrome tree must not remain indefinitely after confirmed daemon death, including uncatchable termination. The precise cleanup latency is undecided.
- R1, must-have: normal multi-command sessions retain process/target/page state across successful CLI exits and caller disconnects while the daemon remains alive.
- R2, must-have: no cleanup action may kill an attached/user-owned browser or another session, nor delete a user-supplied persistent profile.
- R3, must-have: keep normal close and SIGTERM cleanup and configured restore behavior; do not regress current one-hour idle policy or explicit zero opt-out.
- R4, must-have: fix must respect process lifetime rather than a temporary Tokio worker thread lifetime; ordinary worker idleness must not terminate Chrome.
- R5, must-have: lifecycle and CPU claims stay separate; no claim of fixing blank-page/omnibox CPU spin without evidence.

## Temporal contract

| State | Scope/owner | Initial default | unset → set | set → omitted | set → same | set → changed | set → explicit clear | Restart/reuse | Continuity observables |
|---|---|---|---|---|---|---|---|---|---|
| Named live browser session | daemon owns launched local Chrome | no browser until launch | launch and own | reuse ordinary commands | reuse | launch-setting changes follow existing compatibility checks | close explicitly ends local ownership | CLI exit does not end daemon session; daemon death ends owner | daemon/Chrome PID, target, URL, JS marker |
| Attached browser | external owner, daemon owns connection only | unattached | establish connection | ordinary commands preserve target | reuse | explicit connection/config change follows existing path | close disconnects; external owner retains browser | daemon death must not kill external tree | external browser PID/CDP endpoint survives |
| Temporary profile | owner of launched local Chrome | fresh temp directory | create with launch | retain while same session lives | retain | new local launch gets its own directory | close removes only owned temp profile | after dead owner, remove or mark for cleanup without touching other profiles | path ownership and existence |
| User profile | user-owned disk data | absent | use explicitly requested profile path | preserve via ordinary commands | preserve | explicit profile change follows existing path | close does not delete user disk data | restart must retain persistent profile | profile sentinel/data persists |
| Idle timeout | daemon-level launch configuration | one hour when omitted at fresh daemon | positive override or 0 opt-out | current cross-invocation override behavior NOT measured; do not assume omission means clear | current fingerprint includes value | may restart daemon per existing config contract | explicit 0 disables, not a reset to default | changes outside this defect's scope; flag temporal ambiguity for any shape touching config | effective setting, PID/state continuity |

## Unknowns and boundaries

- Why some reporters see near-100% CPU on blank tabs or omnibox, and whether current Chrome reproduces it over days.
- CPU activity from a deliberately animated local page is only a workload discriminator, not proof of pathological spin.
- Whether cleanup authority should cover daemon wedge while still alive in addition to death; not settled by this probe.
- Cleanup latency and whether hard death permits profile deletion vs durable cleanup marking.
- Windows has a distinct process abstraction; this host cannot validate Windows. Linux thread lifetime is a known constraint, not a live test here.
- No claim that normal CLI/agent completion should instantly kill persistent Chrome. That issue request conflicts with an established product workflow.
- No candidate patch has been inspected. Existing related patch identities will be assessed after blind reconstruction.

## Requested independent Shaping output

Load shaping and produce its native full R table (settled/derived/undecided), materially distinct shapes with mechanism parts/flags, binary R × Shape fit check, failure notes, recommendation and required refutation probes. Read only your isolated source and this packet. Do not implement, read another reviewer's output, or fetch candidate diffs. Do not breadboard or slice until a gate verdict. If no shape passes, say so rather than disguising flags as passes.
