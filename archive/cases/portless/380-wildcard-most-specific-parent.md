# 380: wildcard fallback picked the first parent in storage order

- PR: vercel-labs/portless#446 (recreates #439 by @Knat-Dev, credited via Co-Authored-By). Head 2d14f20.
- Gate run: `foundry/runs/review-gate/2026-10-01-portless-439/` (pass, cross-family FX review).

## Defect
`findRoute`'s wildcard tier used `routes.find`, so with `acme` and `api.acme` registered, `admin.api.acme.localhost` reached whichever parent was stored first.

## Fix
`findMostSpecificParent` keeps the longest matching parent. Exact and Tailscale tiers unchanged. README, SKILL.md and `--help` state the rule.

## Evidence
- Built CLI, both registration orders: main gives `acme` when acme registers first; fix gives `api.acme` in both.
- Unit test red on main (`Received: "parent"`).
- An all-404 E2E run right after the full suite was a registration race (3s sleep under load), not the fix; rerun isolated was correct.

## Lesson
E2E scripts that sleep for registration are load-sensitive; a uniform 404 across exact hosts means the routes never registered, not a routing bug. Check routes.json before reading the result.
