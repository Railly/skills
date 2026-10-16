# JSON Render PR #325 slices

## V1: Total invalidation and nested identity

This is one independently mergeable and revertible slice because the two
mechanisms jointly satisfy the review contract. Shipping either alone leaves
one unresolved thread open and retains a reachable renderer defect.

| Field | Contract |
|---|---|
| Outcome | Named-domain element changes invalidate without serialization, while unchanged nested resolved values retain reference identity. |
| Production scope | `packages/react/src/renderer.tsx` only unless implementation evidence requires a colocated private helper file. |
| Test scope | Focused React renderer regression coverage for JR325-A1 through A9 plus existing streaming and renderer suites. |
| Included parts | F1, F2, F3, F4, F5. |
| Excluded | Public API changes, core resolver changes, new stores, new dependencies, docs changes, cyclic raw prop support, non-plain raw object semantics. |
| Demo | The seven-cell red probe turns green; a sibling update preserves the unchanged nested reference; existing untouched-render counts remain unchanged. |
| Revert boundary | Revert the amendment and focused tests together; the candidate returns to exact HEAD `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`. |

## Implementation order

1. Add a private total structural comparison primitive and explicit child
   version tuple comparison.
2. Replace serialized signature values with retained structural inputs.
3. Replace shallow resolved-props stabilization with recursive structural
   sharing.
4. Convert the acceptance probe into durable focused regression tests without
   weakening existing cases.
5. Run the exact contract and must-not-change commands.

## Acceptance

Every `JR325-A*` and `JR325-M*` ID from `/tmp/json325-frozen-packet.md` must be
independently classified by Spec after the factory stages. No promotion action
is part of this slice.
