# Capture protocol

Follow this procedure after the visual gate passes.

## 1. Create an isolated browser session

Create the artifact directory outside the product repository:

```bash
proof_dir="/absolute/artifacts/YYYY-MM-DD-subject"
mkdir -p "$proof_dir"
proof_session="$(agent-browser session id --scope worktree --prefix before-after)"

agent-browser --session "$proof_session" set viewport 1440 900
agent-browser --session "$proof_session" open http://localhost:3000/path
agent-browser --session "$proof_session" wait --text "Stable ready text"
```

Use a semantic readiness condition such as text, URL, or element state. Avoid arbitrary sleeps.

## 2. Capture the baseline element

```bash
agent-browser --session "$proof_session" screenshot \
  'stable-css-selector' \
  "$proof_dir/before.png"
```

Record the exact baseline commit, build, deployment, or fixture identity.

## 3. Capture the changed element

Apply or load the authorized changed state. Restore the same route, data, interaction, and readiness condition:

```bash
agent-browser --session "$proof_session" wait --text "Stable ready text"
agent-browser --session "$proof_session" screenshot \
  'stable-css-selector' \
  "$proof_dir/after.png"
```

Record the exact changed commit, diff, build, or deployment identity.

## 4. Produce a pixel diff

```bash
agent-browser --session "$proof_session" diff screenshot \
  --baseline "$proof_dir/before.png" \
  --selector 'stable-css-selector' \
  --output "$proof_dir/diff.png" \
  --json
```

The selector captures the current changed state, so run the command only after confirming the same element remains mounted.

## 5. Generate the report and manifest

```bash
bun <skill-root>/scripts/create.mjs \
  --out "$proof_dir/YYYY-MM-DD-subject-before-after.html" \
  --title "Concrete visible claim" \
  --subject "Product and surface" \
  --summary "One sentence explaining the visible improvement." \
  --before "$proof_dir/before.png" \
  --after "$proof_dir/after.png" \
  --before-heading "Ambiguous baseline" \
  --after-heading "Explicit changed state" \
  --before-copy "What the user saw before." \
  --after-copy "What the user sees now." \
  --baseline "commit, build, or artifact identity" \
  --changed "local diff, commit, or deployment identity" \
  --url "http://localhost:3000/path" \
  --selector "stable-css-selector" \
  --caveat "What this visual proof does not establish."
```

The generator rejects missing, non-PNG, invalid, or differently sized captures. Add `--allow-size-change true` only when changed dimensions are intentional evidence.

## 6. Inspect the result

Open the HTML in the isolated session:

```bash
agent-browser --session "$proof_session" open \
  "file://$proof_dir/YYYY-MM-DD-subject-before-after.html"
agent-browser --session "$proof_session" snapshot -i -c
```

Check a narrow viewport and both color schemes. Then open the report for the user:

```bash
open "$proof_dir/YYYY-MM-DD-subject-before-after.html"
```
