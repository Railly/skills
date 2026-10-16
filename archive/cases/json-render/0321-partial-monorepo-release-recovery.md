# Case: A monorepo release can publish all but one package

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: artifact verified
Upstream status checked: 2026-08-24
Visibility: public
Repository: vercel-labs/json-render
Role: maintainer
Source: https://github.com/vercel-labs/json-render/pull/321, https://github.com/vercel-labs/json-render/actions/runs/31950623188, https://github.com/vercel-labs/json-render/releases/tag/v0.20.0, release commit `ea4b361b9ff23bcab20286c4f559a5316f0e892b`

## Observed condition or claim

The `v0.20.0` workflow published 27 workspace packages but failed on `@json-render/directives` with npm `E404`. The workspace version and successful packages made the release look nearly complete, but the GitHub Release remained blocked and one public package was still on `0.19.0`.

## Red signal

Checking only `@json-render/core` reported `0.20.0` and would have produced a false success. Enumerating all 28 non-private package manifests showed `total=28 published=27 missing=@json-render/directives`. The previous directives version had a different publication path from packages already authorized for GitHub Actions OIDC.

## Method used

1. Enumerated every non-private workspace package instead of selecting a representative package.
2. Queried the exact target version for each package and recorded the missing member.
3. Compared npm publication identity and package-specific Trusted Publishing configuration.
4. Corrected authorization for the missing package.
5. Re-ran only the failed workflow jobs so the successful package checks remained available.
6. Re-enumerated all packages and verified the GitHub Release artifact.

## Outcome

The retry published `@json-render/directives@0.20.0`, completed all 28 public packages, and created GitHub Release `v0.20.0` on 2026-08-18. On 2026-08-24 npm reported `0.20.0` for `@json-render/core`, `@json-render/react`, and `@json-render/vue`; the release tag points to `ea4b361b9ff23bcab20286c4f559a5316f0e892b`.

## Evidence

- Source: release PR #321, workflow run `31950623188`, tag and release `v0.20.0`.
- Runtime: the first workflow published 27 packages and failed at `@json-render/directives`; the failed-job retry completed publication and release creation.
- Tests: not applicable to the npm authorization failure; repository CI belonged to the release PR, while artifact verification covered publication.
- Review: Hunter approved the release PR; `ctate` corrected the package publication configuration and the public workflow completed.
- Artifact: the recorded full enumeration returned `total=28 published=28 missing=none`; npm spot checks on 2026-08-24 returned `0.20.0` for core, React, and Vue.

## Transferable lesson

A monorepo release is a set of independently authorized artifacts. Verify every public package, not a representative package or the workflow's partial progress. When a retry can preserve successful publication checks, resume the failed jobs rather than start a run whose early version guard may skip the remaining artifact.

## Exceptions

This case does not claim all packages share the same npm Trusted Publishing configuration. It also does not claim that `v0.20.0` contains PR #323, which merged after the release tag.

## Candidate changes

- Deterministic check: enumerate all non-private workspace packages after a release and require the exact target version from the registry before declaring the release complete.

## Confidentiality review

All retrieval handles, package names, workflow state, commits, and release artifacts are public. No token, credential value, private discussion, local path, customer data, or internal environment identifier is included.
