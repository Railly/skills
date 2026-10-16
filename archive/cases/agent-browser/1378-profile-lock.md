# Case: Reproduce loud and silent subprocess failure modes

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [issue #1378](https://github.com/vercel-labs/agent-browser/issues/1378) · [commit](https://github.com/Railly/agent-browser/commit/a1a2edc48d2d666439c3dc708ea576716e77e07b) · [branch](https://github.com/Railly/agent-browser/tree/fix/profile-lock-collision)

> Unvalidated agent backfill. Claims and candidate changes require human review.

## Observed failure

Two sessions sharing a Chrome profile produced a generic early-exit error and an irrelevant `--no-sandbox` hint instead of identifying the profile lock collision.

## Red signal

Two real Chrome processes were launched against one temporary profile. Headless Chrome failed loudly with exit 21 and `ProcessSingleton` stderr. Headed Chrome delegated to the existing instance and exited silently with code 0, matching the misleading user-facing path.

## Method used

1. Inspect the real `SingletonLock` before changing error handling.
2. Reproduce both headed and headless modes.
3. Parse lock ownership and test process liveness before the launch retry loop.
4. Fail fast for a proven non-transient collision and retain a post-mortem race check.
5. Verify the error names the resource, owner PID, and remediation and removes the misleading hint.

## Outcome

The branch reports a directed profile-lock error, avoids pointless retries, ignores stale locks, and relaunches after the first session releases the profile. Unit and end-to-end tests passed and were falsified. No upstream PR was opened.

## Evidence

- Source: lock parsing, liveness probe, and preflight in the linked commit.
- Runtime: real Chrome produced distinct loud and silent collision modes.
- Tests: parser cases and `e2e_second_session_same_profile_reports_lock_collision` cover owner, old-hint absence, and successful relaunch.
- Artifact: release CLI exercised the shared-profile scenario.

## Transferable lesson

Before writing subprocess diagnostics, reproduce every supported launch mode. A loud mode may reveal the mechanism while the silent mode explains the user's misleading error.

## Exceptions

Lock formats and liveness semantics are platform-specific. Do not generalize the Unix lock parser to Windows without evidence.

## Candidate changes

- Exemplar: dual loud and silent failure modes plus fail-fast ownership diagnostics.
- Reference rule: place provably non-transient checks before retry loops.
- Coverage gap: Linux behavior and PID recycling were not exercised.

## Confidentiality review

The issue, source, branch, commit, profile fixture, and tests are public. No user profile data is included.
