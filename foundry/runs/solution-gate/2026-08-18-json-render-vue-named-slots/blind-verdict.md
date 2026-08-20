# Blind verdict before candidate reveal

Proposers:

- Cursor Agent `claude-fable-5-high`
- Cursor Agent `cursor-grok-4.6-high`

Synthesizer: Codex root runtime. The root had seen high-level candidate details
during the preceding xref turn, so the methodological blindness claim applies
strictly to the two structurally isolated proposers. Their archives contained
only `origin/main`; their proposals were sealed before candidate inspection in
this run.

## Synthesis kind

Graft. The proposals converge on the same shape. Take Grok's explicit lazy
Vue-slot-function contract and Fable's bounded package ownership and
version-skew accounting.

## Selected shape

- Vue owns all new runtime, schema, type, test, and documentation work.
- `ElementRenderer` maps every non-default spec slot to a Vue-native lazy slot
  function. Raw Vue registry components receive it through Vue's slot channel.
- `defineRegistry` exposes the same Vue `Slots` object while preserving the
  existing evaluated `children` alias.
- Catalog metadata attaches to metadata-backed registries for warnings.
  Undeclared slots warn and render. `slots.default` warns and is ignored;
  `children` exclusively owns default content.
- Named slots render beside, not inside, `RepeatChildren`, so they render once
  outside the repeat scope the owner creates.
- Vue's element schema opts into the shared `slots` map and its prompt rule.
- Core remains unchanged.

## Probe log before reveal

- P1, base core contract: `vitest` on core spec validator, type conversion, and
  schema tests. Result: 187/187 passed.
- P2, Vue primitive: temporary two-case test mounted a component with a named
  slot function. Unused slot calls: 0. Used slot calls: 1. Result: 2/2 passed.
  This supports lazy functions over pre-evaluated VNode maps.
- P3, Vue baseline: after building core, Vue renderer, hooks, and primitive
  tests passed 30/30.
- P4, source inventory: core already owns named slots; Vue has no metadata
  side table and reads only `slots.default`. Result: survived.
- Candidate-specific discriminator cells remain unverified until reveal:
  raw registry, `slots.default`, undeclared slot, loading warning, owner repeat,
  and nested conversion.

## Failure-shape score before reveal

- S1 over-reach: low if core stays unchanged and children-only tests remain.
- S2 under-reach: high risk unless raw registry, schema/prompt, nested input,
  and repeat scope are covered together.
- S3 direction inheritance: no hit found.
- S4 proxy property: metadata warnings do not prove rendering; tests must assert
  DOM placement separately.
- S5 unregistered peer: metadata is process-local `WeakMap`, no persistent
  lifecycle peer.
- S6 peer-version blindness: accepted release-skew cost. Schema advertising and
  runtime must ship in the same package version.
- S7 wrong layer: high risk if only `defineRegistry` gets slots. Delivery must
  originate in low-level `ElementRenderer`.
- S8 guard-derived cells: matrix derives from shared spec and both registry
  entry points, not candidate structure.
- S9 test pins wrong thing: high risk unless each contract mechanism has an
  observable discriminator.
- S10 claim from prose: mitigated by base source and executable Vue primitive.
- S11 asymmetric validation: warning parity may differ for raw registries by
  design; rendering must not.
- S12 primitive mismatch: Vue-native lazy slot functions survived the primitive
  probe and match the selected contract.

## Carried assumptions

- A Vue `Slots` context addition is acceptably additive for public TypeScript
  consumers.
- Metadata-less raw registries may render invalid names silently.
- Dropping `slots.default` is preferable to accidental duplicate default
  content.
- Full renderer behavior will preserve repeat and loading boundaries when
  implemented beside `RepeatChildren`.
