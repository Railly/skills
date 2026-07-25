# Round 3: distribution ladder

Status: complete
Date: 2026-07-25

## Decision

The marketplace now exposes three independent distribution channels:

- Stable: `unfold`, `pick-an-issue`, `record-a-case`, `review-gate`
- Candidates: `trail-decisions`, `signature-repro`
- Experimental: `quality-baseline`, `performance-proof`, `test-strength`, `resilience-audit`

`record-a-case` moves to Stable with dogfooded maturity because it has been used to capture real maintenance work but has not completed a baseline comparison.

`review-gate` moves to Stable with evaluated maturity because round 002 performed a blind comparison against a maintainer-review answer key. Its mixed result remains visible and does not qualify as validated.

The four new quality skills enter Experimental with method and trigger eval definitions but no real-work case or comparison result.

## Rule

Distribution channel describes installation confidence. Evidence maturity describes what has been proven. Promotion in one dimension never advances the other automatically.
