# Case: A fix can pass every check and still be unguarded — the partial-path fix and the regression test that never goes red

Status: candidate
Validation: independently-validated
Human review: received 2026-07-22 (maintainer round, four findings, raised before the fix)
Maintainer acceptance: pending
Delivery: PR open (draft; fix commit pushed 2026-07-22)
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1589
Upstream status checked: 2026-07-22

> Independently validated: a second reviewer on a different model family reproduced the fixed behavior end-to-end against real Chrome from a self-contained prompt, and in doing so surfaced a finding (the guardless regression test) that the first reviewer and the writer both missed.

## Observed condition or claim

A PR added persistent session-to-tab binding plus a `--pin-tab` strict mode to a CLI whose sessions share one Chrome over CDP. It carried a fix for a known failure ("event-discovered tabs steal the active tab") and shipped regression tests for that fix. A maintainer review round raised four findings against it. Two were real:

- **Partial-path fix.** The no-steal fix patched only the `Target.targetCreated` drain (which correctly registered a discovered tab without activating it). But under `Target.setAutoAttach { autoAttach: true, waitForDebuggerOnStart: true }`, new pages in a shared browser arrive through a *different* handler — `Target.attachedToTarget` — which still called `add_page` (activate + bind), stealing the active tab and overwriting the pin binding. The fix covered the door pages rarely come through and missed the one they use on every open.
- **Boundary drop.** Batch mode built its `--json` result object by hand and omitted the error `code`, so the new `tab_gone` code was machine-readable single-shot but silently dropped in batch; and the `--pin-tab` injection lived only in the single-command path, so `--pin-tab batch …` never pinned a running daemon and `--no-pin-tab` could not disable a sticky pin in batch.

The other two findings (pin applied too late; a gone bound tab silently recovers) were refuted at the source/manager layer and re-refuted end-to-end.

## Red signal

- Partial-path: a caller sweep showed the active-tab/binding sink had two writers; only one was in the no-steal fix. Reverting the fix and driving the `attachedToTarget` path with a pinned session moved the active target from the pinned id to the foreign id.
- Boundary drop: a real built CLI ran two sessions on one shared Chrome; session B closed session A's bound tab; `--json batch "get url"` returned `{"error":"tab_gone: …"}` with no `code` key, while the equivalent single command carried `"code":"tab_gone"`. With pin injection removed, `--pin-tab --json batch "tab list"` against a running unpinned daemon left `{session}.target` at `"pinned":false`.
- Guardless test (the case's core signal): reverting **only** the production fix in an isolated worktree left **both** shipped regression tests green. The unit test called a duplicated helper, not the production handler; the e2e passed because Chrome happened to deliver `Target.targetCreated` before `Target.attachedToTarget`, so it never executed the branch it claimed to guard.

## Method used

1. Ran a review gate on the diff: deterministic surface sweep (all mandated doc surfaces + MCP parity present), then focused lenses. A caller sweep to the active-tab sink surfaced the second, unpatched writer — the partial-path finding.
2. Fixed the partial path at the root, not the symptom: extracted a single `BrowserManager::register_discovered_page` that both the `targetCreated` and `attachedToTarget` handlers call, so neither can diverge on activation policy. Explicit commands (`tab new`, `window new`, `click --new-tab`) register their page before the attach event arrives, so they keep activating through their own path.
3. Fixed the boundary drop: batch now injects `pinTab` per command and preserves every non-null response `code`, matching the single-command path.
4. Ran a second, independent review gate on a **different model family**. First attempt ran it under the tool's low-friction sandbox flag, which blocks launching Chrome and binding sockets — it returned `status: incomplete` with the e2e slice named as an environment gap, never as a pass. Re-ran it unsandboxed (the trusted-repo bypass flag): it then forced every path against real Chrome.
5. The unsandboxed pass verified the two fixes end-to-end AND surfaced the guardless-test finding by force-reverting the production line in an isolated worktree and observing both tests stay green.
6. Closed the guardless test by pointing the regression test at the shared production function and proving force-red against the production revert (not an edited copy): reverting the internal `add_page_without_activation` call to `add_page` made the unit test fail with the exact steal (active target moved from the pinned id to the foreign id); restoring it returned green. Downgraded the non-deterministic e2e from a "#3 guard" to a documented smoke test rather than keep a test whose pass proves nothing.

## Outcome

- Both auto-attach handlers share one decision function; a discovered tab cannot steal the active/pinned tab regardless of which CDP event carried it.
- Batch mode carries `tab_gone` (and any future coded error) and applies/disables pin per command.
- The #3 regression test now binds to production code and was proven red under a revert of the production line.
- `cargo test`: 996 passed, 0 failed, 88 ignored; `fmt` and `clippy` clean; four pin-tab e2es plus the two new regression e2es pass against real Chrome.
- Why the misses happened: the original fix closed the sink writer it was looking at rather than enumerating every writer to that sink (the common path was the one it didn't touch). And the writer's own "red→green" was red on an edited duplicated helper and a non-deterministic e2e, not on a revert of the shipped line — so the test could pass forever while the contract silently drifted. A same-family reviewer and the writer both missed it; a cross-family reviewer, once given a real browser, caught it.

## Evidence

- Source: PR #1589; `cli/src/native/browser.rs` `register_discovered_page`; `cli/src/native/actions.rs` `Target.attachedToTarget` / `Target.targetCreated` handlers; `cli/src/main.rs` `run_batch`.
- Runtime: two-session shared-Chrome CDP repro for the batch `code` drop and the pin-injection drop, on a real built CLI; isolated-worktree revert of the production line for the partial-path steal and for the regression force-red.
- Tests: `test_register_discovered_page_untracked_target_does_not_steal_pinned_tab` (force-red proven against the production revert), plus real-Chrome e2es for foreign-tab non-steal, `tab new` activation, batch pin persistence, and `tab_gone` shaping.
- Review: one maintainer round (four findings, raised before the fix; two confirmed, two refuted); two independent gate passes on two model families, the second run unsandboxed against real Chrome.
- Artifact: signed fix commit pushed; pre-push clippy gate green.

## Transferable lesson

> When a fix changes behavior at one writer to a shared sink (an active-tab pointer, a "current" cache, a selected-target field), enumerate every writer to that sink and give each the same treatment. The fix often lands on the rare path while the common path — the auto-attach/re-discover/connect path that fires on every event — keeps the old behavior. Rank the paths by how often they fire, not by which one the diff happened to touch.

Secondary (the sharper one): a regression test has not been written until it has gone red against a revert of the **production** line it guards — not an edited copy, not a duplicated helper. A test that exercises a simulated branch, or an end-to-end test whose pass depends on non-deterministic event ordering, can stay green forever while the real contract drifts. Make the guard, the production path, and the test read from one shared function so there is no copy to diverge, and force-red by reverting the shipped code.

Third: an empirical reviewer is only empirical if its environment lets it run the empirical layer. A reviewer sandboxed out of launching the browser or binding a socket returns verification gaps, not passes — and those gaps must be reported as gaps. A cross-family second reviewer catches what a same-family reviewer and the writer share as blind spots, but only if it can actually run the code.

## Exceptions

- The partial-path fix relies on explicit commands registering their page before the `attachedToTarget` event drains; verified by reading each explicit-command path. The CDP event ordering (`targetCreated` before `attachedToTarget`) is empirically stable in this environment but not guaranteed by spec — the shared decision function is safe under either order (register-without-activate both ways), so correctness does not depend on the ordering, only the non-deterministic e2e's coverage did.

## Candidate changes

- Skill method: no change.
- Reference rule: **Sibling-sink coverage** lens (enumerate every writer to a shared sink the fix touches) — added to the review-gate catalog with this PR as provenance.
- Exemplar: this case, for the guardless-regression-test lesson.
- Deterministic check: none reliable — "does this test go red on the production revert" is not statically checkable; it belongs to step-4 force-red discipline.
- Eval: candidate — a fixture where a regression test passes with the production fix reverted, to measure whether a reviewer forces red against production vs. an edited copy.
- Coverage gap: none open.
- No change: not selected.

## Confidentiality review

Public repository (`vercel-labs/agent-browser`) and its public PR. Community contributors whose work the PR folds in are credited by their public handles in the PR's commit trailers, not here. The maintainer reviewer's identity and the internal channel that carried the four findings are omitted; the findings are described technically because they are now embodied in the public PR. No local absolute paths, secrets, or neighboring-project identity included.
