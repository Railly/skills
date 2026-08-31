# Coverage and surface lens packet

## Input

- Frozen diff: `fbd046c23a2c1156891bda294aaaee715c23b3f1...f0ef9771426c068e335c5fdb4a0d03362e104fd4`
- Required surfaces: CLI help, README, web docs, core skill, detailed command reference, MCP

## Output

- CLI parser and MCP both accept `port` and `allowedOrigins`.
- README, CLI help, dashboard docs, commands docs, configuration env table, core skill, and command reference describe strict validation, loopback defaults, external HTTPS origins, tokenized access URLs, and restart-before-reconfiguration.
- `docs/src/app/streaming/page.mdx` and `skill-data/core/references/streaming.md` describe the separate raw per-session stream server, so their unrelated `--port` statements do not require `--allowed-origins`.
- Missing exact-head Test Strength receipt: authored examples and tests were not independently falsified against mutations of the authorization and lifecycle properties.
