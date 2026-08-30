# Railly Skills North

Updated: 2026-08-29

## Product promise

Railly Skills turns real engineering evidence into portable agent procedures whose provenance, behavior, and promotion can be audited.

## Current evidence

- The repository contains 19 registered skills, 99 case files, and more than 500 Foundry run artifacts, but their evidence-to-skill relationships are mostly reconstructed through search and prose.
- The existing Foundry already separates cases, maturity, behavior evals, human promotion, and installable procedure.
- Round 006 showed that skill-name matches require manual interpretation because mentions, planned use, and actual method application are different relationships.
- WikiSkill provides research evidence that persistent compiled knowledge can improve skill evolution when it remains separate from the executing agent's context.
- The first proposal-impact run preserved a rejected procedural patch, its three-variant evaluation, decision rationale, and unchanged active-skill digest in the compiled graph.

## Direction bets

1. Add a Foundry-only compiled knowledge layer between recorded evidence and executable skills, with human-readable pages, typed relationships, generated projections, and deterministic validation.
2. Give every registered skill an explicit provenance page. Dogfooded or higher maturity must resolve to applied evidence, while missing evidence remains a visible gap.
3. Keep proposal generation bounded to one skill, preserve every outcome, and require passing evidence plus human authority before active procedure changes.

## Non-goals

- Do not build an autonomous self-modifying skill service in this horizon.
- Do not ingest hidden reasoning, secrets, private review text, customer data, or unrestricted full transcripts.
- Do not place the knowledge corpus inside installed skill packages or target repositories.
- Do not turn every case or pattern into a new skill.
- Do not block the first useful slice on perfect historical reconstruction of the full corpus.

## Decision rules

- Every authored relationship needs a stable ID, explicit type, and retrievable or bounded private evidence handle.
- A textual mention is not evidence that a skill was applied.
- An executing agent reads active procedure only; maintainers and proposers query compiled knowledge separately.
- Skill changes are atomic, reversible, evaluated against the released version, and promoted only by a human.
- Generated indexes and coverage reports never become competing sources of truth.
- Each implementation slice must produce a visible artifact or validator result and land green independently.

## Success signals

- A reader can open one skill provenance page and reconstruct why the skill exists, how it changed, what evidence supports its maturity, and which gaps remain.
- A repeated pattern is found from the compact index without loading the full case corpus.
- A rejected skill change remains queryable and prevents the same unsupported proposal from being repeated.
- Catalog validation detects unsupported maturity, broken evidence links, duplicate IDs, and stale projections.
- An installed agent completes its task without access to Foundry knowledge artifacts.

## Open questions

- Whether compiled knowledge should later become visible on `skills.railly.dev` after the authoring and validation model is proven.
- What pruning policy is needed once active, contradicted, superseded, and stale patterns accumulate over longer periods.
