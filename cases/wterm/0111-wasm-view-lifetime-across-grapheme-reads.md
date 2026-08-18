# Case: WASM view lifetime crosses secondary grapheme reads

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-11
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/111, commits `981868f0cd618047361a7a58a3cb6c67deb2f0c3` and `cdb41c98be3a911121ced5b57eeeb671134c4c6e`

> Technical validation, human review, maintainer approval, and merge are complete. No release newer than 0.3.3 contains this change yet.

## Observed condition or claim

PR #111 exported complete Ghostty grapheme strings through a secondary UTF-8 WASM accessor while retaining the fixed 16-byte viewport cell buffer. `GhosttyCore.getCell()` parsed the cached viewport `DataView`, then called `get_viewport_grapheme` only for cells marked as graphemes.

The initial implementation assumed that a clean viewport also implied a valid cached JavaScript view. That assumption was false because a secondary WASM read can grow `WebAssembly.Memory`, detach every view over the old `ArrayBuffer`, and leave the viewport contents logically clean.

## Red signal

Vercel Agent Review reported that `_ensureViewport()` returned early when `_viewportStale` was false without checking whether `_viewportView.buffer` still matched `memory.buffer`.

A real-WASM regression forced `memory.grow()` inside `get_viewport_grapheme`. The first grapheme read completed, but the next `getCell()` failed in `parseCell` with:

```text
TypeError: Cannot perform DataView.prototype.getUint32 on a detached ArrayBuffer
```

The project conventions already named this exact invariant for every cached WASM view, including the early-return cache-hit shape. The authored gate still missed the viewport instance.

## Method used

1. Loaded the committed `ghostty-vt.wasm`, not a mocked cell encoder.
2. Wrote a combining grapheme followed by an ordinary cell.
3. Wrapped the real `get_viewport_grapheme` export and forced one `memory.grow()` before forwarding to it.
4. Read the grapheme cell, then read the adjacent ordinary cell through the same cached viewport path.
5. Proved the new test red against the original implementation.
6. Changed `_ensureViewport()` to separate two concerns:
   - decode the viewport only when stale
   - recreate the `DataView` whenever `memory.buffer` identity changes
7. Re-ran the focused test, full repository checks, E2E tests, exact-head Review Gate, CI, deployment, and Vercel Agent Review.

## Outcome

PR #111 merged on 2026-08-11 as `77f2913`.

- Complete combining and ZWJ strings remain available from active cells and scrollback.
- Viewport cache hits no longer reuse a detached `DataView`.
- A memory grow does not force a redundant viewport decode; only the JavaScript view is reconstructed.
- The real-WASM Ghostty suite passed 38 tests.
- Full validation passed 15 builds, 14 test tasks, lint, 22 type-check tasks, and 12 Playwright tests.
- CI, Vercel deployment, Socket checks, and the second Vercel Agent Review passed on the fixed head.

An interactive visual before/after artifact was started using detached worktrees at the release baseline and PR head. Both real example builds ran and were manually opened, but screenshot capture and the final HTML were stopped by user request. They are not counted as completed evidence.

## Evidence

- Source: PR #111, original head `981868f`, review-fix head `cdb41c9`.
- Runtime: committed Ghostty WASM with `memory.grow()` forced inside the real grapheme export.
- Tests: the regression failed on the original production implementation at `DataView.getUint32` and passed after restoration; `@wterm/ghostty` passed 38/38.
- Review: Vercel Agent Review raised the detached-view finding on `981868f`; its second pass and every required check passed on `cdb41c9`. The PR received human approval and merged.
- Artifact: exact-head Review Gate records are `foundry/runs/review-gate/2026-08-10-wterm-cdb41c9.json` and `.md`. Visual comparison was interrupted before capture.

## Transferable lesson

Logical cache validity and JavaScript view validity are separate state. A WASM buffer can contain current data while every cached `DataView` over it is detached. Any path that returns a cached WASM view must check buffer identity on every hit, including after unrelated reads that may allocate.

## Exceptions

This case proves the failure family through forced memory growth at the real WASM boundary. It does not claim that ordinary grapheme reads grow memory on every render. The invariant matters because growth is legal and the cached view otherwise survives indefinitely.

## Candidate changes

- Reference rule: model WASM-backed caches as two layers, data freshness and view attachment, and force growth from every secondary accessor that can run between cache hits.

## Confidentiality review

All retrieval handles are public GitHub commits, PR state, public automated review, tests, and checks. Private chat, local worktree paths, internal identities, and unpublished visual URLs are excluded.
