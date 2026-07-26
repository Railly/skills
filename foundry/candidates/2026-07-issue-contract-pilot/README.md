# Issue Contract retrospective pilot

Status: approved for prospective dogfood
Date: 2026-07-25
Method: retrospective reconstruction
Runtime promotion: not applicable; this is an artifact, not a skill

## Question

Does a compact Issue Contract make an issue-solving mission easier to resume, review, and promote without duplicating backlog selection or behavioral review?

## Corpus

| Contract | Source case | Historical state |
|---|---|---|
| [agent-browser #1528](contracts/agent-browser-1528.md) | [PR #1532 case](../../../cases/agent-browser/1532-discarded-tab-revival.md) | merged after seven review rounds |
| [agent-browser #1291](contracts/agent-browser-1291.md) | [state-load case](../../../cases/agent-browser/1291-state-load-timeout.md) | local branch |
| [agent-browser #1460](contracts/agent-browser-1460.md) | [frame-locator case](../../../cases/agent-browser/1460-frame-aware-locators.md) | local branch |
| [Portless PR #365](contracts/portless-365.md) | [multi-segment TLD case](../../../cases/portless/260-multi-segment-tlds.md) and [review case](../../../cases/portless/365-risky-suffix-overgeneralization.md) | merged after five passes |
| [agent-browser PR #1589](contracts/agent-browser-1589.md) | [dispatch case](../../../cases/agent-browser/1589-pin-tab-dispatch-paths.md) and [guard case](../../../cases/agent-browser/1589-sibling-sink-and-guardless-regression-test.md) | review and fix rounds |

This pilot uses frozen case evidence. It does not claim that the reconstructed contracts existed before implementation.

## Baseline

The five case files already preserve strong engineering evidence:

- 5 of 5 name an observed condition and red signal.
- 5 of 5 separate source, runtime, tests, review, or artifact evidence.
- 5 of 5 record delivery status.
- 0 of 5 use stable acceptance IDs.
- 0 of 5 contain an explicit Non-goals section.
- 0 of 5 preserve a complete exact `command -> claim` ledger.

The information usually exists, but it is distributed across prose, rounds, session logs, and later case updates.

## Rubric

| Dimension | Pass condition |
|---|---|
| Outcome | A new agent can state the intended user-visible result without reopening the full session. |
| Scope | Non-goals and invariants distinguish the mission from adjacent work. |
| Change surface | Expected owners and must-inspect consumers are explicit. |
| Proof | Every acceptance claim has a named oracle and no green command stands alone. |
| Promotion | Risk, human gate, Spec review, Standards review, and delivery boundary are explicit. |

## Results

| Contract | Outcome | Scope | Change surface | Proof | Promotion |
|---|---|---|---|---|---|
| #1528 | pass | pass | pass | partial | pass |
| #1291 | pass | pass | pass | partial | pass |
| #1460 | pass | pass | pass | partial | pass |
| #365 | pass | pass | pass | partial | pass |
| #1589 | pass | pass | pass | partial | pass |

Proof is partial in every reconstruction because at least one runtime or artifact command was not retained exactly. Test names and outcomes survive, but an independent agent cannot replay the entire claim map from the case file alone.

## Counterfactual coverage

The contracts would have helped in three concrete ways:

1. **Handoff integrity.** PR #1589 could not have been presented as ready while Standards review was absent. Its delivery gate makes the missing `review-gate` state explicit.
2. **Scope continuity.** #1528, #365, and #1589 accumulated adjacent paths and new failure modes across rounds. Stable IDs make every addition visible instead of silently expanding the mission.
3. **Proof auditability.** #1589's original regression tests stayed green after the production fix was reverted. Mapping A5 to a production-line revert makes that evidence failure obvious.

The contracts would not have discovered every later finding:

- #1528 still needed dialog, sibling-entry-point, and false-positive recovery review.
- #365 still needed widened-domain, substrate-limit, docs-parity, and resolution-consumer lenses.
- #1589 still needed a dispatch-path sweep and a real-browser reviewer.

An Issue Contract is a state carrier and review oracle. It is not a replacement for Triage, repository exploration, or Standards review.

## Historical metrics

| Case | Review or feedback signal | Scope additions | Metric quality |
|---|---|---|---|
| #1528 | seven rounds before merge | dialog state, cancellation cleanup, sibling close path, output surfaces | strong case evidence |
| #1291 | artifact run found provisional navigation after the unit mock passed | `Page.stopLoading` cleanup | strong case evidence |
| #1460 | no upstream review | adjacent #1445 composition remained unverified | partial |
| #365 | five passes before merge | overlaps, composed limits, warnings, persisted state, docs, cert filename, 404 suggestion | strong case evidence |
| #1589 | four initial maintainer findings plus independent reviewer findings | dispatch paths, batch parity, error contracts, test teeth | strong case evidence |

Human questions, comparable minutes-to-red, and handoff recovery time cannot be recovered reliably from these case files. The sessions contain interleaved issues, injected skill text, tool results, and work resumed on different machines. A prospective pilot must record those values at the event boundary instead of reconstructing them later.

## Decision

Do not create an `issue-contract` skill and do not assign the artifact to Unfold.

The lifecycle audit found no explicit Unfold invocation in 34 Vercel-related Claude sessions. The contract should remain phase-neutral:

- `pick-an-issue` ends after selection.
- Reproduction establishes Observed, Expected, red signal, and Change Surface.
- Implementation consumes acceptance IDs, invariants, and non-goals.
- Behavioral proof maps exact commands to acceptance claims.
- `review-gate` remains Standards review.
- `record-a-case` closes the evidence loop.

The approved change is the phase-neutral artifact plus prospective instrumentation. The first round should test whether reproduction needs a dedicated skill or only a contract section and gate. A new skill still requires one agent-browser origin case, one transfer holdout, a baseline comparison, and human review.

Live contracts start from [the canonical template](../../missions/_template.md) and are validated by `bun scripts/validate-issue-contracts.mjs`.

## Prospective pilot instrumentation

Record these fields from the start of the next three real missions:

```text
contract_created_at
first_red_at
human_decision_questions
acceptance_ids_added_after_implementation
non_goals_changed
handoff_started_at
handoff_resumed_at
spec_review_rounds
standards_review_rounds
external_findings
finding_to_contract_or_gate_destination
```

Write every live contract and pilot log under this canonical `Railly/skills` source repository. Never place them in the target repo or an installed `.agents/skills` or `.claude/skills` copy.

The pilot succeeds if another agent can resume from the contract, execute the next exact command, and reconstruct why each promotion state is pass, fail, or incomplete without reading the original conversation.
