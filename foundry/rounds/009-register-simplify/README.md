# Round 009: Register simplify

Status: accepted
Date: 2026-08-19
Scope: register a behavior-preserving code reduction workflow as an experimental skill

## Decision question

Should bounded simplification replace the broad `quality-baseline` audit, be absorbed into it, or become a separate implementation skill?

## Evidence considered

A real feature branch needed to fall from 1,450 additions to fewer than 1,000 without losing generated-secret persistence across two framework adapters. The successful reduction:

- finished at 996 additions with shared runtime and adapter test contracts;
- preserved strict malformed-state handling, including rejecting arrays where records were required;
- passed deterministic checks, Test Strength, repeated Resilience pressure, and external review;
- appended a signed simplification commit without rewriting the feature commit.

Only generalized, public-safe method enters this repository.

## Boundary

`simplify` owns a bounded reduction target and may implement when authorized. `quality-baseline` remains the broad read-only repository health audit. `improve` remains broad advisory planning outside this catalog. Test Strength, Resilience Audit, and Review Gate remain independent verification gates invoked by risk.

## Decision

- Add `skills/.experimental/simplify/`.
- Keep `quality-baseline` unchanged rather than superseding it globally.
- Use the experimental distribution channel.
- Record maturity as dogfooded because the method completed one real feature reduction, while baseline comparison is still pending.
- Add method and trigger eval definitions covering implementation, audit-only behavior, persistence risk, and the broad-quality near miss.

## Evidence gap

The method has not been compared against no skill, `quality-baseline`, or a general improvement audit on transfer holdouts. Promotion requires an independent baseline comparison and human review of whether the reductions preserve clarity as well as behavior.
