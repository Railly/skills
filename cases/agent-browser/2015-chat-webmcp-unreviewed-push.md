# 2015: chat WebMCP shipped without the gate

- PR: vercel-labs/agent-browser#2015 (builds on #2012 by luxleader)
- Reviewed head: 106c24e2 (CHANGES_REQUESTED, ctate, 2026-09-30). Fix head: 6150823d.
- Profile: standard. Gate run: none before request; deterministic gate + lenses after.

## What escaped
1. Prompt banned `--json`, and text `webmcp list` omits the input schema, so chat could not see required fields.
2. Separator split on raw `;`/`&&` truncated quoted `--params` JSON.
3. Invoke example dropped the `--frame` used for schema lookup; duplicate tool names became ambiguous.
4. AGENTS.md doc surfaces not updated.

## Why
No Review Gate run existed for this head. Each escape maps to an existing check:
- 2 → `gate.sh shellmeta` + new-domain matrix (detector cells).
- 3 → demonstrative-example lens (prompt examples must round-trip the real parser).
- 4 → `gate.sh surfaces`.
- 1 → dogfood the built artifact (text vs JSON output on a real WebMCP page).

## Fix evidence
- Unit: prompt examples parsed by `parse_flags` + `parse_command`; quoted/escaped separators; metacharacter passthrough. Three mutants (old split, no `--json`, no `--frame`) each go red.
- Real: `agent-browser chat -v` on the webmcp fixtures set `hola; café && mundo` on the page and invoked child-frame `duplicate_tool` (`scope: frame`); `skills get core` ran from chat.
- 1396 tests pass; 3 clippy errors pre-existing in untouched files under current stable.

## Lesson
The gate did not miss; it was skipped. The failure is admission, not a lens: a PR must not request review without a run report for its exact head (`gate.sh covered`).
