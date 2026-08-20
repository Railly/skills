# butaca review conventions

Project overlay for the review-gate skill. Derived from the butaca repository AGENTS.md and the four agentic UX issues opened on 2026-08-14.

## Surface map

```surfaces
src/args.ts :: src/cli.ts, README.md, skills/butaca/SKILL.md, src/commands/schema.ts
src/commands/butacas.ts :: README.md, skills/butaca/SKILL.md, src/commands/schema.ts
src/commands/reservar.ts :: README.md, skills/butaca/SKILL.md, src/commands/schema.ts
src/commands/elegir.ts :: src/args.ts, src/cli.ts, README.md, skills/butaca/SKILL.md, src/commands/schema.ts
src/commands/recomendar.ts :: src/args.ts, src/cli.ts, README.md, CONTRACT-AUTH.md, skills/butaca/SKILL.md, src/commands/schema.ts
src/api-auth.ts :: src/commands/butacas.ts, src/commands/reservar.ts, src/commands/elegir.ts
```

## House norms

- Runtime and package manager: Bun.
- JSON is a public contract. Observable payload changes require schema, README, skill, and tests.
- Human diagnostics go to stderr. Machine envelopes go to stdout.
- `butacas` opens an upstream order to obtain the map and must never be called in a loop.
- `reservar` and `elegir` take real inventory only after interactive confirmation or `--yes`.
- `recomendar` requires confirmation before opening one order, never calls the hold endpoint, and returns a `reservar --orden` next step for the same transaction.
- Payment is never automated. A site URL never claims to preserve a CLI-created order.
- Do not add em dashes, generated coauthor trailers, or unnecessary comments.

## Verification norms

- Run `bun test`, both TypeScript checks, the targeted Biome lint, and `bun run build`.
- Drive the built CLI for user-facing command changes.
- For authenticated contract changes, verify a read-only preflight against Cinemark before any order-opening operation.
- Every new side effect or failure path declares `sideEffect` and `retryable` where the caller can act on them.
