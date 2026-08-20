# Simplification method details

Use this reference while measuring, planning, implementing, and proving a reduction.

## Honest measurement

Report files changed, additions, deletions, and net lines by production, tests, documentation, and configuration. A working-tree `git diff --numstat` omits untracked files, so use a temporary index or count every untracked authorized path separately without staging unrelated work.

Correct any earlier number immediately if reconciliation with `git status` finds an omission. Include the shared replacement when calculating net savings.

## Behavioral contract

Freeze public behavior, user-visible flows, trust boundaries, supported variants, persistence and recovery behavior, and distinct test invariants before selecting deletions. Literal test duplication does not imply duplicate coverage. A shared parametrized contract is safe only when each implementation still runs it and each invariant remains visible.

Check callers, public exports, dynamic loading, generated consumers, and runtime variants before declaring code dead.

## Reduction map

For each candidate record:

- duplicated or unnecessary surface;
- projected gross and net savings;
- contracts and implementations affected;
- focused verification;
- stop condition if the abstraction is harder to understand than the duplication.

Aim below a numeric threshold with enough margin for formatting or necessary regression assertions.

## Runtime centralization

- Preserve request parsing, routing, build hooks, framework behavior, and public types at adapter boundaries.
- Move only shared state machines and transformations.
- Prefer a small strict record helper or parser over repeated shallow casts.
- Reject arrays when a record is required.
- Preserve fail-closed behavior for malformed persisted or serialized data.

## Test centralization

- Keep each distinct invariant and test name visible.
- Inject implementation-specific behavior through a narrow harness.
- Confirm test discovery executes the contract for every package or adapter.
- Exercise the built or packaged boundary when workspace resolution could hide source mutations.

## Proof depth

Test Strength must show that consolidated tests are not decorative. Mutate the decisive shared behavior, confirm every relevant consumer fails for the intended assertion, restore from a filesystem snapshot, and rerun green.

Resilience must force applicable failures independently, then repeat under realistic concurrency. Cover malformed state, ambiguous success, retry, cleanup, partial writes, queue recovery, cancellation, and idempotency as applicable. A report for an earlier SHA is historical evidence, not a pass for the final tree.

Review Gate must inspect the exact final tree. External review completes only when its report is actionable and finished, without artificial token or time budgets.
