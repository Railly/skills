# Case: An adversarial pass on your own fix caught a panic risk a plain test suite could not

Status: candidate
Validation: independently-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1553
Upstream status checked: 2026-07-16

> Independently validated: a second, blind agent session reproduced the fixed behavior from a self-contained prompt, without access to this session's reasoning.

## Observed failure

Two unrelated but co-reported defects in the same CLI: `to_ai_friendly_error` rewrote any error whose lowercase text contained "element not found" or "no element" into one generic string, discarding the role, name, selector, or index the original error carried, and also catching unrelated WebDriver protocol errors like "No element in response" that have nothing to do with a locator miss. Separately, `find --help` and the MCP tool schema advertised find actions (`type`, `focus`, `uncheck`) that were never wired into the dispatcher, which returned a bare `Unknown subaction: type` for them, while a working, undocumented `text` action existed.

## Red signal

Ran the reported failing commands against a real build: a role-name miss and a name miss both returned the identical generic string in `--json`, with no code or match count. `find role button type --name Submit` against a real button returned `Unknown subaction: type` with no list of valid actions, wasting a full locator resolution before failing.

## Method used

1. Narrow the error-flattening match to the specific message-prefix family locator code actually produces (`element not found`, `no element found`, `no element at index`), verified by grepping every real message-producing call site in the codebase, and append the generic advice to the original message instead of replacing it, so the specific detail survives.
2. Align the documented find actions with the actual dispatcher (`click, fill, check, hover, text`) across the CLI help, the MCP schema, and three separate doc and skill files that all carried the stale list independently.
3. Move the action-validity check ahead of dispatch so an unknown action returns the valid list immediately.
4. Run an adversarial pass on the new diff before treating it as done: enumerate every new branch, wait, and contract the diff introduces, then validate each against a real build rather than reasoning about it.
5. The pass surfaced a self-introduced risk: the dispatch match's catch-all had become `unreachable!()`, correct only while a separate guard and the match arms stayed hand-synced. Forced the drift for real by adding a bogus value to the guard alone, rebuilt, and sent the command against a live daemon.
6. Observed the actual failure mode: the task panicked, the daemon process itself survived (`tokio::sync::Mutex` is not poisoned by a panicking holder, confirmed by sending a normal command immediately after and getting a clean success), but the caller got a bare connection EOF after five retries instead of any error message, a worse outcome than the bug being fixed.
7. Reverted the catch-all to a real `Err`, then had a second review pass catch that the "accepted actions" test asserted a literal list against itself and never touched the real guard or match arms; extracted a single shared constant and added a real end-to-end test that dispatches every accepted action against a live browser.
8. Fixed two more accuracy issues a third pass caught: a PR-description claim that the new end-to-end test ran under plain `cargo test` when it was in fact `#[ignore]`d and required a separate `--ignored` invocation, and an in-code comment narrating the panic investigation in past tense, which belonged in the PR description, not the source.

## Outcome

- Locator-miss errors now keep their role, name, selector, or index; WebDriver protocol errors that happen to contain "no element" pass through unenriched rather than getting misleading locator advice.
- Documented find actions now match what dispatches; an unknown action returns the valid list immediately, before any locator resolution runs.
- The `unreachable!()` was never reached in the shipped diff, but the safe-fallback fix is the actual deliverable of this case: the panic only existed for one build, during the pass that found it, and was fixed before any commit shipped it.
- `cargo test`: 954 passed, 0 failed, 84 ignored (including a real-Chrome end-to-end test run separately with `--ignored`); `clippy` and `fmt` clean.

## Evidence

- Source: PR #1553, `cli/src/native/browser.rs` `is_locator_miss` and `to_ai_friendly_error`; `cli/src/native/actions.rs` `execute_subaction` and the shared `FIND_ACTIONS` constant.
- Runtime: forced-drift experiment against a live daemon, comparing the panicking command's client-side error (connection EOF after five retries) against a normal command sent immediately after (clean success), proving the daemon process survives a single task panic under its actual `tokio::sync::Mutex` state guard.
- Tests: unit tests for the narrowed locator-miss prefixes and the WebDriver-error exclusion; a real end-to-end test that dispatches every entry in `FIND_ACTIONS` against a live browser, added specifically because the prior test only compared a literal list to itself.
- Review: three informal review passes, each with a concrete finding applied (the panic risk, the tautological test, two PR-description and comment accuracy issues); no maintainer review yet.
- Artifact: clean release build on every commit; live CLI verification against an isolated daemon session.

## Transferable lesson

> A fix that only proves the reported bug is gone can still ship a new failure mode of its own. Treat every new branch, guard, or "this can't happen" fallback the fix introduces as its own claim to test, and validate the worst case by forcing it, not by reasoning that it is unlikely: here, forcing a guard-and-match drift that "could never happen" showed the actual failure was a silent, misleading client-side timeout, not the assumed-safe fallback.

Secondary: a test that compares a hardcoded list to itself proves nothing about the code it is meant to guard; the guard, the message, and the test all need to read from one shared source of truth, or the test can pass forever while the real contract silently drifts.

## Exceptions

- The forced-drift technique only tells you what happens when the specific fault is triggered; it does not prove the fault is unreachable in practice, only what its blast radius is if it occurs.
- Not every `unreachable!()` deserves this treatment. It is worth the extra code when the alternative failure mode (a task panic under a shared lock) has an unknown or asymmetric cost compared to a plain error return, which was true here because the panic corrupted the client-visible error into something misleading.

## Candidate changes

- Reference rule (unfold Review or an adversarial-diff pass): for every `unreachable!()` or similar "this can't happen" fallback touched by a diff, force the condition once against a live instance of the system and observe the actual failure mode before accepting the invariant as safe.
- Reference rule (test review): a test that asserts a literal list matches an identically-typed literal list is not testing the production code path; require it to call through the real guard, dispatcher, or const the production code uses.
- Eval: given a diff that adds a validation guard ahead of a match with a separate catch-all, does the agent check whether the guard and the match arms are the same source of truth, or two lists that can drift?
- Coverage gap: no current check catches a PR description claiming a test ran under a command that would not actually execute it (an `#[ignore]`d test under plain `cargo test`); this was caught by a third human-style review pass, not by any tooling.

## Confidentiality review

Public. vercel-labs/agent-browser is a public repository; PR #1553 is public. Internal team chat coordinated the assignment of this work but is not quoted or referenced by channel. No local machine paths appear in this record.
