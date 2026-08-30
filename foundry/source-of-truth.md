# Canonical source repository

All Railly Skills cases, eval definitions, eval runs, review reports, decision trails, and Foundry logs are written to the canonical local checkout of `Railly/skills`.

Installed copies under `.agents/skills`, `.claude/skills`, or another agent-specific directory are distribution artifacts. They may be read, but they are never write destinations.

## Resolve the root

Resolve the source root before the first artifact write:

```bash
bun "${RAILLY_SKILLS_REPO:-$HOME/Programming/railly/skills}/scripts/resolve-source-root.mjs"
```

The resolver checks, in order:

1. `RAILLY_SKILLS_REPO`
2. `~/Programming/railly/skills`
3. `~/railly-skills`

It validates the Foundry registry, marketplace manifest, and case corpus. It does not fall back to the current working directory or the loaded skill directory.

## Canonical destinations

| Artifact | Destination under the source root |
|---|---|
| Public maintenance case | `cases/<repo>/` |
| Project review conventions | `cases/<repo>/conventions.md` |
| Skill eval definition or fixture | `skills/<skill>/evals/` or `skills/.experimental/<skill>/evals/` |
| Review Gate run report | `foundry/runs/review-gate/` |
| Sanitized usage-receipt compilation | `foundry/runs/usage-receipts/` |
| Radius dogfood map and ledger | `foundry/runs/review-gate/radius-dogfood/` |
| Candidate, decision, or pilot | `foundry/candidates/` or `foundry/rounds/` |
| Live Issue Contract | `foundry/missions/<owner-repo>/` |
| Implementation decision trail | `foundry/trails/<repo>/` |

The target repository receives its requested code, tests, and documentation changes. It does not receive Railly Foundry cases, evals, or run logs.

## Failure behavior

If the canonical source root cannot be resolved or is not writable, stop the artifact write and report the missing root. Never substitute an installed skill copy or the target repository.

Distribution may copy static eval fixtures into an installed skill. Those copies are immutable package contents. New results always return to the canonical source root.
