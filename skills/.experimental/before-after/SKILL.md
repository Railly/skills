---
name: before-after
description: "Build a minimal, browser-openable before/after artifact that makes a code change, bug fix, feature, benchmark, migration, or visual behavior easy to see and appreciate. Use whenever the user asks for before/after, antes y despues, compare old vs new, show the bug and fix, open it in my browser, make it screenshotable, show benchmark deltas, or wants to experience a newly built feature rather than read a diff. Prefer this over explain-diff when the main job is visual comparison and evidence, not a long pedagogical walkthrough."
compatibility: "Requires a writable output directory and a browser. Bun is used for the bundled scaffold script. Real-build comparisons may require the target repo's own build and dev tools."
---

# Before after

Make the change visible on one shared basis. The artifact is not a prettier diff. It should let the reader see, trigger, or measure the old and new behavior without reconstructing the conclusion from prose.

Read [references/patterns.md](references/patterns.md) and [references/vercel-visual-system.md](references/vercel-visual-system.md) before composing the page.

## 1. Freeze the comparison

Write down:

- The reader's question.
- The exact baseline and changed artifacts, commits, builds, or measurements.
- The one action or workload both sides receive.
- The observable difference and the caveat that limits the claim.

Keep both sides comparable. Same input, viewport, timing basis, units, environment, and measurement method unless the difference itself is the subject. Label simulations, fixtures, and approximations honestly.

## 2. Choose one shape

- **Visual behavior:** two real lanes or reproducible states, one shared action, visible result, screenshot-ready.
- **Benchmark:** decisive delta first, then one semantic table with exact values, units, sample, and method.
- **Feature tour:** before/after first, then the smallest interaction that lets the reader feel the new capability, followed by proof.

Do not force all three shapes into every artifact. If the change has no meaningful visual or behavioral surface, use `explain-diff` instead.

## 3. Gather evidence before designing

Prefer real builds, traces, fixtures, recordings, screenshots, and exact test output. Drive the shipped surface when possible. Do not present final-state equality as proof of temporal behavior, and do not convert an unmeasured improvement into a number.

The first viewport should answer:

1. What changed?
2. Which side is before and which is after?
3. What should I notice?

## 4. Build the artifact

Save outside the code repo with a date-prefixed filename:

```bash
bun <skill-root>/scripts/create.mjs \
  --out /absolute/path/YYYY-MM-DD-subject-before-after.html \
  --title "Concrete claim" \
  --subject "Project or feature" \
  --summary "One evidence-led sentence"
```

The script copies the official Vercel report foundation beside the HTML. Edit the generated page to replace scaffold content with the observed evidence.

Use one long responsive page. Put the comparison before background or implementation detail. Keep audit evidence available below the first read. Add controls only when they trigger or clarify a real state change.

## 5. Use Vercel design judgment

Use Geist Sans for prose and numbers. Use Geist Mono only for code, commands, paths, timestamps, and short identifiers. Stay monochrome unless color encodes a sourced state or data distinction.

Reject gradients, glows, blobs, glass, ornamental shadows, decorative motion, all-caps eyebrows, pill metadata, generic card grids, repeated metric boxes, fake screenshots, and nested panels. Build hierarchy with type, alignment, shared scales, spacing, and evidence placement.

## 6. Verify before handoff

Open the actual HTML and check:

- Desktop and narrow viewport.
- Light and dark OS themes.
- First viewport communicates the comparison.
- Controls work with mouse and keyboard.
- No overflow, clipped labels, broken code blocks, or character-level wrapping.
- Every number has a unit and provenance.
- Before and after remain on the same visual and measurement basis.
- The artifact is understandable without the conversation.

Return the absolute artifact path and an exact open command:

```bash
open /absolute/path/YYYY-MM-DD-subject-before-after.html
```

Do not commit, push, deploy, or modify the compared repos unless the user separately authorized it.
