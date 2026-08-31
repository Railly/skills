# Adversarial probes

All probes were read-only against source, Git/GitHub, user configuration, and Keychain. CLI setup invocations used `--dry-run`. Credential values were never recorded.

## P1: Live repeated row checks

Command shape: `vercel ai-gateway coding-agents setup --agent <id> --dry-run --yes --no-color --no-session-migration`.

Observed on installed CLI `59.1.4`:

| Agent | Agent file | Shared environment | Warnings | Migrations |
|---|---|---|---|---|
| Claude Code | unchanged | would_update | 0 | 0 |
| Codex | unchanged | unchanged | 0 | 0 |
| OpenCode | unchanged | unchanged | 0 | 0 |
| Pi | unchanged | none | 0 | 0 |

Effect: survives E4-E7. The red Claude row is exclusively the shared `Environment: would_update` signal, not a warning, migration, or broken Claude file.

## P2: Installed writer and comparator

Read `/Users/raillyhugo/.bun/install/global/node_modules/vercel/dist/commands-bulk.js:6036-6185`.

Observed:

- selected agents append exports in iteration order;
- omitted export lines are preserved and appended after selected exports;
- final status is `unchanged` only when transformed full text equals current text, or a placeholder-key regex matches;
- otherwise status is `update`.

Effect: confirms the order-dependent false positive and omission-preservation contract. It also refutes a generalized unordered-map comparator as automatically safe because duplicate declarations and shell evaluation order can be meaningful.

## P3: Desktop consumption

Read exact release source at `c8ee1bc`:

- `VercelService.swift:174-204` turns every pending change or warning into `configured = false`;
- `AppModel.swift:477-523` checks rows concurrently, repairs one row, then rechecks only that row.

Effect: a shared environment reorder becomes row red. Warning separation is a real adjacent defect, but P1 proves it is not the current reproduction.

## P4: `--all` scope

Command: `vercel ai-gateway coding-agents setup --all --dry-run --yes --no-color --no-session-migration`.

Observed: CLI `59.1.4` includes Cline, Hermes, Kilo Code, and OpenClaw in addition to Claude Code, Codex, OpenCode, and Pi, with four unrelated `would_create` actions.

Effect: refutes Desktop's coordinated `--all` repair shape. It would mutate beyond Desktop's supported set and violate R6.

## P5: Newer release and current public source

- `npm view vercel version` returned `59.6.2`, published 2026-08-26.
- Installed CLI remains `59.1.4`.
- Public `vercel/vercel` main at `e06cc643cec6a47bd9344af7f4589c736d95ed15` still builds exports in iteration order and uses `acc === current` in `apply.ts:124-229`.
- The exact `59.6.2` tarball is behind the Vercel security registry and was not downloaded or executed.

Effect: no public evidence that the class is fixed. Exact `59.6.2` behavior remains unverified and must be checked at implementation admission.

## P6: Shell credential sources

Redacted structural inspection found multiple credential sources and a `codex()` wrapper that resolves through Keychain. Fresh shells consistently produced one exported-value hash, while the wrapper used a different source.

Effect: reinforces R5 and the wrong-layer risk. Desktop must not parse, log, or select among credential values. CLI remains the configuration authority.

## Mutation receipt

Desktop repository status remained `fix/onboarding-teams-error` at `fdae0e1dadf76d0443a4153386368484a8f4e89f`, with its pre-existing `src/setup.native`, `src/tests.zig`, and `.turbo/` state unchanged. Two synthetic, non-secret probe rc files were created under `/private/tmp`; only `--dry-run` read them.
