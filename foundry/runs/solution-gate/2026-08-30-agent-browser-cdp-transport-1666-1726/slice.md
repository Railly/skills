# Slice: bounded CDP transport lifecycle

Date: 2026-08-30

Base: `fbd046c23a2c1156891bda294aaaee715c23b3f1`

Branch: `fix/cdp-transport-lifecycle`

Worktree: `/Users/raillyhugo/Programming/vercel/agent-browser-cdp-transport`

## Observable outcome

A CDP connection recovers lone UTF-16 surrogate responses and events without stalling, and closing any browser manager terminates its transport without closing an externally owned browser.

## Scope

- Repair lone surrogate escapes only after normal typed parsing fails.
- Retry typed parsing for responses and events.
- Extract only a positive top-level command id through a Serde `IgnoredAny` envelope if typed parsing still fails.
- Reject command and raw writes after closure starts.
- Duplicate and explicitly shut down the underlying plain or Rustls TCP socket.
- Make close repeated, concurrent, bounded, and cancellation-recoverable.
- Call transport close from every `BrowserManager::close` path while preserving browser ownership behavior.
- Add focused parser, flow, socket, pending-command, repeated-close, post-close-write, and manager ownership regressions.

## Excluded

- Public flags, commands, schemas, timeout changes, or daemon-wide lifecycle changes.
- Closing externally owned browsers.
- Refactoring CDP transport into a single owner task.
- Closing issue #1713.

## Factory contract

| Stage | Command or evidence | Threshold |
|---|---|---|
| Implement | `cargo test --manifest-path cli/Cargo.toml native::cdp::client::tests` plus focused browser close tests | All focused cells pass |
| Reduce | Diff inspection and focused checks after reduction | One close state owner; no abstraction with fewer than two consumers |
| Harden | Cooperative and uncooperative local WebSocket peers with a live inspect handle; pending and concurrent close cells | TCP EOF and task completion within the internal close bound |
| Strengthen | Reversible mutations removing surrogate repair and socket shutdown | Each corresponding regression fails for the intended assertion |
| Prove | Plain local WebSocket producer plus Rustls local peer when available | Response, event, subsequent command, Close frame where possible, TCP EOF always |
| Deterministic | `cargo fmt --manifest-path cli/Cargo.toml -- --check`; `cargo clippy --manifest-path cli/Cargo.toml -- -D warnings`; `cargo test --manifest-path cli/Cargo.toml` | Zero failures and zero warnings |
| Cross-platform | Windows unit workflow or remote Windows test | Socket duplication and shutdown compile and execute on Windows |

## Credit

The replacement commit and PR must credit `@melon95` for the surrogate repair and reproductions, and `@riesvriend` for the external connection lifecycle finding and reconnect proof.
