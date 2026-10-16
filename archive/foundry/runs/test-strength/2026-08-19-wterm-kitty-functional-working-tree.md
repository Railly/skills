# Test Strength: wterm Kitty functional encoding

Date: 2026-08-19
Target: `vercel-labs/wterm#120`, working tree after `1bc44f9`

## Contract

Functional keys preserve official legacy bytes under pure enhancement flags, keypad identity normalizes only without disambiguation/report-all, CSI-letter press omits action while repeat/release retain it, and DECCKM reaches the Kitty encoder from the current bridge state.

Failure classes: functional legacy bypass, missing keypad normalization, forced press action, and dropped cursor application state.

Runtime boundary: real Chromium `KeyboardEvent` → hidden textarea → `InputHandler` → `encodeKittyKey` → terminal `onData` using a rebuilt `@wterm/dom` artifact.

## Fix-absent falsification

- M1 bypassed `legacyFunctionalSequence`: Escape became `CSI 27u`, F1 became `CSI P`, and Shift+Tab became `CSI 9;2u`. Both encoder and InputHandler assertions failed, then passed after restoration.
- M2 forced CSI-letter press event type `1`: ArrowUp became `CSI 1;1:1 A`. Encoder and InputHandler lifecycle assertions failed, then passed after restoration.
- M3 replaced both `cursorKeysApp` arguments with `false`: the second toggled ArrowUp remained `CSI A` instead of `SS3 A`. The InputHandler assertion failed, then passed after restoration.
- M4 forced `normalizeKeypad = false`: NumpadEnter became `CSI 57414u` and Numpad8 became `CSI 57419u`. Encoder and InputHandler assertions failed, then passed after restoration.

Every mutation was verified in the source before running. Restoration used inverse patches, followed by a green rerun.

## Beyond the examples

The matrix crosses flags 1, 2, 4, report-all, key classes Escape/F1-F4/recovery/navigation/keypad, modifier presence, DECCKM on/off, and press/repeat/release. Existing printable, Meta, modifier-peer, associated-text, composition, and browser-shortcut tests remain in the focused suite.

## Real boundary

The Playwright scenario rebuilds `@wterm/dom` and Vite, then drives Chromium keyboard events for Shift+A, Ctrl/Alt cells, lone and paired Ctrl, F1, Shift+Tab, NumpadEnter, Numpad8, Escape, ArrowUp lifecycle, and DECCKM ArrowUp. Result: 1/1 focused scenario passed.

## Determinism and cost

Focused DOM suite: 181 tests in under one second of test runtime. Focused Chromium scenario: about 5.5 seconds including build/server startup. No random input, external credentials, or timing assertions.

## Strength verdict

Strong for the four changed mechanisms. Each mechanism has intended red evidence, restored green evidence, and the user-visible boundary is exercised through a rebuilt browser artifact. Remaining gap: arbitrary keyboard-layout base alternates remain unavailable from `KeyboardEvent` and are intentionally not invented.
