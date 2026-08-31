# Review gate: agent-browser CDP root paths

Status: pass

Head: `e5b37b8eba1f559963b6cf0f3ac772741aa2dfef`

The WebSocket protocol boundary now sends `/?query` for slashless root endpoints while preserving existing paths and encoded query bytes. The daemon command path also reports CDP-specific connection context.

The real WebSocket server oracle, force-red mutation, full Rust suite, clippy, formatting, built CLI help, and documentation sweeps passed.

One finding was fixed during review: the global CLI help still advertised `--cdp <port>` instead of `--cdp <port|url>`.

## Exemptions claimed

- MCP requires no dedicated change because it uses the normal daemon connection state and has no separate CDP URL transport.
- The caller outside the diff awaits `connect_with_headers` before constructing manager state, so the changed connection behavior introduces no rollback obligation.

## Issue candidates

None.

## Reviewer limitation

The delegated and local model review paths were unavailable. The independent challenge was supplied by a real WebSocket server substrate corpus and a production-site force-red mutation.
