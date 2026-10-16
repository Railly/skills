---
name: loop
description: "Run one engineering change from contract to a reviewed, observed, human-approved state, with ceremony scaled by size class. Each step ends on command output, never on a claim. Use when the user says take this to PR-ready, fix this issue, implement this, run the full cycle, or resume an interrupted change. Enter at the earliest incomplete step. Do not use for a question or investigation with no code change, or to review someone else's PR (gate)."
compatibility: "Requires a contract (contract skill), a .agents/verify kit (verify-setup), and the gate scripts."
allowed-tools:
  - Skill(contract)
  - Skill(verify-setup)
  - Skill(gate)
  - Skill(correct)
  - Agent
---

# Loop

```text
contract → [shape] → implement → observe → gate → human → deliver → correct
    ↑          ↑__________ contract or shape change __________|
```

Bracketed steps depend on the size class in `.agents/verify/contract.md`.

## 0. Enter

Read the contract. If it is missing, run `contract`. If `.agents/verify/` is missing, run `verify-setup` (use `--local` in a repo you do not own). Find the earliest step whose evidence is missing or stale for the current tree. A handoff note or an earlier claim is a lead, not evidence.

## 1. Shape (heavy only)

Write two or three candidate shapes under `## Shapes` in the contract: mechanism, change surface, what each breaks, and the cheapest experiment that separates them. Run the experiments rather than arguing. Show the result to the human and record the chosen shape and one independently mergeable slice. No accepted slice, no implementation.

## 2. Implement

For an unverified bug, run the driver first and see it fail on the reported behavior. If it passes, the bug is not reproduced: stop and say so. Then implement the smallest change that satisfies the contract. For `normal` and `heavy`, delegate implementation to a subagent and keep review in a different context, so the author never grades its own work.

## 3. Observe

Run `bash .agents/verify/check.sh`, then `bash .agents/verify/observe.sh <feature>` for every feature in the contract. Open each screenshot or output and read it. `bash .agents/verify/fresh.sh` must exit 0. A failure returns to step 2 with the evidence, not with a retry of the same thing.

For heavy visual or behavioral changes, also observe the baseline: run the same driver on the merge base in a separate worktree and keep both evidence directories, so the human sees before and after on one basis.

Two reversals on the same pair of behaviors (fix A breaks B, fix B breaks A) end the run and return to step 1. That is a wrong change surface, not a bug to keep patching.

## 4. Review

Run `gate` with the profile matching the class (`trivial` = mechanical, `normal` = standard, `heavy` = high-risk). It runs `gate.sh verify` and the deep lenses the diff triggers (test strength, resilience, security, simplify). Any lens that edits code sends the run back to step 3. Record the patch-id it reviewed: `git diff $(git merge-base origin/main HEAD) HEAD | git patch-id --stable`.

## 5. Human promotion

Show the contract result per item, the evidence paths, the review verdict, gaps, and the exact action proposed (commit, push, PR). Wait for explicit approval. Before acting, `gate.sh drift <reviewed-patch-id>` must pass; any drift goes back to step 4. PRs target the default branch, never another feature branch. Authority for one action never implies another.

## 6. Correct

Run `correct`: it records the case, and every mistake that escaped a step becomes a check that fails on it, plus a row in `ENFORCERS.md`. If no check is possible, it writes why.

When the cycle ends open, append `## Handoff` to the contract: the current step, the exact tree (HEAD and `fresh.sh` result), what is unverified, and the next command. The next session enters at step 0 from that note.

## Rules

- A step ends when its command says so.
- A changed contract resets every later step.
- Never invent a threshold, retry count, or stage the repo cannot run. Missing tools are named gaps.
