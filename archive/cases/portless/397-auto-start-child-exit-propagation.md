# Case: PR #397 successor propagates auto-start child failure

Status: evaluated
Validation: independently-validated
Human review: contributor-complete
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-08-25
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: PR #397 head `2ac1519`; branch `railly/portless-397-propagate-auto-start-failure`; commit `2a7509a`; `foundry/runs/review-gate/2026-08-25-portless-397-f1-2a7509a.json`

> Hunter authorized the narrow successor implementation, commit, and push. The code is pushed to an upstream branch, but no PR was created or updated, so maintainer acceptance and PR delivery remain pending.

## Observed condition or claim

PR #397 made privileged proxy elevation failures fatal in the child `proxy start` process. Interactive app auto-start launched that child synchronously, ignored its nonzero exit status, polled proxy readiness for about five seconds, then printed a second generic failure.

## Red signal

With a real child process and fake sudo status 23, the child printed its actionable privilege error immediately. The parent then waited through 20 readiness polls and printed `Failed to start proxy.`. The completed review measured 5.15 seconds; the regression birth run measured 5.70 seconds.

## Method used

The successor added one result partition at the parent seam: a non-null nonzero child status exits the parent immediately. Status 0 remains eligible for readiness discovery. Spawn errors and signals retain the existing immediate parent diagnosis.

The regression runs the built parent CLI with a real nested child process. A preload marks stdin interactive and process uid non-root; a PATH-prepended sudo executable exits 23. The test asserts nonzero parent exit, latency below two seconds, preserved child error, no duplicate parent error, and no persisted proxy state.

## Outcome

Exact commit `2a7509a` passed the Factory Loop:

- real macOS PTY failure exited 1 in 493 milliseconds with one actionable error
- real loopback success returned `X-Portless: 1` and stopped cleanly
- fresh Linux arm64 Debian/Node 24 build passed the three privileged-startup tests in 253 milliseconds
- full repository tests passed: 858 tests, one documented skip
- full E2E passed: 16 tests, two documented Python-fixture skips
- exact-head Review Gate and Before/After passed

The branch is pushed to `origin/railly/portless-397-propagate-auto-start-failure`. PR #397 remains at `2ac1519` because its protected ctate branch is not maintainer-modifiable. No new PR or external prose was created.

## Evidence

- Source: `packages/portless/src/cli.ts`, `packages/portless/src/cli.test.ts`, commit `2a7509a`
- Runtime: real macOS PTY, fake POSIX sudo process, real loopback TCP/HTTP, fresh Linux container
- Tests: focused regression; 858 repository tests; 16 E2E tests; call-site force-red and restored green
- Review: exact-head report `foundry/runs/review-gate/2026-08-25-portless-397-f1-2a7509a.json` passed its fail-closed validator
- Artifact: `foundry/artifacts/before-after/2026-08-25-portless-397-f1-before-after.html`

## Transferable lesson

A synchronous child result is a lifecycle boundary, not a readiness hint. Partition terminal child outcomes before polling shared state. Regression proof belongs at the parent user-facing process, because a direct child test cannot detect a parent that ignores the result and repeats the failure.

## Exceptions

- Windows cannot enter the changed sudo branch because `needsSudo` requires `!isWindows`.
- The repository CI workflow runs on `main` pushes and pull requests only. The authorized branch push received green Vercel checks but no GitHub Actions Linux or Windows run. Triggering those jobs requires a PR mutation, which was outside the authorized external boundary.
- Delivery remains `local` under the case schema because no PR contains this branch, even though the branch is remotely available.

## Candidate changes

- Reference rule: when a parent synchronously starts a child and then polls readiness, handle every terminal child result before polling; force-red at the parent CLI boundary.

## Confidentiality review

Public repository, public PR metadata, public branch, and sanitized technical evidence only. No private review text, local paths, personal files, or employer-internal context is included.
