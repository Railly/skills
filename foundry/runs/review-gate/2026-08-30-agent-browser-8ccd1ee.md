# Review gate: agent-browser CDP transport lifecycle

Status: pass

Head: `8ccd1ee814e213f34870edbfab2c70eda369b9b7`

The implementation and every required proof pass. Lone UTF-16 surrogate responses and events are repaired without changing valid pairs or ordinary Unicode. Closing a CDP client is bounded, idempotent, releases pending callers, rejects later writes, and forces TCP EOF even while an inspect handle remains alive. External browser ownership remains intact.

The tested commit `5a5ab7c0c428ff2222dc80b47c7c126dd9172f09` was amended only to add a verified SSH signature. Its tree and the publishable commit `8ccd1ee814e213f34870edbfab2c70eda369b9b7` are identical at `b489bbc62ebf9ab7ce9d90a7d4b60742a82b6f1c`.

Exact-head checks passed:

- Rust stable 1.98.0 format and Clippy with warnings denied
- 1,164 unit tests and 2 integration tests
- 8 focused CDP tests repeated five times
- Real Chrome `e2e_launch_navigate_evaluate_close`
- Plain WebSocket, Rustls, busy sink, concurrent close, pending caller, post-close writes, and external manager ownership
- Fix-absent surrogate repair and socket shutdown mutations
- Microsoft Windows Server 2025 via cuse and GitHub Actions: 8 CDP tests plus external manager ownership

The Radius map ranked `close_current_browser` and CDP consumers as convergence points. Its 2,447 unresolved calls and 83 unmapped SCIP entries make it under-covering, so the review also used direct caller and lifecycle sweeps.

Windows runtime evidence came from cuse scenario `agent-browser CDP transport Windows` in GitHub Actions run `33336729007`. Rust 1.98.0 executed all 8 focused CDP tests, including plain and Rustls TCP EOF with duplicated socket ownership, plus the external manager ownership test. The scenario passed in 312,703 ms and its structured artifact reports every command and assertion successful.

## Exemptions claimed

- README, command docs, and packaged skill need no update because this is an internal transport reliability fix with no command, flag, schema, output, or documented ownership change.
- Existing `CDP connection` passages in `main.rs`, `browser.rs`, and `output.rs` remain accurate; none promises malformed-frame handling or socket teardown details.
- Existing command callers need no rollback changes because the new closed-state error occurs only after transport closure starts, when writes already could not complete; manager teardown removes the browser before invoking close.
- Inspect proxy callers already treat forwarding failure as termination or best effort, so the new fail-fast closed error preserves their contract.

## Issue candidates

- None.
