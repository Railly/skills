# Case: Bound unreachable state origins and cancel abandoned work

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1291](https://github.com/vercel-labs/agent-browser/issues/1291) · [commit](https://github.com/Railly/agent-browser/commit/172d56a69ab48947d64757b2c7d562be541a9572) · [branch](https://github.com/Railly/agent-browser/tree/fix/state-load-unreachable-origin)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

Loading storage state with an unreachable origin could hang beyond the command timeout and leave the daemon unresponsive.

## Red signal

A local TCP server accepted connections without responding. A state file forced restoration against that origin. Before the fix, `state load` exceeded 40 seconds and concurrent and subsequent `get url` commands also timed out. After the fix, the load returned a warning after 10 seconds and the daemon remained responsive.

## Method used

1. Force the exact per-origin navigation with a deterministic local stall server.
2. Bound each origin independently and report warnings instead of aborting the whole batch.
3. Check fast navigation errors as well as timeouts.
4. Run an end-to-end CLI check after the unit mock passed.
5. Add `Page.stopLoading` when the end-to-end run exposed a provisional load left behind by the canceled navigation.

## Outcome

The branch contains the patch, a falsified mock-CDP regression test, a passing local release-binary scenario, and a contributor-reported suite of 902 passing tests with one unrelated parity failure. No upstream PR was opened.

## Evidence

- Source: state restoration timeout, fail-soft warnings, cancellation, and warning propagation in the linked commit.
- Runtime: local stall-server scenario went from daemon-wide timeouts to a bounded warning and responsive follow-up commands.
- Tests: `test_load_state_skips_unreachable_origin_with_warning` failed with `Elapsed` when the navigation fix was removed.
- Artifact: release binary exercised through the original CLI flow.

## Transferable lesson

Bound each item in a batch independently, report partial failures, and cancel side effects left by abandoned external operations. A unit mock cannot prove external state was cleaned up, so verify the real artifact.

## Exceptions

Do not skip failed items when the operation is transactional or later items depend on them. Bound the operation, then roll back or abort explicitly.

## Candidate changes

- Reference rule: Unfold Review should require artifact verification when a fix cancels work in an external system.
- Eval: a unit-green cancellation fix that leaves real external state blocked.
- Exemplar: fail-soft batch restoration with a side effect found only end to end.

## Confidentiality review

The issue, source, branch, commit, and tests are public. No private runtime transcript or employer-only evidence is included.
