# Issue missions

This directory stores live Issue Contracts for Railly Skills workflows. Contracts are state carriers, not skills and not substitutes for repository exploration or Standards review.

## Start a mission

Copy [_template.md](_template.md) to:

```text
foundry/missions/<owner-repo>/<issue-or-mission>.md
```

Resolve the canonical source root with `scripts/resolve-source-root.mjs`. Never create the contract in the target repository or an installed skill directory.

## State transitions

```text
selected
  -> reproducing
  -> reproduced
  -> implementing
  -> proof-ready
  -> spec-reviewed
  -> standards-reviewed
  -> closed
```

A state advances only when its evidence exists:

- `reproduced`: deterministic red signal or an explicit environment gap.
- `proof-ready`: verification maps commands to acceptance or invariant IDs.
- `spec-reviewed`: acceptance, non-goals, and invariants were checked against the result.
- `standards-reviewed`: Review Gate completed or its gaps are named.
- `closed`: delivery state and case path are recorded.

Return to an earlier state when runtime evidence changes scope or invalidates a contract claim. Append a short Contract changes entry instead of silently rewriting the story.

## Validate

```bash
bun scripts/validate-issue-contracts.mjs
```

The validator checks the retrospective pilot and all live contracts. Live missions must map every acceptance ID to verification evidence.
