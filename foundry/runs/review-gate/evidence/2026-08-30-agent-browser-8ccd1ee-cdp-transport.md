# Independent challenge: agent-browser CDP transport

Date: 2026-08-30

Head: `8ccd1ee814e213f34870edbfab2c70eda369b9b7`

The runtime evidence was collected from commit `5a5ab7c0c428ff2222dc80b47c7c126dd9172f09`. The publishable commit `8ccd1ee814e213f34870edbfab2c70eda369b9b7` differs only by its verified SSH signature; both resolve to tree `b489bbc62ebf9ab7ce9d90a7d4b60742a82b6f1c`.

## Independent design challenge

Two frozen-checkout Solution Gate reviews, Anthropic Claude Sonnet and GLM 5.3 Flash, independently selected bounded surrogate recovery plus explicit transport shutdown. Their durable evidence is recorded in:

- `foundry/runs/solution-gate/2026-08-30-agent-browser-cdp-transport-1666-1726/decision.md`
- `foundry/runs/solution-gate/2026-08-30-agent-browser-cdp-transport-1666-1726/frozen-packet.md`

Both reviews initially proposed a custom ID scanner. A separate Serde probe disproved the need for that complexity by extracting a top-level `u64` while skipping unrepresentable payload values with `IgnoredAny`.

## Real substrates

- A local plain WebSocket peer received repaired response and event traffic, then a subsequent valid command.
- A local peer observed a WebSocket Close frame and TCP EOF while an inspect handle remained alive.
- A local Rustls WebSocket peer observed the Close frame and underlying TCP EOF.
- A real Chrome run passed `e2e_launch_navigate_evaluate_close`.
- An external `BrowserManager` peer observed TCP EOF and no `Browser.close` command.

## Fix-absent mutations

Mutation 1 removed surrogate repair from the production reader path.

Command:

`cargo test --manifest-path cli/Cargo.toml native::cdp::client::tests::repairs_response_and_event_then_processes_next_command -- --nocapture`

Result: red. The command returned `Malformed CDP response: unexpected end of hex escape` instead of the repaired value.

Mutation 2 removed `self.socket.shutdown(Shutdown::Both)` from the production close path.

Command:

`cargo test --manifest-path cli/Cargo.toml native::cdp::client::tests::concurrent_close_sends_close_and_forces_tcp_eof_with_inspect_alive -- --nocapture`

Result: red. The server timed out waiting for TCP EOF while the inspect handle remained alive.

Restored exact HEAD passed all eight focused CDP tests five consecutive times.

## Windows runtime

The exact `socket2 0.6.2` and Tokio `1.49.0` socket duplication and shutdown API compiled for `x86_64-pc-windows-msvc` in a minimal probe. The full project cross-check stopped in the `ring` build before project code because the local cross environment lacks the MSVC C SDK.

The runtime path was then exercised through cuse on GitHub Actions:

- Repository: `crafter-agents/cuse`
- Run: `33336729007`
- Exact temporary commit: `94f5b809b416c1207f46585dd80d02f0430b51ed`
- Parent containing the runtime-tested tree: `5a5ab7c0c428ff2222dc80b47c7c126dd9172f09`
- Runner: Microsoft Windows Server 2025, build 10.0.26100
- Rust: `rustc 1.98.0 (88d9e12ae 2026-08-18)`
- cuse scenario duration: 312,703 ms
- Artifact: `agent-browser-cdp-transport-windows`
- Artifact digest: `sha256:42272677860be1cb420797bf776ca2a672b832c95057564f58bd1780e99f6183`

The scenario ran:

`cargo test --quiet --locked --manifest-path cli/Cargo.toml native::cdp::client::tests -- --nocapture`

Result: 8 passed, 0 failed. This includes duplicated-socket plain TCP EOF with a live inspect handle and Rustls underlying TCP EOF.

`cargo test --quiet --locked --manifest-path cli/Cargo.toml native::browser::tests::test_close_external_manager_disconnects_without_closing_browser -- --nocapture`

Result: 1 passed, 0 failed. The external browser ownership boundary remains intact.

The structured `result.json` reports `ok: true`, `status: passed`, exit code 0 for both Cargo commands, no timeouts, and all three assertions passed. This refutes the Windows runtime finding and completes the Review Gate.
