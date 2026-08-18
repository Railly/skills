# Solution Gate: wterm #116 scroll ownership

Date: 2026-08-12
Base: `4852dde5481439883eecf7f61f32f6091be5b468`
Implementer: GPT-5 family
Proposer A: Claude Sonnet
Proposer B: Gemini Flash-Lite
Synthesis: neither new product shape

## Trigger

Yes. A fix from the first resilience review appeared to violate a must-not-change behavior in the full browser suite, so the previous fix itself required a new gate.

## Defect contract

Property: scrollback logical position appeared to have competing ownership across browser-native anchoring and WTerm lifecycle compensation.

Observable:

- Frame-separated rollover must receive one compensation per discarded row.
- Resize must preserve the same first visible logical row in the full serial suite.

Must not change: bottom follow, virtualization bounds, selection, resize coalescing, third-party cores, or discarded-row arithmetic.

## Proposals

The verbatim structured proposals are preserved in the matching `-proposals.md`.

- Claude proposed permanent native suppression plus a general logical-row identity abstraction.
- Gemini proposed transition-specific arbitration between rollover and resize.

## Cheapest refuting probe

The weakest load-bearing claim in both proposals was that the resize failure represented a real post-scroll state.

Code inspection showed:

1. Assigning `element.scrollTop = 600` emits a scroll event.
2. The scroll handler schedules a render on the next animation frame.
3. That render moves the virtualized DOM window to the new scroll position.
4. The E2E test read `firstVisibleText()` immediately after the numeric `scrollTop` reached 600, before waiting for that render.

Observed failing trace:

```text
before: resize history 349
after:  resize history 34
```

The DOM snapshot after failure contained rows 24 through 73, proving the post-resize window represented `scrollTop 600`. The alleged before row 349 came from the old bottom window and was never the logical row at 600.

Probe:

```text
after assigning scrollTop 600, wait two requestAnimationFrame callbacks
then capture firstVisibleText
```

Results:

- Resize focused: 5/5 pass.
- Full serial Chromium suite: 15/15 pass.
- Frame-separated rollover with measured DOM row height: 5/5 pass.

The probe refuted the premise that permanent native suppression breaks resize.

## Prediction disposition

| Prediction | Result |
|---|---|
| One adjustment per frame-separated discard | Survived, 5/5 browser repetitions |
| Same logical row after resize | Survived after synchronizing the oracle, 5/5 focused and 15/15 full suite |
| Resize needs native anchoring | Refuted by the synchronized built-artifact test |
| A new transition arbiter is required | Refuted, no failing product behavior remains |
| A general logical-row abstraction is required for this fix | Refuted as unnecessary scope for the observed defect |

## Failure-shape scoring

| Shape | Claude general abstraction | Gemini arbiter | Final synthesis |
|---|---|---|---|
| S1 over-reach | Hit: changes every geometry mutation | Hit: adds new transition state | Avoided: no new product change |
| S2 under-reach | Clear for modeled mutations | Risk: classification variants | Clear for the reproduced rollover class |
| S3 direction inheritance | Addresses rollover and resize | Addresses rollover and resize | Both directions driven |
| S4 proxy property | Logical row is direct property | Transition provenance is indirect | Direct browser observables |
| S5 unregistered peer | No persistent peer | No persistent peer | No hit |
| S6 peer-version blindness | No protocol peer | No protocol peer | No hit |
| S7 wrong layer | Coordinator owns scroll | Coordinator owns scroll | CSS applies on canonical scroll owner |
| S8 guard-derived cells | Risk from enumerated mutations | Risk from enumerated transition types | Browser cells derive from actual failure timing |
| S9 test pins wrong thing | Would require new broad tests | Existing failure already pinned wrong state | Designed out by synchronizing oracle |
| S10 claim from prose | No | No | No |

## Synthesis

Neither proposed product expansion is taken. The probe showed that the CSS fix is correct and the resize failure was an invalid oracle.

Final shape:

- Keep `overflow-anchor: none` on `.wterm`, the canonical scroll owner.
- Keep existing explicit discarded-row arithmetic.
- Measure row height from the rendered DOM in the rollover regression.
- Wait for the scheduled virtual-window render before capturing the resize anchor.

No carried product assumption remains. Exact-head verification remains a later Review Gate obligation after commit.
