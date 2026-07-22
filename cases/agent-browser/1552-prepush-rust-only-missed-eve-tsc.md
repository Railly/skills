# Case: pre-push Rust-only gate missed an eve TypeScript break

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-22
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: PR #1552 (branch fix/getbyrole-ax-tree-case-insensitive); commit 6c51a07 (CI red), commit 3cbc15f (CI green); CI run 29893517759 (Eve Package + Sandbox Package failed)

> Agent-authored record, pending human review. The fix is on an open PR, not merged; maintainer has not reviewed this specific commit.

## Observed condition or claim

While closing an advertised-capability finding on PR #1552, the fix removed `type`, `focus`, and `uncheck` from the `find` action lists across four surfaces to match the dispatcher's pinned `FIND_ACTIONS` (click/fill/check/hover/text). One of those surfaces was the eve extension's Zod enum: `action: z.enum([...])` in `packages/@agent-browser/eve/extension/tools/find.ts`. The commit passed all local pre-push checks and was pushed (6c51a07); CI then failed on Eve Package and Sandbox Package.

## Red signal

CI red on 6c51a07 (Eve Package, Sandbox Package) after a local push that reported clean. The local pre-push hook ran `cargo fmt --check` and `cargo clippy -D warnings` and passed; it never ran the eve/sandbox TypeScript build, so the break was invisible until CI.

## Method used

Reproduced the CI failure locally in a worktree at the pushed commit: ran the eve package build (`pnpm run build`, which runs `tsc`). tsc failed on `find.ts` line 28, `action === "type"`: after `"type"` was removed from the enum, the compiler narrowed `action` to the five remaining values, so the comparison had no type overlap. Sandbox Package failed for the same reason (its build compiles eve). Fixed by dropping the dead `|| action === "type"` from the value guard (guard on `fill` only) and scoping the value description to `fill`. Confirmed the eve build returns exit 0, pushed 3cbc15f, CI green.

## Outcome

3cbc15f: CI SUCCESS on PR #1552 (Rust, Eve Package, Sandbox Package, and the rest). The advertised-capability finding is closed and the build is green.

## Evidence

- Source: vercel-labs/agent-browser PR #1552, commits 6c51a07 (red) and 3cbc15f (green)
- Runtime: eve `pnpm run build` reproduced the tsc no-overlap error at find.ts:28 pre-fix; returned exit 0 post-fix
- Tests: no unit test added; the failure and fix are compile-level (tsc), caught by the package build that CI already runs
- Review: CI run 29893517759 Eve Package + Sandbox Package failed pre-fix; full rollup SUCCESS post-fix. Maintainer review pending.
- Artifact: eve extension built to `dist` post-fix (exit 0)

## Transferable lesson

A pre-push gate scoped to one language misses build breaks in a sibling language in the same repo. Removing a value from a discriminated enum turns any remaining `x === <removed>` comparison into a no-overlap type error, so a change that looks like a docs/enum alignment is a compile change in the typed surface. When a diff touches more than one language's build (here Rust CLI plus a TypeScript extension), the local gate must run each touched language's build/typecheck, or CI is the first place the break appears. Scope the gate to what the diff touches, not to a fixed language.

## Exceptions

The fix is compile-level; a runtime regression test is not applicable. This covers the mechanism (enum-value removal leaves dead comparisons) and the process gap (single-language local gate), not a reporter's environment.

## Candidate changes

- Skill method:
- Reference rule: a local pre-push / pre-review gate runs the build or typecheck for every language whose files the diff changes, not a fixed single language
- Exemplar:
- Deterministic check: when a diff removes a member from a TS union/enum, grep the file (and its consumers) for `=== "<removed>"` / `case "<removed>"` and confirm none remain
- Eval:
- Coverage gap:
- No change:

## Confidentiality review

Public repository and the author's own PR. No secrets, customer data, private review text, or internal chat. Local filesystem paths and the personal machine-local hook's exact config are omitted; the lesson is stated as a general gate-scoping rule.
