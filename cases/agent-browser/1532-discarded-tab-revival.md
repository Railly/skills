# Case: Revive a discarded tab on switch without losing live-tab state

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: changes-requested (round-2 points addressed in rounds 3-6, re-review pending)
Delivery: PR open (branch head 0cfb8a6)
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1532
Upstream status checked: 2026-07-21

> Contributor-validated: the unit suite, clippy 1.97, and a real-Chrome plus mock-daemon dogfood were run against the pushed artifact. Maintainer re-review of the review-response commit is pending.

## Observed failure

Switching to a tab discarded by Chrome's Memory Saver waited for the CDP timeout and left the active index pointing at a dead renderer, stalling later commands behind the daemon state lock (#1528). @ctate reviewed the first fix and raised four notes: the probe could misread a slow-but-live tab and silently reload it, losing page state; Page.reload could still wait the full 30s; a cancelled probe left a pending CDP request; the reload behavior was undocumented.

## Red signal

Mock-CDP regression tests over the real BrowserManager: a discarded tab (renderer-bound commands unanswered until recovery) must revive on switch; an unrevivable tab must fail fast without poisoning the active index; a responsive tab must not be reactivated; a cancelled probe must leave the pending map empty. The leak test has teeth: with the drop guard disabled it reports one orphaned entry, with it enabled zero. A real-Chrome dogfood confirmed the recovery mechanism's behavior on genuinely discarded and on live targets.

## Method used

1. Reproduce each review note as a deterministic red (mock-CDP test or a code trace).
2. Replace the recovery action. Use Target.activateTarget instead of Page.reload: activation reloads a genuinely discarded tab (its renderer is gone) but only focuses a live one, so a probe false positive cannot lose page state.
3. Bound the recovery. activateTarget is browser-level, answers promptly, and is wrapped in a 10s timeout, so it cannot ride the 30s renderer-command ceiling the way a page-level reload could.
4. Make send_command cancellation-safe with a drop guard so a probe cancelled by its outer timeout does not leak its pending entry.
5. Surface recovery as `revived: true` (in --json, MCP structured output, and the default CLI line) and document it in the README.
6. Validate the pushed artifact: unit suite, clippy 1.97, and a real-Chrome plus mock-daemon dogfood.

## Outcome

- Patch: one squashed commit on PR #1532, superseding the earlier Page.reload approach.
- Recovery mechanism: Target.activateTarget, the approach #1036 and chrome-devtools-mcp #1230 independently converged on.
- Real Chrome 150: switching to a genuinely discarded tab revives it in ~3.4s with `revived: true`, and a follow-up command returns in ~10ms. Activating a live target fires no navigation and preserves its JS state.
- Also fixed three clippy 1.97 lints (`question_mark`, `useless_borrows_in_formatting`) that were failing the Rust CI check.
- Maintainer acceptance: four review notes addressed; re-review pending.

## Evidence

- Source: PR #1532 squashed commit. `browser.rs` `ensure_renderer_alive` (short probe, Target.activateTarget recovery, bounded), `client.rs` `PendingGuard`.
- Runtime: real Chrome 150 raw CDP — activateTarget on a discarded target fires `frameNavigated`/`loadEventFired` (~508ms); on a live target fires no navigation and `window.__marker` survives. Built binary: discarded-tab switch revived in 3.36s, follow-up eval 0.01s. Mock daemon with a 35s recovery stall: switch stays bounded, not the 30s ceiling.
- Tests: four mock-CDP regression tests (revive, fail-fast-without-poisoning, responsive-not-revived, cancelled-probe-no-leak); the leak test verified red with the guard disabled.
- Review: @ctate's four notes, each mapped to a fix.
- Artifact: built debug binary driven against real Chrome and against a mock CDP daemon.

## Transferable lesson

> When fault detection must be a heuristic because no reliable signal exists, pick a recovery action that is non-destructive on a false positive. Target.activateTarget recovers a dead renderer but only focuses a live one, so misclassifying a slow-but-live tab costs nothing, whereas Page.reload would destroy its state. Making the false positive harmless is stronger than tuning the detector to misfire less often.

Secondary: verify a "no signal exists" claim against the full API surface before relying on it. The "CDP exposes no discard marker" claim held only after checking Target.getTargetInfo, not just Target.getTargets.

## Exceptions

- When the recovery action's side effects are unacceptable. activateTarget brings the tab to the foreground; that fits a tab switch, where the user is moving to it, but not a background revive.
- Headless. activateTarget's foreground semantics were not verified without a visible surface. Memory Saver discard is primarily a headed or connect-to-real-Chrome scenario.

## Candidate changes

- Reference rule (unfold Change/Review): run an adversarial pass over the change's own new failure modes, and prefer a non-destructive recovery for a heuristic-detected fault. Promoted to skills/unfold/references/change.md (step 4) and review.md (step 1). Evidence pair: #1528 shipped four regressions without this pass; applying it on the #1036 connect fix self-caught an untested concurrent pending-request leak (a join_all fan-out re-ran the single-path #1528 leak) before review, plus an honestly-stated residual verified against real Chrome.
- Coverage gap: the connect path (#1036) still hangs when a discarded tab is first in getTargets order. Against a mock, connect attaches all targets and enable_domains rides the retry amplifier (~2.5 minutes). A lazy-attach connect fix is the complement and is out of scope for this PR.
- Deterministic check: none committed; the regression lives as the four tests.
- Eval: a fix that adds a probe-with-timeout plus a recovery action should be tested for (a) a probe false positive, (b) a recovery that stalls, and (c) cleanup of the cancelled probe.
- No change: the liveness probe stays a short timeout because false positives are now harmless.

## Round 2 (2026-07-18, changes requested again)

Three maintainer findings on the review-response commit, harvested to the [gate-miss ledger](conventions.md):

1. The liveness probe misclassifies live tabs with open `confirm()`/`prompt()` dialogs as discarded (reproduced in Chrome by the maintainer). A modal dialog pauses the renderer main thread, so `Runtime.evaluate` never answers; the switch then fails on a live tab. The input class was discoverable from the repo's own `dialog accept/dismiss` commands.
2. A failed switch preserves the old tab's index but wipes its refs and frame context: `handle_tab_switch` (`actions.rs`) clears `ref_map`/`iframe_sessions`/`active_frame_id` before delegating, which was benign while the switch could only succeed or hang. The fix's fail-fast path made the pre-cleared state user-visible. Spawned the "New-failure-outcome propagation" lens.
3. Reload risk and the `revived` result need full CLI, skill, and docs coverage, not README plus one flagged surface. Closed by keying `browser.rs` in the conventions surface map.

Blind replication (2026-07-18, gpt-5.6-sol via `codex exec`, neutral prompt, no knowledge of the maintainer's notes): converged on all three maintainer findings, including the same dialog repro chain and the same `actions.rs:4856` wipe line. It also surfaced two findings nobody had: `tab_close` commits the successor and calls `enable_domains` with no recovery (`browser.rs:1245`, code-trace confirmed, the original #1528 stall through a second entry point), and the connect-path first-target gap (already recorded above as the #1036 residual). Its evidence source for the dialog finding was the repo's own comments (`actions.rs:1775` documents dialog-blocking; `:1791` deliberately allows `tab_switch` during dialogs), reachable only by walking callers outside the diff. It did not see the `waitForDebuggerOnStart` merge interaction, since it reviewed the branch as-is, not against moved main; the two reviews are complementary, supporting the different-model-reviewer rule.

Open engineering question for the next loop: the same-day gate run flagged the post-#1546 merge interaction (`waitForDebuggerOnStart: true` can leave a revived renderer paused, blocking the second probe), which is the same blocked-but-alive family as finding 1; a fix should handle both with one mechanism (e.g. treat only probe timeout with no dialog open and no pending attach pause as discard, or probe via a browser-level signal like `Target.getTargetInfo` before declaring death).

## Rounds 3-6 (2026-07-20/21): the three round-2 findings closed

Branch was rebased onto `v0.32.3` (a mistake: the house norm is merge-not-rebase after review started; corrected by resetting to the original commit hashes, merging `upstream/main`, and re-applying the fixes, so the commits the maintainer reviewed keep their SHAs). Final head `0cfb8a6`, all commits pushed.

Each round-2 finding, with evidence:

1. Dialog-blocked misclassification (round-2 finding 1) — CLOSED. `ensure_renderer_alive` returns a three-state `RendererState` (`Responsive`/`Revived`/`DialogBlocked`); the daemon computes the target tab's dialog state from `pending_dialog.session_id` (fresh: `execute_command` drains CDP events before dispatch) and threads it in. A dialog-blocked tab short-circuits before activation, and the switch falls back to cached url/title so it does not hang on `get_url`/`get_title`. Red test: `test_tab_switch_does_not_misclassify_dialog_blocked_tab` (asserts `dialogBlocked`, no reactivation; verified red without the short-circuit).
2. Failed switch wipes refs/frame (round-2 finding 2) — CLOSED. `handle_tab_switch` clears `ref_map`/`iframe_sessions`/`active_frame_id` only after `tab_switch_by_id` succeeds. The same clear-before-fail defect was later found and fixed in `handle_tab_close` too (round 6, below).
3. Reload/revived coverage (round-2 finding 3) — CLOSED. `revived`, `dialogBlocked`, and `activeTabRevived` each appear on the default CLI line, `--json`, MCP, README, `skill-data/core/SKILL.md`, `skill-data/core/references/commands.md`, and `docs/src/app/commands/page.mdx`. Surface and sibling gates green.

Review-gate reviewer arm (codex/gpt-5.6-sol, different family from the writer) across rounds 4-5 found defects the writer's own pass missed, each fixed:

- HIGH: `tab_close` committed the close then let successor revival return an error, so a completed close reported failure and a retry said the tab was gone. Fixed: successor revival and `enable_domains` are best-effort; a committed close never fails. Red test: `test_tab_close_succeeds_even_if_successor_unrevivable`. Also `test_tab_close_revives_discarded_successor` asserts `activeTabRevived`.
- MEDIUM: with streaming enabled, `handle_tab_switch` ran a viewport-sync `Runtime.evaluate` on the target after committing, stalling on a dialog-paused renderer; skipped when `dialogBlocked`.
- MEDIUM: probe-failure wording claimed "discarded or crashed" though a paused renderer produces the same non-response; neutralized to "not responding".

Round 6 (self-run lens pass; codex hung twice on `codex exec`, so the six catalog lenses were run by the writer): found one new defect via the new-failure-outcome lens applied to `tab_close` — `handle_tab_close` cleared refs/frame before `tab_close_by_id`, so a rejected close (last tab, out-of-range index) wiped the caller's refs without closing anything. Fixed the same way as the switch path (clear only after success). This is the round-2 finding-2 mechanism recurring at a sibling entry point.

F5 (`waitForDebuggerOnStart` revive race) not reproduced as a blocker: `waitForDebuggerOnStart` browser-level auto-attach is installed only with a domain filter or proxy auth (`install_active_network_controls` returns early otherwise), a discard preserves the CDP session, and an isolated Chrome 150 raw-CDP run showed `Target.activateTarget` on an existing target fires zero re-attach events, so no fresh `waitingForDebugger` pause is introduced. Verification gap: a genuine Memory-Saver discard under a filter was not forced end-to-end this session.

## Transferable lesson (rounds 3-6)

> Turning a hang into a returnable error is not one caller's fix; it is a family. Every entry point that mutates caller state before delegating (switch and close both cleared refs/frame; both committed destructive work before a fallible step) must move the mutation after the commit and make post-commit recovery best-effort. Fixing only the reporter's entry point leaves the same defect at its siblings. A different-model reviewer arm earns its place here: it found a flaw in the writer's own fix (the close reporting failure after committing) that the writer's pass missed.

Smallest destination: `reference rule` — extends the existing new-failure-outcome-propagation gate to sweep sibling entry points, not just the reported one. Deterministic aid: `gate.sh callers` already enumerates the daemon handlers; the reading obligation is to check each for pre-commit state mutation.

Deferred as issue candidates (not blockers): two simultaneous dialogs in different tabs (single-slot `pending_dialog`), DevTools debugger-pause misclassification, the sub-second auto-handled-dialog tracking race, and the connect-path first-target gap (covered by PR #1543).

Run reports: `evals/runs/2026-07-20-agent-browser-61b6c63.json`, `2026-07-21-agent-browser-45d724b.json`, `2026-07-21-agent-browser-25c81ec.json` in the review-gate skill.

## Confidentiality review

Public. vercel-labs/agent-browser is a public repository; issues #1528 and #1036, PR #1532, PR #1543, and chrome-devtools-mcp #1230 are public. No private evidence was used.
