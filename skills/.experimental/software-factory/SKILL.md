---
name: software-factory
description: "Run an admitted change through staged execution where each stage produces required evidence before the next begins. Use after a shape or Formula is accepted and before a diff is offered for review, when one agent would otherwise implement, clean, test, and judge its own work in a single context. Separate implementation, reduction, test strength, and hardening into independent passes, and refuse to advance on an agent's own claim of completion. Do not use to select work, choose a solution shape, or replace the final review."
compatibility: Requires a repository with runnable checks and an accepted change contract. Stage tooling is repository-specific and must be discovered, never assumed.
allowed-tools:
  - Skill(test-strength)
  - Skill(simplify)
  - Skill(review-gate)
  - Agent
---
# Software factory

[Solution Gate](../../solution-gate/SKILL.md) decides what deserves implementation. [Review Gate](../../review-gate/SKILL.md) decides whether a finished diff is correct. This skill owns the span between them: it moves proof *inside* implementation instead of collecting it afterwards.

```text
accepted shape or Formula
  → 1. implement   → diff
  → 2. reduce      → complexity evidence
  → 3. strengthen  → surviving-mutant evidence
  → 4. harden      → failure-path evidence
  → 5. prove       → observed behavior
→ Review Gate
```

It is a protocol, not a runtime. Any control plane may execute it. Bind nothing to a specific provider, harness, or model.

## 0. Decide whether this fires

Run it when a change is accepted, touches more than one behavior, and a single agent would otherwise write, clean, test, and judge it in one context.

Skip it when the change is fully mechanical, when its mechanism is determined and one check proves it, or when no shape was accepted yet. A skip is recorded with its reason, never assumed.

**Complete when:** the trigger or the skip reason is named.

## 1. Establish the stage contract before any stage runs

Discover what this repository can actually verify. Record the command, not the intention: test runner, coverage, complexity or lint gates, mutation tooling, build, and how behavior is observed.

A stage whose tool does not exist is `unavailable`, and its evidence is owed. It is never silently satisfied, and its absence never blocks the stages that can run.

Fix the thresholds now, before any diff exists. A threshold chosen after seeing the result is a description, not a gate. Agent-authored code tolerates different complexity limits than human-authored code, so state the number and its basis rather than inheriting a default.

**Complete when:** every stage names a runnable command or is marked `unavailable` with the reason, and every threshold predates the diff.

## 2. Run stages as independent passes

Each stage receives the change contract and the prior stage's evidence. It does not receive the prior stage's reasoning. An agent that must defend its own choices will preserve them.

| Stage | Owns | Required evidence |
|---|---|---|
| implement | the behavior change | checks pass at the named command |
| reduce | behavior-preserving reduction | complexity within the fixed threshold |
| strengthen | test strength | surviving mutants killed or explained |
| harden | failure paths | each failure family observed, not asserted |
| prove | real behavior | output observed at the layer of the claim |

Stage 3 delegates to `test-strength`. Stage 2 delegates to `simplify` where the reduction is bounded and behavior-preserving. Do not restate their methods here.

**Complete when:** every available stage ran as its own pass with its own evidence.

## 3. Refuse advancement on a claim

A stage ends when its command says so. It does not end when an agent reports success. "Tests pass", "cleaned up", and "looks correct" are claims; the command output is the evidence.

When a stage cannot pass, do not advance and retry downstream. Record which stage stopped, its output, and what it would take to satisfy it. A blocked stage is a result.

**Complete when:** every advance points to observed output, and every stop names its stage.

## 4. Watch for thrashing

Repair loops are the signal that the change is beyond what staged execution can carry: a stage fixes one behavior and breaks another, then reverses. Two reversals on the same pair of behaviors ends the run.

Thrashing is not a stage failure to retry. It means the change surface is wrong, and it returns to Solution Gate rather than to stage 1.

**Complete when:** no reversal pair repeats, or the run returned with the observed loop.

## 5. Hand off

Produce the diff, the per-stage evidence, the unavailable stages with their owed evidence, and the thresholds with their basis. Review Gate receives evidence, not assurances.

Findings that survive review return as successors, not as edits to a closed run.

**Complete when:** the handoff carries the diff, per-stage evidence, and every owed item named.

## Boundary

Do not select work, shape a solution, replace review, or promote a change. Do not invent a threshold, a retry count, or a stage a repository cannot run. Do not treat a passing check as proof of behavior at a layer the check does not reach.
