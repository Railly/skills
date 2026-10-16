# Review Gate: json-render #311 working tree

Date: 2026-08-19
Base: `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`
Status: technically green, incomplete only for exact-head coverage

## Outcome

No confirmed correctness finding remains. Gemini 3.7 Flash reviewed the full
tracked diff and the 635-line new test through AI Gateway. Its first round
found two real defects, both fixed and force-red. The final round returned
`PASS`.

The run cannot become an exact-head pass until the worktree is committed and
Review Gate is repeated for that SHA. No push or PR exists.

## Deterministic evidence

- React tests: 86/86.
- Focused regression: 16/16 in 624 ms; complete file repeated five times.
- Repository type-check: 59/59 tasks.
- Lint, Prettier, `git diff --check`, style and surfaces: pass.
- Performance workload: 226 executions instead of 5,226, with zero extra
  executions for untouched leaves instead of 5,025.
- Force-red mutations cover the wrapper bailout, own-key semantics, binding
  loop, repeat/function/directive freshness, DAG invalidation, deep traversal,
  watch cleanup, and error recovery.

## Subsystem model

`Renderer` computes persistent bottom-up versions from each element and its
children or named slots. A hook-free memo wrapper avoids executing unchanged
internal renderers, while the reactive renderer remains subscribed to state,
visibility, watch, action, repeat, function, directive, loading, and devtools
contexts. A second memo boundary around the catalog component compares all
observable callback and prop inputs. Stable binding and resolved-prop records
use key-aware shallow equality.

The adjacent risks were stale callbacks, missed descendant invalidation,
shared-child graphs, cycles, deep graphs, unmount during an async watch chain,
and an error boundary that never recovered after a corrective patch. Each is
driven by a regression.

## Findings fixed during review

1. The original recursive signature traversal overflowed at 12,000 nodes. It
   was replaced with iterative postorder.
2. The first catalog comparator retained stale repeat, function, and directive
   callbacks. Their identities and scope now participate in invalidation.
3. Serializing runtime resolved values rejected cycles and `BigInt`. Runtime
   identities are no longer serialized by the comparator.
4. Gemini round 1 found that unchanged internal element renderers still
   executed tree-wide. A hook-free `ElementRenderer` memo wrapper now bails out
   before their hooks execute.
5. Gemini round 1 found that shallow stabilization treated missing and own
   `undefined` keys as equal. The comparison now requires own-key presence.

## Radius

The final map includes the previously untracked test: 16 changed symbols, 55
impacted items, 5,168 edges, 18,371 unresolved calls, and 36 convergence
items. The unresolved-call count still dwarfs the graph, so the map was used
for orientation only.

## Exemptions claimed

- Documentation remains unchanged because public renderer, binding, and
  streaming contracts are preserved; the diff changes execution stability.
- Chrome heap behavior is not claimed as measured. jsdom proves work
  elimination, loop removal, cleanup, and recovery, not browser Fiber
  collection after forced garbage collection.

## Issue candidates

- Measure Chrome heap and Fiber retention under a long append-paced stream
  with forced GC. This is additional browser-memory evidence, not a known
  defect in the current diff.

## Shipping state

Commit the three source/test files, rerun Review Gate on the resulting SHA so
`covered` can pass, then request separate authorization before push or PR.

Evidence:

- `foundry/runs/review-gate/evidence/2026-08-19-json-render-311-gemini.md`
- `foundry/runs/test-strength/2026-08-19-json-render-311.md`
- `foundry/runs/resilience-audit/2026-08-19-json-render-311.md`
