---
name: pick-an-issue
description: Deprecated compatibility alias for issue-intake. Survey a contributor-side backlog, qualify three to five candidates, recommend one, wait for the user's choice, and seed the canonical Issue Contract. Use only when an existing workflow explicitly invokes pick-an-issue. Prefer issue-intake for new work.
compatibility: Retained for the v0.0.4 migration window. Requires backlog read access. Uses xref for graph evidence when available. Contract materialization requires a writable canonical Railly Skills source repository.
---

# Pick an issue

Deprecated compatibility alias. Use `issue-intake` for new workflows. This alias remains autonomous for one release so existing installations do not break.

## Boundary

Own `backlog -> qualify -> human choice -> Issue Contract seed`. Stop before reproduction, implementation, assignment, tracker comments, branches, or pull requests. If an issue is already selected, return the existing contract and next incomplete phase instead of rescanning.

## Method

1. Confirm the repository, contributor role, environment, preferences, and inspected backlog window. Report truncation.
2. Map issue metadata cheaply: number, title, labels, age, comments, assignee, linked pull requests, and cross-references.
3. When `xref` is available, run `xref --seeds N,N,N --repo owner/repo --prioritize --cluster` for plausible candidates. Treat rankings and clusters as evidence, not selection authority.
4. Read bodies and relevant comments only for plausible candidates. Record uncertainty and a short deferral reason for discarded issues.
5. Present three to five candidates in an evidence-backed matrix covering local fit, validation path, scope, existing work, risk, and learning value. Recommend one without fake scores.
6. Stop for the user's choice.

After selection, resolve the canonical `Railly/skills` checkout through `RAILLY_SKILLS_REPO`, `~/Programming/railly/skills`, or `~/railly-skills`. Use `scripts/resolve-source-root.mjs` and `foundry/missions/_template.md` to create `foundry/missions/<owner-repo>/<number>.md`. Never write contracts into the target repository or installed copies under `.agents/skills` or `.claude/skills`. If the canonical source root is unavailable, return the complete seed and report the blocked write.

The seed must preserve the selected issue, why it matters, known evidence, unknowns, risks, deferrals, current state, and next phase. Bugs and unverified behavior normally enter `reproducing`; a fully specified enhancement may enter `implementing`.

## Complete when

The user selected one issue and the canonical Issue Contract preserves the bounded mission and next phase. Shipping the issue is outside this alias.
