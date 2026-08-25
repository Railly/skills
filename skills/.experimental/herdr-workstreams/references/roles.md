# Visible role launches

Herdr is the runtime surface, not the method owner. A role receives one frozen task from the skill that requested it.

## Role policy

| Role | Lifetime | Default authority | Typical owner |
|---|---|---|---|
| lead | persistent for the active workstream | repository-scoped interactive work | user or implementation workflow |
| planner | one bounded pass | read-only | shaping or solution gate |
| challenger | one bounded pass | read-only | solution gate |
| reviewer | one frozen exact-head pass | read-only | review gate |
| stage worker | one factory stage | only that stage's allowed mutations | software factory |

Do not prewarm planner, challenger, reviewer, or gate roles. Launch them when their owner has a frozen packet and a completion contract.

## Resolve runtime and model

Check the requested agent kind, integration, executable, authentication, and current model list immediately before launch. Preserve an explicit user choice. Otherwise prefer a different model family from the author when independent judgment matters.

Model aliases drift. A local preference such as Cursor Fable for planning or Cursor Grok for review is valid only when the exact ID appears in the runtime's current model list. If unavailable, select a compatible different-family model or report the role unavailable. Never silently substitute a same-family reviewer and call it independent.

When available and the user has not overridden them, the originating profile prefers:

| Purpose | Runtime | Preferred model |
|---|---|---|
| lead and implementation | Codex | current configured Codex model |
| first planning or shaping pass | Cursor | `claude-fable-5-thinking-xhigh` |
| independent challenge or review | Cursor | `cursor-grok-4.6-xhigh` |

These are preferences, not requirements. For two independent passes, use different model families. If the author already used one preferred family, choose the other for review.

Pass runtime arguments after `--`:

```bash
herdr agent start "$name" --kind cursor --pane "$pane_id" -- --model "$resolved_model" --plan --trust --workspace "$repo"
```

Use read-only modes for planners and reviewers. Do not add `--force`, `--yolo`, permission bypasses, or automatic MCP approval unless the owning workflow and user explicitly authorize them.

## Prompt contract

The prompt names:

- role and owning skill;
- frozen repository state or exact HEAD;
- objective, non-goals, and required output;
- evidence sources and allowed mutations;
- completion signal or artifact path.

Wait for a settled lifecycle state with a bounded timeout. `idle` or `done` means ready for inspection, not automatically correct. `blocked` returns to the user. `unknown`, empty output, and timeout remain verification gaps.

## Handoff back

Return the agent name, model and family, repository head, lifecycle result, artifact or transcript handle, and any missing evidence. The owning skill decides whether the result satisfies its gate.
