# Case: scroll anchoring needs one owner

Status: evaluated
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-08-12
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: PR #116 at `4852dde`; resilience audit `2026-08-12-wterm-116`

> The failure and cause falsification are locally reproduced. No product fix has been submitted or reviewed.

## Observed condition or claim

wterm explicitly adjusts `scrollTop` when the scrollback ring discards old rows. Chromium also applies native scroll anchoring to the same scrolling element.

## Red signal

Starting at `history 0354` and `scrollTop 6000`, forty linked rows delivered across frames produced `history 0314` and `scrollTop 4640`. One explicit compensation should have ended at 5320 while retaining `history 0354`.

## Method used

Compare batched and frame-separated rollover, then disable browser anchoring at runtime without changing wterm's compensation. The batch preserved identity. The streamed case failed. `overflow-anchor: none` made the streamed case land at exactly 5320 and preserve the row.

## Outcome

The cause is double ownership, not incorrect discarded-row arithmetic. The smallest candidate fix is to disable browser native anchoring on the terminal scroll owner and retain wterm's deterministic logical-row compensation.

## Evidence

- Source: PR #116 head `4852dde`; the rollover compensation and CSS are unchanged from base
- Runtime: Chromium 151 on macOS, Vite production fixture
- Tests: 1040 initial linked rows, 40 frame-separated rollover writes, exact scroll and row oracle
- Review: pending
- Artifact: resilience audit `2026-08-12-wterm-116`

## Transferable lesson

Scroll anchoring is state ownership. If application code preserves logical identity, the browser's independent anchoring mechanism must be disabled or explicitly incorporated into the oracle.

## Exceptions

Firefox and Safari were not executed. Attribution to #115 is inferred from the exact diff, not from a separate base run.

## Candidate changes

- Deterministic check: stream one row per frame past ring capacity and assert one scroll adjustment plus stable row identity.

## Confidentiality review

Public repository, public PR, and sanitized technical evidence only.
