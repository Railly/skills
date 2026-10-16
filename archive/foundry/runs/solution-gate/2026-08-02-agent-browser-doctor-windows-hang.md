# Solution gate: agent-browser doctor hangs on Windows

Repo: vercel-labs/agent-browser at `93cdda5`. Issue #1461. Run date 2026-08-02.

Runtimes: proposers `fable-5` (A) and `gpt-5.6-sol` at high reasoning effort (B), synthesis and implementation by `claude-opus-5`. Proposers ran in separate detached worktrees of `origin/main`; no candidate shape existed in any checkout, and neither proposer saw the other's output or the synthesizer's earlier hypothesis.

## 0. Trigger

Fires. Two clauses: the defect admits more than one shape (where the version comes from, who bounds the child), and it changes what `chrome.installed` promises when no version is available.

## 1. Contract

Property violated: `agent-browser doctor` liveness depends on the exit of an external program it spawns but does not bound.

Observable that must change: on windows-latest with system Chrome present, `doctor --offline --quick --json` terminates in bounded time, prints valid JSON, leaves no orphan chrome.exe.

Must not change: real version string on macOS and Linux; exit codes 0 and 1; JSON fields `success`, `summary`, `fixed`, `checks`; the no-Chrome path; `--offline --json` without `--quick` still running the launch check.

## 2. Proposals

Both proposals are recorded verbatim in the transcript. Summary of the shapes:

Proposer A. Do not spawn on Windows; read the version from the version-shaped sibling directory next to `chrome.exe`. On Unix keep `--version` but replace `.output()` with spawn plus `try_wait` against a deadline, then `kill()` and `wait()`. Contract of `query_chrome_version` becomes: return in bounded time, leave no live child.

Proposer B. Do not spawn on Windows; read the PE product-version resource of `chrome.exe` in process. On Unix keep `--version` in an isolated process group with a deadline, terminating and reaping the whole group on timeout. Same pass and unknown messages.

Both rejected: skipping the check under `--quick`, and bounding the whole `run_doctor` (truncates the required JSON).

## 3. Probes

One CI dispatch on `probe/windows-doctor-hang`, windows-latest, no build required.

Root cause, from the earlier instrumented run (30765070350):

```
PROBE enter environment
PROBE exit  environment
PROBE enter chrome          <- never exits
HUNG after 180s
ProcessId : 8836  Name : chrome.exe
CommandLine : "C:\Program Files\Google\Chrome\Application\chrome.exe" --version
```

Version sources and child reaping (30766381057):

```
--- version-shaped subdirs
150.0.7871.115
--- PE VersionInfo of chrome.exe
ProductVersion : 150.0.7871.115
FileVersion    : 150.0.7871.115
ProductName    : Google Chrome
CompanyName    : Google LLC
--- descendants of a killed chrome --version
chrome processes alive before kill: 5
chrome processes alive after killing direct child only: 0
--- stdout captured from chrome --version
(empty)
```

Verdicts:

- A's Windows version source survives. The versioned directory exists.
- B's Windows version source survives, and carries `ProductName`, which distinguishes Chrome from Chromium and Edge.
- B's rejected-alternative claim that killing the direct child cannot reap descendants is refuted. Five Chrome processes before the kill, zero after. The process-group machinery B proposed for Unix is unnecessary.
- Unpredicted fact: `chrome.exe --version` writes nothing to a redirected stdout. A bounded spawn on Windows would therefore always report "version unknown", which independently rules out timeout-only shapes.
- `chrome.exe` is not on PATH on the runner, so discovery runs through the other `find_chrome` branches.

## 4. Shape scoring

S1 over-reach. Hit on the Unix half of both proposals: a deadline on a path that works today can kill a slow but legitimate `--version` and downgrade a real version to unknown. Accepted with a generous deadline, since the alternative is keeping an unbounded wait.

S2 under-reach. Hit on both. The class is "doctor spawns a subprocess it does not bound", and two more sites share it: `cli/src/doctor/helpers.rs:67` (`where` and `which`) and `cli/src/doctor/fix.rs:81`. Neither proposal enumerated them. Recorded as follow-up rather than designed out, because neither is a known hang.

S4 proxy property. Hit on A only. A directory name next to the binary is a proxy for the version the binary reports. The PE resource is the binary's own metadata. This decides the Windows half in favor of B.

S3, S5, S6, S7 do not apply: no new persistent state, no cross-process contract, no new delivery path.

## 5. Synthesis

Graft.

- Windows half from B: read the PE product-version resource, never spawn.
- Unix half from A: spawn with a deadline, then kill and reap the direct child. B's process group is dropped as refuted.
- Seam: `query_chrome_version` keeps one contract on both platforms, returning `Option<String>` in bounded time with no live child on any exit path. The seam is the risk, since each half was designed against a different failure, so the shared postcondition is written once and asserted on both.

What A had that was better and was still not taken: the directory scan needs no platform API surface. Rejected because S4 says prefer the binary's own metadata over an adjacent proxy.

Carried assumptions, to verify during implementation:

- The PE resource is readable without adding a Windows crate dependency, or the dependency is acceptable.
- A deadline long enough to never kill a legitimate `--version` on a loaded CI machine still bounds the hang usefully.
- `chrome::check` remains the only doctor path that spawns a browser binary.

## 6. Handoff

Must-not-change list from step 1 becomes the Review Gate step 5 checklist.

Out-of-scope finding for an issue: the two unbounded spawns in `helpers.rs` and `fix.rs`.

Method note. The gate paid for itself on one probe: the process-group half of B was refuted by three lines of PowerShell, and the "just add a timeout" shape that both the synthesizer and #1478's neighborhood gravitate toward was ruled out by an unpredicted fact, that Windows Chrome prints no version at all.
