# Case: Cross-case observations from an agent-browser maintenance batch

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: not-applicable
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1291](https://github.com/vercel-labs/agent-browser/issues/1291) · [issue #1528](https://github.com/vercel-labs/agent-browser/issues/1528) · [issue #1367](https://github.com/vercel-labs/agent-browser/issues/1367)

> Unvalidated agent backfill. These cross-case observations require human review before becoming rules, exemplars, or evals.

## Observed failure

A batch of maintenance sessions exposed repeated diagnostic and operational patterns that did not belong to one issue record.

## Red signal

There is no single red signal. Each observation points to its originating case, branch, test, or process incident. This file is a corpus ledger, not proof of a shared root cause.

## Method used

1. Compare failures and verification friction across completed case backfills.
2. Separate repository behavior from agent-operation failures.
3. Classify each observation as a possible rule, eval, domain reference, or coverage gap.
4. Keep private machine and neighboring-project details out of the public record.

## Outcome

Eleven observations were retained without changing a runtime skill:

1. Equal client and server timeouts plus whole-command retries amplified two independent hangs.
2. A debugger attachment silently repaired the discarded-tab precondition, producing false greens.
3. A load-bearing handoff claim about discarded-tab revival was false and required re-verification.
4. Public CDP target metadata did not expose a discarded marker in the tested environment.
5. Dropping one Tokio split half did not send EOF; explicit shutdown was required in the test.
6. A falsification must remain compilable and fail behaviorally, sometimes requiring a surgical mutation instead of a file revert.
7. Local or inline fixtures made end-to-end tests deterministic when external DNS was unavailable.
8. A surprising parity failure also occurred on an unmodified base, preventing three incorrect blame assignments.
9. Broad process cleanup interfered with unrelated work on a shared machine; ownership by PID and parentage is the safer boundary.
10. A rejected write-capable tool call left a partial edit, so retry required checking filesystem state first.
11. More than 70 historical fix branches remain outside the backfilled corpus.

## Evidence

- Source: public issues and fork branches referenced by the individual cases.
- Runtime: reported timing, process, CDP, DNS, and tool-call observations remain unvalidated.
- Tests: relevant test names and falsification records live in the individual case files.
- Review: no independent or completed human review yet.

## Transferable lesson

Cross-case patterns are useful candidate generators, but recurrence alone does not promote them. Preserve provenance, separate operational incidents from product behavior, and test the smallest candidate change against a baseline.

## Exceptions

Do not combine observations merely because they happened in one session. Similar symptoms may have unrelated mechanisms.

## Candidate changes

- Unfold Triage candidate: reverify preconditions, control the claimed boundary, timeline server identity, and explain the green.
- Unfold Review candidate: compilable surgical falsification and rerun surprising failures on an unmodified base.
- Agent safety eval: process cleanup must target owned PIDs and verify parentage.
- Agent idempotence eval: inspect filesystem state after a rejected write before retrying.
- Domain references: CDP discarded metadata and Tokio split-stream EOF behavior.
- Coverage gap: historical fork branches remain unclassified.

## Confidentiality review

The public record keeps only generalized lessons and public issue references. Details identifying unrelated local work were omitted.
