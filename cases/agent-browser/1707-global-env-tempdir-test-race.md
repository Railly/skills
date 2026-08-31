# Case: temporary config teardown terminated the parallel test harness

Status: reviewed
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-24
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: post-merge CI run `32417814158`, PR #1707, commit `04d64093db6f029d996ab04a8ba429bf7c722305`, merge commit `f9a6cc34212340dad62b114559f7a306c4be0707`

## Observed condition or claim

After PR #1669 merged, the Windows Rust job terminated during tests without reporting a normal failed test. The CA precedence test temporarily set the process-wide `AGENT_BROWSER_CONFIG` variable to a file inside a `TempDir`.

The test created its environment guard before its temporary directory. Rust drops local values in reverse declaration order, so the directory disappeared before the guard restored the environment variable.

## Red signal

A parallel `parse_flags` test could observe `AGENT_BROWSER_CONFIG` while it still pointed to the deleted file. The explicit-config error path calls `process::exit(1)`, which terminates the whole test process. The resulting CI signature was an abrupt harness exit rather than a named failing test.

The original contributor PR stayed green because its pull-request workflow skipped the cross-platform Rust jobs that later ran after merge.

## Method used

1. Read the failed Windows job and identified that the harness exited without a standard Rust test failure.
2. Traced the CA precedence test's environment mutation, temporary file lifetime, and local-variable drop order.
3. Traced missing explicit config handling to `process::exit(1)`.
4. Extracted the unchanged CA precedence rule into a pure resolver.
5. Replaced the environment and filesystem test with a six-cell precedence matrix.
6. Mutated the precedence rule to the known-wrong ordering and confirmed the matrix rejected it.
7. Ran the full Rust suite and the cross-platform workflow, including the Windows job that had failed after merge.

## Outcome

PR #1707 removed the shared environment and temporary filesystem dependency from this precedence test. It was approved by maintainer `@ctate` and merged on 2026-08-22.

The fork workflow passed the Windows Rust job and the Linux and macOS Rust jobs. The final local suite reported 1,145 passed and 101 ignored tests, plus two passing doctor CLI integration tests.

The fix covers this failure mechanism: a test-only global environment value outliving the temporary resource it names. It does not prove that every remaining `parse_flags` test is isolated from all process-wide environment races.

## Evidence

- Source: PR #1707; commit `04d64093db6f029d996ab04a8ba429bf7c722305`; merge commit `f9a6cc34212340dad62b114559f7a306c4be0707`.
- Runtime: GitHub Actions Windows Rust job `96921701494` in workflow run `32529238894`; Linux and both macOS Rust jobs passed in the same rerun.
- Tests: six-cell pure CA precedence matrix; full Rust suite, 1,145 passed and 101 ignored; two doctor CLI integration tests passed.
- Review: independent Fable 5 and Grok 4.6 challenge recorded in the Review Gate evidence; maintainer `@ctate` approved PR #1707 at commit `04d6409`.
- Artifact: Review Gate reports `foundry/runs/review-gate/2026-08-21-agent-browser-a7910f5.{json,md}`.

## Transferable lesson

A test that mutates process-wide state and points it at a temporary resource has two coupled lifetimes. Locking only the writer is insufficient when parallel readers do not take the same lock.

Prefer extracting the decision rule into a pure function and test its full precedence matrix without environment or filesystem state. If integration coverage must mutate global state, the guard must outlive every referenced resource and all readers must share the same isolation mechanism.

An abrupt test-process exit is also a diagnostic signature. When production parsing calls `process::exit`, a stale test-only environment value can kill the harness before the test framework names the offender.

## Exceptions

An integration test still needs real environment and filesystem state when the behavior under test is environment decoding, config-file parsing, or I/O failure handling. In that case, pure resolution coverage complements but does not replace the integration test, and process isolation is safer than relying on declaration order.

## Candidate changes

- Reference rule: tests that bind process-wide configuration to temporary resources must use a pure resolution seam or process-level isolation.

## Confidentiality review

Only public repository history, public pull requests, public CI identifiers, public maintainer review state, and sanitized technical evidence are included. No internal chat, customer data, secrets, local absolute paths, or employer-only context is present.
