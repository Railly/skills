# prove-the-test round 1 results

## Decision

Keep the current `prove-the-test` skill unchanged. Promote the case inventory, executable fixtures, trigger set, grader-compatible result schema, and benchmark harness.

The candidate added a proof-record section and public exemplars. It tied the current skill and therefore failed the measurable-improvement gate.

## Benchmark

| Variant | Passed assertions | Pass rate |
|---|---:|---:|
| no skill | 18/20 | 90% |
| current skill | 20/20 | 100% |
| candidate skill | 20/20 | 100% |

Candidate delta versus current: **0 percentage points**.

Current delta versus no skill: **10 percentage points**.

The meaningful difference appeared in the Python holdout. The no-skill run replaced a test-module binding instead of removing the production fix and did not rerun green after restoration. Current and candidate both mutated the actual production seam, observed the wrong-route failure, restored the fix, and reran the full unittest suite.

## Trigger audit

The current description passed a semantic audit of five positive and five near-miss prompts. This checks description boundaries, not actual runtime invocation. Reproduction-first work belongs to `repro-an-issue`; packaged artifact acceptance does not belong to `prove-the-test`.

## Analyst findings

- Sixteen of twenty assertions did not discriminate among variants.
- Several prompts disclosed the intended method or diagnostic stream.
- The required result artifact partially taught every variant to leave a proof record.
- The Python holdout transferred languages but reused the same authority-routing structure.
- There was one run per variant, so variance is unknown.
- Agent timing, token use, and raw command transcripts were unavailable.
- Candidate made one unrelated end-of-file-only edit during an eval, while current restored the original file shape exactly.

These limitations prevent treating 100% as a general performance claim. The result supports the current skill and rejects the proposed extra text.

## Promoted artifacts

- `skills/prove-the-test/evals/evals.json`
- `skills/prove-the-test/evals/triggers.json`
- five executable fixture pairs under `skills/prove-the-test/evals/fixtures/`
- `scripts/setup-eval-fixture.mjs`
- `scripts/setup-skill-eval.mjs`
- `scripts/aggregate-skill-eval.mjs`
- `scripts/verify-eval-fixtures.mjs`
- CI verification for fixture setup and expected initial state

## Next benchmark requirements

Before reconsidering a skill-text change:

1. Remove method hints from prompts.
2. Use a structurally different transfer holdout.
3. Require the two-stage helper/caller proof explicitly in the rubric.
4. Preserve full runner instructions and raw command traces.
5. Run multiple trials per variant.
6. Separate agent-demonstrated evidence from grader reconstruction.
