# Solution Gate: wterm Kitty review blockers

Date: 2026-08-19
Mode: greenfield fix after external review
Target: `vercel-labs/wterm#120` at `f5f9c92`
Implementer: Codex GPT-5
Proposers: Claude Fable 5 and GPT-5.6 Sol

## Contract

Property: legacy shifted printable input remains text when report-all is inactive, and modifier releases report the active modifier state after the release.

Observable: real Chromium `Shift+A` with flags `1` emits `A`; ControlLeft down/up with flags `1|2|8` emits `CSI 57442;5u`, then `CSI 57442;1:3u`.

Must not change: recovery keys, modified controls/navigation, report-all alternates and associated text, release gating, lock modifiers, and release of one physical modifier while its peer remains held.

Oracle: <https://sw.kovidgoyal.net/kitty/keyboard-protocol/>

## Proposals

Both blind proposers independently selected a pure encoder driven by native post-event modifier flags, a shared legacy-text classification for press and release suppression, and no new state. Both predicted literal shifted text and a cleared lone-Ctrl release. Both rejected unconditional bit removal because it would lose a held physical peer, and rejected input-side state because focus loss could leave it stale. Their stated costs were dependence on DOM event semantics and extra Chromium runtime.

## Forward chains

Proposal A/B:

1. Trust native keyup flags → no duplicate state (`inferred`, source read).
2. No duplicate state → lone Ctrl release clears correctly (`observed`, P1).
3. Native aggregate state preserves a physical peer → peer Ctrl remains active (`guessed`, load-bearing).
4. Harmful branch: if Chromium collapses left/right aggregate state on keyup, the peer is lost (`guessed`).

Shared legacy predicate:

1. Classify shifted printable as legacy text → press emits `event.key` (`inferred`).
2. Reuse classification for release suppression → no unmatched escape release (`inferred`).
3. Restrict recovery keys to unshifted events → Shift+Enter remains encoded (`observed`, focused unit suite).
4. Harmful branch: applying passthrough to all Shift events would change controls (`inferred`).

## Probes

- P0, real Chromium before fix: focused Playwright E2E emitted `CSI 97;2u` for Shift+A and `CSI 57442;5:3u` for lone Ctrl release. Both reported defects confirmed.
- P1, native lone Ctrl: Chromium keyup exposed `ctrlKey=false`. The stateless proposal survived this input.
- P2, native paired Ctrl: `ControlLeft down`, `ControlRight down`, `ControlLeft up` exposed `ctrlKey=false` on the release. This refuted both proposals' load-bearing peer prediction.
- P3, corrected graft: InputHandler-owned physical modifier codes, deleted before release encoding and cleared on blur, produced `5:3` for the first paired release and `1:3` for the final release in real Chromium.
- P4, Test Strength: removing shifted passthrough failed on actual `CSI 97;2u`; forcing current modifier inclusion on release failed on actual `CSI 57442;5:3u`; skipping physical-code deletion failed the peer-release integration assertion. Snapshot restoration returned all focused tests green.

## Failure-shape score

- S1 over-reach: hit designed out with Shift+Enter/Tab and report-all tripwires.
- S2 under-reach: hit designed out with shifted punctuation, lone and paired modifiers, and blur cleanup.
- S3 direction inheritance: cleared by testing press, intermediate release, and final release.
- S4 proxy property: the peer probe showed DOM aggregate flags were only a proxy for physical-key state; designed out with code tracking.
- S5 unregistered peer: not applicable, no persistent state.
- S6 peer-version blindness: not applicable.
- S7 wrong layer: cleared by real Chromium through textarea → InputHandler → encoder → onData.
- S8 guard-derived cells: designed out by deriving cells from Kitty semantics and real producer behavior.
- S9 wrong test: cleared by three force-red mutations.
- S10 prose claim: cleared by real Chromium probes against the official oracle.
- S11 asymmetric consumers: not applicable.
- S12 primitive mismatch: initial stateless primitive hit and was rejected after P2.

## Synthesis

Kind: graft after both proposals were refuted.

Keep their shared legacy-text predicate. Replace their stateless release shape with minimal physical modifier state owned by `InputHandler`, the component that receives the ordered down/up/blur lifecycle. It updates before encoding, removes the released code before release encoding, and clears on blur. `encodeKittyKey` receives a read-only snapshot while retaining DOM flags for locks and ordinary modified events.

Carried assumption: blur is the lifecycle boundary for lost keyups. Verification target: blur clears tracked modifiers before later release encoding.

## Audit visual

Observed evidence:

```text
Chromium Shift+A ──P0──> CSI 97;2u (wrong)
Chromium Ctrl up  ──P0──> CSI 57442;5:3u (wrong)
paired Ctrl up    ──P2──> ctrlKey=false (refutes stateless peer claim)
```

Chosen shape:

```text
KeyboardEvent sequence
  → InputHandler physical modifier set [observed P2]
      → delete released code before encoding [inferred]
      → clear on blur [inferred]
  → encodeKittyKey(event, flags, action, snapshot) [inferred]
      → shared legacy-text decision [inferred]
      → Kitty sequence
```

Format: text trees are sufficient because the disputed relationship is ownership and event order.

## Handoff

Implementation must verify shifted letters and punctuation, shifted recovery keys, alternates/report-all, lone modifier release, paired modifier release, blur cleanup, lock bits, and report-events gating. Review Gate must drive the real Chromium E2E and treat each force-red mutation as part of the evidence.
