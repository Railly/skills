# Web visual proof patterns

## Element-level change

Use for a component, row, button, badge, panel, form field, or small page region.

- Capture the smallest element that still provides enough context to understand the change.
- Use the same stable CSS selector for both screenshots.
- Preserve width, height, data, route, session, viewport, theme, and device pixel ratio.
- Include exact source-state provenance for both sides.

This is the default pattern. A full-page screenshot usually hides the meaningful delta and introduces unrelated noise.

## Interaction or state change

Use for hover, focus, validation, menus, dialogs, loading, empty states, and user-triggered transitions.

- Define the exact starting state.
- Replay the same interaction steps on both source states.
- Wait for a semantic condition such as visible text, URL, or element state.
- Capture the resulting element at the same boundary.

Do not use arbitrary sleep as the primary readiness signal.

## Responsive change

Use when the intended delta concerns wrapping, stacking, overflow, truncation, or mobile layout.

- Capture the relevant target viewport, not only a desktop viewport.
- Keep that viewport identical across before and after.
- If more than one breakpoint matters, make each viewport a separately labelled comparison.
- Allow different element dimensions only when the size change is the actual claim.

## Temporal behavior

Two final screenshots cannot prove flicker, ordering, animation, loading duration, or lifecycle behavior.

For temporal claims:

- Prefer a short video of the same interaction on both builds.
- Or capture an ordered series such as initial, intermediate, and settled.
- Add runtime evidence such as console output, render counts, or timestamps when relevant.

State clearly which evidence proves appearance and which evidence proves timing.

## Baseline recovery

Best evidence order:

1. Baseline captured before implementation.
2. Separate baseline and changed builds receiving the same session setup.
3. Safely reproduced baseline after preserving the exact local diff.
4. Existing screenshot with sufficient provenance.
5. Deterministic fixture or simulation, labelled as such.

Never present a reconstructed or simulated baseline as a live baseline.

## Rejection conditions

Do not produce a polished report when:

- Only an after screenshot exists and the baseline cannot be established.
- Data or authentication differs materially across captures.
- The chosen selector includes unrelated changing content.
- One side is still loading or contains transient browser UI.
- The difference cannot be seen at report scale.
- The claim is really about performance, backend behavior, code structure, or migration correctness.

In these cases, report what evidence is missing or choose a more appropriate verification method.

## Evidence package

A complete package contains:

```text
subject/
├── before.png
├── after.png
├── diff.png
├── YYYY-MM-DD-subject-before-after.html
├── YYYY-MM-DD-subject-before-after.json
└── YYYY-MM-DD-subject-before-after.assets/
```

The HTML is the review surface. The individual captures remain available for direct inspection, and the diff is supporting evidence rather than the primary presentation.
