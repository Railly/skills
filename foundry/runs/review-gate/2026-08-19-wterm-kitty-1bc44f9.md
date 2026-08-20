# Review Gate: wterm Kitty keyboard exact head

- Target: `vercel-labs/wterm#120`
- Base: `cdff1c07890ab2c5ba2efbcc1091f790dfb8f931`
- Head: `1bc44f97acf50cbab6b3ca3afce75882dfc6f23b`
- Status: complete
- Verdict: pass

## Outcome

The exact head passes for push. Tate's two blockers are fixed, and the gate caught one adjacent protocol gap before push: flags 2 and 4 alone were still promoting Ctrl and Alt ASCII presses to CSI-u. The final encoder preserves legacy press bytes while retaining event-type releases and pure alternate formatting.

The review used the official Kitty encoder and specification as the independent oracle, real Chromium as the producer, and a fix-absent mutation. A Cursor Grok 4.6 run was aborted after returning no output and is not counted as evidence.

## Verification

- Fix-absent mutation: expected `0x01`, received `CSI 97;5u`; restored 49/49 focused tests.
- Full tests: 14/14 tasks, including 176 DOM tests.
- Type-check: 22/22 tasks.
- Build: 15/15 tasks.
- Lint: 11/11 tasks with one pre-existing docs warning.
- Format: pass.
- Chromium exact-head: 19/19.
- Deterministic style, siblings, callers, report validation, and diff hygiene: pass.
- Impact Map: 40 changed, 64 impacted, 635 edges, 4,220 unresolved calls. It under-covers and was used only for orientation.

## Exemptions claimed

`apps/docs/src/lib/docs-navigation.ts` and `apps/docs/src/lib/page-titles.ts` need no update. The API reference route and title already exist; the cumulative PR only adds a method row to the existing page.

No additional public prose is required for the isolated-flag correction. Existing docs already promise negotiated Kitty behavior, and the change restores that contract.

## Issue candidates

None.
