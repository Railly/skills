---
name: unfold
description: Understand, diagnose, change, or review an unfamiliar codebase through one evidence-backed mission. Use when learning architecture, tracing a feature, investigating a bug, implementing a real change with guided or agent execution, reviewing a diff or PR, or checking whether tests and the built artifact prove the intended behavior. Prefer over prose-only repository explanations and ungrounded debugging.
compatibility: Requires repository read access. Repository writes depend on the selected mode and user authorization. Mermaid rendering and a structured ask-user tool are optional enhancements.
---

# Unfold

Turn one maintenance mission into a navigable mental model, an evidence-backed change, and proof proportional to the work. Reuse what has already been established instead of restarting the repository tour at every phase.

## 1. Establish the mission

Frame one concrete question or outcome:

> How does `[operation or symptom]` travel from `[entry]` to `[outcome]`, and what evidence would prove the result?

Read existing `.unfold/` artifacts before broad exploration. Compare their recorded commit with HEAD and reverify decisive anchors against current source.

Read [references/protocol.md](references/protocol.md) for the shared evidence and artifact contract.

## 2. Select the earliest incomplete mode

Choose one primary mode. Load only its reference.

| User state | Mode | Reference |
|---|---|---|
| Wants to understand a system or flow | Learn | [learn.md](references/learn.md) |
| Has a symptom, failing behavior, or issue | Triage | [triage.md](references/triage.md) |
| Has a known change to implement | Change | [change.md](references/change.md) |
| Has a diff, patch, test, or PR to assess | Review | [review.md](references/review.md) |

Enter directly at the earliest unfinished state. Do not repeat completed work. A verified Triage Change Surface can enter Change; a finished patch can enter Review; Learn can support any mode when the user lacks a load-bearing part of the mental model.

## 3. Preserve one evidence chain

Carry the same mission, commit, claims, anchors, unknowns, and artifacts across mode transitions. Keep distinctions that change the causal story: setup/runtime/teardown, automatic/manual, caller/owner, persisted/cached, current/proposed, and component/file/function/contract.

When a visual materially clarifies the mission, read [references/visuals.md](references/visuals.md) and render the smallest useful diagram. When durable output is authorized, follow [references/artifacts.md](references/artifacts.md).

## 4. Respect the collaboration policy

Learn is reconstructive by default. Triage remains read-only until the user requests a patch. Change explicitly selects `guided`, `execute`, or `execute-with-approval`. Review may alter tests only when the user authorized review changes.

Never let a mode transition silently broaden write, commit, push, tracker, or release authority.

## Close the mission

Report the result, decisive evidence, remaining unknowns, and the next unfinished mode. The outcome is complete only when the claim is understandable and its proof is retrievable.
