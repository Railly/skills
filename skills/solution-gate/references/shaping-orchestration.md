# Shaping orchestration

Solution Gate wraps Shaping. It does not replace or fork its method.

## Ownership boundary

| Concern | Owner |
|---|---|
| Evidence-only Frame and settled product contract | Solution Gate |
| Requirements table and requirement status | Shaping |
| Shape generation, parts, alternatives, and flags | Shaping |
| R × Shape fit check | Shaping |
| Candidate contamination control | Solution Gate |
| Forward-risk tracing and refuting probes | Solution Gate |
| Updating shapes after evidence | Shaping |
| Failure-shape scoring and gate verdict | Solution Gate |
| Detailing, breadboarding, and slicing after pass | Shaping |
| Implementation correctness | Review Gate |

## Runtime contract

Invoke the available `shaping` skill. `allowed-tools: Skill(shaping)` expresses that dependency for runtimes supporting scoped skill permissions. Runtimes that ignore `allowed-tools` must still load and follow Shaping explicitly. If Shaping is unavailable, report the missing dependency instead of silently recreating a partial local version.

## Input adapter

| Solution Gate packet | Shaping artifact |
|---|---|
| Violated property and outcome | Frame |
| Observable success | R0 or another settled R |
| External product constraints | Settled R entries |
| Must-not-change workflows | Must-have R entries |
| Unknown facts | Undecided R entries or spikes |
| Temporal transition contract | R entries plus shape mechanisms |

Settled requirements remain settled across both passes. Derived requirements retain their source and start undecided until reconciled.

## Isolation contract

Each shaping reviewer receives the same frozen packet and base snapshot, no candidate material, and no other reviewer's output. Give each a separate working directory. Record runtime, model family, repository head, and artifact path.

## Output adapter

Read Shaping's native R table, shapes and parts, flags and required spikes, fit check and failure notes, and selected recommendation. Do not request the old Solution Gate proposal schema.

Derive predictions and costs from specific part identifiers during probing. Attach each result back to its source R or part.

## Evidence return loop

For every probe:

1. Identify the affected R or shape part.
2. Mark evidence `observed` with its command handle.
3. Invoke Shaping to update the mechanism, flag, or fit-check cell.
4. Preserve the prior shape in the audit trail.
5. Re-run the fit check after material changes.

Solution Gate cannot override a failed fit-check cell in prose. It reshapes, returns to the contract, or rejects the candidate.

## Stop boundary

Before the verdict, Shaping may create spikes needed to understand a mechanism. Do not breadboard or slice a shape that has not survived adversarial evidence.

After **Pass to detail**, Shaping resumes:

```text
selected shape → detail → breadboard → slice → implementation
```
