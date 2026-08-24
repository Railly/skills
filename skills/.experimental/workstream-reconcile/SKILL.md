---
name: workstream-reconcile
description: Reassess one or more ongoing engineering workstreams by treating handoffs as leads and revalidating their drift-prone claims against live GitHub state, local Git checkouts, releases, deployments, and package registries. Use when work may have stalled or changed since the last handoff; when the user asks to reassess everything, refresh a portfolio, check new handoffs, find unpushed work, or produce a current software-factory queue. Do not use to write a handoff, inspect only one live GitHub queue with no prior state, or mutate repositories and external systems.
compatibility: Requires read access to the handoffs and relevant checkouts. Live verification may require git, gh, xref, package registries, and deployment CLIs. Degrade explicitly when a source is unavailable.
---

# Workstream reconcile

Turn historical coordination state into a current operating queue. Handoffs are discovery indexes, not current truth.

## Boundary

Remain read-only. Do not edit handoffs, repositories, issues, pull requests, branches, releases, deployments, or local snapshots. Do not run tests, builds, installs, migrations, generators, or commands that create project state.

Use `handoff` to close one working cycle, a live issue radar for a one-off GitHub queue, a persistent factory radar for GitHub portfolio deltas, and `record-a-case` for closed transferable lessons when those capabilities are installed. Use `xref --no-snapshot` when graph relationships materially affect the verdict; this skill owns reconciliation across sources.

## 1. Freeze scope and checkpoint

Resolve the requested workstreams, the current time, the prior checkpoint, authentication identity, and inspection limits. Prefer the newest portfolio checkpoint, then project handoffs updated after it. Preserve older handoffs only when they contain still-open claims or decisions.

List every handoff used with its modification or declared update time. State whether the sweep is complete, bounded, or truncated.

## 2. Extract volatile claims

Turn each handoff into a claim ledger. Revalidate claims that can drift:

- issue or pull-request state, head SHA, review, checks, mergeability, comments, assignments, and links
- local branch, HEAD, upstream, ahead/behind, dirty files, missing worktree, and unpushed commits
- release, tag, package version, deployment, and production-verification state
- named blocker, owner decision, and promised next action

Keep roadmap intent, historical reasoning, and already-decided boundaries as context unless newer evidence explicitly supersedes them. Never promote prose into observed fact.

## 3. Query the authoritative surfaces

Inspect the cheapest authoritative source for each claim:

| Claim | Primary source |
|---|---|
| GitHub object or review | `gh` or GitHub API at the exact item and head |
| Graph, competing work, or linked closure | `xref --no-snapshot` |
| Local delivery | `git status -sb`, `git rev-parse`, `git log`, upstream comparison |
| Published artifact | package registry, GitHub release, tag |
| Deployment | deployment provider inspection and exact commit |
| Human or production verification | explicit observed evidence; otherwise unknown |

Use unauthenticated public APIs only when authentication fails and record the reduced coverage and rate limit. A search result proves inventory, not checks or review details. A green old SHA does not validate a newer local or remote head.

## 4. Reconcile without averaging

For each claim record `checkpoint`, `current`, `evidence`, and `checked_at`. When sources disagree, preserve the disagreement and prefer the source authoritative for that fact. Separate these two axes:

**Delta**

- `unchanged`: current evidence matches the checkpoint
- `advanced`: moved toward delivery or verification
- `completed`: intended outcome is delivered at the required boundary
- `regressed`: previously satisfied evidence no longer holds
- `new`: entered scope after the checkpoint
- `unknown`: current evidence is unavailable or insufficient

**Operating state**

- `ready-action`: a bounded next action is available now
- `waiting-external`: another person or system owns the next transition
- `local-unpublished`: meaningful local state is absent from the remote
- `review-response-needed`: new human feedback is unresolved
- `integration-needed`: branch drift or conflict invalidates readiness
- `release-pending`: merge happened but the intended artifact is absent
- `verification-pending`: delivery exists but required observation does not
- `stalled`: the promised next action did not occur and current evidence shows no active external transition

Age alone never proves `stalled`. Name the expected transition, its owner, the last evidence of movement, and why the item is not merely waiting normally.

## 5. Build the current queue

Deduplicate issues covered by pull requests and releases covered by release pull requests, while preserving their relationships. Rank by:

1. local work at risk or completed fixes never pushed
2. new human review findings or invalidated approvals
3. conflicts, failed exact-head gates, and production/release gaps
4. near-ready merges and explicit external decisions
5. review follow-ups and genuinely stalled work

Do not use a synthetic score. Explain the decisive evidence and route each retained item to exactly one next system: maintainer execution, `review-gate`, `handoff`, release workflow, production verification, `record-a-case`, or human decision.

## Report

Lead with the material change since the checkpoint.

| Priority | Workstream | Checkpoint claim | Current evidence | Delta | Operating state | Exact next action |
|---|---|---|---|---|---|---|

Then include completed or retired items, newly discovered handoffs, unresolved decisions, and inspection limits. Link every external item and use clickable local paths when supported. End with one recommended first action and a no-mutation receipt.

## Complete when

Every retained claim has a dated authoritative check or is explicitly unknown, stalled work is proven rather than aged into existence, local/remote divergence is visible, the current queue is deduplicated and routed, and no state was changed.
