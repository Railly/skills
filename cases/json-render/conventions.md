# json-render review conventions

Bootstrapped 2026-08-13 from the repository `AGENTS.md` during review of PR
#256. Compile prose rules into checks and extend on every external miss.

## Surface map

```surfaces
packages/core/src/types.ts -> packages/core/README.md apps/web/app/(main)/docs/api/core/page.mdx apps/web/app/(main)/docs/data-binding/page.mdx
packages/core/src/schema.ts -> packages/core/README.md apps/web/app/(main)/docs/api/core/page.mdx skills/core/SKILL.md
packages/react/src/renderer.tsx -> packages/react/README.md apps/web/app/(main)/docs/data-binding/page.mdx skills/react/SKILL.md
packages/react-native/src/renderer.tsx -> packages/react-native/README.md skills/react-native/SKILL.md
packages/react-email/src/renderer.tsx -> packages/react-email/README.md skills/react-email/SKILL.md
packages/react-pdf/src/renderer.tsx -> packages/react-pdf/README.md skills/react-pdf/SKILL.md
packages/ink/src/renderer.tsx -> packages/ink/README.md skills/ink/SKILL.md
packages/solid/src/renderer.tsx -> packages/solid/README.md skills/solid/SKILL.md
packages/svelte/src/RepeatChildren.svelte -> packages/svelte/README.md skills/svelte/SKILL.md
packages/vue/src/renderer.ts -> packages/vue/README.md skills/vue/SKILL.md
```

## Norms

- Run the repository type-check after each implementation turn.
- Public API and behavior changes update the relevant package README, web docs,
  and package skill.
- Repeat semantics must remain aligned across every renderer that advertises
  repeat support.
- Web docs use HTML tables, never Markdown table syntax.
- No emojis in code or UI.
- Dev-server examples use globally installed portless and do not add explicit
  port flags or a project dependency.
- Dependency changes verify the latest package version before installation.

## Subsystem invariants

- `repeat.statePath` is consumed by runtime renderers, structural validation,
  generated catalog schemas, AI prompts, docs, and code export. A contract
  change is incomplete until each consumer either supports the new form or
  explicitly rejects it.
- A repeat scope carries an absolute JSON Pointer base path. Nested repeat
  resolution must preserve RFC 6901 path semantics and provide the same base
  path to `$item`, `$index`, `$bindItem`, actions, and descendant repeats.
- Renderer parity is a public contract. A core `UIElement` type change reaches
  React, React Native, React Email, React PDF, Ink, Image, Solid, Svelte, and
  Vue unless a package documents an exception.
- Structural child references include both `children` and named `slots`.
  Traversal, reachability, streaming, nested conversion, code export, and
  Devtools navigation must preserve both forms.
- Catalog slot declarations are framework-agnostic metadata. Rendering named
  element slots is a platform capability and must be documented per renderer;
  a core type alone does not imply renderer parity.

## Gate-miss ledger

(empty)
