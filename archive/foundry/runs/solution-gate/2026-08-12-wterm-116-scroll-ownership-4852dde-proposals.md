# Solution Gate proposals: wterm #116 scroll ownership

Date: 2026-08-12
Target base: `4852dde5481439883eecf7f61f32f6091be5b468`

## Contract

Property violated: scrollback logical position appeared to have competing ownership across browser-native anchoring and WTerm lifecycle compensation, because the rollover fix made the full serial resize test fail.

Observable:

- Forty frame-separated ring discards from `scrollTop 6000` produce exactly one measured-row-height adjustment per discarded row and preserve the first visible logical row.
- Resizing after 400 history lines from `scrollTop 600` preserves the first visible logical row in the full serial Chromium suite.

Must not change: bottom follow, bounded DOM virtualization, selection behavior, resize coalescing, third-party `TerminalCore` compatibility, or existing discarded-row arithmetic.

## Proposer A: Claude Sonnet

### Shape

Disable native anchoring on the scroll owner and make WTerm preserve a logical row identity across every DOM-mutating transition. Capture the first visible logical row before rollover or resize and restore its pixel offset after new geometry exists.

### Predictions

1. The frame-separated rollover test decreases `scrollTop` by one measured row height per discard and preserves the logical row.
2. The serial resize test preserves the same logical row both alone and mid-suite.

### Cost

Every future geometry-changing path must participate in the logical-row abstraction. Font or zoom changes become explicit lifecycle cases instead of receiving incidental browser correction.

### What it makes worse

More state and coupling between the coordinator and renderer. Unmodeled layout changes lose browser-native correction.

### Rejected alternatives

- Native anchoring only: node replacement and ring discard do not provide a stable native anchor.
- Coalescing discards: hides the timing class.
- Post-render feedback correction: depends on browser ordering.

### Forward chain

1. Disable native anchoring, so Chromium stops applying a second adjustment. `[observed]`
2. WTerm becomes the only writer during modeled rollover and resize transitions. `[inferred]`
3. Every geometry-changing path must preserve logical identity explicitly. `[inferred]`
4. Harmful branch: an unmodeled font or layout change can drift because native fallback is gone. `[guessed]`

## Proposer B: Gemini Flash-Lite

### Shape

Introduce a scoped ownership arbiter. Suppress native anchoring during explicit ring rollover, while preserving the existing resize pipeline and allowing its layout anchoring behavior to remain authoritative.

### Predictions

1. Forty frame-separated discards show no double-adjustment frames.
2. Resize after 400 history lines preserves the first visible row in the serial suite.

### Cost

Adds transition provenance state and another layer through which future scroll changes must pass.

### What it makes worse

Debugging becomes less direct, and correctness depends on browser timing around temporary suppression.

### Rejected alternatives

- Permanent `overflow-anchor: none`: proposer believed it would remove useful resize behavior.
- Native anchoring only: does not deterministically handle rapid ring discard.

### Forward chain

1. WTerm captures pending scroll state before destructive setup. `[observed]`
2. WTerm and Chromium can both adjust when top rows disappear. `[inferred]`
3. A transition arbiter selects one owner. `[inferred]`
4. Harmful branch: an incorrect transition classification leaves either double adjustment or no adjustment. `[guessed]`
