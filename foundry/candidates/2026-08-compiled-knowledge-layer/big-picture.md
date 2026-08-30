# Compiled Knowledge Layer - Big Picture

**Selected shape:** C, compiled knowledge graph with human-readable pages

**Implementation:** V1 compiled pilot and V2 full catalog provenance are complete. V2 covers 19 of 19 provenance pages and 276 reviewed textual matches with drift fingerprints.

## Frame

### Problem

- Real work is recorded across cases, runs, rounds, candidates, conventions, and skill references, so recurring knowledge must be rediscovered.
- Skill provenance is not a first-class relationship. The maturity registry points to one decision but not the complete evidence, patterns, rejections, and gaps behind the skill.
- Textual skill-name matches cannot distinguish actual application from plans, references, or incidental mentions.
- Rejected and no-change proposals persist in individual rounds but are not compiled into reusable proposer memory.
- Loading the evidence corpus into executing agents would waste context and weaken confidentiality and procedure boundaries.
- Some registered skills have no explicit case linkage, and missing evidence must remain visible instead of being reconstructed plausibly.

### Outcome

- The Foundry has a canonical compiled knowledge layer between evidence and procedure.
- Every registered skill has an auditable provenance page covering cases, runs, rounds, patterns, accepted changes, rejected changes, and gaps.
- Cross-skill patterns compile repeated evidence without copying the full corpus into agent context.
- Executing agents receive promoted procedure only, while maintainers and proposers can progressively disclose compiled knowledge and selected evidence.
- Existing evals, transfer holdouts, maturity rules, confidentiality boundaries, and human promotion remain authoritative.
- Adoption proceeds incrementally without fabricated cases or a mandatory full-corpus rewrite.

## Shape

### Fit Check (R x C)

| Req | Requirement | Status | C |
|---|---|---|:---:|
| R0 | Convert recorded engineering experience into persistent reusable knowledge between evidence and executable skill procedure | Core goal | ✅ |
| R1 | Give every registered skill an auditable provenance record linking its source cases, applied runs, decision rounds, motivating patterns, and current evidence gaps | Must-have | ✅ |
| R2 | Require dogfooded, evaluated, or validated maturity to resolve to retrievable evidence that the method was actually applied, or expose and correct the unsupported claim | Must-have | ✅ |
| R3 | Preserve missing or ambiguous retrospective evidence as an explicit gap instead of fabricating a case or inferring application from a name match | Must-have | ✅ |
| R4 | Support many-to-many relationships so one pattern can inform multiple skills and one skill can be justified by multiple patterns and cases | Must-have | ✅ |
| R5 | Preserve accepted, rejected, absorbed, superseded, and no-change proposals with their rationale and evaluation outcome | Must-have | ✅ |
| R6 | Keep one canonical Foundry-only source of truth and prevent the full knowledge corpus from entering installed skill packages or target repositories | Must-have | ✅ |
| R7 | Give executing agents only active skill procedure while allowing maintainers and proposers to query compiled knowledge and selected source evidence | Must-have | ✅ |
| R8 | Keep the existing no-skill, released-skill, candidate-skill, transfer-holdout, and human-promotion gates authoritative | Must-have | ✅ |
| R9 | Preserve public and approved-private boundaries, store observable evidence rather than hidden reasoning, and reject secrets, private review text, customer data, and unsafe local context | Must-have | ✅ |
| R10 | Provide progressive disclosure through a concise index before a maintainer or proposer opens detailed patterns, skill provenance, cases, or runs | Must-have | ✅ |
| R11 | Validate missing links, invalid relationship types, unsupported maturity, duplicate identifiers, and stale generated projections deterministically | Must-have | ✅ |
| R12 | Support incremental backfill across the current catalog without requiring a full corpus rewrite before the first useful result | Must-have | ✅ |
| R13 | Represent contradiction, supersession, and staleness without deleting the historical evidence that produced an earlier conclusion | Must-have | ✅ |
| R14 | Make each proposed procedural change atomic to one skill and trace it to the patterns and evidence that motivated it | Must-have | ✅ |
| R15 | Allow cross-model or cross-agent transfer results to be recorded so model-specific workarounds do not silently become universal procedure | Nice-to-have | ✅ |

### Parts

| Part | Mechanism | Flag |
|---|---|:---:|
| **C1** | **Authored knowledge sources** | |
| C1.1 | Pattern pages store stable IDs, status, summaries, root causes, strategies, exceptions, typed evidence, affected skills, and history | |
| C1.2 | Skill provenance pages store evidence, patterns, decisions, and explicit gaps for every registered skill | |
| C1.3 | An append-only impact ledger records every proposed skill change, its inputs, eval outcome, human decision, and supersession | |
| **C2** | **Compilation and validation** | |
| C2.1 | A shared parser compiles authored pages and typed relationships into one in-memory graph | |
| C2.2 | A compiler writes or checks the compact index, coverage matrix, and machine graph | |
| C2.3 | A validator rejects invalid IDs, paths, relationships, public-safety boundaries, duplicate impacts, and unsupported maturity | |
| C2.4 | Existing catalog validation and CI invoke knowledge validation after backfill can land green | |
| **C3** | **Case compilation** | |
| C3.1 | `record-a-case` records link-existing, create-candidate, coverage-gap, or no-change as its knowledge disposition | |
| C3.2 | Case compilation edits knowledge sources but never an installable skill | |
| C3.3 | A name match becomes evidence only after its source is read and the relationship classified | |
| **C4** | **Atomic proposal and impact loop** | |
| C4.1 | A packet builder returns one skill's provenance, patterns, impact history, outcomes, and selected source evidence | |
| C4.2 | A proposer creates one skill patch or no-action result from the bounded packet | |
| C4.3 | Existing behavior, trigger, transfer, and human-review gates decide promotion | |
| C4.4 | Every outcome enters the impact ledger, while only accepted outcomes change the active skill | |
| **C5** | **Runtime and confidentiality boundary** | |
| C5.1 | Installed agents receive active skill procedure and promoted references only | |
| C5.2 | Public relationships contain public or sanitized handles; private evidence stays behind bounded approved pointers | |
| C5.3 | Observable commands, outputs, diffs, artifacts, and decisions are eligible evidence; hidden reasoning and secrets are not | |
| **C6** | **Incremental adoption** | |
| C6.1 | The first slice proves one evidence-rich skill and one gap-only skill | |
| C6.2 | The catalog audit creates every provenance page and classifies every textual match | |
| C6.3 | Fail-closed maturity enforcement activates only after the audit can land green | |

### Breadboard

```mermaid
flowchart TB
    subgraph P1["P1: Canonical Foundry checkout"]
        subgraph P1_1["P1.1: Evidence capture"]
            U1["U1: record-case request"]
            N1["N1: materialize evidence ledger"]
            U2["U2: case and disposition"]
            S1["S1: cases and runs"]
        end

        subgraph P1_2["P1.2: Knowledge authoring"]
            U3["U3: pattern authoring"]
            U4["U4: skill provenance authoring"]
            N2["N2: classify disposition"]
            N11["N11: audit catalog evidence"]
            S2["S2: pattern pages"]
            S3["S3: skill provenance pages"]
            U16["U16: audit decisions and gaps"]
        end

        subgraph P1_3["P1.3: Projection and validation"]
            U5["U5: compile --check"]
            N3["N3: parse graph"]
            N4["N4: validate graph"]
            N5["N5: write projections"]
            S5["S5: maturity registry"]
            S6["S6: index.md"]
            S7["S7: coverage.md"]
            S8["S8: graph.json"]
            U6["U6: knowledge index"]
            U7["U7: coverage matrix"]
            U8["U8: validation result"]
            N12["N12: CI knowledge gate"]
            U17["U17: fail-closed CI result"]
        end

        subgraph P1_4["P1.4: Skill proposal and evaluation"]
            U9["U9: build packet"]
            N6["N6: packet builder"]
            U10["U10: proposal packet"]
            N7["N7: skill proposer"]
            S10["S10: candidate patch"]
            U11["U11: candidate diff"]
            N8["N8: eval protocol"]
            S11["S11: eval and round evidence"]
            U12["U12: eval scorecard"]
            U13["U13: human decision"]
            N9["N9: impact recorder"]
            S4["S4: impact.jsonl"]
            S9["S9: active SKILL.md"]
        end
    end

    subgraph P2["P2: Installed agent runtime"]
        U14["U14: consumer task"]
        N10["N10: inference agent"]
        U15["U15: agent result"]
    end

    subgraph P3["P3: Target repository"]
        target["Requested engineering effect"]
    end

    U1 --> N1
    N1 --> S1
    N1 --> N2
    N1 -.-> U2
    U3 --> N2
    U4 --> N2
    N2 --> S2
    N2 --> S3
    N2 -.-> U2
    S1 -.-> N11
    S5 -.-> N11
    N11 --> S3
    N11 --> S11
    N11 -.-> U16

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
    N12 --> N3
    N12 -.-> U17

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
    S1 -.-> N8
    N8 --> S11
    N8 -.-> U12
    U12 --> U13
    U13 --> N9
    S11 -.-> N9
    N9 --> S4
    N9 --> S3
    N9 -->|accepted only| S9

    U14 --> N10
    S9 -.-> N10
    N10 --> P3
    N10 -.-> U15

    classDef ui fill:#ffb6c1,stroke:#d87093,color:#000
    classDef nonui fill:#d3d3d3,stroke:#808080,color:#000
    classDef store fill:#e6e6fa,stroke:#9370db,color:#000

    class U1,U2,U3,U4,U5,U6,U7,U8,U9,U10,U11,U12,U13,U14,U15,U16,U17 ui
    class N1,N2,N3,N4,N5,N6,N7,N8,N9,N10,N11,N12 nonui
    class S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11 store
```

**Legend:**

- Pink nodes are user-visible inputs and outputs.
- Grey nodes are workflows, scripts, validators, or agents.
- Lavender nodes are authored or generated state.
- Solid lines are control or writes.
- Dashed lines are returns or reads.

## Slices

### Sliced breadboard

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

### Slice grid

|  |  |  |
|:---|:---|:---|
| **V1: COMPILED PILOT**<br>✅ COMPLETE<br><br>• Pattern and provenance schema<br>• Compiler, validator, projections<br>• `review-gate` rich evidence<br>• `before-after` explicit gap<br><br>*Demo: compile and break one relationship* | **V2: FULL CATALOG PROVENANCE**<br>✅ COMPLETE<br><br>• 19/19 provenance pages<br>• 276 textual matches classified<br>• Unsupported gaps preserved<br>• Match fingerprints enforced<br><br>*Demo: inspect any skill from one coverage report* | **V3: CASE-TO-PATTERN LOOP**<br>⏳ PENDING<br><br>• Extend case schema<br>• Add knowledge disposition<br>• Link or create pattern<br>• Never mutate a skill<br><br>*Demo: record a case and regenerate the index* |
| **V4: PROPOSAL AND IMPACT LOOP**<br>⏳ PENDING<br><br>• Build bounded packet<br>• Propose one atomic patch<br>• Run existing eval protocol<br>• Preserve rejection history<br><br>*Demo: reject a patch without losing its lesson* | **V5: FAIL-CLOSED AND RUNTIME BOUNDARY**<br>⏳ PENDING<br><br>• Join provenance to maturity<br>• Add CI enforcement<br>• Verify installed package boundary<br>• Synchronize public docs<br><br>*Demo: unsupported maturity fails, installed execution works* |  |
