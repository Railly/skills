# wterm Kitty independent reference corpus

- Target: `vercel-labs/wterm` PR #120
- Base: `cdff1c07890ab2c5ba2efbcc1091f790dfb8f931`
- Head: `1bc44f97acf50cbab6b3ca3afce75882dfc6f23b`
- Oracle source: official Kitty keyboard protocol and `key_encoding.c`
- Local source hashes:
  - `/tmp/kitty-key-encoding.c`: `5aebe0e13233d8303bf5ee4a2f8c5a51fb4967df2893be6034866b563f27d48c`
  - `/tmp/kitty-keyboard-protocol.html`: `1178a0b1c861cf31710feca2edec7d3b4e54998e6e4f1da24169ffc5766d9b46`

## Reference rules

`encode_key()` preserves legacy printable ASCII when disambiguation and report-all are inactive and no action, alternate, or associated-text field must be added. `report alternate keys` is pure formatting and cannot independently promote a legacy key to CSI-u. `report event types` preserves the legacy press but can encode repeat and release when those events need representation. `encode_printable_ascii_key_legacy()` maps Ctrl letters and selected punctuation, leaves unmapped ASCII unchanged, prefixes Alt with ESC, keeps Shift+Alt as ESC plus produced text, and leaves Ctrl+Shift letters for CSI-u.

## Differential matrix

| Flags | Input | Expected and observed |
|---|---|---|
| 1 | Shift+A press | `A` |
| 4 | Shift+A press | `A` |
| 4 | Ctrl+A press | `0x01` |
| 4 | Ctrl+`;` press | `;` |
| 4 | Shift+Alt+A press | `ESC A` |
| 2 | Ctrl+A press then release | `0x01`, `CSI 97;5:3u` |
| 2 | Ctrl+Shift+A press | `CSI 97;6u` |
| 4 | Ctrl+Shift+A press | `CSI 97:65;6u` |
| 8 | A press | `CSI 97u` |
| 8+16 | A press | `CSI 97;;97u` |
| 2+8+16 | A repeat | `CSI 97;1:2;97u` |
| 1+2+8 | lone Ctrl press/release | `CSI 57442;5u`, `CSI 57442;1:3u` |
| 1+2+8 | left/right Ctrl lifecycle | left release retains Ctrl, final release clears Ctrl |

The real producer was Chromium through Playwright. The focused keyboard scenario passed, then the complete Chromium project passed 19/19 on the exact head.

## Falsification

The production condition `!(flags & 1)` was temporarily inverted to `Boolean(flags & 1)` from a reversible patch. The intended unit and DOM assertions failed with `CSI 97;5u` instead of `0x01`. Restoring the condition returned 49/49 focused tests to green. This proves the regression assertions detect the isolated-flag defect rather than merely executing the path.

## Reviewer runtime note

A read-only Cursor Grok 4.6 review was attempted and aborted after several minutes with no output. It is not used as evidence. The independent challenge is the official reference oracle, real Chromium producer corpus, and red/green mutation above.
