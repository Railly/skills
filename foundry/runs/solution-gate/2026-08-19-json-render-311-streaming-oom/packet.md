# Solution Gate packet: json-render #311

Date: 2026-08-19
Mode: greenfield
Target: `vercel-labs/json-render#311` at `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`

## Frame

During append-paced streaming, work for an unchanged rendered subtree grows
with every accumulated patch. A consumer effect that writes through an
unstable binding object can turn that repeated work into an update-depth loop.
Streaming must keep previously rendered, untouched elements stable without
changing the final spec or the public binding contract.

## Requirements

| Req | Requirement | Status |
|---|---|---|
| R0 | A patch to one element must not execute every untouched component in the rendered tree. | Core goal |
| R1 | Replaying the same ordered `patch`, `flat`, and `nested` parts must produce the same final `Spec` as today. | Must-have |
| R2 | Append-paced streaming must not create a `Maximum update depth exceeded` loop solely because an unchanged element receives a newly allocated `bindings` or resolved-props wrapper. | Must-have |
| R3 | `$state`, `$bindState`, `$item`, `$bindItem`, visibility, watch, actions, repeats, children, and named slots must retain current semantics. | Must-have |
| R4 | `buildSpecFromParts(parts)` remains a correct stateless public helper for arbitrary complete part arrays. | Must-have |
| R5 | `useJsonRenderMessage(parts)` continues to accept the documented AI SDK append pattern and returns `{ spec, text, hasSpec }`. | Must-have |
| R6 | `flat` and `nested` parts may replace prior streamed state, and malformed or non-spec parts remain ignored. | Must-have |
| R7 | A renderer given a new complete `Spec` directly, outside `useJsonRenderMessage`, still updates all elements whose observable inputs changed. | Must-have |
| R8 | The fix must have a deterministic regression test whose failure is tied to untouched render count or reference stability, not a wall-clock threshold. | Must-have |

## Observed evidence

- P1: `buildSpecFromParts` allocates a new root and replays all parts on every
  call: `packages/react/src/hooks.ts:532-554`.
- P2: `useJsonRenderMessage` calls that helper whenever the append guard
  detects a changed parts array: `packages/react/src/hooks.ts:618-645`.
- P3: every recursive `ElementRenderer` receives the complete `spec`, and its
  default `React.memo` comparison therefore fails when the spec reference is
  new: `packages/react/src/renderer.tsx:207-214,422-445`.
- P4: `resolveElementProps` and `resolveBindings` allocate result wrappers:
  `packages/core/src/props.ts:323-367`.
- P5: a 26-element, 200-patch append-paced React harness produced exactly 201
  root renders and 5,226 metric renders. 5,025 metric renders were untouched.
  Five runs preserved exact counts; elapsed time was 116.39, 164.38, 185.83,
  122.68, and 137.18 ms.
- P6: a component effect depending on `bindings` and writing through the state
  store reproduced `Maximum update depth exceeded`. The renderer error boundary
  caught it after 18,304 writes.
- P7: placing all 200 rerenders in one React `act()` produced only two commits,
  proving that a synchronous batched workload does not represent SSE cadence.
- P8: xref found no competing or superseding PR. The only graph neighbor is a
  closed Kairo design issue.

Harness: `/Users/raillyhugo/Programming/vercel/json-render-fix-311/packages/react/src/issue-311.profile.test.tsx`.

## Unknowns

- Whether the best ownership boundary is incremental accumulation in the hook,
  renderer-level comparison/stabilization, or explicit update coalescing.
- Whether stabilizing `bindings` alone is sufficient once untouched elements
  stop rendering.
- Which replacement sequences invalidate an incremental accumulator safely.
- Whether direct `Renderer` consumers rely on whole-spec reference churn for
  elements whose own definitions are unchanged but whose descendants changed.
- Browser heap retention after repeated caught error-boundary recovery is not
  measured locally. Node/jsdom confirms the loop, not Chrome Fiber retention.

## Must not change

- Public `Spec`, `DataPart`, hook return, renderer registry, and component
  binding shapes.
- Ordered patch semantics and complete-array stateless helper behavior.
- Updates driven by state-store context, watches, actions, repeats, loading,
  devtools, and descendant structural changes.
- Existing non-streaming direct renderer use.

## Success measurement

On the same 26-element, 200-patch append-paced workload, render counts for
untouched leaf components must fall from 5,025 to zero or to a bounded count
explained by an observable dependency. The final spec must deep-equal the
baseline, and the focused plus repository type checks must pass.

## Final decision and implementation result

Synthesis kind: one bounded renderer-level shape. Keep `ElementRenderer`
reactive to contexts, derive persistent bottom-up element versions, and place
a memoized boundary immediately around the catalog component. Stabilize
resolved props and binding maps by shallow equality. Use a stable default for
validation functions.

Rejected:

- Incremental part accumulation would add mutable state beside the public
  stateless helper and complicate replacement semantics.
- Throttling changes stream cadence and only reduces the frequency of the
  defect.
- A store parallel to `Spec` duplicates ownership and invalidation rules.

Measured result on the original workload:

- Catalog renders fell from 5,226 to 226: 26 mounts plus 200 updates to the
  touched metric.
- Untouched leaf renders fell from 5,025 to zero.
- The exact count repeated five times.
- The binding-write reproduction completed with 26 writes and no update-depth
  error. Removing binding stabilization restores the loop.

Carried assumptions were converted into tests for direct complete-spec
updates, later children, state context, repeat callback freshness,
functions/directives in props and callbacks, shared-child DAG propagation,
watch cleanup, error recovery, 12,000-node signature graphs, and cyclic or
`BigInt` runtime values. The React suite passes 86/86 and the repository
type-check passes 59/59.

An independent Gemini 3.7 Flash review through AI Gateway found two defects in
round 1: internal element renderers still executed tree-wide, and shallow
stabilization conflated a missing key with an own `undefined` key. Both were
fixed and force-red. The final full-diff round returned `PASS`. The
implementation is not committed or pushed, so exact-SHA Review Gate coverage
is still pending.
