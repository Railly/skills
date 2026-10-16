---
name: performance-proof
description: "Prove a performance improvement before and after changing algorithms, data structures, latency, throughput, memory, bundle size, build time, or repeated work. Use when a concrete path is slow or resource-heavy, when considering Map, Set, heap, trie, queue, cache, index, batching, or memoization, or when asked to optimize code without guessing."
compatibility: Requires a runnable workload and profiling or measurement tools appropriate to the repository. Source edits require user authorization.
---

# Performance proof

The best algorithm depends on workload, constraints, data distribution, and required semantics. Optimize only a measured path.

## 1. Define the claim

State the user-visible performance property, representative workloads, realistic size distribution, worst credible case, required tail or memory bounds, correctness constraints, and stop condition.

**Complete when:** success and rejection can be decided from measurements.

## 2. Record a stable baseline

Capture environment, build mode, dataset, warmup, repetitions, variance, and raw results. Confirm the harness exercises the claimed path. If noise is larger than the expected effect, improve the harness before editing.

**Complete when:** repeated baseline runs are comparable and the workload is representative.

## 3. Profile the path

Use the repository's profiler, tracing, allocation, query-plan, bundle, or timing tools. Name the hot function, allocation, I/O wait, or repeated computation. State expected time and space complexity for the measured region.

**Complete when:** evidence identifies the cost center. If it does not, stop without an optimization claim.

## 4. Compare candidates

Evaluate the smallest candidates that preserve semantics:

| Hot pattern | Candidate | Required check |
|---|---|---|
| repeated search in a hot loop | `Map` index | uniqueness, ordering, build cost, memory |
| repeated membership checks | `Set` | equality, order, construction crossover |
| full sort for small top K | bounded heap or selection | ties, stability, realistic K/N |
| front removal in high-volume FIFO | deque or ring buffer | bounds, backpressure, reuse |
| repeated prefix lookup | trie or prefix index | normalization, update cost, memory |
| repeated graph scan | adjacency or reverse index | invalidation and stale state |
| linear route lookup | exact index plus explicit fallback | precedence and canonicalization |

Include the current implementation as a candidate. Prefer the simpler implementation when results are within noise.

**Complete when:** the chosen candidate has a complexity hypothesis and explicit semantic risks.

## 5. Implement one bounded change

Proceed only when source edits are authorized. Preserve unrelated work. Add semantic equivalence coverage before or with the change.

**Complete when:** one attributable change implements the measured hypothesis.

## 6. Re-measure and reject honestly

Run correctness checks and the same benchmark. Compare distributions, not one favorable run. Check required tail latency, throughput, memory, build or bundle size, and operational complexity.

Reject when the difference is within noise, the workload is unrepresentative, a required metric regresses, semantics change, or complexity grows without material value.

**Complete when:** the claim is proven, rejected, or explicitly inconclusive with raw evidence.

## 7. Guard and review

Add the smallest durable benchmark, budget, or regression test with a documented noise policy. Run the repository review gate when available.

**Complete when:** future regressions can be detected and the rollback path is named.
