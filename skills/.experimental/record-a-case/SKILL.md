---
name: record-a-case
description: "Candidate: Record completed or interrupted maintenance work as an evidence ledger. Use after resolving, disproving, reviewing, or investigating an issue, PR, incident, or agent run; when backfilling an old session; or when another skill needs a durable case before extracting a method. Experimental and awaiting baseline evaluation."
compatibility: Requires access to the work evidence. Writing a case requires an authorized destination; live issue, PR, branch, and release checks require network access.
---

# Record a case

Treat the case as an evidence ledger. Preserve what happened before extracting a method. Promotion is a separate process.

## 1. Bound one case

Name the maintenance unit: one issue, PR, incident, review, disproven claim, or coherent batch with one transferable lesson. Split unrelated outcomes even when they occurred in the same session.

**Complete when:** every included outcome shares one mechanism and one transferable lesson.

## 2. Build the ledger

Inventory evidence before prose. Collect durable retrieval handles:

- repository, commit, branch, issue, and PR
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

## 5. Pass the confidentiality gate

For a public case, retain public repositories and the author's public work. Sanitize secrets, customer data, private review text, internal chat, local paths, neighboring-project identity, and unapproved employer context. Ambiguous provenance routes the case to an approved private destination or a public coverage-gap record.

**Complete when:** every source is authorized for the chosen visibility and the public draft contains no private retrieval handle or identity.

## 6. Materialize the case

Read [the case schema and allowed values](references/template.md), then write to the user-specified destination. When the repository has a case corpus, follow its naming and validation rules. Without write authority, return the complete draft in the response.

Set human-review status only from explicit human feedback or retrievable review evidence. Present new agent-authored records as pending review.

**Complete when:** the artifact passes the destination's validator, all schema fields are resolved, and a reader can reconstruct the work from retrieval handles without trusting the narrative.
