# Issue Contract: agent-browser #1528

Status: retrospective
Source: https://github.com/vercel-labs/agent-browser/issues/1528
Delivery: https://github.com/vercel-labs/agent-browser/pull/1532

## Outcome

Switching to a Memory Saver discarded tab returns a usable tab or a bounded error without leaving the daemon unresponsive or corrupting the caller's current-tab state.

## Observed

Renderer-bound setup on a discarded tab waited through the CDP timeout. The active index could point at the dead renderer and later commands stalled behind the daemon state lock.

## Expected

A genuinely discarded target is revived through a bounded, non-destructive recovery. A live, dialog-blocked, slow, or unrevivable target does not lose state or poison the current session.

## Acceptance

- A1: the discarded-tab regression is red without the production recovery and green with it.
- A2: a genuinely discarded tab becomes usable within the recovery bound and reports `revived`.
- A3: a failed switch preserves the previous active index, refs, iframe sessions, and active-frame state.
- A4: a follow-up command completes after either a successful or failed switch.
- A5: a live or dialog-blocked tab is not destructively reloaded or misclassified as discarded.
- A6: cancelling the liveness probe leaves no pending CDP request.
- A7: `tab_close` does not report failure after a close has committed and does not clear caller state before a rejected close.
- A8: recovery state is represented consistently in default CLI output, JSON, MCP, command docs, skill docs, and the docs site.

## Non-goals

- N1: no session-isolation or daemon-scheduler redesign.
- N2: no background-tab revival contract.
- N3: the connect-path first-target gap remains a separate mission.
- N4: no push or PR before Spec and Standards states are explicit.

## Invariants

- I1: switching to a responsive tab preserves its page and JavaScript state.
- I2: the previous tab remains usable when a switch fails.
- I3: cancellation removes the corresponding pending request.
- I4: an operation that has committed is not reported as failed because optional recovery failed afterward.

## Change surface

Expected:

- BrowserManager tab switching and renderer liveness.
- CDP pending-request cleanup.
- daemon tab-switch and tab-close handlers.
- CLI, JSON, MCP, skill, and docs surfaces for recovery state.

Must inspect:

- every entry point that activates or selects a successor tab.
- state mutations performed before a fallible switch or close.
- dialog and debugger-paused renderer states.
- connect and auto-attach paths for shared mechanisms, even when out of scope.

## Verification

- `cargo test test_tab_switch_revives_discarded_tab` -> A1, A2.
- `cargo test test_tab_switch_does_not_misclassify_dialog_blocked_tab` -> A5.
- cancelled-probe pending-map regression -> A6, I3. Exact command was not retained in the case.
- `cargo test test_tab_close_succeeds_even_if_successor_unrevivable` -> A7, I4.
- real Chrome discarded-tab and live-tab scenarios -> A2, A4, A5, I1. Exact command was not retained in the case.
- full unit suite and clippy -> regression surface only, not sufficient for A2 through A8.

## Risk

- tier: R2
- human gate: real Chrome behavior and Spec review required before delivery.

## Promotion

- deterministic: pass only with named red-capable tests and artifact results.
- spec: verify A1 through A8 and I1 through I4, including N1 through N4.
- standards: run `review-gate` after the final diff and after conflict resolution.
- delivery: no push or PR handoff without explicit deterministic, Spec, and Standards states.

## Retrospective note

This contract would have preserved the review obligations and sibling-path additions across seven rounds. It would not have invented the dialog-blocked or close-path findings. Those still require repository-grounded review.
