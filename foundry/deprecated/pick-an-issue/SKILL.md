---
name: pick-an-issue
description: Survey an unfamiliar or shared issue backlog, qualify a small set of worthwhile contributor-side candidates, compare them in an evidence-backed matrix, recommend one, let the user make the final selection, and seed the canonical Issue Contract. Use for requests like "what should I work on here", "find a good issue to fix", or choosing among open issues. Stop before reproduction or implementation. Do not use for maintainer-side tracker triage or when an issue is already selected.
compatibility: Requires backlog read access. Contract materialization requires a writable canonical Railly Skills source repository.
---

# Pick an issue

Protect the user's attention before expensive investigation begins. Survey cheaply, qualify ruthlessly, show the tradeoffs, and let the user choose. This skill ends at selection and hands the chosen work to a canonical Issue Contract.

## Canonical contract root

After selection, resolve the canonical `Railly/skills` checkout through `RAILLY_SKILLS_REPO`, `~/Programming/railly/skills`, or `~/railly-skills`. The canonical resolver is `scripts/resolve-source-root.mjs`. Create the seed from `foundry/missions/_template.md` under `foundry/missions/<owner-repo>/`. Never write it into the target repo, `.agents/skills`, `.claude/skills`, or another installed copy. If the source root is unavailable, return the complete seed and report the blocked write.

## 1. Define the selection boundary

Confirm the repository, contribution role, available environment, and any user preferences such as bug versus feature, learning value, risk tolerance, language, or time budget.

State the backlog window you inspected. Never imply a complete sweep when the API, pagination, permissions, or time limit truncated it.

If an issue is already selected, stop. Return the existing Issue Contract and next incomplete phase, or create a selected-state seed when the user authorized the workflow. Do not repeat selection.

## 2. Survey cheaply

List enough metadata to map the backlog before reading every body:

- issue number and title
- labels and age
- comment count
- linked or cross-referenced PRs
- assignee when available

Cluster titles by theme to find concentrated pain, but do not infer duplicate meaning from titles alone.

## 3. Qualify candidates

Read the full body and relevant comments only for plausible candidates. Prefer work that is:

- actionable from the available environment
- likely to admit a deterministic validation path
- bounded enough to review independently
- compatible with repository contribution policy
- not already owned by an active contributor or PR
- valuable for the user's stated goal

Record uncertainty rather than inventing certainty. A candidate may remain viable with `?` for reproducibility or scope; Triage will prove those claims after selection.

Do not silently discard issues. Keep a short deferral log with the reason: unavailable environment, insufficient information, feature outside preference, active PR, breaking risk, or truncated inspection.

## 4. Present the candidate matrix

Show three to five candidates at most. Use categories supported by the inspected evidence, not fake precision or composite numeric scores.

| Issue | Type | Local fit | Validation path | Scope | Existing PR | Risk | Learning value |
|---|---|---|---|---|---|---|---|
| `#N title` | bug/feature | yes/no/? | high/medium/low/? | small/medium/large/? | none/active/stale/? | low/medium/high | low/medium/high |

Explain the decisive evidence or uncertainty behind each row. Mark one recommendation and explain why it best matches the user's criteria.

## 5. Let the user choose

Stop after the matrix and recommendation. The agent preselects; the user makes the final pick. Do not begin reproduction, implementation, assignment, tracker comments, branches, or PR work without that choice and the corresponding authority.

After selection, create or update a compact Issue Contract seed. Bugs and unverified behavioral claims normally enter `reproducing`. A sufficiently specified enhancement may enter `implementing` only when acceptance, non-goals, invariants, and change-surface obligations already exist.

```yaml
selected_issue: owner/repo#N
why_worth_it: []
known_evidence: []
unknowns: []
risks: []
deferred: []
contract: foundry/missions/owner-repo/N.md
state: selected
next_phase: reproducing | implementing
```

## Complete when

The user has selected one issue from an evidence-backed shortlist and the canonical Issue Contract preserves the bounded mission and next phase. Shipping the issue is explicitly outside this skill.
