# petdex review conventions

Bootstrapped 2026-07-18 from `AGENTS.md` (crafter-station/petdex) during the
auto-slug review. Compile prose rules into checks; extend on every external miss.

## Surface map

```surfaces
src/i18n/messages/ -> src/i18n/messages/en.json src/i18n/messages/es.json src/i18n/messages/zh.json
src/lib/url-allowlist.ts -> next.config.ts src/lib/security.test.ts
src/lib/db/schema.ts -> src/lib/mock/db.ts drizzle/
public/brand/petdex-mark.svg -> src/app/favicon.ico
packages/petdex-desktop-native/src/agent_hooks.zig -> packages/petdex-desktop-native/src/main.zig packages/petdex-desktop-native/src/hook_runner.zig
packages/petdex-desktop-native/src/assets/*-petdex-plugin/** -> packages/petdex-desktop-native/src/agent_hooks.zig packages/petdex-desktop-native/src/hook_runner.zig
packages/petdex-desktop-native/src/assets/agents/* -> packages/petdex-desktop-native/src/main.zig
```

## Norms

- Bun only for repo work; `npm`/`npx` appear only in end-user CLI docs.
- Submission identity/credit comes from verified Clerk session or CLI bearer token,
  never request bodies (`src/lib/submissions.ts`, `/api/submit`, `/api/cli/submit*`).
- State-changing browser endpoints use `requireSameOrigin`; CLI/server callers
  authenticate by bearer or service-side checks.
- New external hosts touch both `src/lib/url-allowlist.ts` and the CSP in
  `next.config.ts`, plus regression coverage in `src/lib/security.test.ts`.
- i18n locales en/es/zh; after editing messages run `bun run i18n:check`.
- `packages/petdex-cli` and `packages/discord-bot` are independent packages
  (own installs/scripts); root tsconfig excludes `packages`.
- Desktop `AgentKind` values are append-only because their ordinal indexes the
  compiled agent icon atlas. Every new kind needs an icon cell, model row,
  install dispatch, hook source name, and environment wiring in `main.zig`.
- Agent installers preserve foreign hooks and configuration, are idempotent,
  and keep failures fail-open so an agent session is never interrupted.
- Validation set: `bun run check`, `bun run i18n:check`, `bun test`,
  `git diff --check`, mock build via `TELEMETRY_RATELIMIT_SECRET=mock-telemetry-secret
  bun --env-file=.env.mock run build`.
- Known-red on main (2026-07-18): Biome errors in `packages/petdex-cli`
  (process.test.ts noExplicitAny x2, useImportType, bin/petdex.ts format) and
  `src/data/built-with.json` format; `src/lib/pet-preview.test.ts` 2 failing tests.
  Treat as pre-existing unless the diff touches those files.

## Gate-miss ledger

- 2026-08-12: Hermes plugin metadata and five lifecycle phases were initially
  produced but not consumed by `hook_runner.zig`. Gate every new hook phase and
  namespaced payload field through bubble, state, title, and conversation tests.
- 2026-08-12: Hermes install rollback originally allowed unreadable snapshots
  and uninstall was non-transactional. Gate failed installs and uninstalls for
  byte-identical restoration and preservation of user-modified plugin files.
- 2026-08-12: Hermes gateway and approval `session_key` values can contain
  colons while Petdex session IDs are filename-safe. Gate canonical identities
  with a real Hermes-style key and deterministic normalization.
- 2026-08-13: remote host and identity values entered fixed-size model buffers
  without matching ingress bounds. Gate every parsed string against its final
  storage capacity, including prefixes added by SSH argument builders.
- 2026-08-13: chunked remote writes updated live files before completion and
  could activate hook configs before their dependencies landed. Gate writes
  through same-directory temporary files, atomic rename, and dependency-first
  output ordering.
- 2026-08-13: remote Hermes hooks resolved the default home while writeback
  targeted the active profile. Gate every Hermes consumer with a named active
  profile and no explicit `HERMES_HOME`.
- 2026-08-13: remote hook JSON accepted raw C0 control characters and the YAML
  text merger accepted forms it cannot preserve. Gate adversarial payload text
  and fail closed before mutating tab-indented or multi-document YAML.
- 2026-08-13: watcher startup failure marked sync complete and had no live
  re-entry path. Gate every terminal remote phase by forcing failure and proving
  a bounded retry while the tunnel stays alive.
- 2026-08-13: token reads and collected SSH output could truncate without the
  runtime treating the result as failure. Gate every bounded read at its caller
  and keep the remote feed closed when completeness cannot be proven.
- 2026-08-13: watcher replacement raced its flock and an exiting instance
  unlinked another process's PID file. Gate reconnect with an occupied lock,
  bounded acquisition retry, and ownership-checked PID cleanup.
- 2026-08-13: `kill -0` treated an unreaped parent zombie as alive and stranded
  its SSH tunnel. Gate the supervisor with an actual zombie parent and require
  remote token, lease, and watcher cleanup after process exit.
