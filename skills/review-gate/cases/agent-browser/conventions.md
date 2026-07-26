# agent-browser review conventions

Bootstrapped 2026-07-23 from the repo's `AGENTS.md`. Rust codebase; browser-automation daemon in `cli/src/native/`.

## Surface map

Feature-facing changes (new flags, commands, behaviors, env vars, output fields, error codes) must land the full documentation + parity set in the same diff (AGENTS.md §Documentation, §CLI/MCP Parity).

```surfaces
cli/src/flags.rs :: cli/src/output.rs, cli/src/mcp.rs, README.md, docs/src/app/*/page.mdx, skill-data/core/SKILL.md
cli/src/main.rs :: cli/src/output.rs, cli/src/mcp.rs, README.md
cli/src/commands.rs :: cli/src/mcp.rs, README.md
cli/src/native/stream/*.rs :: cli/src/output.rs, README.md, docs/src/app/streaming/page.mdx, skill-data/core/*
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
- **Stream input priority starts at connection setup**: a split WebSocket reader cannot dispatch input until it is spawned. Status, tabs, or cached-frame writes performed before the spawn remain an output-backpressure dependency and must be forced with a stalled peer.
- **Latest-frame delivery includes the transport buffer**: replacing an application-level queued frame is insufficient once prior frames have been accepted by the WebSocket/TCP sink. Pause a real client, let frames accumulate, then resume and assert it does not burst-drain stale frames.

## Gate-miss ledger

- 2026-07-25, PR #1594: initial WebSocket writes could still block input and TCP buffering could still drain stale frames. The boundary-pipeline and dogfood lenses missed both by testing only steady-state reads and application-level channels; closed by adding the two stream subsystem invariants above.
- 2026-07-25, PR #1594: `skill-data/core` omitted the new `maxFps` and latest-frame behavior. The surface sweep passed because native stream paths were absent from the surface map; closed by mapping `cli/src/native/stream/*.rs` to CLI help, README, streaming docs, and a core-skill surface.
