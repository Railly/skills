# Review gate: json-render PR #256

Verdict: request changes.

## Findings

1. Blocker: current `main` does not build with the PR. `validateSpec` passes
   `string | { $item: string }` into `getByPath`. A clean `main` core build
   passes; the composed PR fails at `packages/core/src/spec-validator.ts:142`.
2. Blocker: `@json-render/svelte` fails type-check and has no nested-repeat
   resolver. Its `RepeatChildren.svelte` still treats `statePath` as a string.
3. Invalid top-level `$item` repeat paths warn, then fall back to root state and
   render it. Existing `$item` semantics return `undefined` outside a repeat.
4. `{ $item: "/subitems" }` fails because string concatenation creates a double
   slash, although the existing `$item` resolver accepts both `field` and
   `/field`.
5. Generated prompts, package docs, web docs, and skills still describe
   `repeat.statePath` only as an absolute string path.

## Verified

- The PR React regression passes.
- The regression goes red when the implementation is reverted.
- React's newer per-item repeat filtering can coexist with the nested-repeat
  change after resolving the merge conflict with both contexts.
- Image, Ink, React Email, React Native, React PDF, Solid, and Vue build after
  the temporary validator accommodation.
- `git diff --check` and the style gate pass.

## Required before approval

1. Rebase on current `main`.
2. Add one shared core helper for resolving repeat paths. Use it in validation
   and every renderer, including Svelte.
3. Make outside-scope `$item` resolve to no items or fail validation. Do not
   reinterpret it as a root path.
4. Normalize relative `$item` paths consistently with existing `getByPath`
   behavior.
5. Add Svelte and core-validator regression tests, plus one parity test for each
   renderer family.
6. Update the generated prompt, React schema rule, package docs, web data
   binding docs, and relevant skills.

## Exemptions claimed

- Historical changelogs do not need retroactive edits.
- Action `statePath` parameters remain strings and are outside this change.

## Issue candidates

- `catalog.validate()` stripping `repeat` and other runtime fields is
  pre-existing and already tracked by issue #222 and PR #255.

## Provenance warning

The PR declares Codex assistance and this review used Codex, so author and
reviewer share a model family.
