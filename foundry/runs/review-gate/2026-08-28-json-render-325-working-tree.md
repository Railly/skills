# JSON Render PR #325 Review Gate

Date: 2026-08-28

Status: pass

Risk classification: high for gate accounting because the base-to-HEAD diff
contains a historical streaming test with a `.save()`-shaped call and the
acceptance path intentionally writes to the in-memory StateStore. The reviewed
production delta adds no durable or remote state. The post-write React lifecycle
was forced and independently challenged by the Claude Test Strength pass.

## Exact reviewed state

- Repository: `/Users/raillyhugo/Programming/vercel/json-render-325-review`
- Branch: `review/json-render-325-comments-20260828`
- HEAD: `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`
- Production diff SHA256: `e6767688f6bc3a4305f56592ceec181156fbe8542e9dfc5418e2d021bd0c91d2`
- Contract probe SHA256: `6af1f038acf37d1dbbbfefae8e6b88bcca29d67031df6f861aa0f6c82261030b`
- Dirty state: modified `packages/react/src/renderer.tsx`; untracked `packages/react/src/json325-contract-probe.test.tsx`
- Contract: `/tmp/json325-frozen-packet.md`
- Spec: pass for JR325-A1-A9 and JR325-M1-M8

The live PR remains open at the same head with exactly two unresolved, non-outdated ctate threads. No GitHub state was changed.

## Standards verdict

Pass. The reviewed working tree fixes both confirmed findings:

1. Recursive copy-on-write sharing preserves unchanged nested resolved prop references while rebuilding changed ancestry.
2. Serialization-free structural snapshots and comparisons preserve property presence, function identity, symbol identity, BigInt, NaN and signed-zero semantics without throwing.

No new Review Gate finding survived verification.

## Proof ledger

| Property | Direct oracle | Result |
|---|---|---|
| Nested resolved identity | Exact references delivered through exported `JSONUIProvider` and `Renderer` before and after state writes | Pass |
| Non-lossy element invalidation | Rendered output, render counts and thrown exceptions across complete-Spec transitions | Pass |
| Must-not-change renderer behavior | Existing renderer and streaming suites across skips, contexts, callbacks, partial props, DAGs, cycles, depth, cleanup and recovery | Pass |

The convenient proxies were challenged:

- One effect execution alone does not prove unchanged sibling subtree identity. Separate assertions capture `options`, `layout` and `columns` references.
- A non-throwing BigInt path alone does not prove non-lossy invalidation. Separate cells cover undefined presence in both directions, changed and unchanged functions, symbols and BigInts, NaN and signed zero.
- Green new tests alone do not prove renderer compatibility. Existing renderer and streaming regressions exercise JR325-M1-M7, while exports, types and docs cover M8.

## Behavioral strength

`/tmp/json325-final-strengthen.md` records an independent `anthropic/claude-sonnet-5` pass launched with `fx --add-dir /tmp ask --auto`.

- 7/7 fix-absent mutations killed
- Snapshot and trap restoration used
- Focused suite restored to 40/40 after each relevant mutation
- Exact HEAD and both working-tree hashes preserved

The mutations disabled own-value comparison, erased own-key presence, replaced `Object.is`, disabled recursive sharing and reintroduced caller-container mutation.

## Deterministic checks

- `git diff --check`: pass
- Prettier: pass
- Focused tests: 3 files, 40 tests pass
- Repository tests: 68 files, 1101 tests pass
- Repository typecheck: 59/59 tasks pass
- Repository lint: 14/14 tasks pass
- Standalone React typecheck: only pre-existing diagnostics in unchanged test files; neither changed file is named
- Surface and style gates: pass

## Focused lenses

Run independently with `google/gemini-3.7-flash` through Herdr command panes and `fx --add-dir /tmp ask --auto`:

- Inverse regression surface: pass
- New-domain matrix: pass
- Substrate differential corpus: pass
- Reference-implementation oracle: pass
- Error-path forcing: pass
- Substrate verification and public API dogfood: pass
- Newly-asserted invariant ownership: pass
- Docs-behavior parity: pass
- Complexity budget: pass

Every counted pass exited zero and preserved the exact HEAD, production diff hash and probe hash. Timed-out Claude lens attempts and earlier partial outputs were not counted.

Skipped with reason:

- Resolution-rule consistency, shell re-parse, emission/latch, shim hermeticity, fresh-seam, failure propagation, flag propagation, non-destructive recovery, cancellation/timeouts and boundary pipeline do not trigger for this diff.
- Deliberate-default does not trigger because the change restores the accepted generic prop contract rather than reversing an intentional default.
- Demonstrative example does not trigger because no documentation example changed.
- Choice audit does not trigger because no decision trail exists.

## Subsystem model and ownership

Raw Spec invalidation belongs to `useElementSignatures`. It compares retained structural snapshots and feeds `ElementRenderer` and error reset keys.

Resolved prop identity belongs to `ReactiveElementRenderer`. It compares the latest `resolveElementProps` output with the prior delivered props and supplies the shared result to `CatalogComponentBoundary`.

The core resolver remains pure and stateless. Moving cross-render identity ownership there would mix React lifecycle state into all renderers. The ownership lens found no second writer or missing consumer.

## Radius map

The Impact Map records 26 changed symbols, 52 impacted symbols, 5,185 edges and 18,459 unresolved calls. Thirty-three impacted entries have two or more reaching changed symbols.

The map was treated as under-covering because unresolved calls substantially exceed resolved edges. Lenses inspected convergence paths first, including `createRenderer`, the public renderer tests and the contract probe, then reviewed beyond the map. No finding was attributed to the map.

## Exemptions claimed

- No documentation update: public types already accept unknown prop values and existing docs promise transparent resolution. The diff repairs internal violations without adding an API or promise.
- Standalone `@json-render/react` typecheck diagnostics: all are in unchanged test files and are pre-existing. The dependency-aware repository typecheck passes all 59 tasks.
- Cyclic raw prop graphs and structural preservation of non-plain raw instances remain frozen unknowns. This change does not claim or broaden support.

## Issue candidates

None.

## Promotion boundary

No commit, push, PR update, thread resolution or external comment is authorized. Promotion requires explicit Hunter authority for:

- HEAD `dc035735521d2b0eefd3dcc3913002fec8d6eaa7`
- Production diff SHA256 `e6767688f6bc3a4305f56592ceec181156fbe8542e9dfc5418e2d021bd0c91d2`
- Probe SHA256 `6af1f038acf37d1dbbbfefae8e6b88bcca29d67031df6f861aa0f6c82261030b`
