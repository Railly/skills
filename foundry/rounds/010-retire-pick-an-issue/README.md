# Round 010: Retire pick-an-issue

Status: accepted
Date: 2026-08-20
Scope: close the v0.0.4 migration window and remove the compatibility alias

## Decision question

[Round 005](../005-issue-intake-rename/README.md) renamed the canonical intake method to `issue-intake` and kept `pick-an-issue` as a self-contained alias so existing invocations would not break. That window was scoped to one release. Should the alias stay installable?

## Evidence considered

- The registry contradicted itself: the entry carried `channel: stable` with `maturity: deprecated`, so the catalog kept recommending a method it had already retired.
- [Round 007](../007-human-override-promotions/README.md) recorded 1 invocation in 90 days, consistent with Hunter's read that he no longer uses it.
- The alias had drifted from what it aliases. Its `SKILL.md` was a 30-line shim against the 80-line original, and it carried no `evals/` directory, so it could not be evaluated as a skill in its own right.
- `governance.md` already prescribes the outcome: "Deprecated skills leave the active registry and marketplace. Preserve their complete source, references, and eval evidence under `foundry/deprecated/<name>/` with a decision link."

## Decision

Retire the alias. Hunter's call, on the reading that `issue-intake` is the name that should prevail.

- Removed `skills/pick-an-issue/` from the installable surface.
- Removed its entry from `foundry/maturity.json` and its line from the `stable` group in `.claude-plugin/marketplace.json`.
- Removed it from `CANONICAL_WRITERS` in `scripts/validate-skills.mjs`.
- Removed the alias notes from `README.md`. The `CHANGELOG.md` mention stays: it records what v0.0.4 shipped and is history, not current state.

The complete original source and its evals were already preserved under [foundry/deprecated/pick-an-issue](../../deprecated/pick-an-issue), which is more complete than the retired shim.

## Consequence

An existing workflow that still invokes `pick-an-issue` by name will no longer resolve. That is the intended end of the migration window, not a regression. The replacement is `issue-intake`, same boundary and a fuller eval suite.
