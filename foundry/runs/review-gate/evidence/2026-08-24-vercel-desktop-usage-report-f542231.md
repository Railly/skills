# Vercel Desktop usage-report evidence

Target: `vercel-labs/vercel-desktop` at `f542231065fc63e7117c11197cb9498ba0cc7264`, based on `1ace17e0e528ac9c76b6593ce49f92b86e6a287f`.

## Test Strength

Behavioral dimensions:

- transport: Vercel CLI session or OAuth session;
- response: valid 30-day report, empty zero report, optional billing fields absent or present, malformed JSON, truncated transport, `truncated: true`, duplicate or invalid date, oversized metric, inconsistent totals;
- identity: current generation and key, old generation, changed durable `keyId`;
- auth: success, one 401 then successful refresh, refresh failure, refresh response after deadline;
- publication: usage report before or after hourly decoration, cache write success or failure.

The independent oracle was the merged Vercel API implementation in `vercel/api` PRs 87131, 87132, and 87145 plus the production response captured during Solution Gate. It establishes inclusive UTC dates, key filtering, daily zero filling, optional billed fields, and the report envelope.

Fix-absent mutations:

- Removing the durable key-target guard made the target-switch regression fail.
- Accepting a truncated report made the parser regression fail.
- Clearing `total_micros` in `failUsageReport` made the last-good regression fail with `expected 500000, found 0`.
- Each mutation was restored from the pre-mutation content and the suite returned green.

Real boundary exercised:

- Production `/ai-gateway/usage-report` supplied the response shape during Solution Gate.
- Native SDK fake process and fetch effects exercised the exact CLI argv, OAuth URL, headers, responses, timers, cancellation, and persistence boundary.
- The exact HEAD built as a ReleaseFast macOS executable.

## Resilience Audit

| Forced fault | Expected invariant | Evidence |
|---|---|---|
| OAuth refresh connection failure | Stop the cycle, mark the prior report stale, retain managed key | Regression passed |
| Truncated response | Reject publication and retain last-good report and key | Regression passed |
| Report deadline followed by late refresh | Cancel the cycle and never restart it | Regression passed |
| Old generation or changed key target | Ignore reply and retain current state | Regression passed |
| CLI report command failure | Retain last-good report and key | Regression passed |
| Keychain cache write failure | Keep coherent in-memory state; next refresh persists successfully | Regression passed |

Final verification:

- `zig fmt --check src/app.zig src/spend.zig src/tests.zig`
- `git diff 1c3d4c7...f542231 --check`
- `pnpm check`
- `pnpm test`: 181/181
- `pnpm build`: ReleaseFast macOS build succeeded
- deterministic Review Gate checks: style, surfaces, stale, siblings, callers, and timings passed

Conflict resolution verification:

- `main` includes PR #14's CLI-owned coding-agent setup.
- The only textual conflict was the adjacent `cli_agents_previewed` and `cli_usage_report_received` message declarations; both are retained.
- The resulting PR diff against `main` contains only `src/app.zig`, `src/spend.zig`, and `src/tests.zig`.
- All CLI-agent setup tests and all usage-report tests pass together in the 181-test suite.
