# Case: Framework parity needs a delivery matrix, not one happy path

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-24
Visibility: public
Repository: vercel-labs/json-render
Role: maintainer
Source: https://github.com/vercel-labs/json-render/pull/323, merge commit `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`

## Observed condition or claim

Vue catalogs could declare slot names, but the Vue renderer delivered only default children. A prior candidate proved the basic wrapped-registry path while leaving raw registries, laziness, diagnostics, loading, repeat ownership, and prompt advertising unguarded.

## Red signal

Solution Gate probes passed on the candidate, but its committed tests covered only the happy path through `defineRegistry` and nested-spec preservation. The missing matrix meant regressions could survive in alternative registry shapes and lifecycle states even though the central example stayed green.

## Method used

1. Recreated the candidate on current `main` while preserving `@wotnak` as coauthor.
2. Drove both raw registries and `defineRegistry` wrappers through mounted Vue components.
3. Tested consumed and unconsumed lazy slots, declared and undeclared names, `slots.default`, loading, owner repeat scope, nested conversion, diagnostics, and prompt output.
4. Kept catalog metadata as diagnostic authority only, so rendering does not depend on a process-local `WeakMap`.
5. Removed named-slot delivery while retaining the tests and observed five failures before restoration.

## Outcome

PR #323 merged with maintainer approval as `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`. Vue now delivers named content as native lazy slot functions for raw and wrapped registries, while default content remains `children` and named slots remain outside the repeat scope created by their owner.

## Evidence

- Source: PR #323, source commit `a34d63bc89f69dc96648de456f1b8c4c8d6e6abd`, merge commit `a4d033cf041e7b323ee10f196ef8a3ff2fc1f85f`.
- Runtime: mounted Vue tests exercise raw and wrapped registries, lazy slot consumption, loading, diagnostics, and repeat ownership.
- Tests: focused Vue renderer/hooks passed 36/36; the recorded repository run passed 1,069/1,069 tests, 59/59 type-check tasks, and 14/14 lint tasks; force-red made five tests fail.
- Review: the exact-head Review Gate passed with a same-family warning; GitHub records `ctate` approval and successful CI, Vercel Agent Review, security checks, and previews.
- Artifact: `origin/main` contained `a4d033c` on 2026-08-24. Tag `v0.20.0` points to its parent release commit and does not contain #323, so Vue named slots are not yet released.

## Transferable lesson

Framework parity requires a matrix across delivery shapes and lifecycle states. A wrapper happy path does not prove the raw registry, lazy consumption, loading behavior, diagnostic metadata, scope ownership, or generated prompt. Derive tests from those discriminators and force-red the common delivery seam.

## Exceptions

This case does not claim publication to npm or validation in an external Vue application. Raw registries without catalog metadata may omit slot-name warnings by design, while rendering remains equivalent.

## Candidate changes

- Behavior eval: when adding framework parity for a structural feature, require raw and wrapped delivery, lazy and unconsumed values, diagnostics, loading, scope ownership, conversion, and prompt output in one discriminator matrix.

## Confidentiality review

All retrieval handles, contributor identities, commits, checks, and review state are public. No private discussion, local path, credential, customer data, or internal environment identifier is included.
