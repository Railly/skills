# agent-browser #1461: a red job nobody runs hides the bug it was built to catch

Status: observed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-02
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1637, https://github.com/vercel-labs/agent-browser/pull/1641, https://github.com/vercel-labs/agent-browser/issues/1461

**Change:** two PRs, `test(native): raise parity action timeout to 60s` (1 file, +3/-1) and `fix(doctor): stop hanging on the Chrome version query` (2 files). **Outcome:** both merged, reviewed by the maintainer. Main CI green for the first time in 108 days.

## Observed condition

`CI / Rust (macos-latest - x86_64-apple-darwin)` failed on every push to main. The failure was one test, `native::parity_tests::test_all_documented_actions_are_handled`, panicking with `Action 'launch' timed out` at a 10s per-action `tokio::time::timeout`.

Retrievable: five consecutive failing runs on main plus a rerun of the same commit, all the same test and line. Not a flake.

The 10s budget had no margin on the slowest target. Measured per-action on a fast machine, `launch` returns in 1238ms on arm64 and 1282ms under Rosetta, so the arch of the test binary is not the variable. The variable is the runner: the same suite takes 15s locally, 67s on the CI aarch64 job, 197s on the CI x86 job, and 346s on a later run of that same job. Nearly 5x variance between runs of one job, and 13x against local.

## Red signal

The failure did not reproduce locally, and the honest-but-lazy conclusion was available: environment slowness, raise the number, move on. Two facts made that conclusion insufficient.

First, `rust-cross` is gated on `if: github.event_name != 'pull_request'` (`.github/workflows/ci.yml:124`). The job that fails never runs on a pull request, so no contributor sees it before merging and the PR's own checks cannot verify a fix for it. Verification required `workflow_dispatch` on a branch.

Second, main CI had been red for 74 consecutive runs since 2026-04-16, with the failing job rotating between `aarch64-apple-darwin` (April), `x86_64-pc-windows-msvc` (July 16) and `x86_64-apple-darwin` (July 24 onward). All three belong to the matrix nobody runs. The red job was not one bug; it was a hiding place.

## Method used

Raising the timeout to 60s turned the macOS jobs green, and then the Windows job, freed from fail-fast, ran to its natural end and hung for six hours until GitHub's limit cancelled it. The parity test now passed there (`1041 passed; 0 failed` in 37.72s); `cargo test` had simply never reached the next test binary before.

The hang was `doctor_offline_quick_json_emits_valid_payload` (`cli/tests/doctor_cli.rs:33`), which shells out to `agent-browser doctor --offline --quick --json` and blocks on `.output()`. Instrumenting the test was useless, because a test that hangs never flushes its captured child output. The probe that worked ran the binary directly in the job, with a per-check trace on stderr, a 180s cap, and a child-process enumeration on timeout:

```
PROBE enter environment
PROBE exit  environment
PROBE enter chrome          <- never exits
HUNG after 180s
ProcessId   : 8836
Name        : chrome.exe
CommandLine : "C:\Program Files\Google\Chrome\Application\chrome.exe" --version
```

`query_chrome_version` (`cli/src/doctor/chrome.rs:118`) ran `chrome.exe --version` and blocked on `Command::output`. Chrome's children inherit the stdout handle, so the read waits for an EOF that never arrives. `chrome::check` runs unconditionally in `run_doctor`, so neither `--offline` nor `--quick` avoids it. This is a product defect, not a test defect: any Windows user running `agent-browser doctor` with system Chrome hangs the same way.

The fix shape went through [solution-gate](../../foundry/runs/solution-gate/2026-08-02-agent-browser-doctor-windows-hang.md): two proposers on different model families, blind to each other, then one CI probe against their predictions. The probe refuted one proposal's process-group requirement (5 Chrome processes before killing the direct child, 0 after) and surfaced a fact neither predicted, that `chrome.exe --version` writes nothing to a redirected stdout. That fact ruled out the timeout-only shape both the synthesizer and the neighboring open PR had gravitated toward: bounding the call would report "version unknown" on every Windows run and still pay the deadline.

Shipped shape: on Windows read the version from the binary's own PE resource table, never spawning; elsewhere keep `--version` but spawn, poll to a 10s deadline, then kill and reap. No new crate, since `windows-sys` was already a direct dependency and only needed the `Win32_Storage_FileSystem` feature.

## Outcome

Both PRs merged and approved by the maintainer. On `01c1147d`, CI is green including all three `rust-cross` targets, the first green main CI since 2026-04-16. On Windows the previously hanging test completes in 0.03s.

The maintainer asked in chat whether there was an additional Windows issue. There was, it had been filed as #1461 on 2026-06-18, and it had an unreviewed PR (#1478) attached since 2026-06-23 fixing a different hang in the same command, during browser close inside `launch::check`, which `--quick` skips.

## Evidence

- Source: PR #1637 merged at `93cdda57`, PR #1641 merged at `01c1147d`, issue #1461
- Runtime: `cargo test --profile ci` on windows-latest, macos-latest for both apple targets, ubuntu-latest
- Tests: two new unit tests, one asserting the deadline fires on `sh -c "sleep 60"` within 300ms, one asserting stdout parsing is unchanged. Fix-absent result is retrievable: run 30675652938 shows the same test binary hanging to the 6 hour cancellation
- Restored green: run 30768308257 (dispatch, pre-merge) and run 30773196613 (main, post-merge), all Rust jobs success
- Artifact: `agent-browser doctor --offline --quick --json` driven on macOS post-change, `chrome.installed` message unchanged in form, `<version> at <path>`, exit within 0.94s
- Review: approved and merged by the maintainer, 2026-08-02
- Unverified: the release builds Windows with `x86_64-pc-windows-gnu` (`release.yml:125`) while CI tests only `-msvc`. The new FFI is not exercised by CI on the toolchain that ships. Bounded by three facts: the same crate is already used in `connection.rs` and `main.rs`, `windows-targets` links with `kind = "raw-dylib"` which needs no MSVC import library, and a link failure would fail the release build before publishing

## Transferable lesson

A CI job excluded from pull requests stops being a gate and becomes a place for defects to accumulate. When a job has been red long enough that its failure is treated as terrain, ask what it is covering for, and check whether the failing target rotates.

Then, when a timeout fires in CI and not locally, the fix is not the number. Fixing the number is correct only after establishing which side of the timeout is wrong, and unblocking it exposes whatever was queued behind the fast failure. Budget for the second defect.

## Exceptions

The variance measurement (15s local, 67s and 197s and 346s on CI) justifies the raised timeout on its own terms. Where a hang is unbounded rather than slow, a larger timeout converts a fast red into a six hour red, which is worse for everyone, so raising a timeout is only safe when something downstream is also bounded.

Instrumentation inside a test that hangs cannot report, because the harness captures child output and never flushes it. Drive the binary directly in the environment where it fails.

## Candidate changes

- Deterministic check: run `rust-cross` on pull requests, or require it green before the release workflow publishes. The three defects in this case all lived in the gap and none was visible at merge time
- Coverage gap: `cli/src/doctor/helpers.rs:67` and `cli/src/doctor/fix.rs:81` spawn subprocesses with no deadline. Same class, neither a known hang
- Coverage gap: `x86_64-pc-windows-gnu` ships in releases and is never tested
- No change: solution-gate and signature-repro both applied as written and needed no revision

## Confidentiality review

Public repository, public PRs and issue, public CI logs. The maintainer's chat question is paraphrased as a fact about the exchange, without quoting private text or naming the channel. No local paths, secrets, or neighboring-project identity included.
