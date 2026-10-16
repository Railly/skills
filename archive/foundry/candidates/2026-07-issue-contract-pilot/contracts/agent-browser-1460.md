# Issue Contract: agent-browser #1460

Status: retrospective
Source: https://github.com/vercel-labs/agent-browser/issues/1460
Branch: https://github.com/Railly/agent-browser/tree/fix/semantic-locators-active-frame

## Outcome

Semantic locators search and interact inside the currently selected frame using the same frame semantics already honored by snapshot.

## Observed

After selecting an iframe, snapshot displayed a button while `find text` returned `Element not found` in the same session state.

## Expected

Text and role locators evaluate and clean up markers through the existing frame-aware seam for same-process and out-of-process frames, without leaking results across frame boundaries.

## Acceptance

- A1: `find text` locates and activates an element inside the selected frame.
- A2: role locators honor the same selected-frame state.
- A3: frame content is not returned while main-frame mode is active.
- A4: main-frame content is not returned while child-frame mode is active.
- A5: returning to main-frame mode restores existing locator behavior.
- A6: the e2e guard is red against the original production path and green with the fix.

## Non-goals

- N1: no parallel frame-evaluation implementation.
- N2: no frame-selection API redesign.
- N3: no claim that the adjacent #1445 branch composes until both branches are built and tested together.

## Invariants

- I1: snapshot and semantic locators agree on the active browsing context.
- I2: marker cleanup runs in the same context as marker creation.
- I3: main-frame locator behavior does not regress.

## Change surface

Expected:

- semantic locator evaluation.
- frame-aware execution seam.
- marker creation and cleanup.
- selected-frame e2e coverage.

Must inspect:

- text and role locator callers.
- same-process and out-of-process iframe adapters.
- transitions back to main-frame mode.
- adjacent frame-identity work from #1445.

## Verification

- `cargo test e2e_find_text_searches_selected_frame -- --ignored --test-threads=1` -> A1, A3, A4, A5, A6, I1 through I3.
- role-locator selected-frame artifact scenario -> A2. Exact command was not retained in the case.
- full suite and release CLI smoke -> regression surface and built-artifact confidence.

## Risk

- tier: R2
- human gate: spot check the selected-frame user contract and the unresolved #1445 composition boundary.

## Promotion

- deterministic: e2e guard proven red against the original path and green restored.
- spec: A1 through A6 and I1 through I3.
- standards: inspect every locator caller and both frame execution modes.
- delivery: local branch only until the adjacent branch composition is either verified or explicitly deferred.

## Retrospective note

The contract exposes the #1445 composition gap as N3 instead of leaving it in a late case note. It does not prove the two branches compose.
