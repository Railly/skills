# Case: hyperlink bounds must cross layers

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

> The pressure behavior is locally reproduced. Product policy and fixes remain pending.

## Observed condition or claim

The built-in core bounds hyperlink identity storage at 1024 entries, while the Ghostty adapter caches every identity it resolves without a session bound.

## Red signal

After the built-in table saturates, later OSC 8 links render as plain text with no saturation signal and RIS does not recover capacity. In Ghostty, forced reads of 800, 1024, 1200, and 1600 unique identities produced cache sizes of 800, 1024, 1200, and 1600. RIS increased the cache again; only a fresh core reset it.

## Method used

Drive more unique implicit links than the built-in table can own, inspect mounted anchors and adapter caches, and compare RIS with a fresh core. Use the committed Ghostty WASM rather than a mock.

## Outcome

The built-in path is bounded but silently degrades. The Ghostty path preserves behavior but moves the resource risk into an unbounded JavaScript cache. A safe contract needs a bound and an observable outcome at every layer that retains identity.

## Evidence

- Source: PR #116 head `4852dde`
- Runtime: built-in WASM in Chromium; Ghostty committed WASM in Vitest
- Tests: 1600 unique identities plus RIS and fresh-core recovery
- Review: pending
- Artifact: resilience audit `2026-08-12-wterm-116`

## Transferable lesson

A lower-layer capacity limit does not bound the system if an adapter retains resolved identities independently. Conversely, a fixed lower-layer table is not graceful degradation unless callers can observe saturation.

## Exceptions

Long-duration RSS and heap retention were not measured. Ghostty pressure was not rendered through the DOM in Chromium.

## Candidate changes

- Reference rule: every identity table and adapter cache declares its lifetime, bound, saturation signal, and recovery boundary.

## Confidentiality review

Public repository, public PR, and sanitized technical evidence only.
