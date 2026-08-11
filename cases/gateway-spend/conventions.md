# Gateway Spend review conventions

Bootstrapped 2026-08-07 from the repository README and build scripts.

## Surface map

```surfaces
src/agents.zig :: src/tests.zig
src/persistence.zig :: src/tests.zig
src/setup.native :: src/app.zig, src/tests.zig
src/app.zig :: src/setup.native, src/tests.zig
```

`src/agents.zig` owns the agent configuration formats and locations described under README `Agent files`. Persistence compatibility is executable contract and must remain covered by versioned parse tests. Native markup bindings and application state are a paired surface, with markup assertions and state-transition tests as the repository's UI contract.

## Norms

- Use the project-local Native SDK CLI resolved through Bun scripts; the machine-global `native` may be older than the pinned patched SDK.
- Existing agent config content outside Gateway Spend-managed fields is preserved, and existing files are backed up before replacement.
- Secrets never appear in review text, logs, screenshots, or URLs.
- Product gates are `bun run check`, `bun run test`, `bun run build`, `bun run package`, bundle signature verification, and `git diff --check`.
- Commits are signed, use conventional format, and carry no AI coauthor trailer.

## Subsystem invariants

- Agent drift is established by a read-only probe; review is a second read-only pass until the user explicitly chooses Reapply.
- Keep theirs writes no config and persists the exact accepted content fingerprint; any later content change becomes drift again.
- Reapply uses the existing backup and targeted reconfiguration pipeline, preserving unmanaged fields.
- A Vercel team-list failure with an already selected account must not hide Settings or invalidate the selected account; retry remains available in place.

## Gate-miss ledger

(empty)
