# Round 012: register herdr-workstreams

## Candidate

`herdr-workstreams`, a runtime adapter that materializes selected engineering workstreams and specialist passes as visible Herdr topology.

## Origin

One real Herdr portfolio accumulated eleven long-lived coding agents under one vault cwd and was later collapsed into a single 4-column tab. The result made every agent visible but each pane too small to work in. The user wanted repo-specific operating surfaces while preserving a master notes vault as shared context, plus visible Fable and Grok passes when Solution Gate or Review Gate invokes independent judgment.

The observed runtime supports the needed primitives: one workspace per checkout, tabs and panes, named agents, lifecycle states, runtime-specific arguments, alternate-screen reads, and JSON identifiers. Cursor currently exposes Fable and Grok models, but those IDs are installation-specific and may drift.

## Boundary decision

- `workstream-reconcile` owns current portfolio truth and prioritization.
- `herdr-workstreams` owns approved topology, visible launch, lifecycle monitoring, and evidence return.
- `software-factory`, `solution-gate`, and `review-gate` remain method owners.
- Those three skills opt into the adapter only when already running inside Herdr; their existing Agent path remains the portable fallback.
- A notes vault or control plane may be a context root, but is never required and never replaces the repo checkout as implementation cwd.
- Persistent topology is minimal: lead plus an optional runtime pane. Specialist agents launch on demand rather than waiting indefinitely.
- One optional `00-control` workspace may persist as a single-pane portfolio cockpit. It routes and monitors work but never hosts implementation workers or duplicates project panes.
- Workspace, tab, pane, and agent labels describe their role; live agent names remain globally unique and workspace reuse requires both label and exact cwd.

## Decision

Register the skill as experimental. It has one originating design session and no completed end-to-end setup run yet. Keep model choices as dynamically resolved preferences rather than portable requirements.

## First dogfood questions

1. Can a second setup run reuse exact workspace/check-out matches without duplicates?
2. Does a repo-scoped lead with an external context root acquire enough context without writing to the vault?
3. Can Solution Gate launch two visible independent passes and recover complete artifacts after one runtime blocks or emits no output?
4. Does keeping reviewers on demand reduce stale idle agents without increasing launch friction enough to matter?
