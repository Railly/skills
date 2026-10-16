# Case: Isolate hidden per-command setup with an A/B/C matrix

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1336](https://github.com/vercel-labs/agent-browser/issues/1336) · [commit](https://github.com/Railly/agent-browser/commit/5d2c3149c23e36e676df02ec4aeafb85ce18c2d0) · [branch](https://github.com/Railly/agent-browser/tree/fix/storage-state-implicit-relaunch)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

With `AGENT_BROWSER_STATE` set, a successful navigation was replaced by `about:blank` on the next command even though that command reported the browser was reused.

## Red signal

Three local scenarios isolated the trigger: no environment variable, variable on both commands, and variable only on the first command. Only the second scenario reset the page. The matrix showed that repeated implicit setup, not navigation itself, caused the damage.

## Method used

1. Change one environment-variable condition across an A/B/C matrix before reading code.
2. Verify lifecycle telemetry against the actual tab list.
3. Trace the environment flag to an implicit `launch` emitted before every user command.
4. Make launch idempotent for the same storage-state resource while retaining a clean relaunch for a different resource.
5. Test both the new reuse contract and the stronger preexisting different-resource contract.

## Outcome

The branch reuses the browser when the same state file is already applied and still relaunches for a different state file. Network-free end-to-end and helper tests passed and were falsified. No upstream PR was opened.

## Evidence

- Source: applied-state tracking and idempotence decision in the linked commit.
- Runtime: the A/B/C matrix isolated the second command's environment flag.
- Tests: `e2e_storage_state_relaunch_same_file_keeps_page` and helper cases for same, changed, unloaded, external, and absent state.
- Artifact: release CLI verified same-state reuse and different-state cookie replacement.

## Transferable lesson

When state disappears between successful commands, look for hidden setup executed before each invocation. An A/B/C configuration matrix can localize the destructive step before static analysis begins.

## Exceptions

Do not apply the implicit-setup hypothesis to state loss after a fixed idle interval until expiry and garbage collection have been tested.

## Candidate changes

- Exemplar: hidden setup, contradictory telemetry, and idempotence by applied resource.
- Eval: a per-command environment option silently reapplies destructive initialization.

## Confidentiality review

The issue, source, branch, commit, fixture, and tests are public. No user storage state is included.
