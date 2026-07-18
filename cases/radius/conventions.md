# radius review conventions

Project overlay for the review-gate skill. Bootstrapped 2026-07-18 from the repo's own docs (skills/radius/SKILL.md, skills/radius/references/tuning.md, vault ADRs 0001-0010 in `hunter-brain/04_Projects/_shaping/blast-radius-cli/docs/adr/`); the repo has no README/CLAUDE.md/AGENTS.md yet. Entries carry no authority beyond their provenance.

## Surface map

The skill doc IS the product contract: agents consume radius through `skills/radius/SKILL.md`, so any change to the output shape or CLI flags that the skill documents is not done until the skill agrees.

```surfaces
src/types.ts :: skills/radius/SKILL.md
src/cli.ts :: skills/radius/SKILL.md
src/impact.ts :: skills/radius/references/tuning.md
src/cochange.ts :: skills/radius/references/tuning.md
```

Provenance: bootstrap compilation of the SKILL.md sections "Reading an Impact Map" (documents `visibilityBoundary` fields and confidence semantics) and the CLI usage block, plus tuning.md's rule that ranking knobs are benchmark-governed. Expected acknowledgment for internal-only `impact.ts` changes: "no ranking knob or output semantics changed".

## House norms

- **Ranking knobs are never hand-tuned.** Any change to edge weights, decay, convergence boost, or co-change thresholds is fit against the SZZ ground-truth benchmark (`eval/rank-benchmark.ts`) and recorded in `skills/radius/references/tuning.md`. Provenance: tuning.md itself, after the first hand-tuning temptation on 2026-07-17.
- **Honest counters.** Every resolution gap (unresolved call, unmapped SCIP occurrence, unparsed macro body, stale semantic index) increments a `visibilityBoundary` counter; silently dropping a ref is a correctness bug, not an optimization. Absence of impact is not safety. Provenance: ADR 0003 (EXTRACTED/INFERRED provenance), slice-1/slice-2 gates (ADR 0009/0010).
- **Contract changes are additive-only.** `FileEntry`/`ImpactMap` consumers (review-gate step 2, the inspector Artifact, eval harness, `.radius/graph.json` stores already on disk in dogfooded repos) must keep working; a field removal or rename requires a store `version` bump plus reconcile migration.
- **Determinism.** Given a fixed source tree and a fixed SCIP index, the graph and map are byte-identical. No timestamps, no randomness in the graph path.
- **No native runtime deps.** Parsers and decoders are WASM or pure TS (web-tree-sitter, own protobuf wire decoder). A native module dies on every runtime bump (QMD/better-sqlite3 precedent, 2026-07). Vendored assets carry their upstream LICENSE next to them.
- **New language support enters through a force-red.** A language frontend is built against a recorded escape (a real reviewer miss the map must rank) and promoted only through a gate ADR with replay evidence. Provenance: ADR 0009 (1532 force-red), ADR 0010 (subsumption 78/78).
- Conventional commits; no Co-Authored-By; no em dashes in commit messages.

## Verification norms

- A frontend change re-runs the TS no-regression check (`test/cli-ts-regression.test.ts` golden contract) — the TS frontend funds the whole tool's credibility (pooled A/B n=53).
- Claims about agent-browser behavior are verified against the local checkout (`~/Programming/vercel-labs/agent-browser`), not from memory; SCIP claims against a real emitted index, not the scip.proto docs.

## Gate-miss ledger

(empty — no external review rounds recorded yet)
