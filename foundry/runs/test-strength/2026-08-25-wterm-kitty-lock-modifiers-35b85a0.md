# Test Strength: wterm Kitty lock modifiers

Date: 2026-08-25
Target: `vercel-labs/wterm#120`
Head: `35b85a0fc6e95828b4bc9746ef26d77fd34b43e6`

## Contract

Caps Lock and Num Lock do not disqualify F1 through F4 or DECCKM cursor keys from their legacy sequences. A non-lock modifier still selects CSI encoding, and lock bits remain represented in that CSI modifier parameter.

## Fix-absent falsification

Both new `nonLockModifiers === 0` conditions were temporarily restored to the old `modifierBits === 0` predicate. The new focused test failed as intended: Caps Lock + F1 emitted `CSI 1;65P` instead of `ESC OP`. The inverse patch restored the implementation, the DOM suite passed 182 of 182, and the working tree returned clean.

This mutation rejects the exact former defect rather than a neighboring implementation detail.

## Beyond the examples

The test crosses two lock sources and two legacy functional classes:

- Caps Lock with F1 covers the SS3 F-key branch.
- Num Lock with ArrowUp and DECCKM covers the application-cursor branch.
- Ctrl + Caps Lock + F1 covers the negative case and exact CSI modifier preservation.
- The cumulative DOM and Chromium suites cover prior printable, functional, lifecycle, shortcut, keypad, event, and flag behavior.

## Real boundary

The exact-head Playwright suite rebuilt `@wterm/dom` and passed 19 of 19 Chromium scenarios. A separate built-artifact probe sent F1 and ArrowUp through real Chromium and observed `ESC OP` and `ESC OA`. Headless Chromium could not activate OS lock state, so this producer proof is combined with direct `getModifierState` unit events and the official reference oracle. It is not represented as active-lock browser proof.

## Determinism and cost

The focused tests use exact byte assertions with no randomness, timing assertion, credential, or network dependency. The mutation is reversible and the post-restoration tree was verified clean.

## Strength verdict

Pass. The former predicate is force-red, the corrected predicate is green at focused and cumulative levels, the non-lock counterexample is explicit, and the built browser artifact preserves the surrounding behavior.
