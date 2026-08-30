# Railly Skills review conventions

Bootstrapped 2026-07-25 from the repository README, marketplace manifest,
Foundry governance, maturity registry, and validation script.

## Surface map

```surfaces
.claude-plugin/marketplace.json :: README.md, foundry/maturity.json, scripts/validate-skills.mjs
foundry/maturity.json :: README.md, .claude-plugin/marketplace.json, foundry/governance.md, foundry/knowledge/coverage.md, foundry/knowledge/graph.json
skills/.experimental/* :: README.md, .claude-plugin/marketplace.json, foundry/maturity.json
skills/.experimental/factory-loop/* :: README.md, CHANGELOG.md, .claude-plugin/marketplace.json, foundry/maturity.json, foundry/rounds/*, www/src/components/WorkflowGraph.astro, www/src/components/EvidenceKey.astro, www/src/styles/global.css, scripts/lib/factory-loop.test.mjs
skills/.experimental/software-factory/* :: README.md, CHANGELOG.md, foundry/maturity.json, www/src/components/WorkflowGraph.astro, www/src/styles/global.css, scripts/lib/factory-loop.test.mjs
skills/issue-intake/* :: README.md, foundry/missions/*, foundry/maturity.json
skills/review-gate/* :: README.md, .claude-plugin/marketplace.json, foundry/maturity.json
skills/record-a-case/* :: README.md, .claude-plugin/marketplace.json, foundry/maturity.json
foundry/missions/* :: README.md, scripts/validate-issue-contracts.mjs, foundry/source-of-truth.md
foundry/knowledge/patterns/*.md :: foundry/knowledge/index.md, foundry/knowledge/coverage.md, foundry/knowledge/graph.json
foundry/knowledge/skills/*.md :: foundry/knowledge/coverage.md, foundry/knowledge/graph.json
foundry/knowledge/audits/*.json :: foundry/knowledge/audits/*-coverage.md, foundry/knowledge/graph.json
foundry/knowledge/impact.jsonl :: foundry/knowledge/index.md, foundry/knowledge/graph.json
scripts/lib/knowledge.mjs :: scripts/lib/knowledge.test.mjs, foundry/knowledge/index.md, foundry/knowledge/coverage.md, foundry/knowledge/graph.json
scripts/lib/knowledge-audit.mjs :: scripts/lib/knowledge-audit.test.mjs, foundry/knowledge/audits/*-coverage.md, foundry/knowledge/graph.json
scripts/lib/knowledge-impact.mjs :: scripts/lib/knowledge-impact.test.mjs, scripts/build-proposal-packet.mjs, scripts/record-impact.mjs, foundry/knowledge/index.md, foundry/knowledge/graph.json
```

## Norms

- The canonical local source repository is resolved by `scripts/resolve-source-root.mjs`.
- Cases, evals, run reports, decision trails, and Foundry logs live only in the canonical `Railly/skills` source repository.
- `.agents/skills`, `.claude/skills`, and other installed skill directories are immutable distribution surfaces, never write destinations.
- The target repository receives implementation artifacts only, not Railly Foundry cases, evals, or logs.
- Stable skills live at `skills/<name>`.
- Candidate and Experimental skills live at `skills/.experimental/<name>`.
- Retired skill sources live under `foundry/deprecated/` and never appear in the marketplace or active maturity registry. A deprecated compatibility alias may remain installable for one release when a rename would otherwise break existing invocations.
- Distribution channel and evidence maturity remain independent fields.
- Every installable skill appears exactly once in the marketplace and maturity registry.
- New skills include trigger evals and method evals.
- Skill files remain within the validator's progressive-disclosure line budget.
- Moving a skill requires updating all repository-relative links.
- Validation runs with Bun through `validate-skills.mjs`, `validate-issue-contracts.mjs`, `validate-knowledge.mjs`, `compile-knowledge.mjs --check`, `audit-knowledge-matches.mjs --check`, and `verify-eval-fixtures.mjs`.

## Gate-miss ledger

- 2026-08-29: the surface map used `->` and space-separated targets while `gate.sh surfaces` parses `::` and comma-separated targets. The gate returned a false pass without running any rule. Converted the map to executable syntax, added Knowledge surfaces, and reran it on the compiled-knowledge diff.
