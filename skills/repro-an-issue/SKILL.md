---
name: repro-an-issue
description: Build a signal that goes red on the bug before you theorize or fix it. Use when debugging something broken, slow, or failing, when confirming a bug report is real, or before concluding a bug cannot be reproduced. Triggers include "diagnose", "why is this happening", "can you reproduce this".
---

# Repro an issue

No hypothesis and no fix until you have one command that goes **red on this exact bug** and green once it is fixed. Build the signal first and the cause falls out of it. Reproducing is cheap next to fixing, so spend the cheap effort ruthlessly.

## 1. Build the signal (this is the whole skill)

Name one command (a test, a curl, a CLI diff, a script) that you have **already run once** (paste it and its output) and that:

- drives the **real** code path the bug lives in
- asserts the **user's exact symptom**, not "runs without erroring"
- is deterministic (same verdict every run) and fast (seconds)

If you are reading code to build a theory before this command exists, stop. Jumping to a hypothesis without a signal is the exact failure this skill prevents.

**Done when:** you can paste one command and its output, and it can go red on this bug.

## 2. Reproduce on the path the user is on

A green on the wrong path is not a green. If your repro runs against a different config, port, build, or entry point than the user's, a pass proves nothing: you tested a scenario the bug does not live in. Before you conclude **"cannot reproduce"**, match the reported setup on every axis that could matter. A config artifact that silently dodges the bug (a non-default port, a stub, the wrong build) is how you wrongly clear a real bug.

**Done when:** the signal goes red on the user's failure, not a lookalike nearby.

## 3. Minimise

Cut inputs, callers, config, and steps one at a time, re-running after each cut, until every remaining element is load-bearing (removing any one turns it green). The minimal repro shrinks the hypothesis space and becomes the regression test.

**Done when:** nothing left can be removed without turning the signal green.

## 4. Hypothesise, then probe one variable

List three to five ranked, falsifiable hypotheses before testing any ("if X is the cause, changing Y makes it disappear"). Test one variable at a time. Tag every temporary log with a unique prefix so cleanup is one grep.

## 5. Fix behind a guard

Turn the minimised repro into a regression test at the correct seam, then hand it to `prove-the-test`: revert the fix, watch it go red, restore. Re-run the signal against the original scenario. Remove all temporary instrumentation.

**Done when:** the original repro no longer reproduces, and a committed test goes red without the fix.
