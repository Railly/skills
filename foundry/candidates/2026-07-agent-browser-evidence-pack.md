# Candidate pack: agent-browser maintenance session

Status: observed
Source cases: [agent-browser cases](../../cases/agent-browser)
Validation: unvalidated
Human review: pending
Independent review: pending
Runtime change: none

> Unvalidated agent synthesis. The classifications and proposed round require human review.

## Decision

The backfill suggests possible improvements to Unfold Triage and Review, but it does not justify a new skill or an immediate v0.0.1 instruction change. The smallest responsible next step is human review followed by an eval round against the released protocol.

## Triage candidate rules

The unvalidated backfill attributes four changed verdicts to treating reproduction as an experiment whose preconditions and controls required proof:

1. **Reverify the failing precondition immediately before every run.** The system under test may repair a discarded tab, release a lock, warm a cache, or renew a lease during setup. Source: #1528.
2. **Run the control outside the reporter's claimed boundary.** Dynamic-only, platform-only, or mode-only language is a hypothesis until the non-boundary control passes. Source: #1445 and the disproven batch.
3. **Timeline server identity after every command for state-loss bugs.** A PID or start-time sequence can turn vague daemon behavior into a process lifecycle. Source: #1367.
4. **Explain the green.** Before concluding non-reproduction, rule out a dead fixture, missing environment precondition, trivial observation, rewrite, prior fix, or deliberate design tradeoff. Source: the disproven batch.

These rules form one candidate package: **repro as a controlled experiment**.

## Review candidate rules

1. **Observe the substrate when success may lie.** Inspect DOM, filesystem, database, process identity, or serialized artifact rather than the command output under investigation. Sources: #1105, #1266, #1336.
2. **Verify canceled external work end to end.** A mock cannot expose provisional navigation, leaked process state, or another external side effect. Source: #1291.
3. **Falsify surgically when a file revert would stop compilation.** The red must be a failing behavioral test, not a build error. Source: #1367.
4. **Rerun a surprising failure on the unmodified base before blaming the patch.** Source: repeated ambient parity failures in the session notes.

## Exemplar candidates

| Case | Pattern | Why not promoted yet |
|---|---|---|
| #1528 | timeout arithmetic reveals whole-operation retries | No comparison showing the exemplar improves diagnosis |
| #1336 | A/B/C config matrix reveals hidden setup | No transfer holdout |
| #1378 | loud and silent subprocess failure modes | Platform evidence is macOS-only |
| #1266 | boundary piercing across discovery, resolution, action, and cleanup | Rich but potentially over-specific |
| #1460 | working-path contrast reveals the reusable seam | Adjacent branch composition remains unverified |

## Proposed round

Compare three variants:

1. no skill;
2. released Unfold v0.0.1;
3. Unfold plus the four Triage candidate rules.

Use at least these behaviors:

- a precondition repaired by the tool during setup;
- a reporter boundary disproven by its control;
- a CLI and daemon state-loss timeline;
- a green caused by an unopened port or dead fixture;
- an intermittent near-miss where one green must not close the issue;
- a transfer holdout outside browser automation.

Passing requires fewer false greens and better evidence handles than both baselines without adding ritual to unrelated debugging.

## Operational notes not promoted

- Prefer network-free fixtures when the network is not the behavior under test.
- Verify filesystem state after a rejected write tool call before retrying.
- Kill only owned processes by PID and parentage on a shared machine.
- More than 70 historical fork branches remain a corpus coverage gap.

These are useful observations but currently lack the ownership, evals, or public-safe evidence required for runtime promotion.
