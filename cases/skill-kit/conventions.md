# skill-kit review conventions

Project overlay for the review-gate skill, compiled from `README.md` and `packages/cli/AGENTS.md` in `crafter-station/skill-kit`.

## Surface map

User-facing CLI behavior is documented in the root README, the CLI agent guide, and the packaged skill.

```surfaces
packages/cli/src/bin.ts :: README.md, packages/cli/README.md, packages/cli/AGENTS.md, skills/skillkit/SKILL.md, packages/cli/src/skill-data/core/SKILL.md
packages/cli/src/commands/receipts.ts :: README.md, packages/cli/README.md, packages/cli/AGENTS.md, skills/skillkit/SKILL.md, packages/cli/src/skill-data/core/SKILL.md, packages/cli/src/skill-data/core/references/commands.md
packages/cli/src/receipts/remote.ts :: README.md, packages/cli/README.md, packages/cli/AGENTS.md, skills/skillkit/SKILL.md, packages/cli/src/skill-data/core/SKILL.md, packages/cli/src/skill-data/core/references/commands.md
packages/cli/src/commands/context.ts :: README.md, packages/cli/README.md, packages/cli/AGENTS.md, skills/skillkit/SKILL.md, packages/cli/src/skill-data/core/SKILL.md
packages/cli/src/scanner/mcp.ts :: README.md, packages/cli/README.md, packages/cli/AGENTS.md, skills/skillkit/SKILL.md, packages/cli/src/skill-data/core/SKILL.md
packages/cli/src/scanner/registry.ts :: README.md, packages/cli/README.md, packages/cli/AGENTS.md, skills/skillkit/SKILL.md, packages/cli/src/skill-data/core/SKILL.md
```

## House norms

- Runtime and package manager: Bun.
- Lint and format: Biome.
- Public commands and flags must agree with `skillkit help`.
- The packaged skill is a contract-carrying surface because agents use it to discover CLI capabilities.

## Subsystem invariants

- MCP probes that time out are reported as `timeout` and contribute zero measured tools, never as successful zero-cost measurements.
- Primary command listings exclude aliases and utility dispatch entries such as `help` and `version`.

## Verification norms

- Documentation-only changes are checked against the runnable CLI and the underlying dispatch or flag implementation.
- A failing repository-wide lint baseline is acknowledged separately when the changed Markdown files are outside Biome's configured inputs.

## Gate-miss ledger

None recorded.
