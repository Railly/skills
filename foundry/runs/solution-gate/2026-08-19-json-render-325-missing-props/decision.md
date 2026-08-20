# Solution Gate: json-render PR #325 missing streamed props

Date: 2026-08-19
Mode: fix for an external review finding
Candidate: Vercel Agent Review suggestion on `renderer.tsx:296`
Base candidate SHA: `476e27a4e9ad8cfce2e4e105ada6bebdda716bd4`

## Contract

An element that has a valid type but whose props have not arrived yet must not
crash the React renderer, and a later props patch must invalidate the element
and render the completed value. Complete elements, callbacks, graph semantics,
and the public required `UIElement.props` type must remain unchanged.

Observed substrate:

- `setSpecValue` casts a whole `/elements/<key>` patch value to `UIElement`
  without runtime validation.
- `Renderer` has direct consumers in addition to `buildSpecFromParts`, so
  normalizing only one stream producer under-covers the runtime boundary.
- Guarding only `Object.keys` moves the same reproduction to a `TypeError` in
  `resolveBindings`.

## Blind proposals

Gemini 3.7 Flash and Grok 4.20 independently proposed normalizing missing props
at the element-ingest boundary while keeping the public type strict. They
rejected widening `UIElement`, catch-all error suppression, and buffering until
the element is complete.

Their ingest-only shape under-covers direct `Renderer` consumers and complete
`flat` replacement inputs. The useful part is the single-normalization-owner
principle.

## Candidate reveal

The bot suggested only:

```ts
Object.keys(frame.element.props ?? {})
```

That prevents the signature pass from throwing but leaves the next consumer,
`resolveBindings`, receiving `undefined`. The suggestion is directionally
correct and incomplete.

## Decision

Synthesis kind: graft.

- Make signature computation tolerate the temporary absence.
- Normalize missing props to one stable empty object at the reactive renderer
  boundary before bindings, dynamic props, and the catalog component.
- Keep `UIElement.props` required and do not modify stream accumulation.

The stable singleton avoids creating a new wrapper on every render. A
regression replays the real `type`-first patch sequence, observes `waiting`,
then adds props and observes `ready`.

## Falsification

- Removing the signature guard fails in `useElementSignatures` with
  `Cannot convert undefined or null to object`.
- Keeping the signature guard but removing renderer normalization fails in
  `resolveBindings` with the same error.
- Restoring both passes and updates `waiting` to `ready` after the later patch.

## Must not change

- Missing type is not defaulted or silently accepted.
- Public `UIElement.props` remains required.
- Complete specs retain existing prop identity and update behavior.
- The later props patch increments the semantic version and updates output.
