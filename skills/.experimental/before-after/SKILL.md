---
name: before-after
description: "Create granular, browser-openable visual proof for a web UI change by capturing the same real DOM element or page state before and after with agent-browser. Use when a web bug fix, component change, responsive adjustment, loading state, interaction, or styling change has a visible browser result worth demonstrating, including show me, prove the visual fix, before and after, antes y despues, screenshot the change, or make it reviewable. Do not use for backend-only changes, migrations, benchmarks, performance claims, native desktop UI, code explanations, or changes with no meaningful visible web delta."
compatibility: "Requires agent-browser, Bun, a writable artifact directory, and browser-accessible baseline and changed states."
---

# Before after

Produce honest, element-level evidence for a visible web change by composing existing `agent-browser` commands.

Read [the capture protocol](references/capture-protocol.md), [the visual proof patterns](references/patterns.md), and [the Vercel visual system](references/vercel-visual-system.md) completely before acting. Load the installed `agent-browser` core skill before running browser commands.

## Visual gate

Use this skill only when the changed behavior can be seen in a browser:

- Component layout, content, styling, or responsive changes.
- Loading, empty, error, validation, hover, focus, or interaction states.
- A visual regression fix that can be reproduced deterministically.

Do not use it merely because code changed. Use relevant tests for nonvisual work, `performance-proof` for measured performance claims, and `explain-diff` for code understanding. If the delta cannot be reproduced honestly, report the evidence gap instead of manufacturing a comparison.

## Required proof basis

Before capturing, freeze:

- Exact baseline and changed source states.
- URL, app process, authentication, data, route, interaction, and readiness signal.
- Browser session, viewport, device pixel ratio, theme, and zoom.
- One stable selector for the smallest element that contains the meaningful change.
- Expected visible difference and the claim's limit.

Both sides should differ only in the behavior under review. Preserve the same browser session and tab when hot reload can update the changed state without losing data. Do not modify product source solely to add a proof selector unless the user authorizes that change.

## Evidence requirements

Capture the baseline before editing whenever possible. If the implementation already exists, use a separate baseline build or safely reproduce the prior state only when source edits are authorized, the exact local diff is preserved, and the changed state is restored immediately afterward. Never reset or discard unrelated work.

Use the same URL, selector, viewport, data, interaction, and wait condition for `before.png` and `after.png`. For temporal claims such as flicker or ordering, use video or an ordered state sequence because two settled screenshots do not prove timing.

Inspect both captures before generating the report:

- Same element boundary and surrounding context.
- Same pixel dimensions unless size is the intended change.
- No loading, stale hot reload, tooltip, cursor, focus ring, or transient overlay on only one side.
- Intended difference remains visible at normal report scale.
- No unrelated content or data drift.

Use the screenshot diff as supporting evidence. A pixel diff detects change but does not decide correctness.

## Artifact

Run the bundled `scripts/create.mjs` with the exact command in [the capture protocol](references/capture-protocol.md). It validates PNG inputs and dimensions, copies the captures, creates a responsive HTML report, and writes a JSON manifest with source identities, URL, selector, dimensions, and comparison policy.

Pass `--allow-size-change true` only when size or layout is the claim and explain the exception. The normal evidence package is:

```text
subject/
├── before.png
├── after.png
├── diff.png
├── YYYY-MM-DD-subject-before-after.html
├── YYYY-MM-DD-subject-before-after.json
└── YYYY-MM-DD-subject-before-after.assets/
```

## Verify and hand off

Open the generated HTML with `agent-browser`. Inspect desktop and narrow viewports plus light and dark OS themes. Confirm that the first viewport presents both captures, labels and provenance stand alone, images are sharp and unclipped, and limits are explicit.

Open the report for the user and return links to the HTML, `before.png`, and `after.png`, plus validation status. Do not commit, push, deploy, or mutate the baseline solely because this skill ran.
