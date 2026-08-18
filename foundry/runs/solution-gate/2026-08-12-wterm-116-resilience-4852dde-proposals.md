# Proposals, verbatim: wterm PR #116 resilience fixes

Date: 2026-08-12.
Target: `vercel-labs/wterm` at `4852dde5481439883eecf7f61f32f6091be5b468`.

Both proposers received identical neutral contracts from isolated detached worktrees. Neither saw the other proposal. Codex is the synthesizer and future implementer, and proposed neither candidate.

- Proposer A: `anthropic/claude-opus-5` through Vercel AI Gateway.
- Proposer B: `google/gemini-3.1-pro-preview` through Vercel AI Gateway.
- An earlier `claude-fable-5` CLI attempt hung without output and is not counted as a proposal.

## Round 1

### Proposer A

#### Shape

**D1.** `WTerm` becomes the sole owner of the logical viewport anchor. It stores `{ absoluteRow, offsetPx }`, derives `scrollTop` from the current discarded count on every render, and removes incremental discarded-row subtraction. The renderer retains absolute row keys but does not own viewport movement.

**D2.** `hyperlink.Table` retains its fixed 1024-entry allocation and fail-closed index-zero rejection. It adds a saturating capacity-rejection counter, exposed through optional `TerminalCore.getResourceState()`. Invalid input remains separately classified. `CellData` remains unchanged.

**D3.** Replace `_hyperlinkCache` with a fixed-capacity LRU derived from geometry. Ghostty page metadata remains authoritative and cache eviction reconstructs the same value.

#### Predictions

1. Batched and 2/5/40-frame rollover all end at `scrollTop = 5320` with `history 0354` first visible.
2. Repeated renders with unchanged state do not drift.
3. After 1025 distinct built-in identities, resource state reports `used=1024`, `rejected=1`, `saturated=true`, while prior mappings remain intact.
4. Invalid inputs do not increment the capacity-rejection counter.
5. Ghostty cache samples at 400/800/1600 identities remain equal and below capacity.
6. Evicted Ghostty metadata reconstructs the same URI, optional ID, and semantic key.

#### Cost

D1 rewrites scroll ownership across `wterm.ts` and renderer options. D2 adds Zig state, WASM exports, and one optional core API. D3 adds cache-capacity and eviction policy to `ghostty-core.ts`.

#### What it makes worse

D1 introduces more logical-anchor state and row-height sensitivity. D2 grows a public API for a rare condition without restoring rejected links. D3 can trade retained memory for repeated decoding and garbage collection pressure.

#### Rejected alternatives

- D1: moving incremental compensation into the renderer, relying only on browser anchoring, or generation-deduping the current delta.
- D2: recycling table slots, dynamically allocating the table, or reporting saturation through terminal response bytes.
- D3: clearing on resize, using a `WeakMap`, or deleting the cache without first proving it has no load-bearing value.

### Proposer B

#### Shape

**D1.** Move discarded-row compensation from `WTerm` into `Renderer` so the renderer owns both DOM updates and the scroll adjustment.

**D2.** Add a saturation flag and `TerminalCore.isHyperlinkSaturated()`. Return a special rejected identity that becomes `CellData.linkRejected`.

**D3.** Replace `_hyperlinkCache` with a bounded FIFO or LRU cache.

#### Predictions

1. The discarded-delta subtraction disappears from `WTerm`.
2. Forty frame-separated rows end at `scrollTop = 5320`.
3. `isHyperlinkSaturated()` flips after 1024 identities.
4. The 1025th linked cell carries `linkRejected`.
5. Ghostty cache stays below its configured bound through 2000 identities.
6. An evicted entry reconstructs an identical `linkKey`.

#### Cost

D1 changes `wterm.ts` and renderer ownership. D2 changes Zig, WASM, `TerminalCore`, and `CellData`. D3 adds eviction bookkeeping.

#### What it makes worse

D1 couples renderer implementations to scroll ownership. D2 adds a cell-level branch to hot rendering loops. D3 increases repeated decoding and allocation after eviction.

#### Rejected alternatives

- D1: debounce or delayed reset of the current compensation.
- D2: clear the table at capacity or report through unhandled-sequence diagnostics.
- D3: clear on resize or use a `WeakMap`.

## Round 1 probe result

Both D1 shapes were refuted. The real Chromium probe had already shown that injecting `overflow-anchor: none` preserves the existing arithmetic exactly. Moving or rewriting the JavaScript compensation does not remove Chromium as the second effective owner.

Both D3 shapes rested on a false performance premise. `_readHyperlink` calls WASM and decodes the bytes before consulting `_hyperlinkCache`; the map only reuses the final small JavaScript object.

D2 survived. Proposer A's core-level optional resource-state shape dominated Proposer B's cell-level rejected sentinel because it preserves `CellData` semantics and reports the actual resource, not a proxy property on one cell.

## Round 2

The second brief covered only D1 and D3 and included the refuting observations.

### Proposer A

#### Shape

**D1.** Make JavaScript the sole effective owner by adding `overflow-anchor: none` to the canonical `.wterm` stylesheet and also setting the same inline property in the constructor so correctness does not depend on importing CSS. Keep the existing discarded-row arithmetic unchanged.

**D3.** Delete `_hyperlinkCache`. `_readHyperlink` returns a fresh `{ linkUri, linkId?, linkKey }` value after every authoritative WASM decode.

#### Predictions

1. Batched and frame-separated Chromium runs both end at exactly `5320` with `history 0354` preserved.
2. The Chromium case also passes without importing the stylesheet because the constructor sets the property.
3. React and Vue computed styles resolve `overflowAnchor` to `none`.
4. Ghostty heap retention no longer scales with 400/1600 unique identities after forced GC.
5. Existing Ghostty hyperlink tests pass unchanged.
6. Hyperlink-heavy render duration changes by less than 5%; a larger regression would prove a real caching need.

#### Cost

One CSS declaration, one inline style assignment, cache deletion, and regressions. No new option.

#### What it makes worse

The inline style constrains a consumer-supplied element and disables native anchoring for any unrelated nested content. Removing the cache creates short-lived objects and removes incidental reference stability.

#### Rejected alternatives

- D1: relocate delta arithmetic, rely on browser anchoring, assert a corrective scroll later, or add a public option.
- D3: bounded LRU, clearing per generation, `WeakRef`, or moving retention into the renderer.

### Proposer B

#### Shape

**D1.** Add only `overflow-anchor: none` to the canonical `.wterm` stylesheet.

**D3.** Remove `_hyperlinkCache` entirely and always construct the decoded metadata value.

#### Predictions

1. The Chromium 40-row batched and frame-separated cases end at `5320`.
2. `history 0354` remains visually anchored.
3. JavaScript retention no longer grows linearly with 10,000 identities.
4. Repeated reads return distinct objects but identical value fields.
5. Existing Ghostty hyperlink tests remain green.

#### Cost

One CSS declaration and deletion of map state. No public API.

#### What it makes worse

Native scroll anchoring is unavailable for unrelated above-viewport height changes inside the terminal. Ghostty allocates one short-lived object per linked-cell read.

#### Rejected alternatives

- D1: delete explicit compensation or browser-sniff.
- D3: bounded LRU or `WeakMap`.
