# wterm Kitty lock-modifier reference oracle

Date: 2026-08-25
Target: `vercel-labs/wterm#120`
Base: `cdff1c07890ab2c5ba2efbcc1091f790dfb8f931`
Head: `35b85a0fc6e95828b4bc9746ef26d77fd34b43e6`

## Independent reference

The official Kitty protocol says legacy functional-key encoding does not encode lock keys. The historical Kitty implementation change `15f4c476c3a65765426d34dc84c907d74bbe1609` introduced `has_no_unlocked_mods` for DECCKM and F1 through F4. This is the same selection rule as the wterm change: remove Caps Lock and Num Lock bits only when deciding whether the legacy sequence is eligible.

Supporting upstream history:

- `a4db27a8078e0d16ff923e9a87220c754203ce29`: Ignore the lock modifiers in legacy mode.
- `dd249df5ebd0df7e13ee3b6626c932d798f83d03`: Preserve the corresponding recovery-key behavior.

Captured source hashes:

- Kitty `key_encoding.c`: `5aebe0e13233d8303bf5ee4a2f8c5a51fb4967df2893be6034866b563f27d48c`
- Kitty `docs/keyboard-protocol.rst`: `cd452d4f1b5070752499233f8d76455c854d0ec5f2318e38309f835baf2410ce`

The current reference C source has mixed predicates in nearby branches, so the protocol prose and upstream change history are the decisive oracle. Both independently state the intended lock-modifier behavior.

## Spec matrix

| Case | Required output | Exact-head evidence | Status |
| --- | --- | --- | --- |
| Caps Lock + F1, pure alternate reporting | `ESC OP` | Unit assertion and rebuilt Chromium artifact | Pass |
| Num Lock + ArrowUp, DECCKM, pure alternate reporting | `ESC OA` | Unit assertion and rebuilt Chromium artifact | Pass |
| Ctrl + Caps Lock + F1 | `CSI 1;69P` | Unit assertion | Pass |
| Existing cumulative Kitty keyboard behavior | No changed output outside lock-only legacy selection | 182 focused DOM tests, 14 root test tasks, and 19 Chromium scenarios | Pass |

The Ctrl counterexample proves the implementation does not erase lock bits globally. It ignores them only for legacy selection, then retains all modifier bits in a CSI modifier parameter when another modifier requires CSI encoding.

## Producer evidence and limitation

The canonical cumulative Playwright suite rebuilt the exact-head DOM package and passed 19 of 19 scenarios. A separate Playwright probe sent F1 and ArrowUp through real Chromium and observed the built artifact emitting `ESC OP` and `ESC OA`.

Headless Chromium reported `getModifierState("CapsLock")` and `getModifierState("NumLock")` as false for attempted real key toggles. The browser run therefore proves the real producer and built-artifact route but cannot prove active OS lock state. The independent specification, upstream implementation history, direct lock-state unit events, and mutation test supply that missing active-lock oracle.

## Reviewer provenance

No cross-model verdict is claimed. Cursor Grok stopped at its monthly usage limit. Claude reviewer runs produced no output and were terminated. These runtime failures are provenance notes, not evidence. The high-risk independent challenge is satisfied by the official reference oracle and upstream history above.

## Verdict

Pass. The exact-head behavior matches the normative protocol and its upstream implementation history, the counterexample preserves non-lock modifiers, and no contradictory output was observed.
