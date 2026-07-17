# Case: An adversarial pass on your own fix caught a panic risk a plain test suite could not

Status: candidate
Validation: independently-validated
Human review: received 2026-07-16 and 2026-07-17 (maintainer; two rounds, five findings, all confirmed real and fixed)
Maintainer acceptance: pending (round-2 response pushed, CI green)
Delivery: PR open (round-2 fixes pushed 2026-07-17)
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1553
Upstream status checked: 2026-07-17

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
9. A maintainer review pass (2026-07-16) found two defects the three prior passes missed: the step-2 sweep left two more copies of the stale action list standing -- the root README and the eve extension's find tool (a package merged one day before the branch was cut), whose zod enum still offered `type`/`focus`/`uncheck` that the CLI rejects -- and the new e2e drift test could not catch the drift it was named for: an action added to `FIND_ACTIONS` without a match arm falls through to the internal-error fallback, whose message does not start with "Unknown action", the only thing the test asserted.
10. Fixed all three after merging main (v0.32.1, which carried the eve changes): aligned README and eve with the dispatcher (eve typechecks; `type` and `uncheck` remain reachable through eve's standalone fill and set_checked tools), and rewrote the drift test to assert `success == true` per action with a checkbox fixture for `check`. Proved the new assertion by forcing the exact drift (a bogus guard entry with no handler), watching the test go red on the internal-error message, then reverting.

## Outcome

- Locator-miss errors now keep their role, name, selector, or index; WebDriver protocol errors that happen to contain "no element" pass through unenriched rather than getting misleading locator advice.
- Documented find actions now match what dispatches; an unknown action returns the valid list immediately, before any locator resolution runs.
- The `unreachable!()` was never reached in the shipped diff, but the safe-fallback fix is the actual deliverable of this case: the panic only existed for one build, during the pass that found it, and was fixed before any commit shipped it.
- `cargo test`: 954 passed, 0 failed, 84 ignored (including a real-Chrome end-to-end test run separately with `--ignored`); `clippy` and `fmt` clean.
- Post-review (2026-07-16): README and eve now carry the real action set, the drift test asserts dispatch success and was proven red under forced drift, and the branch carries main at v0.32.1 via merge (no force push). 956 unit tests pass; clippy, fmt, and eve's tsc clean.
- Why the misses happened: the sweep fixed the copies of the action list it found rather than running one repo-wide search for the stale tokens and driving that to zero hits -- closure by enumeration, when the case's own "three separate files carried this independently" was already evidence the copy count was unbounded (a fourth surface, eve, had merged the day before). And the drift test's assertion was written against yesterday's observed failure ("Unknown subaction") instead of the invariant in its own doc comment; the `Err` fallback added in this same PR to defuse the panic is exactly what let it pass silently -- the safe fallback and the test meant to catch drift neutralized each other, and the test was never once run against the drift it was named for.

## Evidence

- Source: PR #1553, `cli/src/native/browser.rs` `is_locator_miss` and `to_ai_friendly_error`; `cli/src/native/actions.rs` `execute_subaction` and the shared `FIND_ACTIONS` constant.
- Runtime: forced-drift experiment against a live daemon, comparing the panicking command's client-side error (connection EOF after five retries) against a normal command sent immediately after (clean success), proving the daemon process survives a single task panic under its actual `tokio::sync::Mutex` state guard.
- Tests: unit tests for the narrowed locator-miss prefixes and the WebDriver-error exclusion; a real end-to-end test that dispatches every entry in `FIND_ACTIONS` against a live browser, added specifically because the prior test only compared a literal list to itself.
- Review: three informal review passes, each with a concrete finding applied (the panic risk, the tautological test, two PR-description and comment accuracy issues); no maintainer review yet.
- Artifact: clean release build on every commit; live CLI verification against an isolated daemon session.

## Transferable lesson

> A fix that only proves the reported bug is gone can still ship a new failure mode of its own. Treat every new branch, guard, or "this can't happen" fallback the fix introduces as its own claim to test, and validate the worst case by forcing it, not by reasoning that it is unlikely: here, forcing a guard-and-match drift that "could never happen" showed the actual failure was a silent, misleading client-side timeout, not the assumed-safe fallback.

Secondary: a test that compares a hardcoded list to itself proves nothing about the code it is meant to guard; the guard, the message, and the test all need to read from one shared source of truth, or the test can pass forever while the real contract silently drifts.

Third (from maintainer review): a test that exists to catch a specific drift has not been written until it has been forced red by that drift once. Asserting against the failure message already observed (the past bug) instead of the invariant (dispatch succeeded) left a third outcome -- the internal-error fallback added in this very PR -- that the assertion could not distinguish from success.

Fourth (from maintainer review): a contract duplicated across N surfaces is only aligned when a repo-wide search for the stale value returns zero hits. Fixing the copies you already know about is closure by enumeration; the number of independent copies already found is itself the signal that N is unbounded, and new packages merged since the branch was cut are part of N.

## Exceptions

- The forced-drift technique only tells you what happens when the specific fault is triggered; it does not prove the fault is unreachable in practice, only what its blast radius is if it occurs.
- Not every `unreachable!()` deserves this treatment. It is worth the extra code when the alternative failure mode (a task panic under a shared lock) has an unknown or asymmetric cost compared to a plain error return, which was true here because the panic corrupted the client-visible error into something misleading.

## Candidate changes

- Reference rule (unfold Review or an adversarial-diff pass): for every `unreachable!()` or similar "this can't happen" fallback touched by a diff, force the condition once against a live instance of the system and observe the actual failure mode before accepting the invariant as safe.
- Reference rule (test review): a test that asserts a literal list matches an identically-typed literal list is not testing the production code path; require it to call through the real guard, dispatcher, or const the production code uses.
- Eval: given a diff that adds a validation guard ahead of a match with a separate catch-all, does the agent check whether the guard and the match arms are the same source of truth, or two lists that can drift?
- Coverage gap: no current check catches a PR description claiming a test ran under a command that would not actually execute it (an `#[ignore]`d test under plain `cargo test`); this was caught by a third human-style review pass, not by any tooling.
- Reference rule (drift/invariant tests, from maintainer review): before accepting a test whose purpose is to catch a specific drift, introduce that drift deliberately once and confirm the test fails; a drift test that has never been red against its target drift is unverified. Assert the invariant (the operation succeeded), not the absence of one known failure message -- enumerate the other error paths that could reach the assertion and pass it.
- Reference rule (duplicated contracts, from maintainer review): when fixing a value duplicated across surfaces, finish with a repo-wide search for the stale tokens and require zero hits, explicitly including packages merged after the branch was cut; "I updated the N places I found" is not alignment.
- Eval: given a test asserting on an error-message prefix, does the agent enumerate the other error paths whose messages would also pass the assertion?

## Confidentiality review

Public. vercel-labs/agent-browser is a public repository; PR #1553 is public. Internal team chat coordinated the assignment of this work but is not quoted or referenced by channel. No local machine paths appear in this record.

## Round-2 delivery (2026-07-17)

The second maintainer round raised two findings plus a style note, all confirmed and fixed. Invalid find actions were validated only inside `execute_subaction`, which runs after locator resolution, and the daemon auto-launches before dispatch: the fix rejects unsupported actions at the dispatch entry before any browser work, keeping the inner guard as defense in depth. The "wrapped locator errors" finding was root-caused to the WebDriver engine: a genuine miss surfaces as the driver's "no such element" error payload, which `find_element` reduced to the protocol-shaped "No element ID in response", so the narrowed classifier (this PR's own change) stripped it of selector detail and guidance. The PR's own committed test asserted that pass-through as correct, which defeated two independent review passes; the payload now translates to the anchored "No element found by <strategy> '<value>'" form. Five ` -- ` comment-punctuation instances were cleaned.

One extra lesson: CI resolves rust stable at run time, and a stale local toolchain produced a false clippy green (needless_borrow on clippy 1.97 caught only in CI). Harvested to the [project conventions](conventions.md) as a pre-push toolchain rule.

Both rounds were used as the answer key for the review-gate blind-replication round ([foundry/rounds/002](../../foundry/rounds/002-review-gate-blind-replication/README.md)); every finding is now a deterministic gate, a lens, or a conventions entry.
