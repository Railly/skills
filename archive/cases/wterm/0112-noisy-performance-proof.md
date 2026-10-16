# Case: A performance PR may prove only a simpler scheduler

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-11
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/112, commit `81e1f282a3a8739499d515436fe07df64ebc8d4f`

> Technical validation, human review, maintainer approval, and merge are complete. No release newer than 0.3.3 contains this change yet.

## Observed condition or claim

The DOM scheduler queued ordinary writes through `setTimeout(0)` before requesting an animation frame. Since `requestAnimationFrame` already coalesces every write received before the frame, the timer looked like an unnecessary scheduling boundary and a possible source of input latency.

The attractive claim was “removing the timer makes input visibly faster.” The measurements did not support that claim.

## Red signal

Two forms of evidence pointed in different directions:

- Structural evidence was strong: the old implementation could not request a frame synchronously because it always crossed a timer task first.
- Chromium latency evidence was neutral: input-to-DOM medians before and after were within measurement noise.

A screenshot comparison would also be non-evidence because both implementations intentionally produce the same final frame.

## Method used

1. Changed `_scheduleRender()` to request a frame directly while preserving one pending frame, synchronized-output cancellation, and destroy cleanup.
2. Added an asynchronous RAF mock that records whether the frame was requested immediately and whether multiple writes coalesce.
3. Restored the timer implementation while retaining the new test. The assertion failed because `requestAnimationFrame` had zero calls at the synchronous boundary.
4. Restored the direct-RAF implementation and reran the DOM suite green.
5. Measured input-to-DOM mutation in Headless Chromium 147:
   - 100 samples in the primary run
   - 30 samples at each of six offsets within a frame
6. Compared medians and tails rather than selecting one favorable sample.
7. Scoped the PR and documentation claim to scheduler simplification and removal of a task boundary, not a numeric latency improvement.

## Outcome

PR #112 merged on 2026-08-11 as `82d08f9`.

- Ordinary writes request RAF directly.
- Multiple writes before the frame still coalesce into one render.
- Existing synchronized-output, response-error, cancellation, and destroy behavior remains covered.
- The force-red test proves the timer boundary is gone.
- The benchmark does not prove a latency win.

Primary 100-sample result:

```text
Before median 8.9 ms, p90 9.6 ms, mean 8.995 ms
After  median 9.0 ms, p90 9.7 ms, mean 9.065 ms
```

Across six frame offsets, five median deltas were between -0.1 and 0 ms and one was -0.1 ms. Late-frame after samples had several large outliers, further supporting the decision not to claim a numeric improvement.

## Evidence

- Source: PR #112 at `81e1f282a3a8739499d515436fe07df64ebc8d4f`.
- Runtime: Headless Chromium 147 on macOS; raw measurements were saved for the review run.
- Tests: restoring `setTimeout(0)` made the direct-RAF assertion fail with zero RAF calls; restored head passed `@wterm/dom` 113/113.
- Review: exact-head Review Gate, CI, Vercel Agent Review, Vercel deployment, and Socket checks passed. The PR received human approval and merged.
- Artifact: `foundry/runs/review-gate/2026-08-10-wterm-81e1f28.json` records the performance disposition. A visual screenshot pair was deliberately not produced because identical final frames cannot demonstrate scheduling order.

## Transferable lesson

A performance change can have a proved structural benefit and an unproved latency benefit at the same time. Keep the stronger claim and discard the weaker one. For scheduler changes, force-red the ownership boundary, measure the user-facing outcome, and let noisy or neutral data narrow the release language.

## Exceptions

The measurements cover one Chromium build and machine under the tested frame phases. They do not prove that no environment benefits from removing the timer. They do prove that this run cannot honestly advertise a numeric speedup.

## Candidate changes

- Skill method: performance proof reports should separate structural wins, measured wins, and explicitly unsupported wins; visual evidence is skipped when the final pixels are not the changed property.

## Confidentiality review

The public case retains only the public repository, commit, PR, browser version, aggregate measurements, and test results. It excludes local paths, private discussion, and internal environment identifiers.
