# Review Gate: wterm Kitty shifted text and modifier release

- Date: 2026-08-19
- Target: `vercel-labs/wterm#120`
- Head: `aecbd65`
- Status: incomplete only because two Claude review runtimes hung without output

## Result

No finding emerged from the executable and manual review layers. Real Chromium now emits literal `A` for flags `1`, clears Ctrl on a lone release, preserves Ctrl while the opposite physical key remains held, clears the final release, and drops tracked state on blur.

Three fix-absent mutations failed at their intended assertions and returned green after snapshot restoration. The full repository passed format, 22 type-check tasks, tests including 171 DOM tests, lint, 15 build tasks, and 18 Chromium E2E tests.

## Verification gap

The independent focused model lens did not complete. Cursor Agent and Claude CLI both hung without returning output and were aborted. This run is therefore recorded as incomplete rather than presented as a full Review Gate pass.

## Exemptions claimed

No documentation update is required. Existing docs already promise negotiated Kitty keyboard behavior; this change restores that behavior without adding an API or workflow.

## Issue candidates

Investigate the hanging Claude review runtimes separately. They did not modify the checkout or publish anything.
