# Case: Carry a shared repeat contract across every renderer

Status: reviewed
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: released
Upstream status checked: 2026-08-24
Visibility: public
Repository: vercel-labs/json-render
Role: maintainer
Source: https://github.com/vercel-labs/json-render/issues/252, https://github.com/vercel-labs/json-render/pull/319, merge commit `9f58a3caded38689a51135bce85a8383fee5f940`, release `v0.20.0`

## Observed condition or claim

Nested repeats could not address data relative to an enclosing repeat item. The shared `repeat.statePath` contract was consumed independently by runtime renderers, static renderers, structural validation, schemas, prompts, documentation, and package skills.

## Red signal

An early implementation exposed three cross-surface gaps: `{ "$item": "/" }` did not resolve to the enclosing item, all nine renderer schemas omitted `repeat`, and validation emitted duplicate issues for reused DAG nodes. A recursive traversal also needed an explicit cyclic-graph termination test.

## Method used

1. Defined strings as the unchanged root-path form and `{ "$item": string }` as the new relative form.
2. Moved interpretation into one resolver exported by `@json-render/core`.
3. Routed React, React Native, React Email, React PDF, Image, Ink, Solid, Svelte, and Vue through that resolver.
4. Tested empty and slash-prefixed relative paths, outside-scope use, nested samples, empty outer samples, reused DAG nodes, mixed scope reuse, and cycles.
5. Added a schema-parity test and updated prompts, docs, and skills.
6. Removed correct repeat resolution while retaining the regressions and observed nine failures before restoring green.

## Outcome

PR #319 merged with maintainer approval, closed issue #252, and was published in `v0.20.0`. The release changelog credits the original #256 contribution by `@tmchow`, and the merge commit preserves Trevin Chow as coauthor.

## Evidence

- Source: PR #319, source commit `f34f0713ae968facf9391bff82bf4eea18547039`, merge commit `9f58a3caded38689a51135bce85a8383fee5f940`.
- Runtime: the merged diff routes nine renderer families through shared repeat-path resolution.
- Tests: the final focused run passed 162 tests; the force-red mutation made nine new regressions fail before restoration.
- Review: the exact-head Review Gate passed; an independent Claude Sonnet review reported no blocking correctness or compatibility finding; GitHub records maintainer approval.
- Artifact: tag `v0.20.0` contains `9f58a3c`; its changelog names nested repeats, and npm reported `@json-render/core@0.20.0` on 2026-08-24.

## Transferable lesson

A shared data-path contract is not complete when only its type and primary renderer change. Give interpretation one owner, enumerate every runtime and static consumer, and use parity tests so schemas, validation, prompts, documentation, and renderer bridges cannot silently diverge.

## Exceptions

This case does not claim validation against the downstream SAP integration or its Swift adapter. It also leaves pre-existing `$bindItem` leading-slash behavior and zero-item output differences outside the delivered contract.

## Candidate changes

- Reference rule: when a shared spec field changes semantics, require one resolver plus an explicit parity sweep across every renderer, validator, schema, prompt, documentation, and skill surface.

## Confidentiality review

All retrieval handles, contributor identities, commits, checks, and release artifacts are public. No private discussion, local path, credential, customer data, or internal environment identifier is included.
