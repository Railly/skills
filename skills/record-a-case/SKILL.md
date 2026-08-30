---
name: record-a-case
description: "Record completed or interrupted maintenance work as an evidence ledger and classify its compiled-knowledge disposition. Use after resolving, disproving, reviewing, or investigating an issue, PR, incident, or agent run; when backfilling an old session; or when another skill needs durable evidence before extracting or reinforcing a pattern."
compatibility: Requires access to the work evidence. Writing a case requires an authorized destination; live issue, PR, branch, and release checks require network access.
---

# Record a case

Treat the case as an evidence ledger. Preserve what happened before extracting a method. Promotion is a separate process.

## Canonical write root

Before writing, resolve the canonical `Railly/skills` checkout through `RAILLY_SKILLS_REPO`, `~/Programming/railly/skills`, or `~/railly-skills`. The canonical resolver is `scripts/resolve-source-root.mjs`. Never write a case, eval, or log into the current repo's `.agents/skills`, `.claude/skills`, another installed skill copy, or the target repository. If the source root is unavailable, return the draft and report the blocked write.

## 1. Bound one case

Name the maintenance unit: one issue, PR, incident, review, disproven claim, or coherent batch with one transferable lesson. Split unrelated outcomes even when they occurred in the same session.

**Complete when:** every included outcome shares one mechanism and one transferable lesson.

## 2. Build the ledger

Inventory evidence before prose. Collect durable retrieval handles:

- repository, commit, branch, issue, and PR
- Issue Contract path, final state, and acceptance IDs when one exists
- exact command and behavior-specific output
- regression test and its fix-absent result
- restored green command
- built, installed, deployed, or serialized artifact check
- review and maintainer decision

Classify every material claim as retrievable evidence, unreviewed report, inference, or unknown. Recheck drift-prone state such as PR status, branch head, merge, and release. Session summaries supply leads.

**Complete when:** every material claim has a class and every drift-prone state has a dated check or is explicitly unknown.

## 3. Assign independent statuses

Record technical validation, human review, maintainer acceptance, and delivery independently.

For an agent-generated or synthetic backfill, default to:

```text
Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
```

Advance each field only from evidence for that field. Branch existence, test behavior, human review, maintainer acceptance, and delivery remain separate facts.

**Complete when:** each status cites supporting evidence or retains its conservative default.

## 4. Extract the lesson

Describe the observed condition, red signal, method, outcome, and limits using the ledger's claim classes. State when the fix covers a failure family or mechanism proxy rather than the reporter's exact environment.

Choose the smallest provisional destination:

- `skill method`
- `reference rule`
- `exemplar`
- `deterministic check`
- `behavior eval`
- `coverage gap`
- `no change`

**Complete when:** the lesson states its evidence boundary and exactly one smallest destination is selected.

## 5. Classify compiled knowledge

Read the compact knowledge index before opening detailed pattern or provenance pages. Record exactly one disposition and its typed target:

- `link-existing` with an existing `pattern.<id>` when the case reinforces that pattern
- `create-candidate` with a new `pattern.<id>` when no existing pattern fits; create it with candidate status and link the case as source evidence
- `gap` with an existing `gap.<id>` when evidence is missing or ambiguous
- `no-change` with `none` when the lesson should remain case-local

For `link-existing`, add the case as active origin, application, evaluation, or transfer evidence. For `create-candidate`, add it as active origin evidence. Contradiction, rejection, or inactive evidence cannot support either disposition. Update skill provenance only when the case supports a typed relationship. Never edit an installable skill during this step. Promotion and procedural mutation remain separate reviewed workflows.

**Complete when:** the case, target pattern or gap, and reverse links agree; generated projections are current; and the case operation changed no file under `skills/`.

## 6. Pass the confidentiality gate

For a public case, retain public repositories and the author's public work. Sanitize secrets, customer data, private review text, internal chat, local paths, neighboring-project identity, and unapproved employer context. Ambiguous provenance routes the case to an approved private destination or a public coverage-gap record.

**Complete when:** every source is authorized for the chosen visibility and the public draft contains no private retrieval handle or identity.

## 7. Materialize the case

Read [the case schema and allowed values](references/template.md), then write to `cases/<repo>/` under the canonical source root. Use another destination only when the user explicitly names it and it is not an installed skill copy. Follow the canonical corpus naming and validation rules. Without write authority, return the complete draft in the response.

Set human-review status only from explicit human feedback or retrievable review evidence. Present new agent-authored records as pending review.

When the case closes a live mission, update its canonical Issue Contract to `Status: closed` and record the case path and final delivery state. Do not fill missing proof retrospectively.

Stage the new public case before validation so tracked-file evidence checks can resolve it, then validate the case and compiled knowledge and regenerate projections.

**Complete when:** the artifact passes the destination's validator, all schema fields and the knowledge disposition are resolved, the live contract points to the case when applicable, and a reader can reconstruct the work from retrieval handles without trusting the narrative.
