# Compiled Knowledge Layer Frame

## Source

> good y todos los skills deberian tener tambien sus casos documentados no? no solo review gate jeje, y sí agree que le falta memoria compliada entre evidacina y procedimiento, me gusta crear ese knowledge layor hagamoslo, primero shaping ?

## Research input

- `2608.27454v1`, "WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution", separates immutable execution evidence, persistent compiled knowledge, and reversible executable skills.
- The current Foundry already separates cases, runs, rounds, maturity, and installable skills, but does not expose one persistent layer that compiles patterns and skill impact across those artifacts.

## Problem

- Real work is recorded across `cases/`, `foundry/runs/`, `foundry/rounds/`, `foundry/candidates/`, conventions, and skill references. A maintainer or proposer must rediscover recurring lessons by searching all of them.
- Skill provenance is not a first-class relationship. `maturity.json` points to one decision per skill, but does not enumerate the cases, runs, patterns, rejections, and gaps that justify the current procedure and maturity.
- Name matches are not reliable provenance. They can represent a real application, a future suggestion, or an incidental substring. Round 006 already required manual reading to distinguish them.
- Rejected, absorbed, and no-change proposals survive in individual rounds, but are not compiled into a searchable history that prevents the same weak intervention from being proposed again.
- Loading the evidence corpus directly into an executing agent would waste context, risk private-data exposure, and blur the boundary between demonstrated procedure and background knowledge.
- Some registered skills have no explicit case linkage. Missing evidence must remain visible instead of being replaced by a plausible retrospective story.

## Outcome

- The Foundry has a canonical knowledge layer between evidence and procedure.
- Every registered skill has an auditable provenance page that links its cases, runs, rounds, motivating patterns, accepted changes, rejected changes, and current evidence gaps.
- Cross-skill patterns compile repeated evidence without copying the full cases into agent context.
- Executing agents receive promoted skills only. Knowledge maintainers and skill proposers can query the compiled layer and follow selected links back to raw evidence.
- Existing behavior evals, transfer holdouts, maturity rules, confidentiality boundaries, and human promotion remain authoritative.
- The layer can be introduced incrementally across the current catalog without fabricating backfilled cases or rewriting the full corpus.
