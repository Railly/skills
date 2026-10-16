# Review Gate: vercel-labs/emulate

Date: 2026-10-05
Repository: vercel-labs/emulate
Base: `main`
Head: `56acae77a4356b971e8335149898a067ae2ccfce`
Profile: standard
Skill revision: `git:da6286e`
Verdict: findings

## Execution

- Mode: sequential_isolated_pass
- Runtime receipt: none
- Degraded from: none
- Schema failures: 0
- Independence gap: standard profile; single reviewer pass, no cross-family challenge required

## Contract

- Path: https://github.com/vercel-labs/emulate/pull/278
- Spec status: not_applicable
- Acceptance reviewed: PR body

## Stage receipts

- Test Strength: not_triggered. Diff adds no runtime behavior; the fix-absent analog (stripping .fails and classifying failures) was run inside P1.
- Resilience Audit: not_triggered. No runtime durable side effects changed.
- Security Review: missing

## Verified properties

- P1: Every expected failure fails because the emulator lacks the behavior, not because of a harness bug. No TypeError, no outside-origin fetch, no setup crash among the 76.
- P2: Implemented behaviors pass. Matches CI build-and-test success.
- P3: Lockfile change is limited to the Blob pin. No unexpected package additions.

## Deterministic checks

- `git diff --check`: pass
- `type-check`: pass. tsc --noEmit
- `lint`: pass. 0 errors, 7 warnings
- `tests`: pass. 24 passed, 76 expected fail
- `CI`: pass. build-and-test and custom-consumer matrix green

## Judgment lenses

- test-validity: run
- dependency: run
- contract-drift: run
- security: skipped. test-only diff; emulator auth code unchanged
- surfaces: skipped. no packages/@emulators/vercel/src runtime path changed and no surface rule maps vercel

## Findings

- F1: confirmed, open. 'allows SDK get to stream a local emulator URL' (blob.test.ts:1434) can never pass via emulator work: @vercel/blob 2.8.0 get() throws 'Invalid URL: the URL does not point to a Vercel Blob store' for any hostname not ending in .blob.vercel-storage.com, before any request. It documents an SDK constraint, not a missing emulator feature, which contradicts the PR's 'remove fails as each behavior is implemented' contract. Evidence: Stripped .fails; failure message is the SDK BlobError from dist/index.js:125, not an emulator response.

## Gaps

None.

## Limits and provenance

- Author model: unknown (human author scotttrinh, write access)
- Reviewer model: claude-opus-5.5
- Same family: no
- Independent challenge: not satisfied. Standard profile.
