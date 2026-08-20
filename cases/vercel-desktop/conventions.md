# vercel-desktop review conventions

Bootstrapped 2026-08-13 from `AGENTS.md`, `README.md`, `package.json`, and the release scripts.

## Surface map

```surfaces
src/app.zig :: src/tests.zig
src/setup.native :: src/app.zig, src/tests.zig
src/*.native :: src/app.zig, src/tests.zig
src/macos.zig :: src/app.zig, src/tests.zig
patches/@native-sdk__cli@*.patch :: pnpm-lock.yaml, src/tests.zig
package.json#version :: app.zon, CHANGELOG.md
```

Application state, commands, windows, timers, and menu-bar presentation live in `src/app.zig` and require executable coverage in `src/tests.zig`. Native markup bindings are paired with their Zig model and markup assertions. Native SDK patches and their lockfile hashes move together.

## Norms

- Use `pnpm` for dependency and project commands.
- Ordinary product changes run `pnpm check`, `pnpm test`, `pnpm build`, and `git diff --check`.
- Release preparation is a separate single PR. Only release PRs change the version and current marked release notes or run `pnpm release:check`.
- Do not rewrite historical release notes in an ordinary product PR.
- Commits use conventional format, contain no AI coauthor trailer, and PR text contains no em dash.

## Subsystem invariants

- The Vercel control item and Gateway Spend amount are separate adjacent macOS status items. Their widths must be explicit when compact spacing is required.
- The spend amount uses the regular macOS system Sans path when its presentation is not monospaced.
- The Vercel CLI runs from a probed absolute path with an explicit runtime `PATH`. Shell startup files, prompts, ZLE, and interactive shell workers must not run inside GUI-owned subprocesses.
- Removing a window-backed feature also removes its commands, model state, effects, timers, markup, platform helpers, fixtures, and tests.

## Gate-miss ledger

(empty)
