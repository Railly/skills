---
name: test-strength
description: "Test whether regression coverage can actually detect the defect it claims to guard. Use when tests are green but may be weak, when reviewing coverage quality, after fixing a bug, or when asked for falsification, mutation testing, property-based testing, fuzzing, boundary integration, artifact verification, or flake detection."
compatibility: Requires runnable tests. Mutating production or test files requires user authorization and reversible isolation.
---

# Test strength

Execution is not protection. A strong test turns red when the guarded behavior is broken and exercises the layer where the claim lives.

## 1. Name the contract and defect

State the exact invariant, failure family, input classes, and runtime boundary. Identify which existing tests claim to protect it.

**Complete when:** a reader can describe the smallest wrong implementation the tests must reject.

## 2. Falsify the protection

In a reversible isolated change, remove the fix, invert the condition, or introduce the smallest representative fault. Run the narrow test first. Restore the source and rerun it green.

Do not accept a red caused by compilation failure, unrelated setup, or a different assertion.

**Complete when:** the intended assertion fails for the intended reason without the fix and passes after restoration.

## 3. Probe beyond the example

Choose methods from the contract:

- mutation testing for changed or critical logic;
- property-based generation for invariants and equivalence classes;
- bounded fuzzing at structured untrusted-input boundaries;
- reference-contract comparison for external semantics;
- deterministic seeds and replayable shrunk counterexamples.

Scope campaigns to actionable code. Treat surviving mutants in critical changed logic as leads. Do not chase a universal mutation or coverage percentage.

**Complete when:** generated failures are reproducible and survivors are killed, justified, or recorded as gaps.

## 4. Exercise the real boundary

Use integration tests for package, renderer, database, process, protocol, filesystem, or browser boundaries. Verify built, installed, bundled, serialized, or deployed artifacts when the claim depends on them.

**Complete when:** the test reaches the same layer as the user-visible claim, or the unavailable layer is named as a verification gap.

## 5. Check determinism and cost

Repeat new tests, control clocks, randomness, ports, and external state, and record runtime. Put fast changed-code checks in the pull-request path and broader mutation or fuzz campaigns in scheduled runs.

**Complete when:** the test is reproducible, replayable, and placed at a sustainable cadence.

## 6. Report strength

Report the contract, fix-absent red evidence, restored green evidence, mutation or property results, boundary exercised, remaining survivors, and verification gaps.

**Complete when:** no claim of protection relies only on coverage or a green suite.
