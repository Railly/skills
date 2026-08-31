# Case: Ovation PR #8 repository and item triage

Status: reviewed
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-31
Visibility: public
Repository: vercel-labs/vercel-factory
Role: contributor
Source: https://github.com/vercel-labs/vercel-factory/pull/8; head `297e5a14179e6e20d482121340aad219554d1d5f`

## Observed condition or claim

PR #8 adds a dedicated repository Triage route and item-level triage. The selected contract requires GitHub authority, truthful partial versus complete coverage, serialized item publication, stale-generation fencing, failed-rerun preservation, reset-only clearing, and compatibility with existing workspace flows.

## Red signal

The prior branch head `b58fa27` conflicted with current `origin/main` `99e0364`. The first merge resolution also inherited current main's complete-only item copy while retaining the PR's reachable partial item-publication API. The `factory` Vercel preview lacked `BETTER_AUTH_SECRET`.

## Method used

Merged live `origin/main` into a disposable checkout, preserved upstream's hourly polling UI, and retained the PR's item publication path. Review found the partial-copy seam and a successor commit made item copy and counts derive from coverage state. PostgreSQL migrations, full suite, typecheck, lint, build, 25 repetitions, live GitHub-to-PostgreSQL retry, four mutations, Spec, Test Strength, Review Gate, and Before/After all ran before push.

## Outcome

Head `297e5a14179e6e20d482121340aad219554d1d5f` was approved and merged on 2026-08-26. Seven checks passed: both Socket checks, Vercel Agent Review, Vercel Preview Comments, docs, factory-gateway, and factory-webhooks. The `factory` preview failed after compilation and TypeScript because its deployment environment lacked `BETTER_AUTH_SECRET`; the same exact source built with disposable Better Auth values.

## Evidence

- Source: `origin/main` `99e0364b518a12c1abb7216930ec9c81bf8bcccb`; PR #8 head `297e5a14179e6e20d482121340aad219554d1d5f`.
- Runtime: PostgreSQL 16 with disposable test databases.
- Tests: 398 web tests pass; 11 store tests pass across 25 repetitions; four critical mutations fail at their intended assertions and restore green.
- Review: `foundry/runs/review-gate/2026-08-25-ovation-297e5a1.json` passes the Review Gate validator and exact-head coverage check.

## Transferable lesson

For a durable projection, resolving source conflicts is insufficient when two compatible mechanisms create a new semantic state. Reconstruct the union of producers and consumers, then force-red the presentation contract as well as the database protocol.

## Exceptions

The failed `factory` preview is not evidence of a code defect. Vercel completed compilation and TypeScript before page-data collection failed on absent deployment configuration.

## Candidate changes

- No change: the current factory-loop already invalidates downstream evidence after code or base changes and requires exact-head Review Gate coverage.

## Confidentiality review

Public repository, public PR metadata, and sanitized technical evidence only. No secrets, private review prose, local paths, personal files, or neighboring project identity are included.
