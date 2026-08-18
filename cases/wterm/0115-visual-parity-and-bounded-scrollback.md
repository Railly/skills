# Case: Visual parity does not prove bounded scrollback

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-08-12
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/issues/61, https://github.com/vercel-labs/wterm/pull/115, commit `b89cd3d0331f29b39c3bf2a8d0e1d83acf9d5984`

> Technical validation and browser evidence are complete on the PR head. Human review, maintainer acceptance, merge, and release remain pending.

## Observed condition or claim

The terminal retained a bounded core scrollback ring but materialized every retained history row in the DOM. A thousand-line history therefore produced one thousand scrollback elements even when the browser displayed only a small viewport.

Reducing the element count was not sufficient by itself. The visible history position, bottom-follow behavior, resize anchoring, native selection, and rollover identity also had to remain correct.

## Red signal

After printing 1,200 lines in the built Vite fixture:

```text
origin/main: 1,000 mounted scrollback rows
PR at history position: 63 mounted scrollback rows
PR at bottom: 13 mounted scrollback rows
```

The before and after screenshots while reading history were byte-identical. That proved visible parity, but the identical pixels did not prove that the DOM was bounded. The node count supplied the missing structural signal.

## Method used

1. Replaced retained-history materialization with a viewport window plus overscan.
2. Added spacers so virtualized rows preserve the full scroll geometry.
3. Preserved native selection by temporarily widening the mounted window around the selected range.
4. Added a monotonic discarded-row count to built-in and Ghostty cores.
5. Adjusted `scrollTop` by the discarded-row delta while the user reads history.
6. Kept third-party cores correct when the optional count is absent by re-reading the visible window instead of reusing rows at a constant retained count.
7. Drove the built Vite artifact in isolated Chromium sessions against `origin/main` and the PR with the same viewport and command.
8. Paired screenshot parity with DOM-row counts and behavior-specific Playwright assertions.
9. Forced each major seam red, restored the implementation, and reran green.

## Outcome

PR #115 is open at `b89cd3d`.

- Visible history remains unchanged in the sampled browser comparison.
- Mounted scrollback rows fall by 93.7% at the sampled history position and 98.7% at the bottom.
- Output at the exact bottom follows the bottom.
- Typing while reading history returns to the bottom.
- Resize preserves the first visible history row.
- Rollover identity is carried across the core-to-DOM boundary.
- Native selection remains mounted.
- Third-party cores without the optional rollover signal refresh correctly.

CI, Vercel deployment, Socket checks, and the exact-head local gate passed. Human approval and merge remain pending.

## Evidence

- Source: issue #61, PR #115, commit `b89cd3d0331f29b39c3bf2a8d0e1d83acf9d5984`.
- Runtime: built Vite fixture in isolated Chromium sessions at 1280 by 720 after printing 1,200 lines.
- Tests: 63 core, 125 DOM, 42 Ghostty, and 14 Playwright tests passed on the exact head; build, type-check, lint, and format also passed.
- Review: CI, Vercel deployment, and Socket checks passed. Human review and maintainer acceptance are pending.
- Artifact: history-position screenshots were byte-identical; measured mounted rows were 1,000 before, 63 after in history, and 13 after at the bottom.

## Transferable lesson

Virtualization changes two independent properties: what the user sees and how much structure the browser retains. Prove visible parity with rendered evidence, prove boundedness with node counts, and prove anchoring with behavioral assertions that force rollover, input, and resize seams. No one signal substitutes for the other two.

## Exceptions

The browser comparison covers the built Vite fixture, Chromium, one viewport, and one generated history sequence. It does not prove pixel identity across browsers, terminal cores, fonts, or every selection shape. The optional third-party-core fallback preserves correctness but cannot provide exact rollover anchoring without a discarded-row identity signal.

## Candidate changes

- Deterministic check: every scrollback virtualization change must assert a mounted-row ceiling and separately drive bottom-follow, history reading, input return, resize, rollover, and selection.

## Confidentiality review

The case contains only public issue, PR, commit, aggregate test results, and generic browser evidence. It excludes local paths, private discussion, internal environment identity, and unpublished review text.
