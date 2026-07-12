---
name: pick-an-issue
description: Survey an unfamiliar or shared issue backlog, qualify a small set of worthwhile contributor-side candidates, compare them in an evidence-backed matrix, recommend one, and let the user make the final selection. Use for requests like "what should I work on here", "find a good issue to fix", or choosing among open issues. Do not use for maintainer-side tracker triage or when an issue is already selected.
---

# Pick an issue

Protect the user's attention before expensive investigation begins. Survey cheaply, qualify ruthlessly, show the tradeoffs, and let the user choose. This skill ends at selection; `unfold` owns the resulting maintenance mission.

## 1. Define the selection boundary

Confirm the repository, contribution role, available environment, and any user preferences such as bug versus feature, learning value, risk tolerance, language, or time budget.

State the backlog window you inspected. Never imply a complete sweep when the API, pagination, permissions, or time limit truncated it.

If an issue is already selected, stop. Hand it to `unfold` Triage instead of repeating selection.

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

After selection, produce a compact handoff. Bugs and unverified behavioral claims normally enter Triage. A sufficiently specified enhancement may enter Change directly.

```yaml
selected_issue: owner/repo#N
why_worth_it: []
known_evidence: []
unknowns: []
risks: []
deferred: []
next:
  skill: unfold
  mode: Triage | Change
```

## Complete when

The user has selected one issue from an evidence-backed shortlist and Unfold has a bounded mission at the correct mode. Shipping the issue is explicitly outside this skill.
