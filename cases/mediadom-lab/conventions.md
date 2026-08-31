# mediadom-lab review conventions

Compiled from the root README, `packages/mediadom/README.md`, package scripts, and repository behavior.

## Surface map

```surfaces
packages/mediadom/src/cli.ts :: packages/mediadom/src/schema.ts, packages/mediadom/src/skills.ts, packages/mediadom/test
packages/mediadom/src/adapters/scribe-words.ts :: packages/mediadom/src/skills.ts, packages/mediadom/test
packages/mediadom/src/edl.ts :: packages/mediadom/src/cli.ts, packages/mediadom/test
fixtures/ :: fixtures/manifest.json, README.md
```

## House norms

- Runtime and package manager: Bun.
- Lint and format: Biome.
- The corpus stays private. Do not redistribute audio or paste transcript excerpts into artifacts leaving the machine.
- Tracked fixture sources are immutable inputs. Derived WAVs remain ignored and the manifest must match disk.
- JSON stdout stays parseable. Diagnostics go to stderr.

## Subsystem invariants

- The envelope owns edit boundaries. Transcript and word timestamps are observations, not snap points.
- Store read-modify-write operations hold the per-store lock and persist through atomic writers.
- Observation reads use the newest generation independently per layer unless the caller explicitly selects a generation.
- Existing EDL entries record historical intent and are not silently revoked or rewritten by a later bulk operation.
- Optional provider absence does not break unrelated operations or trigger a hidden fallback.

## Verification norms

- CLI contract changes drive the real Bun CLI across filesystem-backed stores, not only helper functions.
- EDL changes verify source immutability, repeated invocation, pre-existing state, and lock timeout behavior.
- Lexical behavior uses captured provider-shaped sidecars without private text and verifies persisted EDL output.
- `bun run typecheck`, focused Biome checks, the complete test suite, and `scripts/manifest.sh --check` are required.

## Gate-miss ledger

- 2026-08-21: `autocut` accepted `--lock-timeout` without acquiring the store lock. Frozen R5 and the schema claimed locking, but the initial lexical fix preserved the unlocked implementation. Closed by wrapping the whole current-layer/EDL read-modify-write in `withStoreLock` and a holder-child timeout regression.
- 2026-08-21: unit, mutation, receipt, and editorial gates all passed while real Cueva acoustic verification still failed with 17 flagged seams and 4.820 seconds retained silence. The gate missed composition between autocut and intentional lexical speech discards because it tested each mechanism separately. Closed only when a real edit-render-review-verify corpus run becomes mandatory and green.
