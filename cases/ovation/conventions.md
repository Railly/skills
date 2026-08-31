# Ovation review conventions

Project overlay for the `review-gate` skill. Bootstrapped from Ovation's repository instructions and README files on 2026-08-21.

## Surface map

```surfaces
apps/web/lib/server/github.ts :: apps/web/app/api/github/items/route.ts, apps/web/lib/github/mappers.ts
apps/web/lib/server/db/schema.ts :: apps/web/lib/server/db/work-enrichment-store.ts
apps/web/lib/atoms.ts :: apps/web/components/jotai-provider.tsx, apps/web/components/workspace/shell.tsx, apps/web/components/workspace/dialogs/index.tsx, apps/web/components/workspace/sidebar/index.tsx
apps/web/app/api/runs/reset/route.ts :: apps/web/components/workspace/shell.tsx, apps/web/README.md
apps/web/lib/server/runs.ts :: apps/web/lib/agent-models.ts
```

## House norms

- Use the repository's pinned package manager and scripts for existing workflows.
- The web app uses Next.js 16 and React 19. Read the installed Next.js documentation before changing framework APIs.
- Credentials remain server-side and never use a `NEXT_PUBLIC_` prefix.
- GitHub and Vercel mutations remain explicit human actions.
- Preserve fixture and cache fallbacks when remote services or Postgres are unavailable.

## Subsystem invariants

- GitHub remains authoritative for issue and pull request state.
- Cached work items improve hydration but cannot hide live GitHub-native rows.
- Repository-scoped identities include the normalized owner, repository, and item number.
- A failed optional enrichment cannot remove or replace GitHub-native work items.
- Factory reset clears disposable browser and server-side projections without changing GitHub or Vercel data.
- Agent work runs in Vercel Sandbox and cannot inherit internal enrichment prose as task instructions unless explicitly requested.

## Verification norms

- Run `bun run --cwd apps/web check` for web TypeScript changes.
- Drive changed web behavior against the existing localhost application without restarting it.
- For GitHub pagination or ranking changes, verify a repository with more than 100 open items and inspect the resulting source identities.
- For durable projections, verify a subsequent GET returns the completed projection.

## Gate-miss ledger

- Empty at bootstrap.
