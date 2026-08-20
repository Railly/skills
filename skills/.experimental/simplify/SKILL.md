---
name: simplify
description: "Reduce code size, PR additions, duplication, ceremony, or maintenance surface while preserving behavior and regression protection. Use whenever the user asks to simplify, deduplicate, delete unnecessary code or tests, reduce LOC, shrink a diff below a line budget, centralize repeated runtime logic, or make a feature smaller without changing its contract. Implement when edits are authorized; remain read-only for audit-only requests. Use quality-baseline for broad repository health audits and improve for broad advisory planning."
compatibility: Requires git and the repository's normal build and test tools. A writable repository is required only when implementation is authorized.
---

# Simplify

Produce a smaller system, not merely a smaller-looking diff. Preserve the feature, public contracts, distinct regression invariants, and operational behavior while removing duplicated or unnecessary structure.

This skill takes precedence over `quality-baseline` and `improve` only for a bounded simplification request. Do not use it to refactor unrelated code. Read [method details](references/method.md) before measuring or editing.

## 1. Establish authority and state

- For audit, recommendation, or opportunity-finding requests, remain read-only and return a ranked reduction plan.
- For explicit simplify, reduce, clean-up, or line-budget requests, implement only within that scope.
- Run `repo-write-preflight` when the target may not be writable.
- Read repository instructions and preserve unrelated worktree changes.
- Record the target, base, branch, HEAD, dirty state, package manager, verification commands, and requested metric.
- Do not push, merge, release, publish, or rewrite history without separate authorization.

## 2. Measure and freeze the contract

Measure the complete authorized tree, including untracked files, by production, tests, documentation, and configuration. Reconcile every number with `git status`. Treat an unspecified line budget as additions.

Do not game the metric through minification, collapsed formatting, generated blobs, language or type-safety downgrades, or moving code outside scope.

Before deleting anything, inventory:

- public inputs, outputs, errors, exports, compatibility, and user-visible claims;
- security boundaries and operational behavior such as persistence, retries, cleanup, recovery, and concurrency;
- supported implementations and runtimes;
- every distinct regression invariant represented by tests.

Treat tests by invariant, not file count. Shared contracts must still execute against every implementation. Consolidate or delete a test only after proving another test guards the same defect at the same boundary.

## 3. Select the reduction

Rank candidates by net savings, proof cost, regression risk, and cognitive load. Prefer:

1. shared test contracts or harnesses for literal duplication;
2. small internal abstractions for duplicated production behavior;
3. consolidated types, strict validators, parsers, and serialization logic;
4. one canonical documentation example with concise sibling references;
5. redundant wrappers, branches, imports, helpers, and no-op handling;
6. proven dead code after callers, exports, dynamic loading, and variants are checked.

For each candidate, state the exact surface, gross and net savings, affected contracts, focused proof, and stop condition. Choose the smallest set with margin below the target.

## 4. Implement in reversible slices

Apply one reduction class at a time. After each slice:

1. run focused tests and type checks;
2. remeasure tracked and untracked files;
3. confirm the invariant and implementation matrix still executes;
4. inspect the diff for behavior changes;
5. revert or redesign reductions with poor savings or clarity.

Keep framework-specific behavior at thin adapter boundaries. Share only genuine state machines and transformations. Validate untrusted persisted data once at a strict boundary, reject arrays where records are required, and avoid a dependency when a short local parser is clearer.

## 5. Prove equivalence

Run gates in this order unless repository instructions are stricter:

1. focused checks after each slice;
2. all deterministic build, type-check, test, lint, format, and diff checks;
3. `test-strength` with reversible force-red mutations for moved or consolidated protection;
4. `resilience-audit` when persistence, retry, concurrency, cleanup, queues, partial writes, or recovery changed;
5. `review-gate` against the exact final tree or commit.

External reviewers must finish. Budget exhaustion, missing credentials, runtime failure, and absent reports are gaps, never passes. Use existing authorized credential setup when available and do not impose an artificial review budget.

## 6. Preserve history and report

Default to one new signed append-only commit. Do not amend, squash, or force-push unless explicitly authorized. Exclude unrelated artifacts and never add agent coauthor trailers.

Report before and after lines and files by category, reductions made, preserved invariant matrix, every gate result, remaining gaps or justified duplication, and exact commit, PR, merge, and release state.

## Stop conditions

Stop instead of forcing the metric when it requires deleting a unique invariant, increases coupling or cognitive load, cannot preserve compatibility, depends on unrelated refactors, relies on metric tricks, or needs authority beyond the request.
