# Security lens packet

## Input

- Frozen diff: `fbd046c23a2c1156891bda294aaaee715c23b3f1...f0ef9771426c068e335c5fdb4a0d03362e104fd4`
- Claims: trusted same-origin provenance, explicit reverse-proxy allowlisting, DNS-rebinding resistance, generated external access token
- Surfaces: dashboard HTTP API, session HTTP proxy, session WebSocket proxy, fragment-to-cookie bootstrap, child CLI and plugin execution

## Output

- Confirmed: HTTP and WebSocket authorization compose exact allowed Origin, scheme-aware Host authority equality, and the external token. Loopback remains tokenless.
- Confirmed: cross-origin form-compatible POSTs, missing provenance, preflight, DNS-rebinding Host mismatches, missing tokens, and token prefix or suffix mismatches are rejected in the exercised suite.
- Finding F2: the bearer token escapes the dashboard process through inherited environment state into dashboard-launched CLI, plugin, and session subprocesses.
- Gap: Windows effective confidentiality for the token-bearing config file was not exercised.
