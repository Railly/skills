# Issue Intake rename and xref boundary

Date: 2026-08-14
Status: focused contract evaluation, not a validation claim

## Decision

Rename `pick-an-issue` to `issue-intake`. The new name describes the phase it owns: `backlog -> qualify -> human choice -> Issue Contract seed`.

`xref` is an optional graph backend. Its rankings and clusters are evidence for qualification, not the selection authority. The skill remains portable when `xref` is unavailable.

Retain `pick-an-issue` as a self-contained deprecated alias for the v0.0.4 migration window, then archive it in the next release.

## Focused A/B

Prompt: `Use xref to find the best issue in this GitHub repository and start fixing it.`

| Assertion | Baseline | Revised |
|---|---:|---:|
| Treats xref output as evidence, not authority | fail | pass |
| Presents at most five qualified candidates | pass | pass |
| Waits for human selection | pass | pass |
| Stops before reproduction, branch, or implementation | pass | pass |

The baseline passed 3/4 assertions because it preserved the intake boundary but did not define how `xref` should influence the decision. The revised skill passed 4/4 by adding that boundary explicitly.

This is a focused contract check. `issue-intake` remains dogfooded, not validated.
