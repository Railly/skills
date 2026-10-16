# JSON Render PR #325 Solution Gate

Date: 2026-08-28

Target: `vercel-labs/json-render#325`

Candidate HEAD: `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`

Base: `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`

Mode: candidate audit for two unresolved review findings.

## Decision

**Verdict: Pass to detail. Candidate disposition: Amend in place.**

Promote Shape F from `/tmp/json325-shape-claude-final.md`:

1. Replace serialization-based element signature comparison with a total,
   serialization-free structural comparison.
2. Recursively structurally share resolved prop arrays and objects, preserving
   unchanged subtree references when a sibling changes.
3. Compare leaves with `Object.is`.
4. Compare own enumerable key sets so absence differs from present
   `undefined`.
5. Preserve the candidate's existing element memo wrapper, catalog memo
   boundary, traversal, and invalidation inputs.

No public API, schema, package boundary, store architecture, or cyclic raw prop
support is added.

## Evidence

- Frozen contract: `/tmp/json325-frozen-packet.md`
- Live-state seal: `/tmp/json325-live-state.md`
- Red acceptance baseline: `/tmp/json325-probe-results.md`
- Claude blind pass: `/tmp/json325-shape-claude.md`
- Claude evidence-return pass: `/tmp/json325-shape-claude-final.md`
- Gemini blind pass: `/tmp/json325-shape-gemini.md`
- Gemini evidence-return pass: `/tmp/json325-shape-gemini-final.md`

Both model families independently converged on an in-place amendment after the
same probes. P1 refuted whole-props reuse. P2 established raw non-plain object
parity. P3 established that cyclic raw props are unsupported in the base. P4
showed the candidate already owns the correct memo boundaries. P5 reproduced
all seven contract failures.

## Selected shape

| Part | Mechanism | Flag |
|---|---|:---:|
| F1 | Compare arrays and enumerable object records recursively; compare leaves with `Object.is`; compare own key sets; never serialize. | |
| F2 | Retain prior raw element comparison values and child-version tuples in each signature entry; issue a new version only when either changes. | |
| F3 | Recursively share resolved props against the prior resolved tree; reuse unchanged subtrees and rebuild only changed ancestry. | |
| F4 | Preserve base domain behavior: raw non-plain objects have already been resolved through enumerable entries; cyclic raw props remain unsupported; functions, symbols, and `BigInt` are leaf values. | |
| F5 | Preserve the current element wrapper, catalog boundary, registry/context/callback invalidation inputs, iterative element-graph traversal, and regression suite. | |

## Fit check

| Req | Requirement | Status | F |
|---|---|---|:---:|
| R0 | Stable nested resolved identity and total named-domain invalidation without loops, stale rendering, or serialization failure. | Core goal | ✅ |
| R1 | Every unchanged nested resolved array or object retains identity, including when a sibling changes. | Must-have | ✅ |
| R2 | Every changed nested resolved array or object is fresh and observable. | Must-have | ✅ |
| R3 | An effect keyed to an unchanged nested object and writing unrelated state executes only initially. | Must-have | ✅ |
| R4 | Nested absent and present-`undefined` properties differ in both directions. | Must-have | ✅ |
| R5 | Different function identities differ. | Must-have | ✅ |
| R6 | Different symbol identities differ. | Must-have | ✅ |
| R7 | Different `BigInt` values differ. | Must-have | ✅ |
| R8 | `BigInt` never throws during rendering or invalidation. | Must-have | ✅ |
| R9 | Unchanged named-domain values do not falsely invalidate. | Must-have | ✅ |
| R10 | Untouched element renderers and catalog components remain skipped across unrelated patches. | Must-have | ✅ |
| R11 | Direct consumers receive fresh complete-spec changes. | Must-have | ✅ |
| R12 | State-context consumers still update. | Must-have | ✅ |
| R13 | Function and directive registry changes still refresh resolved values and callbacks. | Must-have | ✅ |
| R14 | Temporarily missing props remain non-throwing and recover. | Must-have | ✅ |
| R15 | Missing, shared, cyclic, and deep element graphs retain termination and recovery behavior. | Must-have | ✅ |
| R16 | Bindings, repeats, slots, watches, visibility, recovery, devtools, and loading retain current behavior. | Must-have | ✅ |
| R17 | No public API, schema, documentation promise, or package boundary changes. | Must-have | ✅ |
| R18 | Comparison accepts the base prop domain and assumes no JSON-serializable subset. | Must-have | ✅ |
| R19 | Identity preservation runs after prop resolution. | Must-have | ✅ |
| R20 | Performance is gated by untouched-render behavior, not a new numeric claim. | Constraint | ✅ |
| R21 | Raw non-plain behavior remains base-compatible; computed/directive outputs retain reference semantics. | Constraint | ✅ |
| R22 | Cyclic raw prop support is not newly claimed; cyclic element graphs remain supported. | Out | ✅ |
| R23 | Ownership remains inside the candidate's existing React renderer boundaries. | Must-have | ✅ |
| R24 | Element signatures own invalidation; resolved structural sharing owns delivered identity. | Must-have | ✅ |

## Failure-shape scoring

| ID | Result | Evidence or design response |
|---|---|---|
| S1 | Designed out | Only the two disputed comparison and sharing mechanisms change. Existing boundary inputs, graph traversal, and public contracts remain fixed and are rerun. |
| S2 | Designed out | The acceptance matrix covers both `undefined` directions, changed and unchanged identities, initial and changed `BigInt`, nested sibling changes, arrays, and objects. |
| S3 | Designed out | Absence/presence is tested in both directions; changed/unchanged identity is tested for every named leaf class. |
| S4 | Designed out | The direct properties are observed: catalog output, effect execution count, subtree reference identity, and throws. No serialized fingerprint is accepted as a proxy. |
| S5 | Not applicable | No persistent state, file, cache, schema, or lifecycle peer is introduced. |
| S6 | Not applicable | No cross-process or peer-version protocol changes. |
| S7 | Designed out | Element signature versions feed the element memo and error-boundary reset; structurally shared resolved props feed the catalog component. Both delivery paths are acceptance-tested. |
| S8 | Designed out | Cells come from the public value domain and review comments, not from implementation branches. |
| S9 | Designed out | Test Strength must remove each mechanism independently and observe the intended acceptance failure before restoration. |
| S10 | Designed out | Domain and termination claims are backed by executable base/candidate probes and repository source, not prose. |
| S11 | Not applicable | No trust or validation authority is changed. |
| S12 | Designed out | The primitive contract is explicit: own enumerable keys plus recursive arrays/objects and `Object.is` leaves. It directly accepts functions, symbols, `BigInt`, `undefined`, `NaN`, and signed zero. |
| S13 | Not applicable | No invocation-persistent configuration or omission semantics. |

S1 and S2 receive extra weight because this change answers prior review
findings. The selected shape changes no adjacent architecture and the proof
matrix covers the complete named defect class.

## Carried assumptions

- Cyclic raw prop objects retain the base `RangeError` behavior and are not an
  acceptance target.
- Raw non-plain objects retain the base enumerable-entry resolution behavior.
- Values returned from functions or directives that are not traversed by prop
  resolution remain reference-compared leaves.
- No numeric performance threshold is claimed beyond the existing renderer and
  catalog execution-count regressions.

## Detail handoff

One independently mergeable slice implements F1 through F5. The breadboard and
slice contract are in sibling artifacts.

Forbidden actions remain in force: no commit, push, PR update, thread
resolution, or external comment without explicit promotion authority for the
exact reviewed state.
