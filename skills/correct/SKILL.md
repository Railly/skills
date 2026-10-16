---
name: correct
description: "Close a piece of engineering work: record it as an evidence ledger, then turn every mistake that escaped into a check that fails on it (a driver assertion, a check.sh command, a gate.sh rule, a lint, a test, or a hook), proven failing on the mistake and passing on the fix. Use after resolving, disproving, reviewing, or investigating an issue, PR, incident, or agent run; when backfilling an old session; when a review finding escaped; when a papercut has a probable fix; or when someone says make sure this never happens again. Do not use to fix the mistake itself, to write release notes, or to promote a lesson straight into a skill."
compatibility: "Requires access to the work evidence and git. Writing a case requires an authorized destination. Driver and check.sh enforcers require a .agents/verify kit (verify-setup)."
---

# Correct

A lesson that lives in prose gets read and skipped. A lesson that lives in a check fails the next time. Correct does two things in order: it records what happened, then it moves each escaped mistake from the first kind to the second.

## Canonical write root

Before writing, run the packaged `scripts/resolve-source-root.mjs`, which honors `RAILLY_SKILLS_REPO`. Never write a case, eval, or log into the current repo's `.agents/skills`, `.claude/skills`, another installed skill copy, or the target repository. Enforcers are the exception: they belong in the target repo's `.agents/verify/` or its own checks.

## 1. Record the case

Follow [the case ledger method](references/case-ledger.md): bound one case, build the ledger with claim classes, assign independent statuses for validation, human review, maintainer acceptance, and delivery, extract the lesson, pass the confidentiality gate, and write it to `cases/<repo>/` using [the template](references/template.md).

**Complete when:** the case validates and every escaped mistake is listed with its evidence.

## 2. Pin each mistake

For every mistake that escaped a step, name it as an observable state, not a feeling: the command, input, or tree where it happened, and what was wrong. If no observable signal exists, write `Enforcer: none: <reason>` and stop for that mistake.

## 3. Pick the cheapest enforcer that would have caught it

| Level | Enforcer | Catches |
|---|---|---|
| 1 | assertion in an existing `drive/<feature>.sh` | wrong behavior on a surface already driven |
| 2 | new driver plus feature file | behavior on a surface nobody drove |
| 3 | command in `check.sh`, a lint, or a test | statically detectable patterns |
| 4 | `gate.sh` rule | diff shapes that recur across repos |
| 5 | hook in the agent settings | agent actions, not code |

A mistake that already has an enforcer and happened again moves one level up. Record why the lower level missed it.

## 4. Write it and see it fail

Recreate the mistaken state: revert the fix (`git revert --no-commit <sha>` or `git apply -R`), restore the input, or replay the command. Run the enforcer and see it fail with a message that names the mistake. Restore the fixed state and see it pass. Save both outputs. An enforcer never seen failing does not count. When the original state cannot be recreated, build the smallest synthetic reproduction of the same mechanism and say so.

## 5. Link it

- Add a row to the target repo's `.agents/verify/ENFORCERS.md`: rule, enforcer, origin.
- Set the case's `Enforcer: check: <path or command>`.
- For a papercut, replace its line with a pointer to the enforcer, or delete it if the fix shipped.

Report the case path, each mistake, the level chosen and why, the failing and passing outputs, and the files changed. Label each claim measured, inferred, or guess.

## Rules

- One mistake, one enforcer. Batches hide which check guards what.
- Never weaken an existing check to make a new one pass. A check that flags correct code is a bug in the check.
- Hooks are a last resort: they slow every session, so use them only for agent actions.
- A case may propose a lesson for a skill; it never edits an installed skill. Promotion is a separate reviewed change.
