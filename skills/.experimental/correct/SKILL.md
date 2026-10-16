---
name: correct
description: "Turn one escaped mistake into a check that fails on it: a driver assertion, a check.sh command, a gate.sh rule, a lint, a test, or a hook. Prove the check fails on the original mistake and passes on the fix, then record it in ENFORCERS.md and the case's Enforcer field. Use after record-a-case, when a review finding escaped, when a papercut has a probable fix, when the same mistake happened twice, or when someone says make sure this never happens again. Do not use to fix the mistake itself or to write prose rules."
compatibility: "Requires the target repo with a .agents/verify kit (verify-setup) for driver and check.sh enforcers, and git to restore the mistaken state."
---

# Correct

A lesson that lives in prose gets read and skipped. A lesson that lives in a check fails the next time. This skill moves one mistake from the first kind to the second.

## 1. Pin the mistake

Name the mistake as an observable state, not a feeling: the command, input, or tree where it happened, and what was wrong. Find the evidence: the case file, the review finding, the commit that fixed it, or the papercut line. If you cannot name an observable signal, stop and write `Enforcer: none: <reason>` in the case.

## 2. Pick the cheapest enforcer that would have caught it

Climb only as far as needed:

| Level | Enforcer | Catches |
|---|---|---|
| 1 | assertion in an existing `drive/<feature>.sh` | wrong behavior on a surface already driven |
| 2 | new driver plus feature file | behavior on a surface nobody drove |
| 3 | command in `check.sh`, a lint, or a test | statically detectable patterns |
| 4 | `gate.sh` rule in review-gate | diff shapes that recur across repos |
| 5 | hook in the vault settings | agent actions, not code |

A mistake that already has an enforcer and happened again moves one level up. Record why the lower level missed it.

## 3. Write it and see it fail

Recreate the mistaken state: revert the fix (`git revert --no-commit <sha>` or `git apply -R`), restore the input, or replay the command. Run the enforcer and see it fail with a message that names the mistake. Restore the fixed state and see it pass. Save both outputs. An enforcer that was never seen failing does not count.

When the original state cannot be recreated, build the smallest synthetic reproduction of the same mechanism and say so.

## 4. Record it

- Add a row to the target repo's `.agents/verify/ENFORCERS.md`: rule, enforcer, origin.
- Set the case's `Enforcer: check: <path or command>`.
- For a papercut, replace its line with a pointer to the enforcer, or delete it if the fix shipped.

## 5. Report

Report the mistake, the level chosen and why, the failing output, the passing output, and the files changed. Label each claim measured, inferred, or guess.

## Rules

- One mistake, one enforcer. Batches hide which check guards what.
- Never weaken an existing check to make a new one pass.
- A check that flags correct code is a bug in the check. Fix it before recording.
- Hooks are a last resort: they slow every session, so only use them for agent actions.
