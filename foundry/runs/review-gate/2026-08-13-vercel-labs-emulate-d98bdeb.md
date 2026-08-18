# Review Gate: vercel-labs/emulate d98bdeb

Status: pass

Base: `2e49af2e91eae4377dbb3610b8bd2b0ac826daec`

Head: `d98bdeb3306c2036f64cc261425f55459643e82f`

## Scope

Prepare release 0.10.0 by bumping `emulate` and all 17 `@emulators/*` packages, moving the changelog release markers, and documenting PRs #191, #198, #199, and #200.

No Issue Contract was provided. The repository release instructions in `AGENTS.md` define the delivery contract.

## Deterministic checks

- Style: pass after replacing two em dashes in added changelog lines.
- Surface map: pass.
- Version synchronization: all 18 packages report 0.10.0.
- Release markers: exactly one start marker and one end marker.
- Publish list: all 17 `@emulators/*` directories are present in `EMULATOR_PACKAGES`, with no extras.
- Diff check: pass.
- Type-check: 34 of 34 tasks passed.
- Tests: 33 of 33 tasks passed.
- Build: 26 of 26 tasks passed.
- Format check: pass.
- Package substrate: 18 tarballs packed successfully and every tarball reports version 0.10.0.
- Registry precondition: `emulate`, `@emulators/github`, and `@emulators/stripe` remain at 0.9.0, so merging the bump will trigger the release workflow.

## Subsystem model

The release workflow reads the canonical version from `packages/emulate/package.json`, compares it with npm, builds the workspace, packs each package, publishes every package listed in `EMULATOR_PACKAGES`, and extracts GitHub release notes from the single marked changelog entry.

The release assumes three adjacent layers remain aligned: package directory enumeration, the workflow publish list, and the changelog marker pair. Each was checked directly.

## Lens results

- Substrate verification: pass. The packed artifacts, not only package source files, report 0.10.0.
- Docs-behavior parity: pass. Each release claim was checked against the merged PR title, body, and changed surface.
- Deliberate-default check: not triggered. No runtime default changes in this diff.
- All other catalog lenses: not triggered by a version and changelog-only release diff.

## Findings

No open findings.

## Exemptions claimed

- No force-red run. The diff adds no regression test or runtime behavior.
- No user-facing dogfood beyond package packing. The diff ships metadata and release notes, while the underlying features were already gated in their own PRs.
- Radius produced no changed symbols because the diff contains only JSON metadata and Markdown. Its high unresolved-call count is irrelevant to this release-only delta and was not used as safety evidence.

## Issue candidates

None.
