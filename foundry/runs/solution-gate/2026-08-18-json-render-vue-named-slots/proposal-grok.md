## 1. Shape

`@json-render/core` already owns the shared spec: default content lives in `UIElement.children`, named content in `UIElement.slots?: Record<string, string[]>`, and those references participate in validation, reachability, autofix, nested-to-flat conversion, and prompt gating (`packages/core/src/types.ts:58-80,689-768`; `packages/core/src/spec-validator.ts:134-146,289-296,324-330,492-512`; `packages/core/src/schema.ts:677,830-851`).

`@json-render/vue` owns runtime realization and Vue-facing contract. Catalog authors already declare capability as `slots: string[]` (`packages/vue/src/schema.ts:39-40`). Spec authors put default keys in `children` and named keys in `slots[name]`. Component authors consume named content as Vue-native slot functions.

Contract:

- `children` is the only default-content representation. Vue delivers it on Vue’s native default slot. Existing `defineRegistry` functions keep receiving the evaluated `children` alias (`slots.default?.()` today: `packages/vue/src/renderer.ts:430-439,849-853`; `packages/vue/src/catalog-types.ts:58-61`).
- Each non-`default` `slots[name]` list is a separate named Vue slot function returning that referenced subtree. A raw `ComponentRegistry` entry (`Record<string, Component>`, `packages/vue/src/renderer.ts:84`) receives those functions on Vue’s slot channel. `defineRegistry` exposes that same Vue `Slots` object in render context.
- `slots.default` does not merge with or replace the native default slot. When catalog metadata exists, warn and ignore that entry; `children` still wins exclusively.
- An undeclared named slot warns when catalog metadata exists and still remains callable/renderable.
- Missing referenced keys stay silent while `loading` is true and emit a location-specific warning afterward (child vs named slot), matching the current children path (`packages/vue/src/renderer.ts:410-415`) and React’s slot-aware wording (`packages/react/src/renderer.tsx:425-433`).
- `repeat` on the owning element applies only to `children` (already the only walk in `RepeatChildren`, `packages/vue/src/renderer.ts:528-549`). Named-slot content renders once, outside the scope that repeat creates, matching core (`packages/core/src/spec-validator.ts:289-296`; `packages/core/src/spec-validator.test.ts:327-345`).
- Nested specs converted with `nestedToFlat` render identically to equivalent flat specs (`packages/core/src/types.ts:750-768`).
- Vue’s element schema must expose optional element-level `slots` so `supportsNamedSlots` is true and prompts advertise named slots. Package README, Vue skill, and Vue API docs describe this contract. Shared core types, validator, traversal, autofix, and conversion stay unchanged.

## 2. Predictions

1. **Children-only unchanged.** Command: `pnpm vitest run packages/vue/src/renderer.test.ts`. Measurement: existing cases “children is passed for container components” and “renders a nested spec” still pass; a Card with only `children` still shows that subtree and no extra named regions (`packages/vue/src/renderer.test.ts:97-165`).

2. **One named slot and multiple named slots.** Command: `pnpm vitest run packages/vue/src/renderer.test.ts`. Measurement: a catalog component declaring `["default","header","footer"]` with `children: ["main"]`, `slots.header: ["h"]`, `slots.footer: ["f"]` yields header text only from `slots.header()`, footer text only from `slots.footer()`, and main text from the default slot / `children` alias. Header-only specs leave footer empty. Both a raw Vue component (`setup(_, { slots })`) and a `defineRegistry` function observe the same placement.

3. **`slots.default` is invalid default content.** Command: same vitest file with `vi.spyOn(console, "warn")`. Measurement: a spec with both `children: ["body"]` and `slots.default: ["other"]` warns that `slots.default` should be `children`; default-slot DOM contains `body` only; `other` is not merged in. Warning fires for `defineRegistry` when the catalog lists slots; a raw registry without metadata may stay silent.

4. **Undeclared named slot is tolerated.** Command: same vitest file plus warn spy. Measurement: catalog slots `["default","header"]` plus `slots.sidebar: ["x"]` warns that `sidebar` is unknown and lists available names; `slots.sidebar()` / the sidebar region still contains `x`.

5. **Missing reference vs loading.** Command: same vitest file, mount with `loading: true` then `loading: false`. Measurement: missing key in `slots.header` produces no `console.warn` while loading; after loading, warn text includes the key and `in slot "header"` of the owner type. Missing `children` keys keep the current “as child of” wording (`packages/vue/src/renderer.ts:413`).

6. **Owner repeat does not clone named slots.** Command: `pnpm vitest run packages/vue/src/renderer.test.ts` with a two-item state array. Measurement: repeated default children appear twice with item scope (`$item` resolves in the child template); the named-slot subtree appears once and does not receive that item scope.

7. **Nested conversion parity.** Command: vitest that runs `nestedToFlat` then `Renderer`. Measurement: nested `{ children: [...], slots: { header: [...] } }` produces the same header/main/footer text as the equivalent flat key spec (`packages/core/src/types.ts:750-768`; `packages/core/src/types.test.ts:829-842`).

8. **Prompt advertising after schema opt-in.** Command: `pnpm vitest run packages/core/src/schema.test.ts` analog using `@json-render/vue/schema`, or a focused Vue schema test calling `catalog.prompt()`. Measurement: a Vue catalog component with `slots: ["default","header"]` yields `[accepts children; slots: header]` and does not print `slots: default` (`packages/core/src/schema.ts:677,830-844`; `packages/core/src/schema.test.ts:179-192`). Today this must fail because Vue’s element shape has no `slots` (`packages/vue/src/schema.ts:13-30`).

9. **Types and existing Vue suite.** Commands: `pnpm type-check` and `pnpm vitest run packages/vue`. Measurement: `ComponentContext` / `BaseComponentProps` accept a Vue `Slots` field without dropping `children`; current emit, fallback, and children tests still pass.

## 3. Cost

Vue `ElementRenderer` currently builds only a default slot from `children` or `RepeatChildren` (`packages/vue/src/renderer.ts:398-440`). Named-slot lists must be resolved into additional Vue slot functions, with `slots.default` excluded from that map.

Vue has no catalog-metadata side table. React’s `slots.default` / unknown-slot warnings require `registryMetadata` populated by `defineRegistry` (`packages/react/src/renderer.tsx:406-420,816-821`). Vue warnings of that class need an equivalent attachment when a catalog is present; raw `ComponentRegistry` usage stays warning-poor.

`defineRegistry` already receives Vue `{ slots }` and forwards only `children: slots.default?.()` (`packages/vue/src/renderer.ts:849-858`). Context types must grow a Vue `Slots` field without removing `children` (`packages/vue/src/catalog-types.ts:58-72`; `DefineRegistryComponentFn` at `packages/vue/src/renderer.ts:783-790`).

Vue’s spec schema must add optional element-level `slots` and a named-slot generation rule. React already has both (`packages/react/src/schema.ts:25,84`); Vue has neither on the element object (`packages/vue/src/schema.ts:13-30,78-96`). That is a small schema/prompt change with large downstream generator behavior.

Docs currently describe only `children` (`packages/vue/README.md:366-378`; `skills/vue/SKILL.md` has no slot guidance; `apps/web/app/(main)/docs/api/vue/page.mdx`). Tests covering the discriminator matrix do not exist in `packages/vue/src/renderer.test.ts`.

Named-slot subtrees are extra `ElementRenderer` work per owner, not per repeated item. `RepeatChildren` stays a children-only walker (`packages/vue/src/renderer.ts:466-555`).

## 4. What it makes worse

Default content becomes dual-addressable: Vue `slots.default()` and the evaluated `children` alias. An author who renders both will duplicate default content.

`slots.default` on the spec is dropped after a warning, so misplaced default content disappears instead of appearing in the main region.

Undeclared named slots still render, so catalog `slots: string[]` is not a runtime allowlist. Components that enumerate every slot name can see unexpected keys.

Repeat-plus-named-slot behavior will surprise authors who expect a header to clone per item. Core already forbids giving those descendants the new item scope.

Prompt opt-in will cause models to emit `slots` on Vue specs. If that ships while the renderer still ignores `element.slots`, named regions stay invisible (`packages/vue/src/renderer.ts:398-440`).

Diagnostics split by registry kind: metadata-backed `defineRegistry` can warn; a raw `Component` map cannot unless metadata is supplied some other way. React already has that split (`packages/react/src/renderer.tsx:407`).

Every `ComponentFn` type surface grows. README / skill examples that still type only `{ props, children }` will be incomplete.

## 5. Rejected alternatives

**React-style `slots?: Record<string, VNode[]>` as a renderer prop, not Vue’s slot channel.** Rejected because Vue already delivers default content only through Vue’s slot object (`packages/vue/src/renderer.ts:430-439`), raw components already read `slots.default?.()` (`packages/vue/src/dynamic-forms.test.ts:75-76`), and `ComponentRegistry` is `Record<string, Component>` with no React-like `children`/`slots` render props (`packages/vue/src/renderer.ts:65-84`). A second channel would split the API the contract says must stay Vue-native.

**Drop the evaluated `children` alias and pass only `Slots`.** Rejected because `defineRegistry` currently sets `children: slots.default?.()` (`packages/vue/src/renderer.ts:849-853`), `BaseComponentProps` documents that alias (`packages/vue/src/catalog-types.ts:58-61`), and `renderer.test.ts:97-112` asserts it. Existing registry functions must keep receiving evaluated `children`.

**Merge `slots.default` into the native default slot.** Rejected because `children` and `slots` are separate fields (`packages/core/src/types.ts:66-68`) and React already warns to use `children` for default (`packages/react/src/renderer.tsx:410-413`). The catalog comment “Use `['default']` for children” names catalog slot capability, not spec `slots.default` (`packages/vue/src/schema.ts:39`).

**Omit or hard-fail undeclared named slots.** Rejected because React warns and still builds them into the slots object (`packages/react/src/renderer.tsx:414-418,462-469`).

**Run owner `repeat` over named-slot keys.** Rejected because `RepeatChildren` iterates only `element.children` (`packages/vue/src/renderer.ts:528-549`) and core validation withholds the new repeat scope from `element.slots` (`packages/core/src/spec-validator.ts:289-296`; `packages/core/src/spec-validator.test.ts:327-345`).

**Change shared `UIElement`, validator, autofix, nested-to-flat, or prompt-gating internals.** Rejected because those already implement named slots; Vue is the gap (runtime ignores `element.slots`; Vue element schema omits `slots`).

**Leave Vue’s element schema without `slots`.** Rejected because `supportsNamedSlots` is `elementShape?.slots !== undefined` (`packages/core/src/schema.ts:677`). Catalog-level `slots: string[]` (`packages/vue/src/schema.ts:40`) does not turn that flag on, so prompts will not advertise named slots (`packages/core/src/schema.ts:830-844`).

**Warn on missing slot refs while `loading` is true.** Rejected because Vue already suppresses missing-child warnings during load (`packages/vue/src/renderer.ts:410-415`), and the loading/fallback contract must stay compatible.

## 6. Forward chain

**Order 1 — Vue spec schema opts into element-level `slots` (and a named-slot generation rule).**  
Helpful: `catalog.prompt()` can print `[accepts children; slots: header]` instead of collapsing named catalog slots. Link: **observed** (`packages/core/src/schema.ts:677,830-844`; `packages/vue/src/schema.ts:13-30` vs `39-40`; `packages/core/src/schema.test.ts:179-192`).  
Harmful: generators then emit `slots` maps that today’s renderer never reads, so named regions stay blank. Link: **observed** (`packages/vue/src/renderer.ts:398-440`).  
Branch: schema-before-renderer is harmful (prompt-valid specs look empty). Schema-with-or-after renderer is helpful. Link: **inferred** from those two observations.

**Order 2 — Renderer delivers `children` on the default slot and each non-default `slots[name]` as a Vue slot function; `slots.default` warned and ignored.**  
Helpful: raw components keep `setup(_, { slots })`; `defineRegistry` already has `{ slots }` and can expose it. Link: **observed** (`packages/vue/src/renderer.ts:430-439,849`; `packages/vue/src/dynamic-forms.test.ts:75-76`).  
Helpful: Vue slot functions are lazy, so unused named slots need not commit DOM. Link: **inferred** from Vue slot-function semantics plus the Vue-native product rule; not measured in this archive.  
Harmful: spec content placed only in `slots.default` vanishes from the default region after the warning. Link: **inferred** from exclusive-`children` plus the current default-only channel.  
Harmful: undeclared names appear on the slot object; a component that enumerates slot names sees extras. Link: **guessed** (no Vue catalog component in this archive enumerates slot keys).  
Branch: pre-rendering named VNodes eagerly (React-style) would make unused slots pay render cost; function delivery avoids that. Link: **observed** React eager map (`packages/react/src/renderer.tsx:462-469`); Vue-function alternative **inferred**.

**Order 3 — Named-slot trees are built beside `RepeatChildren`, not inside it.**  
Helpful: runtime matches core: named-slot `$item` walks keep the parent repeat base, not the owner’s new item scope. Link: **observed** (`packages/core/src/spec-validator.ts:289-296`; `packages/core/src/spec-validator.test.ts:327-345`; `packages/vue/src/renderer.ts:528-549`).  
Harmful: a header will not clone per repeated child; authors who wanted a per-item chrome piece must put that piece in `children`. Link: **inferred** from the children-only repeat walker plus the scope rule.  
Branch: placing named slots inside `RepeatScopeProvider` would make header descendants resolve `$item` and contradict the validator. That branch is harmful and rejected. Link: **inferred**.

**Order 4 — `defineRegistry` context adds Vue `Slots` and keeps `children`; warnings attach only when catalog metadata exists.**  
Helpful: current `({ props, children })` functions and children tests remain valid. Link: **observed** (`packages/vue/src/catalog-types.ts:58-61`; `packages/vue/src/renderer.ts:849-853`; `packages/vue/src/renderer.test.ts:97-112`).  
Helpful: header/footer authors call `slots.header()` without losing the children alias. Link: **inferred** from the product rule plus the existing alias.  
Harmful: rendering both `children` and `slots.default?.()` duplicates default content. Link: **inferred**.  
Harmful: Vue currently never stores catalog slot metadata, unlike React, so raw registries stay silent on `slots.default` / unknown names. Link: **observed** (no `registryMetadata` under `packages/vue`; React `packages/react/src/renderer.tsx:407-420,816-821`). Discriminator already allows that split.  
Branch: metadata only on `defineRegistry` matches React and keeps raw `Component` maps catalog-free. Link: **observed** for React; **inferred** as the Vue attachment point.

**Order 5 — README, `skills/vue/SKILL.md`, and Vue API docs describe Vue-native named slots.**  
Helpful: those surfaces currently document only `children` (`packages/vue/README.md:366-378`; `skills/vue/SKILL.md`; `packages/vue/src/catalog-types.ts:58-72`), so authors would otherwise invent a React-like `Record<string, VNode[]>` or miss named regions. Link: **observed**.  
Harmful: documenting `slots` before types include it makes published examples fail `pnpm type-check`. Link: **inferred**.  
Branch: docs after types and runtime is helpful; docs-only is harmful. Link: **guessed** as an ordering risk.
