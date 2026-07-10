---
name: prove-the-test
description: Prove a test fails when the code is wrong before you trust it green. Use when writing or reviewing a test for a change or bug fix, when a change ships with passing tests you are not sure cover it, or when the user asks "does this test have teeth", "is this covered", or "add a test for this fix".
---

# Prove the test

The failure this prevents: a test passes while the code is still wrong. A test is worth keeping only if it goes **red when the change is reverted**. Everything here serves that.

## The proof: revert the change, watch the committed suite go red

Revert the change under test (the fix line, the new behavior). Run the **committed** suite. Watch a test go red. Restore. A test you have not watched fail against the real revert has no teeth, and a green you did not earn this way is a guess.

These do not count as the proof:

- a new test that passes: green alone says nothing about what would turn it red
- a manual run or an e2e you watched fail by hand: that is an acceptance check, not a committed guard, so CI still has nothing

If reverting the change leaves the whole suite green, the change is uncovered. Move or add a test until the revert turns something red.

## Test the code that changed, not the code beside it

Extracting a helper and testing the helper does not test the caller that changed. If the bug lived in how the caller wires the pieces together, a green helper test is false confidence. This is the **helper-vs-caller trap**: you tested the extraction, not the integration.

Choose the **seam** (the boundary where the change's behavior is observable) at the level the bug occurs:

- the bug needs two callers: a single-caller test cannot catch it
- the bug is in the wiring: drive the wired path, not the pure function under it
- only a too-shallow seam is reachable: say so. The architecture is blocking the guard, which is a finding, not a test to fake green.

## What a test worth keeping is

- checks behavior through a public seam, not internal structure, so it survives a refactor and breaks only when behavior breaks
- takes its expected value from an independent source (a known-good literal, a worked example, the spec), never recomputed the way the code computes it. A test that recomputes the answer passes by construction and can never disagree with the code.
- reads like a claim about what the system does, so a failure names what broke

## Red before green

Write the failing test first. Watch it fail for the right reason (a wrong assertion, not a file that will not load). Then write only enough code to pass it. A test written after the code and never seen red is the most common toothless test.
