# Herdr topology operations

Use the installed `herdr` skill and CLI as the syntax authority. These recipes state invariants, not fixed IDs.

## Inventory

Verify caller context and inspect existing state before mutation:

```bash
test "${HERDR_ENV:-}" = 1
herdr workspace list
herdr agent list
herdr integration status
```

For each candidate workspace, list its tabs and panes and inspect pane cwd. A matching label with a different cwd is not reusable.

## Create one repo workspace

```bash
created=$(herdr workspace create --cwd "$repo" --label "$label" --no-focus)
workspace_id=$(printf '%s\n' "$created" | jq -r '.result.workspace.workspace_id')
tab_id=$(printf '%s\n' "$created" | jq -r '.result.tab.tab_id')
lead_pane=$(printf '%s\n' "$created" | jq -r '.result.root_pane.pane_id')
herdr tab rename "$tab_id" work
```

Use the returned IDs. Do not derive them from order or examples.

Rename topology by role when creating or repairing it:

```bash
herdr workspace rename "$workspace_id" "$label"
herdr tab rename "$tab_id" work
herdr pane rename "$lead_pane" lead
```

Use a short unique project label for the workspace. Agent names are globally unique among live agents, so prefix them with that label, for example `wterm-lead` and `wterm-reviewer`.

## Optional control cockpit

Create a control workspace only when the user wants a persistent portfolio coordinator:

```bash
created=$(herdr workspace create --cwd "$control_root" --label 00-control --no-focus)
workspace_id=$(printf '%s\n' "$created" | jq -r '.result.workspace.workspace_id')
tab_id=$(printf '%s\n' "$created" | jq -r '.result.tab.tab_id')
cockpit_pane=$(printf '%s\n' "$created" | jq -r '.result.root_pane.pane_id')
herdr tab rename "$tab_id" cockpit
herdr pane rename "$cockpit_pane" cockpit
```

Keep this workspace to one pane. The coordinator inspects `herdr workspace list` and `herdr agent list`, routes focus and prompts, and emits notifications only for meaningful blocked or completed work. Do not split project workers or persistent commands into it. The chosen `control_root` is configurable context, not an implementation root or product dependency.

## Optional runtime pane

Add it only for a command that must persist:

```bash
split=$(herdr pane split "$lead_pane" --direction right --ratio 0.72 --cwd "$repo" --no-focus)
runtime_pane=$(printf '%s\n' "$split" | jq -r '.result.pane.pane_id')
herdr pane rename "$runtime_pane" runtime
herdr pane run "$runtime_pane" "$verified_repo_command"
```

Discover the repository command from its instructions and package scripts. Do not assume `dev`, install dependencies, or start a server during setup unless requested.

## Lead and context access

Start the lead in the checkout. Runtime-native access to an external context root is optional:

- Codex: use `-C <repo>` and, only when needed, `--add-dir <context-root>`.
- Cursor: use `--workspace <repo>` and, only when needed, `--add-dir <context-root>`.
- Claude: start from the repo and use `--add-dir <context-root>` only when needed.

External context access does not authorize editing it. State the no-write boundary in the context packet and do not claim the runtime enforces read-only access when it does not.

## Idempotence and repair

- Reuse an exact workspace label and cwd match.
- Keep at most one control cockpit; reuse it only when its configured cwd matches.
- Reuse an available shell pane before splitting another one.
- Reuse a live uniquely named role only when it belongs to the same workspace and contract.
- If topology differs, propose a repair. Do not move or close user panes without approval.
- A moved pane receives a new workspace-qualified ID; continue with the returned ID or agent name.

## Receipt

Report workspace ID and label, checkout path, tab and pane IDs, running commands, live agent names and states, reused resources, and anything deliberately left unchanged.
