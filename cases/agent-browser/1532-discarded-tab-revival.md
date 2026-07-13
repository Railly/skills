# Case: Revive a discarded tab on switch without losing live-tab state

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: changes-requested
Delivery: PR open
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1532
Upstream status checked: 2026-07-13

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

## Confidentiality review

Public. vercel-labs/agent-browser is a public repository; issues #1528 and #1036, PR #1532, and chrome-devtools-mcp #1230 are public. No private evidence was used.
