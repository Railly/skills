---
name: herdr-workstreams
description: "Materialize selected engineering workstreams as visible, persistent Herdr workspaces after a portfolio or handoff review. Use when the user asks to set up, resume, or organize project work in Herdr; turn a workstream-reconcile queue into repo-scoped workspaces; or make specialist agents launched by other skills visible and monitorable. Do not use to prioritize work, reconcile stale claims, perform a gate, or manage terminals outside Herdr."
allowed-tools:
  - Skill(herdr)
---
# Herdr workstreams

Turn a human-selected queue into a small operating surface in Herdr. This skill owns topology, visible agent launch, lifecycle monitoring, and context handoff. The upstream method still owns the work.

```text
workstream-reconcile or another queue
  → human selects workstreams
  → optional persistent control cockpit
  → one Herdr workspace per checkout
  → persistent lead plus optional runtime panes
  → specialist agents appear on demand
  → evidence returns to the owning skill
```

## Boundary

Do not infer priorities, reconcile handoffs, implement changes, or replace `solution-gate`, `software-factory`, `review-gate`, or `handoff`. Do not keep a standing panel of reviewers. A specialist is born for one bounded pass, reports evidence, and may be closed by the user or owning workflow.

This workflow requires `HERDR_ENV=1`, the `herdr` CLI, `jq`, and local checkouts for selected workstreams. Agent roles also require their corresponding installed runtimes.

Context and authority are different. An optional context root may supply handoffs, plans, or vault notes, but every workspace and command starts in the selected checkout or worktree. Grant external context access only when needed, state that it is a no-write boundary, and never make it the implementation cwd. Do not claim technical read-only enforcement unless the runtime provides it.

## 1. Verify the control surface

Follow the installed `herdr` skill. Stop when `HERDR_ENV` is not `1`. Read the installed CLI help for the command groups needed by this run and inspect existing workspaces, tabs, panes, agents, and integrations before proposing changes.

Treat creation as mutation. Inventory is read-only; creating, moving, closing, starting, or prompting needs the user's selected workstreams and approval of the proposed topology.

## 2. Select, then map

When no explicit selection exists, ask one short question: which workstreams should be active now? Prefer a reconciled current queue when available, but accept any explicit repo list. Do not automatically materialize every discovered project.

Resolve each selected workstream to an absolute checkout or worktree. Reject missing or ambiguous paths. Inspect current Herdr state and reuse a workspace only when its label and cwd identify the same checkout. Never infer identity from the label alone.

Present the mutation plan before applying it:

| Workstream | Checkout | Reuse or create | Persistent panes | On-demand roles |
|---|---|---|---|---|

## 3. Optionally maintain one control cockpit

When the user wants a persistent portfolio coordinator, create or reuse one workspace such as `00-control` with exactly one full-size `cockpit` pane. Its cwd may be a preferred control repo, notes vault, or another configured directory; this choice supplies context but does not couple the skill to that location.

The cockpit may run reconciliation, ask which workstreams to activate, inspect global Herdr state, route focus and prompts, and summarize meaningful `blocked` or `done` events. It must not host implementation workers, dev servers, standing reviewers, or duplicate views of project panes. Herdr's workspace sidebar remains the portfolio dashboard.

The control workspace is optional. Do not create it when the user only requests one repo workspace or a bounded specialist launch.

## 4. Build the minimum persistent topology

Use one workspace per checkout or active worktree. Default to one tab named `work` with:

- `lead`: the primary interactive agent, or an available shell if the user has not chosen a runtime;
- `runtime`: an optional narrow pane for a long-lived dev server, watcher, or logs, created only when the workstream actually needs it.

Create `test`, `review`, or `gate` tabs only when their process or workflow begins. Keep at most two persistent panes visible in `work`. Use `--no-focus` unless the user asks to switch. Parse every ID from Herdr JSON responses.

Give each level a human-readable role: a unique workspace label such as `wterm`, tab labels such as `work` or `server`, pane labels such as `lead` or `runtime`, and globally unique agent names such as `wterm-lead`. Resolve workspace identity from label plus exact cwd, never from labels alone.

Read [references/operations.md](references/operations.md) before creating or changing topology.

## 5. Seed the lead with a context packet

Start the lead in the checkout. Give it a compact packet with:

- objective and current operating state;
- exact next action and owning workflow;
- checkout or worktree path, branch, and known dirty-state boundary;
- relevant handoff, contract, shaping, or evidence paths;
- non-goals, unresolved decisions, and completion evidence owed.

Do not dump an entire vault or transcript. The packet points to durable sources and tells the lead to verify drift-prone claims before mutation. An idle lead is ready for the user's next instruction; do not start implementation merely because setup completed.

## 6. Launch specialists on demand

When another skill requires an independent planner, challenger, reviewer, or gate pass, create a pane or tab in the same repo workspace and start a named Herdr agent there. Prefer names such as `<repo>-planner`, `<repo>-reviewer`, or `<repo>-gate`; names must remain unique among live agents.

The owning skill supplies the frozen packet, permissions, model-family constraint, and completion contract. This skill selects only an available runtime and materializes it visibly. Resolve model IDs from the installed runtime immediately before launch; preferences are fallbacks, not portable requirements. Never count an empty, stalled, blocked, or `unknown` run as evidence.

Read [references/roles.md](references/roles.md) when launching a specialist.

## 7. Monitor and return evidence

Use `herdr agent prompt --wait` or `herdr agent wait` with a bounded timeout when a workflow needs synchronous completion. On `blocked`, inspect the agent and return the question or approval to the user. On timeout, stalled prompt, or `unknown`, report the gap instead of retrying indefinitely.

Read the result through the agent surface. If alternate-screen history is incomplete, ask the agent to write a Markdown artifact in a temporary directory and return its path. Give that artifact and lifecycle result back to the owning skill. Herdr visibility does not upgrade prose into proof.

## Complete when

Every selected workstream maps to the intended checkout, the proposed topology was approved and applied idempotently, persistent panes are minimal, each launched role is visible and uniquely named, and the final report lists workspace IDs, paths, active roles, blocked or unavailable roles, and the exact next command or user action. Unselected projects and existing unrelated Herdr state remain unchanged.
