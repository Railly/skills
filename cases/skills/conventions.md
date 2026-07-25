# Railly Skills review conventions

Bootstrapped 2026-07-25 from the repository README, marketplace manifest,
Foundry governance, maturity registry, and validation script.

## Surface map

```surfaces
.claude-plugin/marketplace.json -> README.md foundry/maturity.json scripts/validate-skills.mjs
foundry/maturity.json -> README.md .claude-plugin/marketplace.json foundry/governance.md
skills/.experimental/ -> README.md .claude-plugin/marketplace.json foundry/maturity.json
skills/review-gate/ -> README.md .claude-plugin/marketplace.json foundry/maturity.json
skills/record-a-case/ -> README.md .claude-plugin/marketplace.json foundry/maturity.json
```

## Norms

- Stable skills live at `skills/<name>`.
- Candidate and Experimental skills live at `skills/.experimental/<name>`.
- Distribution channel and evidence maturity remain independent fields.
- Every installable skill appears exactly once in the marketplace and maturity registry.
- New skills include trigger evals and method evals.
- Skill files remain within the validator's progressive-disclosure line budget.
- Moving a skill requires updating all repository-relative links.
- Validation runs with Bun through `validate-skills.mjs` and `verify-eval-fixtures.mjs`.

## Gate-miss ledger

(empty)
