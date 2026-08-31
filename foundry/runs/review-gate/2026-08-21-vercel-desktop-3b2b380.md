# Review Gate: Vercel Desktop CLI-owned coding agents

Status: incomplete.

The exact HEAD `3b2b380` delegates coding-agent discovery, preview, warnings, migrations, and writes to Vercel CLI. Desktop retains only cleanup for configs it managed before this change. The superseded fx installer, OAuth inspection, status parser, effects, UI, and tests are absent.

`pnpm check`, 174 tests, ReleaseFast build, package, signature verification, DMG verification, style, surfaces, stale-value, and caller gates passed. The fx-removal assertion was forced red and restored green.

Fable 5 and Grok 4.6 were run against frozen copies of this exact HEAD. Both exited successfully but emitted empty reports, so neither counts as an exact-head review. The earlier Grok candidate audit remains useful evidence for the lifecycle findings fixed before this HEAD, but cannot close the new exact-head review. The packaged app was not reopened for a final visual pass. PR #14 should remain draft.

## Exemptions claimed

- `CHANGELOG.md` is unchanged because release notes and version metadata belong to a separate release PR.
- `.github/workflows/credential-probe.yml` and `src/cli_discovery.zig` mention coding agents or Vercel CLI but do not describe setup ownership or fx behavior.
- `src/agents.zig` remains because older Desktop-managed configs still require exact backup restore, created-file deletion, and shell-block cleanup.

## Issue candidates

- fx will become available automatically when Vercel CLI ships it in `coding-agents setup`; that upstream addition is outside this PR.
- The exact-head visual dogfood and non-empty independent reviewer report remain verification gaps, not product defects.
