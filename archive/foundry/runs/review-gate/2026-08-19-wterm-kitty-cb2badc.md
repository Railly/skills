# Review Gate: wterm Kitty keyboard lifecycle

- Date: 2026-08-19
- Target: `vercel-labs/wterm#120`
- Head: `cb2badc787167b9e2a7153b6771ecc8ee0e91e23`
- Reviewer: Cursor Grok 4.6 High Fast
- Status: complete

## Verdict

Pass for push. Grok's first review found one real P1 defect and two candidates refuted by the official Kitty protocol. The real defect was reproduced in Chromium, passed a second Solution Gate, fixed, mutation-tested, and reviewed again by Grok across the exact fix and cumulative PR. The final review returned `PASS` with no findings.

Report-all now emits physical Meta events, a delivered key retains protocol ownership if Meta becomes active before repeat or release, and Cmd+V remains browser-owned. Shifted legacy text, lone and paired Ctrl release state, recovery-key exceptions, keypad disambiguation, lock handling, and independent flag behavior remain intact.

## Verification

- Five fix-absent mutations failed on their intended assertions and restored green from snapshots.
- 172 DOM tests passed.
- 19/19 full Chromium E2E passed; the final Cmd+V counterexample passed again in isolation.
- Format, 22 type-check tasks, tests, lint, and 15 build tasks passed.
- Deterministic style, caller, sibling, covered, and diff-hygiene gates passed.

## Exemptions claimed

No documentation update is required. Existing public surfaces already describe negotiated Kitty behavior and the browser limitation on unavailable blur releases.

## Issue candidates

None.
