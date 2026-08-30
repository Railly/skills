# Compiled Knowledge Layer Slices

Selected shape: C, compiled knowledge graph with human-readable pages.

## Slice summary

| ID | Slice | Mechanisms | Observable demo |
|---|---|---|---|
| V1 | Compiled pilot | C1, C2.1-C2.3, C6.1 | Compile one evidence-rich skill and one gap-only skill, open the generated index and coverage report, then prove a broken relationship fails validation |
| V2 | Full catalog provenance | C1.2, C2, C6.2 | Open one audit table covering all 19 registered skills, with every match classified and every missing application shown as a gap |
| V3 | Case-to-pattern loop | C3 | Record a real case, link or create its pattern, regenerate projections, and show that no installable skill changed |
| V4 | Proposal and impact loop | C4 | Build one bounded proposal packet, evaluate one atomic candidate, reject it, and retrieve the preserved rejection while the active skill remains unchanged |
| V5 | Fail-closed governance and runtime boundary | C2.4, C5, C6.3 | Show CI rejecting unsupported maturity and an installed agent completing a task while the Foundry knowledge directory is unavailable |

## V1: Compiled pilot

### Outcome

The knowledge model works end to end on `review-gate` as an evidence-rich skill and `before-after` as a gap-only skill without requiring a full catalog backfill.

### Affordances added

| ID | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| U3 | P1.2 | pattern page | Pattern authoring surface | edit | → N3 | |
| U4 | P1.2 | skill provenance page | Skill provenance authoring surface | edit | → N3 | |
| U5 | P1.3 | terminal | `bun scripts/compile-knowledge.mjs --check` | invoke | → N3 | |
| U6 | P1.3 | generated index | Pattern and skill index | display | | |
| U7 | P1.3 | generated coverage | Pilot skill evidence coverage matrix | display | | |
| U8 | P1.3 | terminal | Validation result with exact failing relationship | display | | |
| N3 | P1.3 | knowledge compiler | Parse authored knowledge graph | call | → N4, → N5 | |
| N4 | P1.3 | knowledge validator | Validate relationships, safety, history, and maturity support | call | | → U8 |
| N5 | P1.3 | knowledge compiler | Write deterministic projections | call | → S6, → S7, → S8 | → U6, → U7 |
| S2 | P1.2 | `foundry/knowledge/patterns/*.md` | Initial authored patterns and typed relationships | | | → N3 |
| S3 | P1.2 | `foundry/knowledge/skills/*.md` | Provenance pages for `review-gate` and `before-after` | | | → N3 |
| S5 | P1.3 | `foundry/maturity.json` | Existing maturity claims joined during compilation | | | → N3, → N4 |
| S6 | P1.3 | `foundry/knowledge/index.md` | Generated progressive-disclosure catalog | | | → U6 |
| S7 | P1.3 | `foundry/knowledge/coverage.md` | Generated pilot coverage and gap report | | | → U7 |
| S8 | P1.3 | `foundry/knowledge/graph.json` | Generated machine projection | | | → N4 |

### Demo

Run the compiler, open `index.md` and `coverage.md`, verify that `review-gate` resolves to applied evidence while `before-after` exposes an explicit gap, then temporarily break one evidence path and show the validator fails before restoring it.

### Validation

- Generated projections are byte-stable across two runs.
- `--check` passes on the committed projection and fails when it is stale.
- Duplicate IDs, unknown relationship types, missing paths, and an unsupported public-private boundary fail with exact file context.
- Existing skill validation remains green.

## V2: Full catalog provenance

### Outcome

Every registered skill has one provenance page, and every existing textual match has been read and classified instead of inferred.

### Affordances added

| ID | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| U16 | P1.2 | catalog audit | Per-skill applied-evidence decisions and gaps | display | | |
| N11 | P1.2 | catalog audit workflow | Classify every skill-name match by reading its source | call | → S3, → S11 | → U16 |
| S3 | P1.2 | `foundry/knowledge/skills/*.md` | Provenance pages expanded from 2 to all 19 registered skills | | | → N3, → N6 |
| S11 | P1.4 | catalog audit decision record | Durable classification of applied, mentioned, planned, contradicted, or unrelated matches | | | → U16 |

### Demo

Open the audit decision table and generated coverage report. For any registered skill, follow one typed relationship to its source or see an explicit gap. Show that incidental name matches do not count as applications.

### Validation

- Exactly one provenance page exists for every maturity entry and active skill directory.
- Every evidence relationship resolves and declares its type.
- Every `dogfooded`, `evaluated`, or `validated` skill either has applied evidence or a visible mismatch awaiting correction.
- No maturity value changes automatically in this slice.

## V3: Case-to-pattern loop

### Outcome

A newly recorded case can reinforce an existing pattern, create a candidate pattern, expose a coverage gap, or produce no compiled change without directly editing a skill.

### Affordances added

| ID | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| U1 | P1.1 | record-a-case | Record-case request | invoke | → N1 | |
| U2 | P1.1 | case artifact | Case with knowledge disposition | display | | |
| N1 | P1.1 | record-a-case | Materialize evidence ledger | call | → S1, → N2 | → U2 |
| N2 | P1.2 | knowledge maintainer protocol | Classify knowledge disposition | call | → S2, → S3 | → U2 |
| S1 | P1.1 | `cases/` and `foundry/runs/` | Case schema extended with one explicit knowledge disposition and typed target | | | → N2, → N6, → N8 |
| S2 | P1.2 | `foundry/knowledge/patterns/*.md` | New evidence appended to an existing or candidate pattern | | | → N3, → N6 |
| S3 | P1.2 | `foundry/knowledge/skills/*.md` | Skill provenance updated only when the new case supports a typed relationship | | | → N3, → N6 |

### Demo

Run `record-a-case` on one real work item, select a knowledge disposition, validate the case and knowledge graph, and show the regenerated index. Confirm `git diff -- skills/` is empty.

### Validation

- The case validator requires exactly one allowed knowledge disposition.
- `link-existing` requires a valid pattern ID.
- `create-candidate` creates a non-promoted pattern with source evidence.
- `gap` and `no-change` remain valid durable outcomes.
- No case operation gains mutation authority over installed skills.

## V4: Proposal and impact loop

### Outcome

A maintainer can derive one atomic skill proposal from compiled knowledge, evaluate it through the existing protocol, and preserve the outcome even when rejected.

### Affordances added

| ID | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| U9 | P1.4 | terminal | Build packet for one skill | invoke | → N6 | |
| U10 | P1.4 | proposal packet | Bounded patterns, history, outcomes, and evidence | display | → N7 | |
| U11 | P1.4 | candidate diff | Atomic skill patch or no-action result | display | → N8 | |
| U12 | P1.4 | eval scorecard | No-skill, released, candidate, trigger, and transfer results | display | → U13 | |
| U13 | P1.4 | human gate | Accept, reject, absorb, or retain no change | decide | → N9 | |
| N6 | P1.4 | proposal packet builder | Select one skill's relevant compiled context | call | | → U10 |
| N7 | P1.4 | skill proposer | Produce one skill patch or no-action result | call | → S10 | → U11 |
| N8 | P1.4 | existing eval protocol | Run behavioral variants and transfer holdout | call | → S11 | → U12 |
| N9 | P1.4 | impact recorder | Append decision and update accepted provenance | call | → S4, → S3, → S9 | |
| S4 | P1.4 | `foundry/knowledge/impact.jsonl` | Append-only proposal identity, sources, metrics, decision, and supersession | | | → N3, → N6 |
| S9 | P1.4 | `skills/**/SKILL.md` | Active skill changes only after an accepted human decision | | | → N10 |
| S10 | P1.4 | Candidate skill workspace | Reversible atomic patch under evaluation | | | → N8 |
| S11 | P1.4 | Skill eval and round evidence | Observable candidate outcomes and human-reviewed decision inputs | | | → N9, → U12 |

### Demo

Build a packet for one skill, propose one patch, run the existing variant matrix, reject the candidate, then query the impact history. The rejection and diff identity remain visible while the active `SKILL.md` is byte-identical to its pre-proposal state.

### Validation

- One impact record targets exactly one skill and references at least one pattern or explicit no-action reason.
- Proposal IDs and diff identities are unique.
- Rejected candidates cannot change the active skill tree.
- Accepted candidates require eval evidence and a human decision handle.
- Transfer metadata records source and inference model or agent when available.

## V5: Fail-closed governance and runtime boundary

### Outcome

Knowledge provenance becomes an enforced catalog invariant, while installed execution remains independent from the Foundry memory.

### Affordances added

| ID | Place | Component | Affordance | Control | Wires Out | Returns To |
|---|---|---|---|---|---|---|
| U14 | P2 | agent interface | Consumer engineering task | invoke | → N10 | |
| U15 | P2 | agent interface | Agent result and evidence | display | | |
| U17 | P1.3 | CI | Fail-closed catalog provenance result | display | | |
| N10 | P2 | inference agent | Execute task with active installed skill only | call | → P3 | → U15 |
| N12 | P1.3 | existing CI workflow | Invoke knowledge validation with the catalog validators | call | → N3 | → U17 |
| S9 | P1.4 | `skills/**/SKILL.md` | Only active promoted procedure enters distribution | | | → N10 |

### Demo

Set a test fixture to `dogfooded` without applied evidence and show CI fail closed. Restore it, install one skill into a temporary agent directory without `foundry/`, run a representative task, and show the agent completes using only promoted procedure.

### Validation

- `validate-skills.mjs` invokes knowledge validation.
- CI rejects unsupported maturity, missing provenance pages, broken evidence links, and stale projections.
- Installer output contains active skill files and promoted references only.
- A real installed-skill run succeeds with no `foundry/knowledge/` path available.
- README, governance, source-of-truth, Foundry overview, and website projection agree on the new boundary.

## Sliced breadboard

```mermaid
flowchart TB
    subgraph V1["V1: COMPILED PILOT"]
        U3["U3: pattern authoring"]
        U4["U4: skill provenance authoring"]
        U5["U5: compile --check"]
        N3["N3: parse graph"]
        N4["N4: validate graph"]
        N5["N5: write projections"]
        S2["S2: patterns"]
        S3["S3: skill provenance"]
        S5["S5: maturity"]
        S6["S6: index"]
        S7["S7: coverage"]
        S8["S8: graph"]
        U6["U6: index display"]
        U7["U7: coverage display"]
        U8["U8: validation result"]
    end

    subgraph V2["V2: FULL CATALOG PROVENANCE"]
        N11["N11: audit catalog evidence"]
        U16["U16: audit decisions and gaps"]
    end

    subgraph V3["V3: CASE-TO-PATTERN LOOP"]
        U1["U1: record-case request"]
        N1["N1: materialize case"]
        S1["S1: cases and runs"]
        N2["N2: classify disposition"]
        U2["U2: case and disposition"]
    end

    subgraph V4["V4: PROPOSAL AND IMPACT LOOP"]
        U9["U9: build packet"]
        N6["N6: packet builder"]
        U10["U10: proposal packet"]
        N7["N7: proposer"]
        S10["S10: candidate patch"]
        U11["U11: candidate diff"]
        N8["N8: eval protocol"]
        S11["S11: eval evidence"]
        U12["U12: scorecard"]
        U13["U13: human decision"]
        N9["N9: impact recorder"]
        S4["S4: impact ledger"]
        S9["S9: active skill"]
    end

    subgraph V5["V5: FAIL-CLOSED AND RUNTIME BOUNDARY"]
        N12["N12: CI knowledge gate"]
        U17["U17: CI result"]
        U14["U14: consumer task"]
        N10["N10: inference agent"]
        P3["P3: target repository"]
        U15["U15: agent result"]
    end

    U3 --> S2
    U4 --> S3
    U5 --> N3
    S2 -.-> N3
    S3 -.-> N3
    S4 -.-> N3
    S5 -.-> N3
    N3 --> N4
    N3 --> N5
    N4 -.-> U8
    N5 --> S6
    N5 --> S7
    N5 --> S8
    S6 -.-> U6
    S7 -.-> U7

    S1 -.-> N11
    S5 -.-> N11
    N11 --> S3
    N11 --> S11
    N11 -.-> U16

    U1 --> N1
    N1 --> S1
    N1 --> N2
    N1 -.-> U2
    N2 --> S2
    N2 --> S3
    N2 -.-> U2

    U9 --> N6
    S1 -.-> N6
    S2 -.-> N6
    S3 -.-> N6
    S4 -.-> N6
    S6 -.-> N6
    S8 -.-> N6
    N6 -.-> U10
    U10 --> N7
    N7 --> S10
    N7 -.-> U11
    U11 --> N8
    S10 -.-> N8
    N8 --> S11
    N8 -.-> U12
    U12 --> U13
    U13 --> N9
    S11 -.-> N9
    N9 --> S4
    N9 --> S3
    N9 -->|accepted| S9

    N12 --> N3
    N12 -.-> U17
    U14 --> N10
    S9 -.-> N10
    N10 --> P3
    N10 -.-> U15

    V1 ~~~ V2
    V2 ~~~ V3
    V3 ~~~ V4
    V4 ~~~ V5

    style V1 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style V2 fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    style V3 fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style V4 fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    style V5 fill:#fff8e1,stroke:#ffc107,stroke-width:2px

    classDef ui fill:#ffb6c1,stroke:#d87093,color:#000
    classDef nonui fill:#d3d3d3,stroke:#808080,color:#000
    classDef store fill:#e6e6fa,stroke:#9370db,color:#000

    class U1,U2,U3,U4,U5,U6,U7,U8,U9,U10,U11,U12,U13,U14,U15,U16,U17 ui
    class N1,N2,N3,N4,N5,N6,N7,N8,N9,N10,N11,N12 nonui
    class S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11 store
```

## Slice grid

|  |  |  |
|:---|:---|:---|
| **V1: COMPILED PILOT**<br>✅ COMPLETE<br><br>• Pattern and provenance schema<br>• Compiler, validator, projections<br>• `review-gate` rich evidence<br>• `before-after` explicit gap<br><br>*Demo: compile and break one relationship* | **V2: FULL CATALOG PROVENANCE**<br>✅ COMPLETE<br><br>• 19/19 provenance pages<br>• 279 textual matches classified<br>• Unsupported gaps preserved<br>• Match fingerprints enforced<br><br>*Demo: inspect any skill from one coverage report* | **V3: CASE-TO-PATTERN LOOP**<br>✅ COMPLETE<br><br>• Schema 2 disposition contract<br>• Typed pattern, gap, or no-change target<br>• Real case reinforces an existing pattern<br>• Dogfood commit leaves `skills/` unchanged<br><br>*Demo: validate the case and regenerate the index* |
| **V4: PROPOSAL AND IMPACT LOOP**<br>⏳ PENDING<br><br>• Build bounded packet<br>• Propose one atomic patch<br>• Run existing eval protocol<br>• Preserve rejection history<br><br>*Demo: reject a patch without losing its lesson* | **V5: FAIL-CLOSED AND RUNTIME BOUNDARY**<br>⏳ PENDING<br><br>• Join provenance to maturity<br>• Add CI enforcement<br>• Verify installed package boundary<br>• Synchronize public docs<br><br>*Demo: unsupported maturity fails, installed execution works* |  |
