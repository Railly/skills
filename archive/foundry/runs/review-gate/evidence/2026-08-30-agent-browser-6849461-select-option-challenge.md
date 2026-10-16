# Independent challenge: agent-browser select option normalization

Head: `684946184733d91e5610842ffb5b6efc03ef1c76`

## Independent inputs

- GitHub issue #1700 and the review history of community PR #1701.
- A real Chrome accessibility snapshot and native `<select>` DOM state.
- The browser-generated `change` event counter.
- A comparison against the contributor implementation at `f99e7fcd356345175ff5dde1c3e0ec5ea24846a1`.

## Challenge result

The contributor implementation fixed the reported NBSP mismatch and the review finding that a miss cleared the current selection. It also added case-insensitive matching, retained the snapshot's joined-word rendering, and could silently choose among options that collide after normalization.

The recreated implementation narrows the behavior:

- Snapshot rendering converts U+00A0 to an ordinary space and removes only true zero-width characters.
- Exact case-sensitive value, label, and text matches run before normalization.
- Normalization is limited to whitespace collapsing and zero-width removal.
- A normalized collision returns an error before mutation.
- A miss, including a partial multi-value miss, returns an error before mutation.

## Real-browser corpus

The exact-head E2E drove Chrome through the native daemon command pipeline and observed:

- `Capital\u00A0Federal` renders as `Capital Federal`.
- `Capital Federal` selects opaque value `C`.
- Exact `Alpha Beta` wins over the normalized collision with `Alpha\u00A0Beta`.
- `Alpha  Beta` reports normalized ambiguity without changing selection.
- Exact value `us` selects `us`, preserving case-sensitive value semantics.
- Multi-select accepts a normalized label plus an exact value.
- A partial multi-value miss preserves the complete prior selection.
- `Zero\u200BWidth` renders and selects as `ZeroWidth`.
- Successful selection increments the page's `change` event counter once.

The focused Chrome E2E passed again at exact HEAD in 1.21 seconds. The complete real-Chrome suite previously passed 105 tests at the same SHA, and the new E2E passed four consecutive repetitions.

## Falsification

- Restoring snapshot NBSP deletion made the snapshot assertion fail because the output returned `CapitalFederal`.
- Removing normalized selection fallback made the Chrome E2E fail because `Capital Federal` did not select value `C`.
- Restoring mutation-before-resolution made miss-preservation assertions fail.

Each mutation was restored from a filesystem snapshot, and the focused tests returned green.

## External review history

PR #1701 had one code-review finding: its first revision deselected every option before determining whether the request matched. Mauricio fixed that in `f99e7fc`. The recreated branch covers the same finding for single and multiple selects and additionally rejects normalized ambiguity.
