# Issue Contract: agent-browser #1291

Status: retrospective
Source: https://github.com/vercel-labs/agent-browser/issues/1291
Branch: https://github.com/Railly/agent-browser/tree/fix/state-load-unreachable-origin

## Outcome

Loading storage state with one unreachable origin completes within a per-origin bound, reports the partial failure, and leaves the daemon responsive.

## Observed

One origin that accepted a connection but never responded held the batch beyond the command timeout. Concurrent and subsequent commands also timed out.

## Expected

Each origin restore is bounded independently. A failed origin becomes a warning, successful origins continue, abandoned navigation is cancelled, and the daemon remains usable.

## Acceptance

- A1: the regression test is red when the per-origin bound is removed and green when restored.
- A2: the real CLI returns a warning for the stalled origin within the configured bound.
- A3: successful origins in the same state file still restore.
- A4: concurrent and follow-up `get url` commands remain responsive after the warning.
- A5: cancelled navigation does not leave provisional external work blocking the page.
- A6: fast navigation errors and timeouts use the same fail-soft warning contract.

## Non-goals

- N1: no transactional rollback for the entire state file.
- N2: no global navigation retry-policy redesign.
- N3: no upstream PR until the local branch and artifact evidence receive human review.

## Invariants

- I1: one origin cannot consume the full batch budget indefinitely.
- I2: partial failure is visible to the caller.
- I3: cancellation includes cleanup in the external browser, not only future cancellation in Rust.
- I4: valid origin restores keep their existing behavior.

## Change surface

Expected:

- storage-state origin restoration.
- warning propagation.
- browser navigation cancellation and `Page.stopLoading`.
- state-load tests and CLI artifact scenario.

Must inspect:

- per-item timeout ownership.
- batch continuation semantics.
- provisional browser state after task cancellation.
- callers that translate warnings into CLI, JSON, or MCP responses.

## Verification

- `cargo test test_load_state_skips_unreachable_origin_with_warning` -> A1, A6, I1.
- local non-responding TCP server plus release CLI state-load scenario -> A2, A4, A5, I2, I3. Exact command was not retained in the case.
- mixed reachable and unreachable origin fixture -> A3, I4. Exact command was not retained in the case.
- full suite -> regression surface only.

## Risk

- tier: R2
- human gate: artifact verification required because cancellation touches an external browser.

## Promotion

- deterministic: named unit regression red and restored green.
- spec: A1 through A6 and I1 through I4, including warning visibility.
- standards: review cancellation, batch semantics, and artifact behavior.
- delivery: local only until the exact artifact command and result are attached.

## Retrospective note

The unit mock did not expose the provisional load. The contract makes A5 independent from A1, so a green unit test cannot substitute for external cleanup evidence.
