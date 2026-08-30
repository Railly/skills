# Test Strength: case-to-pattern loop

Date: 2026-08-29
Repository: Railly/skills
Head: `bbdf93c825b2cf4b3ba12bef17674fdb6af87912`
Status: contributor-validated

## Behavioral model

A schema 2 case must choose exactly one compiled-knowledge disposition and a typed target. The selected target must exist, satisfy the disposition's status constraints, and point back to the case through active supportive evidence. Legacy cases remain valid, partial schema 2 declarations fail, and case compilation must not mutate an installable skill.

| Dimension | Accepted class | Rejected classes | Evidence |
|---|---|---|---|
| Schema boundary | legacy case without knowledge fields, or complete schema 2 case | knowledge field without schema 2, unsupported schema | focused parser tests and repository validation |
| Disposition | exactly one of `link-existing`, `create-candidate`, `gap`, `no-change` | missing, duplicate, or unknown disposition | focused parser tests |
| Existing pattern | existing pattern plus active supportive backlink | missing pattern, path-only match, contradicted, superseded, or stale relationship | focused tests and exact-head mutations |
| Candidate pattern | existing candidate pattern plus active origin backlink | promoted pattern, missing source, inactive source relationship | focused tests |
| Gap | existing compiled gap | unknown gap identifier | focused tests |
| No change | target `none` | pattern or gap target | focused tests |
| Write boundary | authored case and compiled knowledge artifacts only | mutation of files under `skills/` by case compilation | dogfood commit diff and repository validation |

Excluded: automatically deciding which disposition is correct remains maintainer judgment. Promotion of a candidate pattern and mutation of an installable procedure remain separate governed actions.

## Independent oracle

- The case template and Record a Case procedure define the required authored contract independently of the parser branches.
- The compiled pattern and gap registries are the target-existence oracle.
- Active reverse relationships in authored knowledge are the evidence oracle for link and candidate dispositions.
- The Git diff between the pre-dogfood tree and dogfood commit is the write-boundary oracle.

## Fix-absent falsification

Mutations ran in isolated detached worktrees and were restored before the final run.

| Mutation | Intended red signal |
|---|---|
| Disable the guard that rejects knowledge fields without `Case schema: 2` | the partial-schema fixture became accepted and its assertion failed |
| Reduce reverse-link validation to path equality | contradicted and stale backlinks became accepted and their assertions failed |
| Remove the exactly-one-disposition invariant | duplicate disposition fixture became accepted and failed |
| Ignore candidate status and origin evidence | promoted or unsupported candidate targets became accepted and failed |
| Skip gap lookup | unknown gap target became accepted and failed |
| Accept arbitrary targets for `no-change` | non-`none` target became accepted and failed |
| Remove disposition from the real producer case | repository validation failed on the dogfood case |

After restoration, the focused suite passed 5 tests with 16 expectations. The complete validator suite passed 46 tests with 127 expectations.

## Real boundary and producer

The final boundary was the repository's real Markdown case corpus, compiled pattern and gap registries, and generated projections. The dogfood case `cases/skills/compiled-knowledge-pointer-boundary.md` reinforced `pattern.drive-the-shipped-surface`; the reverse relationship is present and active. The dogfood commit changed no file under `skills/` relative to its parent.

## Determinism and cost

The focused suite is deterministic and completed in 16 ms on the final tree. The full repository validation, projection freshness check, 279-pair textual audit, five behavior fixtures, website check, and static build passed without external credentials.

## Comparative skill eval

Three paired prompts compared the new procedure with the previous procedure for reinforce-existing, create-candidate, and gap-or-no-change cases. The new procedure scored 15/15 and the previous procedure 7/15, a 53 percentage-point gain. Timing and token measures were unavailable from the agent surface. Because the prompts named the intended disposition, this result demonstrates schema and validator compliance more strongly than independent disposition selection.

## Remaining gaps

- The paired eval does not yet measure whether an agent discovers the correct disposition from ambiguous evidence.
- Radius indexed no changed JavaScript symbols and reported 42 unresolved calls, so it supplies no safety claim.
- Three existing dogfooded skill pages still warn that they lack application evidence: Before After, Handoff, and Issue Intake.
