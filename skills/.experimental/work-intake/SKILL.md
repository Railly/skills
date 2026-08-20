---
name: work-intake
description: Assess one already-selected GitHub issue, pull request, or manual request before any factory workflow is admitted. Classify the real intent, preserve evidence and uncertainty, recommend the minimum workflow, and stop for human confirmation. Use when a source item may be a question, investigation, unverified bug, feature, maintenance change, non-mechanical change, or pull request review. Do not use to shortlist a backlog or to implement, reply, assign, branch, or create a pull request.
compatibility: Requires read access to the selected source and repository context. Must run in a read-only sandbox with a pinned skill revision.
---

# Work intake

Decide what kind of work this source actually represents before the software factory spends mutation authority.

## Boundary

Accept exactly one selected source: a GitHub issue, a GitHub pull request, or a manual request. If the user is choosing among backlog items, hand off to `issue-intake`. If an executable contract is already confirmed, continue with its admitted Formula instead of reassessing it.

Never modify files, create branches or commits, assign work, post or draft an external reply, close an item, create a pull request, or invoke implementation. Classification is not admission.

## Inspect the source

Read the current source body, state, labels, comments, timestamps, and linked pull requests when available. Inspect only enough repository context to test the source's claims. Record the exact source revision:

- issue or manual request: normalized content digest plus `updatedAt`
- pull request: normalized content digest, `updatedAt`, and exact head SHA

If the source cannot be read, its revision changed during inspection, or the skill identity is not pinned, return `blocked` with a recovery action. Do not guess.

## Classify intent

Choose one primary intent:

- `question-support`: asks how existing behavior works or requests guidance
- `investigation-research`: seeks findings, options, or a decision without an accepted change
- `unverified-bug`: reports broken behavior that has not been reproduced
- `feature-request`: asks for a new capability whose shape is not yet accepted
- `mechanical-maintenance`: bounded, behavior-preserving maintenance with an explicit contract
- `nonmechanical-change`: an accepted behavioral change that requires design and implementation
- `pull-request-review`: asks to evaluate an existing pull request at its exact head

Use confidence `high`, `medium`, or `low`. Evidence must be observable. Unknowns must remain explicit. Ambiguity defaults to a read-only investigation, never to implementation.

## Recommend the minimum workflow

Map the intent to one versioned template:

| Intent | Template | Consequence |
|---|---|---|
| question-support | `support-response-v1` | Investigate, draft response, human approval; no code or promotion |
| investigation-research | `investigation-v1` | Investigate, synthesize, human decision; no promotion |
| unverified-bug | `bug-reproduction-v1` | Reproduce, classify, human decision; change requires a successor |
| feature-request | `feature-shaping-v1` | Clarify, shape, human decision; implementation requires a successor |
| mechanical-maintenance | `mechanical-change-v1` | Validate, execute, checks, proof, human decision, promotion |
| nonmechanical-change | `nonmechanical-change-v1` | Contract, solution, implement, checks, review, applicable resilience, proof, human decision, promotion |
| pull-request-review | `pull-request-review-v1` | Inspect exact head, checks, review, human decision; findings require successors |

## Return the assessment

Return one fenced YAML document and no executable instructions:

```yaml
status: ready | blocked
assessment_id: stable UUID
source:
  kind: issue | pull-request | manual
  locator: owner/repo#N | manual UUID
  digest: sha256 value
  updated_at: ISO-8601
  head_sha: optional exact SHA
intent: question-support | investigation-research | unverified-bug | feature-request | mechanical-maintenance | nonmechanical-change | pull-request-review
confidence: high | medium | low
evidence: []
unknowns: []
recommended_workflow: versioned template id
allowed_actions: []
forbidden_actions: []
recommendation: one concrete human choice
recovery_action: null | concrete action
assessor:
  skill: work-intake
  revision: pinned revision
  model: runtime identity
no_mutation_receipt:
  files_changed: 0
  external_writes: 0
assessed_at: ISO-8601
```

Allowed actions describe only the recommended Formula after confirmation. Forbidden actions always include everything outside that Formula.

## Complete when

The immutable assessment preserves source identity, evidence, unknowns, consequence, skill identity, and a zero-mutation receipt. Stop for the human to confirm, request clarification, or override with a rationale. Revalidate the source before admission.
