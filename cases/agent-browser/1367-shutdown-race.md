# Case: Trace server identity across a shutdown race

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1367](https://github.com/vercel-labs/agent-browser/issues/1367) · [commit](https://github.com/Railly/agent-browser/commit/4346435a4ea729cc38728744b44c82ba54f95dd1) · [branch](https://github.com/Railly/agent-browser/tree/fix/close-shutdown-race)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

The issue reported a command succeeding after a failed close while later reads returned stale content. The reproduced variant reported success and then lost the newly created browser state.

## Red signal

A local two-page sequence killed the daemon, closed the respawned browser, opened a new page, and inspected content and URL. Recording the daemon PID after every command showed the successful `open` landed during a 100 ms post-close grace window and the daemon then exited, deleting the state it had just created.

## Method used

1. Reproduce the state-loss family without claiming the reporter's exact stale-content flavor.
2. Record server identity after every command to create a process timeline.
3. Find that shutdown was decided before a grace sleep while the accept loop remained open.
4. Mark shutdown when the close response is written and reject newly accepted work.
5. Falsify the guard surgically so the tests fail behaviorally rather than at compile time.

## Outcome

The branch rejects commands entering the grace window and keeps the final CLI state consistent. Unit tests and the full sequence passed after restoration. The reporter's exact WSL stale-content mechanism remains unresolved. No upstream PR was opened.

## Evidence

- Source: shutdown flag and Unix and Windows accept-loop guards in the linked commit.
- Runtime: PID timeline identified the daemon that served and then destroyed the successful command.
- Tests: `test_close_sets_shutting_down_before_returning_response` and `test_commands_after_close_are_rejected` were falsified with a compiling mutation.
- Artifact: release CLI completed the forced shutdown sequence with the expected final page.

## Transferable lesson

At the moment shutdown is decided, stop accepting new work before the grace or drain period. For vague state loss between CLI commands, record the server's identity after every step.

## Exceptions

The patch proves the reproduced failure family, not every variant in the original report. Persistent queues may safely accept during drain only when durability is guaranteed independently of the exiting process.

## Candidate changes

- Reference rule: Unfold Triage should timeline server identity for state-loss-between-command bugs.
- Reference rule: Unfold Review falsification must preserve compilation and fail as a test.
- Coverage gap: exact WSL stale-content behavior remains unexplained.

## Confidentiality review

The issue, source, branch, commit, fixture, and tests are public. No private process details are included.
