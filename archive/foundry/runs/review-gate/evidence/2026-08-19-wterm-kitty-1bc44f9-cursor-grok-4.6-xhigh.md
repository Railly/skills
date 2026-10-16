# Cursor Grok 4.6 xhigh review: wterm Kitty keyboard

- Target: `vercel-labs/wterm#120`
- Base: `cdff1c07890ab2c5ba2efbcc1091f790dfb8f931`
- Head: `1bc44f97acf50cbab6b3ca3afce75882dfc6f23b`
- Cursor session: `ea8f40ae-e3b5-4d31-a37f-c0c9264c68d0`
- Model: `cursor-grok-4.6-xhigh`
- Verdict: `FAIL`

Exact head `1bc44f97acf50cbab6b3ca3afce75882dfc6f23b` vs `origin/main` `cdff1c07890ab2c5ba2efbcc1091f790dfb8f931`. Commits `51d12d1` and `1bc44f9` correctly restore legacy **printable** bytes for flags 2/4, but they leave the same pure-enhancement contract unimplemented for functional keys, and the CSI-letter press serializer still disagrees with official `key_encoding.c`.

## Findings

### [P1] Preserve legacy functional encoding when flags 2 or 4 add no extra payload

Location: `packages/@wterm/dom/src/kitty-keys.ts:231`

| flags | event | expected | actual |
|---|---|---|---|
| `2` or `4` | `Escape` press | `\x1b` | `\x1b[27u` |
| `4` | `F1` press | `\x1bOP` | `\x1b[P` |
| `4` | `Tab` + Shift press | `\x1b[Z` | `\x1b[9;2u` |
| `2` or `4` | `NumpadEnter` press | `\r` | `\x1b[57414u` |

Official `legacy_mode` is `!event_types && !disambiguate && !report_all`. Alternate-key reporting is a pure format flag and cannot by itself turn a legacy key into CSI-u. Escape is stricter: it remains `\x1b` whenever disambiguation and report-all are off, including when event types are active. Keypad keys are converted to non-keypad equivalents unless disambiguate or report-all is set.

The reviewed commits implemented this only for printable ASCII. Every functional key falls through to CSI encoding as soon as any flag is nonzero.

### [P1] Omit the press event-type subfield on CSI-letter keys

Location: `packages/@wterm/dom/src/kitty-keys.ts:298`

```ts
encodeKittyKey(new KeyboardEvent("keydown", { key: "ArrowUp" }), 2, "press")
encodeKittyKey(new KeyboardEvent("keydown", { key: "ArrowUp" }), 31, "press")
encodeKittyKey(new KeyboardEvent("keydown", { key: "ArrowUp", ctrlKey: true }), 2, "press")
```

Expected: `\x1b[A`, `\x1b[A`, `\x1b[1;5A`

Actual: `\x1b[1;1:1A`, `\x1b[1;1:1A`, `\x1b[1;5:1A`

Official `init_encoding_data()` sets `add_actions` only when `report_all_event_types && action != PRESS`. Repeat and release match Kitty; press does not. The existing all-flags ArrowUp test locks in the wrong press bytes.

## Refuted concerns

- Shift+A under flag 4 remaining plain `A` is correct.
- Ctrl and Alt ASCII under flags 2 or 4 remaining legacy bytes is correct.
- Plain `a` release under flag 2 is correctly suppressed without report-all.
- Physical modifier tracking is required because Chromium can clear the aggregate modifier bit while a peer key remains held.
- Per-keydown Meta ownership correctly separates protocol-delivered keys from browser-owned shortcuts.
- Arbitrary keyboard-layout base alternates cannot be inferred safely from `KeyboardEvent.key`.

## Verification gaps

- The reviewer did not execute Vitest, Playwright, or a fix-absent mutation.
- Chromium coverage omitted Escape, F1, Shift+Tab, keypad, and arrow presses under isolated flags 2 and 4.
- Associated-text flag 16 without report-all is unspecified and was not confirmed as a defect.
- Shift+Enter remains a pre-existing WTerm product choice.
- Cursor application mode is not passed into `encodeKittyKey`; this matters for legacy-mode flag combinations and remains folded into the first finding.

## Provenance

The complete machine transcript is stored at:

`/Users/raillyhugo/.cursor/projects/Users-raillyhugo-Programming-vercel-wterm-kitty-keyboard/agent-transcripts/ea8f40ae-e3b5-4d31-a37f-c0c9264c68d0/ea8f40ae-e3b5-4d31-a37f-c0c9264c68d0.jsonl`
