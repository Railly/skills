# Review Gate: json-render Vue named slots

Date: 2026-08-18
Base: `ea4b361b9ff23bcab20286c4f559a5316f0e892b`
Head: `a34d63bc89f69dc96648de456f1b8c4c8d6e6abd`
Author runtime: Codex
Reviewer runtime: Codex focused pass

## Verdict

Pass. No blocking findings. The branch recreates PR #322 on current `main`,
preserves wotnak through `Co-authored-by`, and adds the discriminator coverage
required by the preceding Solution Gate.

Cursor Grok 4.6 and Fable 5 review launches repeatedly stalled without output.
They are not counted as evidence. The focused lens therefore used the author
runtime and carries the same-family warning required by Review Gate.

## Spec boundary

No separate Issue Contract or Spec review was supplied. Solution Gate contract:
`foundry/runs/solution-gate/2026-08-18-json-render-vue-named-slots/candidate-audit.md`.
Spec review status remains `not_provided`.

## Deterministic checks

- Style: pass.
- Surface map: pass. Vue renderer changes include package README, web API docs,
  and Vue skill.
- Caller sweep for `defineRegistry`: pass.
- Sibling sweep for `named slots`: acknowledged. Historical changelogs, core
  contract pages/tests, and other renderer schemas describe the existing shared
  contract or their own platform support; this change adds only Vue runtime
  parity. Vue schema's existing catalog-slot comment remains accurate.
- Diff whitespace: pass.
- Head coverage: run report created for exact head before push.

## Subsystem model and adjacent layers

`UIElement.slots` is shared core input. Vue `ElementRenderer` is the delivery
owner for both raw registries and `defineRegistry` wrappers. Catalog metadata is
diagnostic authority only and lives in a process-local `WeakMap`; rendering does
not depend on it. Default content remains owned by `children`, while named slot
functions are lazy and sit outside the repeat provider created by their owner.

Adjacent layers inspected: raw versus wrapped delivery, metadata-less registries,
loading warning suppression, repeat scope, nested stream conversion, schema and
prompt advertising, public component context types, and documentation.

## Triggered lenses

- New-domain matrix: run. Covered raw and wrapped registries, consumed and
  unconsumed slots, declared and undeclared names, `slots.default`, loading,
  owner repeat, nested conversion, and prompt output.
- Fresh-seam scan: run. The low-level renderer is the common seam; no wrapper-only
  delivery was found.
- Error-path forcing: run. Missing references and invalid slot names were forced.
- Boundary pipeline trace: run. Spec slot keys reach Vue native slot functions,
  then raw or wrapped components.
- Substrate verification and dogfood: run through mounted Vue components using
  `@vue/test-utils`.
- Docs-behavior parity: run. Docs match observed Vue slot behavior.
- Demonstrative example: run. Examples require named outlets to render header
  and footer content.
- Complexity budget: run. Per-render metadata/name checks and child mapping are
  linear in the element's declared slots and referenced children.

Other catalog lenses were skipped because the diff does not replace a data
source, deepen resolution, parse shell input, add a process/channel, add a shim,
change defaults, add persistent state, add a new failure outcome, propagate a
flag, add recovery/cancellation behavior, assert a global invariant, or include
a decision trail.

## Verification

- Focused Vue renderer and hooks: 36/36 passed.
- Repository type-check: 59/59 tasks passed.
- Repository lint: 14/14 tasks passed.
- Full test suite: 66 files, 1,069/1,069 tests passed.
- Force-red: removing `{ ...namedSlots }` from the Vue component delivery made
  five renderer tests fail. The tree was restored from snapshots and verified
  clean afterward.
- Impact Map: 12 changed symbols, 24 impacted symbols, 5,134 edges, 18,264
  unresolved calls. The map under-covers and was used only for orientation.
  Convergence points inspected were `defineRegistry → registry/mountRenderer`,
  Vue schema parity, and `BaseComponentProps → ComponentContext`.

## Exemptions claimed

- No changelog update: releases are manual and maintainer-owned; this is a
  feature PR, not release preparation.
- Core and other renderer named-slot surfaces are unchanged because the shared
  contract already exists and this branch adds Vue-only runtime parity.
- `BaseComponentProps.slots` being required is accepted additive context surface:
  the renderer always supplies it, ordinary destructuring consumers remain
  compatible, and repository type-check passes. Consumers manually constructing
  a complete context object may need to add `slots`.
- Raw registries without catalog metadata may omit slot-name warnings by design;
  rendering behavior remains identical.

## Issue candidates

None.
