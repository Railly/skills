# prove-the-test round 2 results

## Decision

Keep `prove-the-test` unchanged. Reject the candidate proof-record text, subprocess sentence, and public exemplars. Promote only the improved evaluation infrastructure.

## Benchmark

| Variant | Passed assertions | Pass rate |
|---|---:|---:|
| no skill | 16/20 | 80% |
| current skill | 17/20 | 85% |
| candidate skill | 17/20 | 85% |

Candidate delta versus current: **0 percentage points**.

Current delta versus no skill: **5 percentage points**.

Current and candidate have identical assertion and task vectors. Nineteen of twenty assertions do not discriminate among all three variants.

## Improvements over round 1

- Prompts no longer disclose the helper/caller trap, red-before-green method, proof-record structure, or exact subprocess stream.
- The transfer holdout uses Python retry semantics instead of repeating authority routing.
- Agent outputs use a neutral final-response contract.
- Grading more strictly distinguishes prose claims from durable evidence.

These changes improve the benchmark, not the candidate.

## Findings

- All variants correctly strengthened caller coverage.
- Current and candidate reported verification boundaries where no skill omitted one in the route fixture.
- All variants solved the structurally different Python holdout.
- Candidate alone recorded a direct subprocess probe distinguishing empty stdout from stderr.
- That probe was unscored, survived only as prose, and came from one run.
- Candidate's subprocess fallback was weaker than current when stderr is empty.
- Candidate and no skill made minor unrelated whitespace edits in one fixture; current preserved file shape.

## Gate outcome

| Gate | Outcome |
|---|---|
| No regression | fail under strict quality comparison |
| Measurable improvement | fail, zero candidate delta |
| Structurally different transfer | pass for benchmark design, no candidate gain |
| Evidence precision | fail, structured prose did not become durable proof |
| Repeated-run confidence | fail, one run per variant |

## Durable outcome

Round 2 validates the foundry itself: a plausible and attractive skill addition was rejected because it did not outperform the existing method.

The repository keeps:

- public-safe case inventory and clusters;
- five executable behavior fixtures;
- ten semantic trigger cases;
- setup, verification, aggregation, and CI scripts;
- machine-readable results for both rounds;
- the existing lean `prove-the-test` skill.

## Future candidate requirements

1. Harness-captured command, exit, stdout, stderr, mutation, and restoration evidence.
2. Separate assertions for artifact correctness, grader reconstruction, and agent-demonstrated proof.
3. Repeated trials with task-level variance.
4. Blinded subprocess cases covering stdout, stderr, spawn errors, empty exits, signals, and timeouts.
5. A deterministic-proxy holdout before reconsidering the agent-browser exemplar.
6. Reference-open telemetry before attributing improvement to exemplars.
