# Case: Falsify a discarded-tab revival regression

Status: candidate
Validation: contributor-validated
Human review: contributor-complete
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Source: https://github.com/vercel-labs/agent-browser/pull/1532

## Observed failure

Switching to a Chrome Memory-Saver-discarded tab could wait for the CDP timeout and leave the active index pointing at a dead renderer, stalling later work behind the daemon state lock.

## Red signal

The public PR records two mock-CDP regression tests. With the fix removed, both failed with the bug-specific `Elapsed` timeout. With the fix restored, the full unit suite passed. A crashed renderer provided a real-browser mechanism proxy: the unfixed binary hung, while a pre-final fixed build revived the tab.

## Method

1. Probe renderer responsiveness with a short timeout.
2. Reload a dead renderer before enabling domains.
3. Commit the active tab index only after revival succeeds.
4. Split tests-only and fix-only states to establish red before green.
5. Use a deterministic crashed-renderer proxy when the exact Memory Saver trigger is unavailable.

## Outcome

- Patch: commit `9f300d8` on PR #1532.
- Unit suite: contributor-reported 904 passing tests.
- Delivery: PR open as of 2026-07-12.
- Maintainer acceptance: pending.

## Transferable lesson

> When the exact trigger is unavailable, a deterministic mechanism proxy can test the same failure boundary, but the remaining equivalence assumption must stay explicit.

## Limits

- Real Memory Saver discard was not reproduced.
- Real-browser dogfood ran before the final output-field cleanup, so exact final-artifact runtime behavior remains inference.
- The proposed skill exemplar did not outperform the current skill and was rejected.
