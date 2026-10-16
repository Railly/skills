# Case: A patch that "confirmed" a root cause for an intermittent bug

Status: candidate
Validation: self-refuted during the same run
Human review: pending
Maintainer acceptance: not raised (the finding was withdrawn before it reached the maintainer)
Delivery: PR open
Upstream status checked: 2026-07-27
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1589 (branch feat/session-tab-binding, final gate over head c4fc782, follow-ups 5cabec7 and fb37749)

> Self-refuted: the root cause below was drafted as a confirmed blocker, apparently validated by a patch experiment, and then contradicted by six further runs inside the same session. The case exists for the method failure, not for a repo defect.

## Observed condition or claim

Final pre-merge gate on a `--pin-tab` session-binding PR. Dogfooding the built CLI against real Chrome, two consecutive sessions showed a pinned session silently recovering onto a fresh blank tab when its bound tab was closed externally: `snapshot` returned `(empty page)` with exit 0, `tab list` showed a new `about:blank`, and the binding file was rewritten to `{targetId: <blank tab>, pinned: true}` — a strict isolation boundary silently relocated and persisted.

A root cause followed quickly and read well: only the attach paths call `apply_tab_binding_on_attach*`, the single place that copies `state.pin_tab` onto the `BrowserManager`. The local-launch and provider paths never do, so `BrowserManager.pin_tab` would stay `false` for the daemon's life while `state.pin_tab` was `true` — the persisted state claiming a pin nothing enforces. Patching the local-launch site to call the wrapper made both misbehaviours disappear. Blocker written, mechanism named, fix validated.

All of it was wrong, and every step of the reasoning was individually sound.

## Red signal

Six later sessions under the same command sequence returned the correct `tab_gone`, binding intact — including one where the spare `about:blank` was closed first so the bound tab really was the session's sole tracked page, which is the precondition the original finding required. In those runs the pin is demonstrably enforced on a local launch, which the stated root cause says is impossible.

The discriminating detail, found only afterwards: a locally launched Chrome sometimes keeps an extra `about:blank` beside the navigated tab and sometimes does not. Whether `page_count()` reaches 0 therefore varies per launch, so "the session's sole tab" was not a condition the test controlled — it was a coin flip the harness never observed. The two early sessions and the six later ones were not running the same scenario.

That also invalidates the patch experiment. It was a single run before and a single run after, on a behaviour whose base rate was unmeasured. It could not distinguish a fix from a different toss.

## Method used

1. Drove the built CLI against real Chrome rather than trusting tests, which is what surfaced the two instances at all — the author's suite and two independent static reviewers (mine and a gpt-5.6-sol pass) all read the code as correct.
2. Bounded the scope by driving the same scenarios over `--cdp`, where both behaved correctly. This looked like isolation of the defect to the launch paths; it was really two samples on each side of a noisy boundary.
3. Wrote the root cause, patched it, observed the misbehaviour gone, reverted the patch.
4. Kept driving anyway, on fresh sessions, which is the only reason the error surfaced. Six clean runs against a "confirmed" defect.
5. Forced the original precondition deliberately (closed the spare tab, then closed the bound tab externally). Clean `tab_gone`. At that point the root cause was dead and the patch result meaningless.
6. Rewrote the finding as `unverified` with both the two captured instances and the six counter-runs, set the run report to `run.status: incomplete`, and withdrew the blocker instead of sending it to the maintainer.

## Outcome

No defect reported to the maintainer. Two real coverage findings from the same gate did ship (5cabec7): regression tests for the rollback wrapper and the restore-path revive, both force-red verified, and removal of a `pub` primitive left with zero callers. The intermittent observation remains open and undiagnosed, recorded with its evidence rather than either escalated or dropped.

## Evidence

- Runtime, positive: sessions `gate1589` and `gateX` — `--pin-tab navigate example.com`, bound tab closed via CDP `/json/close`, then `snapshot` → `(empty page)` exit 0, `tab list` → new `t2 about:blank`, binding file rewritten with `pinned: true`. Captured in the run report; sessions ephemeral.
- Runtime, counter-evidence: sessions `r1`, `r2`, `r3`, `s1`, `gateV`, `gateW` — same sequence, correct `tab_gone` with the binding preserved. `s1` had the spare tab closed first, so `page_count()` reached 0 as required. Ephemeral.
- Tooling: `radius impact` returned 0 edges against 2384 `unresolvedCalls` with `rust-analyzer` on PATH, so the Impact Map contributed nothing and every finding came from free exploration. Retrievable (`evals/radius-dogfood/2026-07-27-agent-browser.json`).
- Run report: `evals/runs/2026-07-27-agent-browser-codex-c4fc782.json`, `run.status: incomplete`, finding `1589-pin-intermittent-silent-recovery-on-local-launch` state `unverified` carrying both the observations and the refutation of its own hypothesis.

## Transferable lesson

Before attributing a root cause to a behaviour that was not reproduced on demand, measure its base rate on the unpatched artifact. Two-for-two is not determinism; it is two samples. A patch that makes an intermittent symptom disappear in one run inherits exactly the variance it was meant to settle, so it cannot confirm a mechanism — and because a passing patch feels like proof, it converts an open question into a false certainty faster than plain reasoning would.

The companion rule: when a scenario depends on an environmental precondition (a tab count, a timing window, a cache state), assert the precondition in the harness rather than assuming the setup produced it. The two early sessions and the six later ones ran the same commands and different scenarios, and nothing in the transcript said so.

## Exceptions

This is about attribution, not about reporting. An unreproducible observation with captured evidence is still worth recording as `unverified` — dropping it silently is the failure the gate's own "a verification gap is not a refutation" rule names. The error was upgrading it to `confirmed` with a mechanism, not noticing it.

Also not a claim that dogfooding failed. Dogfooding is what produced the only real signal here; two static reviewers on different model families read the same code as correct. The flaw was in what happened after the signal.

## Candidate changes

- Sharpened the error-path forcing lens: per fix rather than per diff, plus "on intermittent behaviour, establish the base rate before attributing a cause." (`references/gates.md`.)
- New subsystem invariant: tab topology varies per launch, so any scenario depending on `page_count() == 0` must close the spare tab explicitly. (`cases/agent-browser/conventions.md`.)
- Gate-miss ledger entry for the attribution failure itself, with the base-rate check as the closure. (`cases/agent-browser/conventions.md`.)

## Confidentiality review

Public repository and public PR. No internal chat quoted. No secrets or customer data. Session names and CDP ports are local ephemeral test artifacts; no local absolute paths or neighboring-project identity included.
