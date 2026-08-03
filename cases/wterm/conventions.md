# wterm conventions

Compiled from `AGENTS.md`, `CONTRIBUTING`-equivalent prose, and `.github/workflows/ci.yml` in `vercel-labs/wterm`. Bootstrapped 2026-07-31 during the review gate on PR #98.

## Surface map

Every line: when the diff touches the left, the right must be updated or exempted with evidence.

```surfaces
packages/@wterm/*/package.json:scripts  -> packages/@wterm/*/README.md
packages/@wterm/ghostty/scripts/        -> packages/@wterm/ghostty/README.md, apps/docs/src/app/ghostty/page.mdx
packages/@wterm/*/src/                  -> packages/@wterm/*/README.md, apps/docs/src/app/**/page.mdx
src/                                    -> README.md#development
scripts/                                -> README.md#development
packages/@wterm/*/                      -> packages/@wterm/core/README.md#related-packages
apps/docs/src/app/**/page.mdx           -> apps/docs/src/lib/docs-navigation.ts, apps/docs/src/lib/page-titles.ts
examples/*/                             -> examples/*/README.md
packages/@wterm/core/package.json:version -> all @wterm/* package.json (via `pnpm sync-versions`)
```

AGENTS.md states the docs rule for "any user-facing change (new feature, option, API change, bug fix, etc.)". Bug fixes are named explicitly, so a fix that makes a documented option actually work still runs the surface check; it exempts only after the surface is read and found already correct.

## House norms

- Formatter is **prettier**, not biome. `pnpm format:check` runs `prettier --check "**/*.{ts,tsx,js,jsx}"`. Running biome reformats and reorders imports across untouched files and produces a diff the repo does not want. (Gate-miss 2026-07-31.)
- No linter enforces `no-explicit-any`. Tests use bare `as any`. A `biome-ignore` comment is noise here.
- Tables in MDX use `<table>` HTML elements, never markdown table syntax.
- Dev servers use `portless <name>.wterm`, never a `--port` flag, and portless is never a project dependency.
- Releases are manual and maintainer-controlled. A feature PR does not touch `CHANGELOG.md` or versions.
- Dependencies are added with `pnpm add`, never by hand-writing a version.

## Subsystem invariants

- **The committed wasm is the artifact under review.** `packages/@wterm/core/wasm/wterm.wasm` is built and diff-checked by CI; `packages/@wterm/ghostty/wasm/ghostty-vt.wasm` is **not**. A Zig change in `@wterm/ghostty` is not verified by CI at all until the binary is rebuilt and committed. Tests that must observe Zig behavior load the committed wasm through a fetch stub (see `style-leak.test.ts`); a mocked core cannot see it.
- **Both ghostty wasm builds are byte-reproducible across host platforms.** A container build equals a host build, so a diff-check is meaningful and a mismatch means a real source/binary drift.
- **A DataView over WASM memory is invalidated by any growth, not only by a write.** `GhosttyCore` caches views for the viewport and for one scrollback row. A cache hit can outlive a grow triggered by an unrelated read, so every path that returns a cached view must compare `view.buffer` against `exports.memory.buffer` before handing it back. Early-return-on-cache-hit is the shape that reintroduces this. (`@wterm/core` carries a dedicated `wasm-memory-growth.test.ts` for the same class.)
- **`RenderState` covers the active area only.** Anything reading history (scrollback) must read the page list directly and cannot reuse `RenderState`-derived helpers. This is why cell encoding is duplicated between `get_viewport` and `get_scrollback_line`; a change to the cell contract belongs in both.
- **`RenderState.Cell.style` is undefined unless the raw cell carries a non-default `style_id`,** and the style array is reused across render passes, so reading it ungated resurfaces another screen's style. See case `0086-style-id-stale-across-screens.md`.
- **Scrollback offset 0 is the row directly above the active area**, and the length accessor returns the row's grid width, not its trimmed text length. The renderer uses that length as the cell-count bound. Both conventions are set by `@wterm/core`'s `WasmBridge` and any second core must match them.

## Gate-miss ledger

| Date | Finding | Which gate missed | Why | What closed it |
|---|---|---|---|---|
| 2026-07-31 | `rebuild-wasm:docker` added to `package.json` scripts while `rebuild-wasm` stayed documented in `packages/@wterm/ghostty/README.md` (x2) and `apps/docs/src/app/ghostty/page.mdx` | `surfaces` | No conventions file existed for this repo, so AGENTS.md's docs rule ran as prose judgment instead of a check | Surface map lines for `package.json:scripts` and `ghostty/scripts/`; both docs updated in the same PR |
| 2026-07-31 | Ran `biome check --write` in a prettier repo, reformatting 6 untouched files | none (no norm recorded) | House formatter was never compiled into a norm | Norms entry naming prettier as the formatter |
| 2026-08-02 | `scripts/gen-unicode-width.mjs` and `src/unicode_width_table.zig` added with no entry in the root README's Development section | `surfaces` | The map covered `packages/@wterm/*/src/` but not the repo-root `src/` or `scripts/`, where the built-in core and its generators live | Two surface lines for `src/` and `scripts/`; the regenerate step documented under Development |
| 2026-07-31 | Detached-DataView on the scrollback cache-hit path, found by Vercel Agent Review, not by this gate | lens selection | The diff was reviewed by its own author; the caching path was read as new code rather than as an instance of the memory-growth class the sibling package already tests for | Subsystem invariant on DataView invalidation; regression test forcing `memory.grow` |
