# Reconciled blind contract

## Property

For every shared `UIElement`, Vue renders `children` as default-slot content
and each `slots[name]` reference list as separate named content. Named-slot
descendants follow shared core validation, reachability, conversion, and
autofix semantics. A repeat on the owning element applies only to `children`;
its named slots render once outside the new repeat scope.

## Observable

A Vue catalog component that declares default, header, and footer regions can
render a flat or nested-converted spec with main content in the default region
and named content in the matching regions. Children-only specs render as
before. Missing references remain silent while loading and warn after loading.
The behavior works through both a raw Vue component registry and
`defineRegistry`.

## Must not change

- Shared core `UIElement`, validator, traversal, prompt-gating, autofix, and
  nested-to-flat contracts.
- `children` remains the only representation of default content.
- Existing Vue registry functions continue receiving evaluated `children`.
- Raw Vue components continue consuming default content from Vue's native
  default slot.
- Repeat applies only to `children`; named slots do not inherit the scope the
  owning repeat creates.
- Existing specs, registry components, events, fallbacks, and loading behavior
  remain compatible.

## Resolved product decisions

- Component authors consume named content as Vue-native slot functions. A raw
  Vue component receives them through Vue's slot channel; `defineRegistry`
  exposes that same Vue `Slots` object in its context while preserving the
  existing evaluated `children` alias.
- When catalog metadata is available, `slots.default` and undeclared named
  slots warn. Undeclared named slots still render, matching React's tolerance.
- `slots.default` does not replace or merge with the native default slot.
  `children` wins exclusively; the invalid named entry is ignored after its
  warning.
- Vue's element schema must opt into `slots` so shared prompt generation
  advertises the capability. Vue package docs and skill guidance must describe
  the contract.

## Discriminators

1. Children only: identical default rendering and API.
2. Header only: header slot function returns its referenced subtree.
3. Header and footer: independent functions and placement.
4. `slots.default`: warning; `children` remains the sole default content.
5. Undeclared slot: warning when metadata exists, but content remains usable.
6. Missing key: no warning during loading; location-specific warning after.
7. Owner repeat: repeated children get item scope; named slot renders once and
   does not get that scope.
8. Nested conversion: flattened slot references render identically.
9. Raw registry and `defineRegistry`: both receive Vue-native named slots;
   only metadata-backed warnings may differ.

## Proposal task

Return exactly:

1. **Shape**: ownership and contract, no implementation code.
2. **Predictions**: at least four falsifiable predictions, each naming the
   command or measurement.
3. **Cost**.
4. **What it makes worse**.
5. **Rejected alternatives** with the fact that rejects each.
6. **Forward chain**: at least three orders, branch on helpful and harmful
   effects, and mark every link observed, inferred, or guessed.

Stay blind to any candidate. Inspect only this base archive.
