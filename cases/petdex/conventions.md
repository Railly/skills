# petdex review conventions

Bootstrapped 2026-07-18 from `AGENTS.md` (crafter-station/petdex) during the
auto-slug review. Compile prose rules into checks; extend on every external miss.

## Surface map

```surfaces
src/i18n/messages/ -> src/i18n/messages/en.json src/i18n/messages/es.json src/i18n/messages/zh.json
src/lib/url-allowlist.ts -> next.config.ts src/lib/security.test.ts
src/lib/db/schema.ts -> src/lib/mock/db.ts drizzle/
public/brand/petdex-mark.svg -> src/app/favicon.ico
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
- Validation set: `bun run check`, `bun run i18n:check`, `bun test`,
  `git diff --check`, mock build via `TELEMETRY_RATELIMIT_SECRET=mock-telemetry-secret
  bun --env-file=.env.mock run build`.
- Known-red on main (2026-07-18): Biome errors in `packages/petdex-cli`
  (process.test.ts noExplicitAny x2, useImportType, bin/petdex.ts format) and
  `src/data/built-with.json` format; `src/lib/pet-preview.test.ts` 2 failing tests.
  Treat as pre-existing unless the diff touches those files.

## Gate-miss ledger

(empty)
