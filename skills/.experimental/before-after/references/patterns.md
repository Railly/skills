# Before/after patterns

## Visual behavior

Use when the reader wants to reproduce a bug, feel a fix, or capture a screenshot.

- Run the same action against baseline and changed builds.
- Keep both lanes mounted and synchronized when hidden or soloed.
- Provide one obvious replay, trigger, or reset control.
- Show direct evidence near each lane, such as paint count, mounted nodes, drift, emitted bytes, or current state.
- Preserve a deterministic reproduction when the natural bug depends on OS, DPR, timing, hardware, or unavailable infrastructure.
- State which lane is real, simulated, or fixture-driven.

The strongest opening is usually the two behaviors themselves, not a hero explaining them.

## Benchmark

Use when the difference is primarily numeric.

- Lead with the relationship, such as `26 renders → 1`, not a grid of unrelated KPIs.
- Use a semantic table for exact lookup.
- Align numeric headers and cells to the right.
- Keep units, period, sample, and measurement method next to the values.
- Show unchanged guard metrics when they prove the improvement did not trade correctness away.
- Use a chart only when position or length makes the relationship faster to understand.

Do not color a favorable result green merely because it is favorable.

## Feature tour

Use when a new capability deserves to be explored rather than merely verified.

- Open with the old limitation beside the new capability.
- Add the smallest simulator that represents the real contract.
- Explain the data flow only after the reader has experienced the difference.
- Keep implementation detail short and evidence-led.
- End with tests, real boundaries, limitations, and current delivery status.

## Evidence hierarchy

Prefer, in order:

1. Two real shipped or built artifacts receiving the same input.
2. A real changed artifact beside a captured baseline trace.
3. Deterministic fixtures extracted from the real failure.
4. A clearly labelled simulation.

Never let a polished simulation imply that two real builds were exercised.

## Relationship to other skills

- Use `before-after` when the main job is to see, compare, test, or screenshot the change.
- Use `explain-diff` when the main job is to learn the subsystem and code deeply.
- Use `performance-proof` before claiming a performance improvement.
- Use `review-gate` to decide whether the change is safe to ship.
