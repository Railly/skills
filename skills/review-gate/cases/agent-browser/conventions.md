# agent-browser review conventions

Bootstrapped 2026-07-23 from the repo's `AGENTS.md`. Rust codebase; browser-automation daemon in `cli/src/native/`.

## Surface map

Feature-facing changes (new flags, commands, behaviors, env vars, output fields, error codes) must land the full documentation + parity set in the same diff (AGENTS.md §Documentation, §CLI/MCP Parity).

```surfaces
cli/src/flags.rs :: cli/src/output.rs, cli/src/mcp.rs, README.md, docs/src/app/*/page.mdx, skill-data/core/SKILL.md
cli/src/main.rs :: cli/src/output.rs, cli/src/mcp.rs, README.md
cli/src/commands.rs :: cli/src/mcp.rs, README.md
```

## House norms (invert or extend universal gates)

- No emojis in code/output/docs. Unicode symbols (✓ ✗ → ⚠) allowed.
- Docs/markdown: never `--` as a dash; em dash sparingly; prefer rewriting to avoid dashes.
- CLI flags kebab-case only (`--pin-tab`, never `--pinTab`).
- Colored output through `cli/src/color.rs` (respects `NO_COLOR`); no hardcoded ANSI.
- MDX tables use HTML `<table>`, not markdown pipe tables.
- CLI ↔ MCP parity: any CLI command/flag/behavior/output/env/parser change updates `cli/src/mcp.rs` in the same change, with a parity test.
- Package manager is pnpm, not npm/yarn.

## Subsystem invariants (agent-browser/native daemon)

- **Process/channel topology**: CLI process vs detached daemon; the daemon owns Chrome over CDP. Diagnostics emitted in the daemon land in daemon logs, not the CLI the user is attached to.
- **Active-tab selection**: `Target.getTargets` order is not activity-sorted; `pages[0]` may be a Memory-Saver-discarded tab (CDP session, no renderer, `Page.enable` never answers → 30s hang). Any code that picks a "current" tab must probe for a live renderer.
- **Session isolation**: `--session` isolates the daemon process, not the tab. Tab identity must survive re-attach and daemon restart; event-discovered targets (`Target.targetCreated`) must not steal the active slot.
- **Consumers of a resolution rule**: a tab-ref / target-id resolution rule is applied by every path that maps user input to a target (primary resolver, error/suggestion builders, MCP tool paths), not just the main resolver.
