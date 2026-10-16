# Solution Gate: wterm Kitty Meta lifecycle

Date: 2026-08-19
Mode: fix after Review Gate finding
Target: `vercel-labs/wterm#120` at `aecbd65`
Implementer: Codex GPT-5
Proposers: Cursor Grok 4.6 and GPT-5.6 Sol

## Contract

With report-all enabled, physical Meta press/release events are delivered as Kitty events. A key whose press was delivered as CSI retains protocol ownership through repeats and release even if Meta becomes active later. Browser-owned Cmd shortcuts whose keydown was absorbed remain suppressed. Existing Cmd+A/C/V host behavior and blur cleanup remain.

## Observed evidence

- P1: real Chromium MetaLeft down/up under flags `1|2|8` produced no bytes at `aecbd65`; expected `CSI 57444;9u`, `CSI 57444;1:3u`.
- P2: real Chromium KeyA down, MetaLeft down, KeyA up produced only `CSI 97u`; Meta press and both releases were missing.
- P3: the official Kitty protocol says report-all reports modifier key events and report-events reports requested releases.
- P4: Enter/Tab/Backspace releases without report-all are explicitly prohibited by the official spec, refuting one Grok review candidate.
- P5: disambiguate explicitly gives non-text keypad keys dedicated IDs, refuting a second Grok review candidate.

## Proposals

Grok kept the encoder unchanged, allowed physical modifiers through only under report-all, removed the global Meta keyup gate, and used existing suppression for browser-owned keydowns. Sol proposed a larger delivered-key map and blur release synthesis.

## Forward chains

Small shape:

1. Report-all physical modifier bypasses host Meta catch-all → Meta reaches encoder (`inferred`, P1/P3).
2. Suppression belongs to absorbed keydown IDs → Cmd+V release remains suppressed (`observed`, P6).
3. Previously delivered key bypasses later shortcut checks → repeat/release remain paired (`inferred`).
4. Harmful branch: without delivered ownership, a repeat after Meta would become suppressed (`observed`, force-red M2).

Large shape:

1. Per-key ownership map → exact press/release pairing (`inferred`).
2. Synthetic blur releases → remote state may clear (`guessed`).
3. Harmful branch: fabricated event ordering and bytes violate the documented browser-event boundary (`inferred`).

## Probes

- P6: corrected real Chromium sequence emitted Meta press/release, delivered-key repeat/release with Meta held, and only Meta bytes for Cmd+V.
- M1: removing the report-all modifier bypass failed with Meta output `[]`.
- M2: removing delivered-key ownership failed with missing repeat/release bytes.
- Focused and full suites returned green after snapshot restoration.

## Failure shapes

- S1 over-reach: designed out by retaining Cmd+A/C/V absorption and gating physical modifiers on report-all.
- S2 under-reach: designed out by testing Meta alone, Meta interleaved after KeyA, a repeat while Meta is held, and Cmd+V.
- S3 direction inheritance: press, repeat, release, and absorbed-key direction covered.
- S4 proxy property: global `metaKey` was a proxy for browser ownership; replaced by per-key lifecycle ownership.
- S5/S6: no persistent or cross-version state.
- S7: real Chromium → textarea → InputHandler → encoder → onData passed.
- S8: cells derive from lifecycle order, not the new conditions.
- S9: both new mechanisms force-red independently.
- S10: official Kitty spec and real Chromium used.
- S11: shortcut and protocol consumers share the keydown ownership decision.
- S12: synthetic blur releases rejected because they exceed the browser event contract.

## Synthesis

Kind: graft. Keep Grok's minimal report-all physical-modifier bypass and existing negative suppression. Add only a delivered-key set so repeats and releases cannot change ownership after a later modifier press. Clear delivered and physical state on blur; do not synthesize releases.

## Visual

```text
keydown
  ├─ absorbed browser shortcut → suppressedKeyUps → swallow matching keyup
  └─ Kitty-delivered event → deliveredKeys → repeat/release remain Kitty-owned

physical Meta + report-all → Kitty-delivered event
blur → clear ownership sets, emit no fabricated key events
```

## Review handoff

Re-run the independent Grok Review Gate on the exact fix head. Required tripwires: Meta modifier events, interleaved repeat/release, Cmd+V, shifted text, paired Ctrl, and blur cleanup.
