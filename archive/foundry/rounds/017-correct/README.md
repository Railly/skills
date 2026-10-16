# Round 017: correct

## Change

- New experimental skill `correct`: one escaped mistake becomes one enforcer (driver assertion, `check.sh` command, lint or test, `gate.sh` rule, or hook) that is seen failing on the mistake and passing on the fix.
- Case schema 2 now requires `Enforcer: check: <path or command>` or `Enforcer: none: <reason>`, validated by `scripts/lib/case-knowledge.mjs`.
- `record-a-case` sets the field after extracting the lesson.

## Why

The corpus held over a hundred cases and the vault more than fifty papercuts with a probable fix, and none of them became a check. Record a Case could only link a pattern, create a candidate, keep a gap, or change nothing, so lessons accumulated as prose. Requiring an enforcer, or a written reason why none exists, makes that gap visible on every case.

## Evaluation

Not evaluated. The first application is the agent-browser #2114 regression: the domain-redirect driver fails with the fix reverted and passes with it applied.
