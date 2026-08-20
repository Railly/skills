# Case: Rejected docs read promise poisons shared cache

Status: evaluated
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-08-18
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: PR #387, review comment `discussion_r3807937625`, commits `7e10ff6` and `ed06dc0`

> Vercel Agent Review reported the defect. The contributor reproduced and fixed it; maintainer review remains pending.

## Observed condition or claim

The shared docs loader cached in-flight `readFile` promises by href. A rejected promise remained in the map permanently, so every later request received the same rejection without retrying the filesystem.

## Red signal

`pnpm --filter @portless/docs test -- --run src/lib/docs-source-retry.test.ts` failed because the second `loadDocsSource("/why")` call rejected with the first transient error instead of resolving. The mocked `readFile` was not called a second time.

## Method used

A controlled filesystem mock rejected the first read and delegated subsequent calls to the real `readFile`. The fix attaches a rejection handler that removes the cached promise only if the map still points to that same promise, preserving concurrent deduplication without deleting newer work.

## Outcome

The forced failure went red before the fix and green afterward. The full 12-test suite passed twice before commit, then passed on exact commit `ed06dc0`. The production Next.js build also passed.

## Evidence

- Source: `apps/docs/src/lib/docs-source.ts`, PR #387 review comment `discussion_r3807937625`
- Runtime: Vitest filesystem mock plus real fallback read
- Tests: `apps/docs/src/lib/docs-source-retry.test.ts`; 12 tests passed on `ed06dc0`
- Review: Vercel Agent Review recommendation `FIX`; maintainer review pending
- Artifact: `pnpm --filter @portless/docs build` passed on `ed06dc0`

## Transferable lesson

An in-flight promise cache may retain successful work, but a rejected promise must be evicted before the next attempt. Eviction should be conditional on identity so a late rejection cannot delete a newer promise for the same key.

## Exceptions

Permanent negative lookup results intentionally represented as resolved values are not failures and may be cached according to product policy.

## Candidate changes

- Reference rule: shared promise caches evict rejected entries by identity and carry a fail-once, retry-success regression test.

## Confidentiality review

All evidence is from a public repository, public PR, and public review comment. No private data or local-only identity is included.
