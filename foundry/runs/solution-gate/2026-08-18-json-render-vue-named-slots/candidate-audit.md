# Candidate audit: json-render Vue named slots

Date: 2026-08-18

## Candidate snapshot

- PR: `vercel-labs/json-render#322`
- Author: `wotnak <wotnak@pm.me>`
- Base: `ea4b361b9ff23bcab20286c4f559a5316f0e892b`
- Head: `c67314e82a9dd7a5a7d11384725c72f232cd516b`
- Local recovery ref: `refs/codex-audit/json-render-322`
- State at retrieval: mergeable, review required, Vercel previews blocked on
  authorization
- Mode: candidate audit
- Proposers: Cursor `claude-fable-5-high` and Cursor
  `cursor-grok-4.6-high`

The two Cursor proposers saw structurally isolated archives containing only
the base commit. Their proposals were sealed before the candidate was opened.
The root synthesizer had seen high-level PR details during the preceding xref
turn, so strict blindness applies to the two proposers, not the synthesizer.

## Verdict

**Amend.** Adopt the implementation shape and preserve wotnak's authorship.
Before merge, commit focused regression tests for the contract cells exercised
by probes C1 through C6 below. No architectural rewrite is warranted.

The candidate independently matches the selected blind shape on every material
mechanism. The amendment is test strength: its committed tests cover the
`defineRegistry` happy path and nested-spec preservation, but do not pin raw
registry delivery, lazy non-consumption, default-slot rejection, undeclared
slot behavior, loading warnings, repeat scope, or Vue prompt output.

## Candidate mechanism from code

- Vue owns the schema, runtime, types, documentation, and tests. Core is
  unchanged.
- `ElementRenderer` converts non-default spec slots to Vue-native slot
  functions and passes them to every registry component.
- `defineRegistry` exposes the Vue `Slots` object and preserves evaluated
  `children` for compatibility.
- A process-local `WeakMap` attaches catalog slot metadata to registries made
  by `defineRegistry` and `createRenderer`.
- Undeclared slots warn and still render. `slots.default` warns and is filtered
  out, leaving `children` as the sole default-content source.
- Named slots are built beside `RepeatChildren`, outside the repeat scope
  introduced by their owning element.
- Vue schema and prompt rules advertise named slots. Docs and the Vue skill are
  updated.

## Blind result versus candidate

| Dimension | Blind result | Candidate | Delta and evidence |
|---|---|---|---|
| Contract observable | Named content reaches the named outlet while default children remain unchanged | Same | Equivalent, observed by C1, C2, and committed renderer happy path |
| Primitive semantics | Lazy Vue slot functions | Same | Equivalent, observed by C1 with an unconsumed footer whose component setup count stays zero |
| Authority and trust | Catalog metadata diagnoses names; runtime still renders undeclared names | Same | Equivalent, observed by C3 |
| Negative cells | Ignore `slots.default`; tolerate missing refs during loading; owner slot stays outside repeat | Same | Equivalent, observed by C2, C4, and C5 |
| Ownership and lifecycle | Vue-local runtime/schema/types; process-local metadata | Same | No material delta, observed from diff and C1 to C6 |
| Compatibility and portability | Preserve `children`; raw registry delivery must work | Same | Equivalent, observed by C1 and C2; full type-check passed |
| Reusable implementation | One low-level renderer path supports raw and wrapped registries | Same | Equivalent, observed by C1 and committed wrapped-registry test |
| New accepted costs | Public context gains `slots`; registry metadata can be absent | Same | Accepted additive type/API surface and silent raw-registry diagnostics |

## Candidate forward trace

```text
spec element.slots
  -> ElementRenderer creates lazy named functions [observed]
  -> Vue invokes only outlets consumed by the component [observed C1]
  -> raw and defineRegistry components share delivery semantics [observed C1]
  -> catalog-backed registries add diagnostics without controlling rendering [observed C3]
  -> named content stays outside the owner's repeat provider [observed C5]
```

Harmful branch:

```text
new contract
  -> committed happy-path tests exercise defineRegistry only [observed]
  -> a later refactor can break raw delivery or eager evaluation [inferred]
  -> existing candidate tests remain green [inferred]
```

The bounded mitigation is to retain the discriminator tests, not to change the
runtime shape.

## Probe log

All candidate probes ran at head
`c67314e82a9dd7a5a7d11384725c72f232cd516b` in a disposable worktree.

- **C1 raw registry and laziness:** a raw Vue component consumed `header`,
  inspected but did not invoke `footer`, and rendered default children. Header
  and main rendered, footer content did not, and footer component setup calls
  remained zero. Passed.
- **C2 default ownership:** a catalog-backed component received both children
  and `slots.default`. Only children rendered and a `slots.default` warning was
  emitted. Passed.
- **C3 undeclared slot:** a slot absent from catalog metadata warned and still
  rendered. Passed.
- **C4 loading boundary:** a missing named-slot reference emitted no warning
  while loading and did emit one after loading. Passed.
- **C5 repeat boundary:** an owning element repeated over two items. Its named
  header rendered once, outside the repeated default children. Output was
  `HeaderAB`. Passed.
- **C6 prompt contract:** `catalog.prompt()` advertised `slots: header` and did
  not advertise `slots: default`. Passed.
- **C7 focused suite:** renderer, hooks, and discriminator tests passed 36/36.
- **C8 type safety:** repository `pnpm type-check` passed 59/59 tasks.

The install reused a symlinked temporary root `node_modules`, but package-level
`@json-render/core` resolved to the candidate worktree and every command first
verified the candidate head. Turbo also replayed some cache entries whose logs
name an older worktree. C7 executed candidate source directly, and the Vue build
and repository type-check completed successfully at the candidate path.

## Failure-shape score S1 to S12

- **S1 over-reach:** no hit observed. Core and other renderer packages are
  unchanged; `children` remains supported.
- **S2 under-reach:** implementation survives raw registry, wrapped registry,
  nested conversion, schema/prompt, repeat, and loading variants. Test coverage
  under-reaches until C1 to C6 are committed. Designed out by amendment.
- **S3 direction inheritance:** no bidirectional cause applies.
- **S4 proxy property:** metadata only controls diagnostics, not delivery. C3
  separately proves warning and rendering.
- **S5 unregistered peer:** no persistent state. The `WeakMap` lifecycle follows
  its registry object.
- **S6 peer-version blindness:** same-package schema/runtime release skew is an
  accepted package-version cost, not a cross-process protocol.
- **S7 wrong layer:** designed out. Delivery originates in `ElementRenderer`,
  and C1 proves the raw path.
- **S8 guard-derived cells:** designed out. Cells came from the blind contract,
  not candidate branches.
- **S9 test pins wrong thing:** hit in the committed candidate test set because
  it pins only the wrapped happy path. Designed out by committing C1 to C6.
- **S10 claim from prose:** designed out by executable probes and type-check.
- **S11 asymmetric validation:** accepted. Metadata-backed registries warn;
  metadata-less raw registries render without name diagnostics. Rendering
  authority is equal in both paths.
- **S12 primitive mismatch:** no hit. C1 proves Vue-native lazy invocation.

## Smallest auditable visual

Observed evidence:

```text
Spec slots
  |-- raw registry -> Vue slot function -> consumed named outlet [C1]
  |-- defineRegistry -> Slots + compatible children [C2, committed test]
  |-- diagnostics -> warn, do not block rendering [C2, C3, C4]
  `-- owner repeat -> named once + default per item [C5]
```

Proposed amendment:

```text
keep candidate code [observed match]
  `-> add C1-C6 as permanent focused tests [inferred protection]
      `-> hand exact cells to Review Gate [inferred]
```

## Handoff

Reusable work is the entire candidate implementation and documentation. Keep
wotnak as author; any test-only follow-up should be an additional commit or a
maintainer amendment that clearly retains the original commit and credit.

Review Gate must rerun C1 through C6, the committed Vue suite, and repository
type-check. Carried assumptions are that adding required `slots` to the public
component context is acceptably additive, metadata-less raw registries may omit
name warnings, and `slots.default` should be ignored rather than duplicated.

No GitHub comment, review, status change, push, or merge was performed.
