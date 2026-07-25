# Issue Contract: agent-browser PR #1589

Status: retrospective
Source: https://github.com/vercel-labs/agent-browser/pull/1589

## Outcome

Each session keeps a stable tab binding across launch, attach, discovery, wrappers, and failure paths. `--pin-tab` prevents implicit rebinding and every command surface preserves the same machine-readable contract.

## Observed

Sessions sharing one Chrome could steal each other's active tab. The first implementation fixed one discovery path but omitted another writer, dropped pin state and error codes in batch, and shipped tests that stayed green with the production fix reverted.

## Expected

All dispatch paths use one binding decision. Discovered tabs do not steal a bound or pinned target, explicit tab-creation commands still activate their own result, missing bound tabs return `tab_gone`, and batch or MCP wrappers preserve pin and error semantics.

## Acceptance

- A1: fresh launch, auto-launch, connect, reattach, batch, and MCP paths propagate pin state to the browser manager.
- A2: enabling pin on a running daemon binds the active target immediately and disabling pin removes strict mode.
- A3: `Target.targetCreated` and `Target.attachedToTarget` use one production registration decision.
- A4: an event-discovered tab cannot steal the active or pinned target.
- A5: the regression guard goes red when the decisive production line is reverted and green when restored.
- A6: a destroyed sole bound tab returns `tab_gone` instead of silently selecting a replacement.
- A7: batch preserves non-null response codes and applies pin state per command.
- A8: daemon reuse fingerprints include pin state.
- A9: explicit `tab new`, `window new`, and `click --new-tab` still activate their new page.
- A10: errors never expose unsanitized credential-bearing runtime URLs.
- A11: tab switch persists a new binding only after required setup succeeds.
- A12: tab close reports committed and rejected outcomes truthfully.

## Non-goals

- N1: no new browser-context or cookie-isolation architecture.
- N2: no reliance on inherited community tests as Standards review.
- N3: no push or PR handoff that omits the review-gate state.
- N4: no empirical pass when the reviewer environment cannot launch Chrome or bind the required sockets.

## Invariants

- I1: one session cannot change another session's binding through implicit discovery.
- I2: every wrapper preserves the single-command error and option contract.
- I3: explicit user actions retain activation semantics.
- I4: regression tests exercise the production decision rather than a duplicated helper.
- I5: credential-bearing connection state is sanitized at the output boundary.

## Change surface

Expected:

- browser manager binding and pin state.
- both CDP discovery handlers.
- launch, connect, reattach, batch, and MCP envelopes.
- daemon fingerprint and persisted session target.
- response-code shaping and URL sanitization.
- unit and real-Chrome regression coverage.

Must inspect:

- every writer to active-target and bound-target sinks.
- every dispatcher that reconstructs a command envelope.
- every boundary that rebuilds JSON responses.
- post-commit fallible work in tab switch and tab close.

## Verification

- `cargo test test_register_discovered_page_untracked_target_does_not_steal_pinned_tab` with production-line revert -> A3 through A5, I1, I4.
- real Chrome two-session foreign-tab scenario -> A4, A6, A9.
- real Chrome batch pin and `tab_gone` scenarios -> A1, A2, A7, A8, I2.
- credential-bearing runtime URL error scenario -> A10, I5. Exact command was not retained in the case.
- tab-switch and tab-close error-path scenarios -> A11, A12.
- `cargo test`, `cargo fmt --check`, and `cargo clippy -- -D warnings` -> deterministic regression surface only.
- `review-gate` with real browser access -> Standards review, not a substitute for the acceptance checks.

## Risk

- tier: R3
- human gate: session isolation and credential-bearing errors require human approval before delivery.

## Promotion

- deterministic: named tests, production revert proof, and real-browser results.
- spec: A1 through A12 and I1 through I5, including N1 through N4.
- standards: full dispatch, sink-writer, wrapper-parity, error-path, and credential-boundary review.
- delivery: no push or PR unless deterministic, Spec, and Standards states are explicit in the handoff.

## Retrospective note

N3 directly prevents the historical handoff failure. The contract does not discover the missing `attachedToTarget` writer by itself. The change-surface obligation tells Standards review where to sweep.
