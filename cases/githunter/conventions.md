# GitHunter review conventions

Bootstrapped 2026-08-02 from GitHunter's package scripts, ranking domain context, ranking ADRs, ranking operations document, database schema, and deployment configuration.

## Surface map

```surfaces
src/rankings/types.ts :: src/rankings/lenses.ts, src/rankings/score.ts, src/rankings/store.ts, src/db/schema/ranking.ts, docs/ranking-system.md
src/rankings/lenses.ts :: src/rankings/score.test.ts, src/app/rankings/*, docs/ranking-system.md
src/rankings/score.ts :: src/rankings/score.test.ts, src/rankings/store.ts, src/app/api/rankings/*, src/app/rankings/*
src/db/schema/ranking.ts :: src/db/schema/index.ts, drizzle/*.sql, drizzle/meta/*, docs/ranking-system.md
src/rankings/github.ts :: scripts/build-ranking-bundle.ts, src/rankings/refresh.ts, src/triggers/refresh-ranking-snapshots.ts, docs/ranking-system.md
src/rankings/store.ts :: src/app/api/rankings/*, src/app/rankings/*, docs/ranking-system.md
```

## House norms

- Use Bun for package scripts and execution.
- Use Biome for formatting and linting.
- Do not add comments unless the maintainer requests them.
- Do not add AI coauthor trailers.
- Ranking claims state the lens, cohort, evidence window, version, freshness, and limitations. Balanced is a default lens, not a universal quality claim.
- A lens weight change requires a version change and a reproducibility test.

## Subsystem invariants

- The ranking pipeline is metric facts to a versioned lens to an immutable snapshot to Redis, Postgres, and then the public API and UI.
- Public reads follow Redis, Postgres, bundled audited snapshot. Database or cache failure must not make the public ranking unavailable.
- Normal lenses percentile-normalize within one cohort before weighting. Raw magnitudes do not add score beyond cohort position.
- Rising compares equal-duration adjacent periods. Missing prior evidence lowers confidence and is never silently treated as zero.
- Refresh collection finishes before persistence, and same-day retries replace the same snapshot identifier rather than creating divergent versions.
- GitHub location is self-reported scope evidence. Private activity and commit substance are not claimed as measured.
- The bundled dataset is a deployment fallback and reproducibility artifact, not an independent live source.

## Verification norms

- Run `bun run test -- --runInBand`, `bunx tsc --noEmit`, targeted Biome checks, `bunx drizzle-kit check`, and a production `bun run build`.
- Drive at least one ranking page on desktop and mobile, switch lenses, filter the table, and inspect browser errors.
- Verify the JSON API success contract, CDN cache header, invalid-scope 404, cohort count, lens version, and at least one known rank.
- Regenerating the bundled dataset requires checking all lens leaders and the focal profile's position before committing it.

## Gate-miss ledger

(empty)
