# CDP root-path protocol challenge

Head: `e5b37b8eba1f559963b6cf0f3ac772741aa2dfef`

The independent oracle is the request-target observed by a real `tokio-tungstenite` WebSocket server during the client handshake.

Behavioral matrix:

- Authority followed directly by an encoded query becomes `/?token=a%2Fb`.
- IPv6 authority followed directly by a query gains `/`.
- Userinfo in the authority does not interfere with path insertion.
- An empty query gains `/` before `?`.
- Existing `/` and `/cdp` paths remain unchanged.
- Encoded query bytes remain unchanged in the observed handshake.

Observed boundary:

- Input: `ws://127.0.0.1:<port>?token=a%2Fb&scope=browser%20test`
- Server-observed request-target: `/?token=a%2Fb&scope=browser%20test`

Falsification:

- Bypassing normalization at the production `connect_with_headers` call site made `root_websocket_url_with_query_sends_slash_request_target` fail at the handshake boundary.
- Restoring normalization made the test pass.
- The restored boundary test passed five consecutive runs.

Additional verification:

- The full Rust suite passed with 1,161 executed tests and no failures.
- `cargo clippy --manifest-path cli/Cargo.toml -- -D warnings` passed.
- `cargo fmt --manifest-path cli/Cargo.toml -- --check` passed.
- The built CLI help contains `--cdp <port|url>` and states that the root WebSocket query slash is optional.
- The daemon-level `execute_command` test verifies that CDP auto-connection failures use `CDP connection failed`.

Reviewer limitation:

- The delegated reviewer mechanism failed to start.
- The local Codex reviewer could not run because `AI_GATEWAY_API_KEY` was absent.
- Protocol independence is supplied by the real WebSocket server oracle and force-red corpus, not by another model.
