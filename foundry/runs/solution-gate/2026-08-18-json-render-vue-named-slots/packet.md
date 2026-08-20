# Evidence-only packet: Vue named-slot parity

Mode: candidate audit. Base: `vercel-labs/json-render` `origin/main` at
`ea4b361b9ff23bcab20286c4f559a5316f0e892b`.

Do not inspect GitHub, pull requests, non-base branches, commit history, or any
path outside this workspace. The workspace is an archive of the base branch.

## Product ask

`@json-render/vue` should render the named-slot structure already carried by
the shared json-render spec, while retaining its current default-child API and
Vue-native behavior.

## Evidence

- **Specified:** Shared `UIElement` stores default content in `children` and
  named content in `slots?: Record<string, string[]>`.
  Source: `packages/core/src/types.ts:58-80`.
- **Observed:** Shared validation, reachability, autofix, prompt generation,
  and nested-to-flat conversion already know about named slots.
  Sources: `packages/core/src/spec-validator.ts:134-146,289-292,324-330,492-512`;
  `packages/core/src/types.ts:689-768`;
  `packages/core/src/schema.ts:677,830-851`.
- **Observed:** React renders named slot references separately from `children`,
  sends them through a `slots` component input, warns for `slots.default` and
  undeclared names, and renders `children` as default content.
  Sources: `packages/react/src/renderer.tsx:406-481`;
  `packages/react/src/catalog-types.ts:60-74`.
- **Observed:** Vue currently resolves and renders only `children`, then passes
  those VNodes as Vue's default slot to the registered component.
  Source: `packages/vue/src/renderer.ts:398-440`.
- **Observed:** Vue registry render functions receive `children` as the
  evaluated default slot but do not receive the Vue slots object.
  Sources: `packages/vue/src/renderer.ts:783-790,817-860`;
  `packages/vue/src/catalog-types.ts:58-72`.
- **Observed:** Vue catalog entries already declare a `slots: string[]`
  capability, but Vue's spec schema does not accept an element-level `slots`
  map.
  Source: `packages/vue/src/schema.ts:13-45`.
- **Specified:** Core tests establish that named slot descendants participate
  in validation/reachability, and named slots do not inherit repeat scope
  created by their owning element.
  Source: `packages/core/src/spec-validator.test.ts:62-75,327-345`.
- **Unknown:** Whether runtime handling of undeclared slot names should reject,
  warn, or render them. React currently warns and renders.
- **Unknown:** Whether registry component authors should consume an abstract
  `Record<string, VNode[]>`, Vue-native slot functions, or another API.

## Contract reconstruction task

Return exactly these sections:

1. **Property**
2. **Observable success condition**
3. **Must not change**
4. **Boundaries**: trust, authority, ownership, lifecycle, compatibility
5. **Discriminator matrix** with at least these cells:
   - children only
   - one named slot
   - multiple named slots
   - `slots.default`
   - undeclared named slot
   - missing referenced element while loading and after loading
   - repeat on the owning element plus named-slot content
   - nested spec converted to flat
   - direct low-level registry versus `defineRegistry`
6. **Blocking unknowns**

Do not propose a solution yet. Every conclusion must cite base files and lines.
