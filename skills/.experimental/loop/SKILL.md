---
name: loop
description: "Run one engineering change from contract to a reviewed, observed, human-approved state, with ceremony scaled by size class. Each step ends on command output, never on a claim. Use when the user says take this to PR-ready, fix this issue, implement this, run the full cycle, or resume an interrupted change. Enter at the earliest incomplete step. Do not use for a question or investigation with no code change, or to review someone else's PR (review-gate)."
compatibility: "Requires a contract (contract skill), a .agents/verify kit (verify-setup), and the review-gate scripts."
allowed-tools:
  - Skill(contract)
  - Skill(verify-setup)
  - Skill(solution-gate)
  - Skill(simplify)
  - Skill(test-strength)
  - Skill(resilience-audit)
  - Skill(security-review)
  - Skill(review-gate)
  - Skill(before-after)
  - Skill(ship)
  - Skill(record-a-case)
  - Skill(handoff)
  - Agent
---

# Loop

```text
contract → [shape] → implement → observe → [lenses] → review-gate → [before-after] → human → ship → record
    ↑          ↑__________ contract or shape change ___________|
```

Bracketed steps depend on the size class in `.agents/verify/contract.md`.

## 0. Enter

Read the contract. If it is missing, run `contract`. If `.agents/verify/` is missing, run `verify-setup` (use `--local` in a repo you do not own). Find the earliest step whose evidence is missing or stale for the current tree. A handoff or an earlier claim is a lead, not evidence.

## 1. Shape (heavy only)

Run `solution-gate`. It must return one accepted, independently mergeable slice. No accepted slice, no implementation.

## 2. Implement

For an unverified bug, run the driver first and see it fail on the reported behavior. If it passes, the bug is not reproduced: stop and say so. Then implement the smallest change that satisfies the contract. For `normal` and `heavy`, delegate implementation to a subagent and keep review in a different context, so the author never grades its own work.

## 3. Observe

Run `bash .agents/verify/check.sh`, then `bash .agents/verify/observe.sh <feature>` for every feature in the contract. Open each screenshot or output and read it. `bash .agents/verify/fresh.sh` must exit 0. A failure returns to step 2 with the evidence, not with a retry of the same thing.

Two reversals on the same pair of behaviors (fix A breaks B, fix B breaks A) end the run and return to step 1. That is a wrong change surface, not a bug to keep patching.

## 4. Lenses (normal and heavy, when triggered)

| Trigger | Skill |
|---|---|
| the diff grew past what the contract needs | `simplify` |
| new or changed tests carry the proof | `test-strength` |
| process, network, storage, cache, retry, or lifecycle boundaries | `resilience-audit` |
| auth, secrets, origins, sandboxing, injection | `security-review` |

Any lens that edits code sends the run back to step 3.

## 5. Review

Run `review-gate` with the profile matching the class (`trivial` = mechanical, `normal` = standard, `heavy` = high-risk). Its `gate.sh verify` must pass. Record the patch-id it reviewed: `git diff $(git merge-base origin/main HEAD) HEAD | git patch-id --stable`.

For heavy visual or behavioral changes, run `before-after` on the reviewed head.

## 6. Human promotion

Show the contract result per item, the evidence paths, the review verdict, gaps, and the exact action proposed (commit, push, PR). Wait for explicit approval. Before acting, `gate.sh drift <reviewed-patch-id>` must pass; any drift goes back to step 5. Then use `ship`. Authority for one action never implies another.

## 7. Record

Run `record-a-case`. Every mistake that escaped a step gets a check: a driver assertion, a `check.sh` command, or a `gate.sh` rule, plus a row in `ENFORCERS.md`. If no check is possible, write why. When the cycle ends open, run `handoff`.

## Rules

- A step ends when its command says so.
- A changed contract resets every later step.
- Never invent a threshold, retry count, or stage the repo cannot run. Missing tools are named gaps.
