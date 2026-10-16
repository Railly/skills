# Case: Keep the diagnosis, change the placement when the fix lands in a hot path

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-07-28
Visibility: public
Repository: vercel-labs/wterm
Role: maintainer
Source: https://github.com/vercel-labs/wterm/pull/92, superseding #65 and #68

## Observed condition or claim

Two pull requests from the same external contributor, open 84 days, reporting the same underlying defect from two directions: views cached over WebAssembly memory become detached when the module grows memory mid-call, throwing `Cannot perform ... on a detached ArrayBuffer`.

- #68: `writeRaw()` built one `Uint8Array` before its loop, but `writeBytes()` inside the loop can grow memory. Fixed by moving the view creation inside the loop.
- #65: `getCell()` and `getScrollbackCell()` read through a `DataView` cached once at init. Fixed by constructing a new `DataView` on every call.

Both diagnoses were correct. Both fixes worked.

## Red signal

The two fixes have the same shape but land in paths with call frequencies three orders of magnitude apart. `writeRaw()` iterates once per 8192-byte chunk, so #68's per-iteration allocation is bounded by payload size and only affects writes large enough to have been broken anyway.

`getCell()` is called from the renderer once per cell, per row, per frame. On a 256 by 60 grid that is roughly 15,000 `DataView` allocations per frame. The correctness fix was right and its placement made it a rendering-throughput regression on the exact path a terminal renderer spends its budget in.

The signal was in the call sites, not the diff: two call sites in the renderer, both inside per-cell loops.

## Method used

1. Read both pull requests as one defect rather than two, since the same detached-buffer mechanism produced both.
2. Located the call sites of each patched function before judging the fix, which is where the frequency asymmetry appeared.
3. Kept #68 verbatim. The per-chunk allocation is correct and its cost is irrelevant at that frequency.
4. Replaced #65's approach while keeping its diagnosis: cache the `DataView` as before, but invalidate it by comparing buffer identity against `this.memory.buffer`. Growth replaces the buffer object, so identity comparison detects exactly the condition that detaches the view, at the cost of one reference comparison per call instead of an allocation.
5. Recreated both as a single commit with the original author credited as co-author, rather than merging the external branches, and stated the changed approach in the pull request body and again on #65 itself so the author could see why.
6. Wrote regression tests against the real compiled module rather than a mock, exercising both paths: a multi-chunk `writeRaw` forced to grow memory mid-loop, and direct `WebAssembly.Memory.grow()` calls before reading cells.

## Outcome

- One commit covering both reports. `writeRaw` creates its view per chunk; the grid and scrollback `DataView` is invalidated by buffer identity through a private accessor.
- Three regression tests against the real compiled wasm. All three fail against the unfixed source with the detached-buffer error and pass with the fix.
- Merged, and accepted by the repository owner.
- Both original pull requests closed with the mechanism and, for #65, the reason its approach was changed, including the measured cost of the rejected approach.

## Evidence

- Source: PR #92, one commit on `packages/@wterm/core/src/wasm-bridge.ts`. Superseded PRs #65 and #68, both credited by co-author trailer on the commit.
- Runtime: not exercised through a live terminal session. The defect and fix were verified through tests against the real compiled module rather than a running renderer.
- Tests: three tests against the real compiled wasm, verified in both directions by reverting the source and re-running. The per-frame allocation cost of the rejected approach was derived from the call sites and grid dimensions, not benchmarked.
- Review: repository owner approved and the change merged.
- Artifact: full workspace build, test, format, lint, and type-check pass. The package generates part of its own source at build time, so the build must precede the test run.

## Transferable lesson

> When an external fix is correct but lands in a hot path, keep the diagnosis and change the placement. A cache that can be invalidated by identity comparison is usually available where a per-call reconstruction was proposed, because whatever invalidates the cached object typically replaces the object the cache was derived from. Growth replaces the `ArrayBuffer`, so comparing buffer identity detects exactly the detachment condition without allocating.

Secondary: the same correctness fix can be free in one function and expensive in another, and nothing in the diff tells you which. Only the call sites do. Two reports with identical shape needed opposite decisions, and reading the diff alone would have accepted or rejected both together.

Third: when you change a contributor's approach, say so where they will see it and give the number. "Same guarantee, no hot-path cost" plus the measured allocation count is checkable; "we did it differently" is not.

## Exceptions

The 15,000 allocations per frame figure is derived from the renderer's call sites and a plausible grid size, not measured under a profiler. The direction is not in doubt, the fix moved from per-call allocation to per-call reference comparison, but the magnitude is an estimate. No benchmark was run before or after.

## Candidate changes

- Skill method: no change
- Reference rule: before accepting or rewriting a fix, read the call sites of the patched function to establish its call frequency
- Exemplar: no change
- Deterministic check: no change
- Eval: no change
- Coverage gap: no test or benchmark guards per-frame allocation on the render path, so this regression would not have been caught after merging
- No change: not selected

## Confidentiality review

Public repository, public pull requests, public author credited by co-author trailer. No local paths, no private review text, no internal discussion referenced.
