# Case: Opaque private pointers close the retrieval boundary

Case schema: 2
Status: evaluated
Validation: independently-validated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-08-29
Visibility: public
Repository: Railly/skills
Role: maintainer
Source: V1 and V2 precursor https://github.com/Railly/skills/pull/22 at `4b3203c`; implementation head `a7e38d32bb42392261a26c307438c0a1aa24363b`; local V3 procedure commit `9a6fb05`; `foundry/runs/review-gate/2026-08-29-skills-a7e38d3.json`
Knowledge disposition: link-existing
Knowledge target: pattern.drive-the-shipped-surface

> The pointer implementation and its exact-head review are retrievable in the V1 and V2 precursor pull request. This V3 case and compilation remain local; human review and maintainer acceptance are pending.

## Observed condition or claim

The compiled knowledge validator needed to preserve private evidence as a useful handle without publishing a local path, URL, credential, or free-form description. Early denylist variants looked safe in code and tests but admitted additional location-bearing syntax when probed as real input.

## Red signal

Independent review repeatedly produced accepted private values that still exposed retrieval details. The final mutation replaced the opaque grammar with `private:.+`; the local-path rejection corpus then failed because invalid pointers were accepted.

## Method used

The work used `record-a-case` at procedure commit `9a6fb05` after the implementation review. It bounded the lesson to the confidentiality mechanism, kept delivery separate from validation, selected one compiled disposition, and linked the case to an existing pattern instead of changing procedure. The validator comparison is explicit: legacy case text remains readable without inferred knowledge, while schema 2 rejects a missing, duplicate, invalid, or unbacked disposition.

## Outcome

Private evidence now accepts only `private:<system>:<id>`. Public evidence and decisions require tracked repository files inside their declared boundaries. The precursor pull request is open, mergeable, and green at `4b3203c`; this V3 case-to-pattern update remains local and has only local validation. The case reinforces the existing shipped-surface pattern because the decisive proof came from driving accepted and rejected values through the actual validator boundary.

## Evidence

- Source: Precursor pull request 22 at `4b3203c`, implementation head `a7e38d3`, local procedure commit `9a6fb05`, and the committed exact-head report.
- Runtime: Bun 1.3.11 on macOS arm64.
- Tests: 41 tests with 111 expectations passed on the implementation head; eight fix-absent mutations failed at their intended assertions and restored green.
- Review: Independent frozen-tree review returned pass with no findings after the boundary fixes; author and reviewer shared a model family, recorded as a limitation.
- Artifact: The precursor pull request's deterministic index, coverage, graph, and 277-pair audit had green GitHub validation and Vercel preview checks on 2026-08-29. The local V3 graph and 279-pair audit pass local checks only.

## Transferable lesson

When a value must preserve identity but hide location, validate the smallest opaque positive grammar at the real consumer boundary. A denylist of familiar path syntax is an incomplete model of the input space. Tests should prove rejected classes as well as the accepted token.

## Exceptions

Use repository-relative tracked paths when the evidence is intentionally public and directly retrievable. Use an approved private destination rather than an opaque token when the consumer truly needs the underlying private material. This case proves the pointer boundary, not access control for the private system named by the token.

## Candidate changes

- Reference rule: reinforce the existing shipped-surface pattern with positive-grammar and rejected-class evidence from the real validator boundary.

## Confidentiality review

The case contains only public repository, pull request, commit, command, and generated-artifact handles. It includes no local path, secret, private review text, customer data, or neighboring-project identity.
