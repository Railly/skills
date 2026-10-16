# Case: Structural child references cross every consumer

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: released
Upstream status checked: 2026-08-24
Visibility: public
Repository: vercel-labs/json-render
Role: maintainer
Source: https://github.com/vercel-labs/json-render/issues/39, https://github.com/vercel-labs/json-render/pull/320, merge commit `0f6798b1937bf8f4371fc38a83de95dbf7c6a0fd`, release `v0.20.0`

## Observed condition or claim

The spec represented structural descendants only through `children`, while component catalogs could already describe named slot capability. Adding `UIElement.slots` therefore affected more than React delivery: every consumer that traversed, validated, repaired, streamed, converted, exported, or navigated child references needed the same structural definition.

## Red signal

The first complete-looking implementation had two contradictions. Prompt output advertised `default` as a named slot while also instructing models not to emit `slots.default`, and `nestedToFlat` retained nested slot objects instead of converting them to element keys.

## Method used

1. Kept `children` as the default slot and represented only named content in `slots`.
2. Delivered named descendants through the React catalog boundary without inheriting the repeat scope created by their owning element.
3. Swept validation, reachability, autofix, streaming patches, nested conversion, code export, playground views, and Devtools navigation.
4. Separated prompt language for default children from non-default named slots.
5. Added regressions at the conversion and structural-consumer seams, then verified repository tests, type checks, lint, and previews.

## Outcome

PR #320 merged with maintainer approval, closed issue #39, and was published in `v0.20.0`. The release changelog credits the original #105 contribution by `@wotnak`, and the merge commit preserves `wotnak` as coauthor.

## Evidence

- Source: PR #320, source commit `973327588a3822d2dcd94b48306076a271fa895b`, merge commit `0f6798b1937bf8f4371fc38a83de95dbf7c6a0fd`.
- Runtime: the merged React renderer delivers default children and named slots through separate channels; named slots render outside the owner's repeat scope.
- Tests: the recorded final local run passed 1,061 tests, 59 type-check tasks, and 14 lint tasks; merged tests cover core structure, React rendering, streaming, nested conversion, codegen, and navigation.
- Review: GitHub records maintainer approval and successful CI, Vercel Agent Review, security checks, and previews. The pre-push independent reviewer did not complete, so validation remains contributor-validated.
- Artifact: tag `v0.20.0` contains `0f6798b`; its changelog names React named slots, and npm reported `@json-render/react@0.20.0` on 2026-08-24.

## Transferable lesson

When a data model gains another structural edge, search for consumers of the old edge rather than only consumers of the new field. Traversal, repair, serialization, streaming, conversion, code generation, inspection, and runtime delivery all carry structure, and each can silently drop the new branch.

## Exceptions

The release adds React runtime support, not renderer-wide named-slot parity. Vue support merged later in #323. External visual validation and downstream integration validation were not recorded.

## Candidate changes

- Reference rule: model every structural edge as a shared child-reference family and sweep every traversal, repair, conversion, streaming, export, inspection, and runtime consumer when the family expands.

## Confidentiality review

All retrieval handles, contributor identities, commits, checks, and release artifacts are public. No private review text, local path, credential, customer data, or internal environment identifier is included.
