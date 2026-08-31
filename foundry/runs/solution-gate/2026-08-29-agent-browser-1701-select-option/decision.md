# Solution Gate: agent-browser #1701

## Status

Mode: candidate audit

Verdict: Pass to detail

Candidate verdict: absorb and recreate

Base: `fbd046c23a2c1156891bda294aaaee715c23b3f1`

Candidate: `f99e7fcd356345175ff5dde1c3e0ec5ea24846a1`

## Reviewer isolation

Two clean clones at the base SHA were created for blind shaping. The configured external reviewer runtime could read the frozen packet but did not complete either artifact. Direct Codex launches also failed because `AI_GATEWAY_API_KEY` was empty and Codex had no local login. No candidate material was present in either clone.

This run does not claim two independent completed reviewer passes. The gap is accepted because the discriminator probes made the viable mechanism mechanically narrow. The implementation and Review Gate must retain this as a verification gap and independently challenge the chosen shape.

## Reconciled requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | An option name displayed by the interactive snapshot can be passed back to `select` successfully. | Core goal |
| R1 | A human-readable ASCII-space spelling resolves an otherwise identical label containing non-breaking whitespace. | Must-have |
| R2 | Exact option values continue to resolve with their current case-sensitive semantics. | Must-have |
| R3 | A request that cannot be resolved fails loudly and leaves the current selection unchanged. | Must-have |
| R4 | Multiple requested values remain supported for native multiple-select elements. | Must-have |
| R5 | CLI and MCP behavior remain aligned through their shared native path. | Must-have |
| R6 | Snapshot option names remain readable and do not join words separated by non-breaking whitespace. | Must-have |
| R7 | The fix does not add unrelated case-insensitive matching. | Must-have |
| R8 | Resolution does not silently choose among multiple options that become indistinguishable only after fallback normalization. | Must-have |

## Shapes

### A: Widen select matching only

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Preserve the current snapshot representation. | |
| A2 | Match values, labels, and text through exact, whitespace-normalized, invisible-stripped, and case-folded forms. | |
| A3 | Compute matches before changing selection. | |

### B: Repair snapshot representation only

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Render NBSP as an ASCII space instead of deleting it. | |
| B2 | Keep existing exact select matching. | |

### C: Readable snapshot plus bounded fallback

| Part | Mechanism | Flag |
|---|---|:---:|
| C1 | Render NBSP as an ASCII space while continuing to remove true zero-width characters. | |
| C2 | Resolve each requested value by current exact case-sensitive value, label, or trimmed text first. | |
| C3 | Only when exact resolution misses, compare normalized label and text with whitespace collapsed and zero-width characters removed. | |
| C4 | Reject normalized ambiguity and any miss before mutating option state. | |
| C5 | Apply the complete resolved set once and dispatch the existing change event. | |

## Fit check

| Req | Requirement | Status | A | B | C |
|---|---|---|:---:|:---:|:---:|
| R0 | An option name displayed by the interactive snapshot can be passed back to `select` successfully. | Core goal | ✅ | ✅ | ✅ |
| R1 | A human-readable ASCII-space spelling resolves an otherwise identical label containing non-breaking whitespace. | Must-have | ✅ | ❌ | ✅ |
| R2 | Exact option values continue to resolve with their current case-sensitive semantics. | Must-have | ❌ | ✅ | ✅ |
| R3 | A request that cannot be resolved fails loudly and leaves the current selection unchanged. | Must-have | ✅ | ❌ | ✅ |
| R4 | Multiple requested values remain supported for native multiple-select elements. | Must-have | ✅ | ✅ | ✅ |
| R5 | CLI and MCP behavior remain aligned through their shared native path. | Must-have | ✅ | ✅ | ✅ |
| R6 | Snapshot option names remain readable and do not join words separated by non-breaking whitespace. | Must-have | ❌ | ✅ | ✅ |
| R7 | The fix does not add unrelated case-insensitive matching. | Must-have | ❌ | ✅ | ✅ |
| R8 | Resolution does not silently choose among multiple options that become indistinguishable only after fallback normalization. | Must-have | ❌ | ✅ | ✅ |

Notes:

- A fails R2 and R7 because case-folded forms widen established exact value semantics.
- A fails R6 because the snapshot continues joining words.
- A fails R8 because one normalized input may collect several options.
- B fails R1 because fixing display alone does not make ASCII spaces equal DOM NBSP.
- B fails R3 because the base mutates selection before reporting a miss.

## Probe evidence

| ID | Command or surface | Observed result | Affected requirement |
|---|---|---|---|
| P1 | Base binary, Chrome, snapshot of `Capital\u00A0Federal` | Combobox value retained NBSP; option row rendered `CapitalFederal`. | R0, R6 |
| P2 | Base binary, `select "CapitalFederal"` | Failed and changed selected value from `C` to empty. | R0, R3 |
| P3 | Base binary, `select "Capital Federal"` | Command reported success but selected value remained empty because no match was applied before the error check. | R1, R3 |
| P4 | Base binary, `select "C"` | Selected opaque value `C`. | R2 |
| P5 | Base binary, `select "Montevideo"` after selecting `C` | Failed and cleared `C`. | R3 |
| P6 | Base binary, labels `Alpha Beta` and `Alpha\u00A0Beta`, exact `Alpha Beta` | Exact ASCII label selected its own option. | R8 |
| P7 | Source trace from MCP `call_select` through CLI parser to native `select_option` | Both surfaces share the changed matcher. | R5 |

## Candidate reveal

The candidate contains reusable work:

- It adds `option.label` as a candidate source.
- It computes a wanted set before mutating.
- It adds a real-browser regression test.
- It preserves the existing error shape and change event.

The candidate mechanisms not carried forward:

- Case-insensitive fallback.
- Selecting every option produced by normalization without detecting ambiguity.
- Keeping NBSP deletion in snapshot output.
- Duplicating several overlapping raw, trim, collapsed, and stripped forms.
- Large explanatory source comments.

Credit plan:

`Co-authored-by: Mauricio Antolin <suscripciones@mauricioantolin.com>`

The replacement PR will name `@mauriantolin` and #1701 as the source contribution.

## Forward effects

1. C1 changes serialized option names from joined words to ordinary spaced words. Observed base rendering proves the current deletion point.
2. C2 preserves exact case-sensitive value behavior because fallback is not entered when exact matches exist. This must be force-red tested.
3. C3 makes ASCII space and NBSP labels equivalent without changing opaque values. This must be driven in Chrome.
4. C4 prevents the base miss-clears-selection defect and prevents normalized last-wins ambiguity. This must be tested for single and multiple selects.
5. C5 preserves event behavior and the common CLI/MCP implementation path. Source trace is observed; MCP command parity remains covered by existing delegation.

## Failure catalog

- S1 over-reach: designed out by excluding case folding and value normalization.
- S2 under-reach: covered with NBSP, zero-width, normal-space, miss, collision, and multi-select cells.
- S3 direction inheritance: snapshot-to-select and select-to-state directions are both tested.
- S4 proxy property: tests assert browser selection state, not matcher counts.
- S5 unregistered peer: not applicable, no persistent state.
- S6 peer-version blindness: not applicable, no cross-version protocol.
- S7 wrong layer: real Chrome and the command pipeline are exercised.
- S8 guard-derived cells: collision and exact-precedence cells come from the input domain, not the implementation branches.
- S9 test pins wrong thing: production matcher and snapshot call sites will each be mutated independently.
- S10 claim from prose: base and fixed behavior are driven against the built binary.
- S11 asymmetric validation: CLI and MCP converge before the changed function.
- S12 primitive-contract mismatch: exact matching and normalized fallback have separate acceptance rules.
- S13 invocation-state collapse: not applicable beyond the selection pre-state, which is explicitly checked after failure.

## Detail

Implementation slice:

1. Add one snapshot display normalization helper and focused unit coverage.
2. Replace the native selection loop with exact-first, normalized-fallback resolution.
3. Add one real-browser E2E covering snapshot output, normal-space selection, exact values, exact precedence, ambiguity, miss preservation, and multiple selection.
4. Run force-red mutations at both snapshot rendering and select call sites.
