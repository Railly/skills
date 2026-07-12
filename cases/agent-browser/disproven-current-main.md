# Case: Explain the green before dismissing an old issue

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: [#1358](https://github.com/vercel-labs/agent-browser/issues/1358) · [#1260](https://github.com/vercel-labs/agent-browser/issues/1260) · [#1179](https://github.com/vercel-labs/agent-browser/issues/1179) · [#1011](https://github.com/vercel-labs/agent-browser/issues/1011) · [#1016](https://github.com/vercel-labs/agent-browser/issues/1016) · [#1504](https://github.com/vercel-labs/agent-browser/issues/1504)

> Unvalidated agent backfill. Verdicts and candidate changes require human review.

## Observed failure

Six open issues described failures involving recording, Chrome auto-connect, fullscreen screenshots, React clicks, download-link discovery, and stale snapshot references.

## Red signal

Current-main experiments did not reproduce a patchable bug:

- #1358 retained a stable screencast frame rate before, during, and after recording stop; current recording no longer uses screencast.
- #1260 connected after the debugging port was confirmed ready; the first failure was an unmet environment precondition.
- #1179 produced lime pixels, not a black screenshot, after decoding the PNG rather than checking file existence.
- #1011 produced a trusted delegated click; the generic React-event theory was disproven.
- #1016 exposed and clicked the filename on current main; the report was obsolete.
- #1504 requested removal of an intentional resilience tradeoff and required a maintainer design decision rather than a contributor patch.

## Method used

1. Run the reported claim on current code before theorizing about a fix.
2. Challenge every green result with an anti-artifact control.
3. Explain the green through current architecture, environment precondition, prior behavior change, or explicit design tradeoff.
4. Preserve inference when the reporter's exact environment is unavailable.

## Outcome

No code was changed. The six issues received evidence-backed internal verdicts: obsolete, environment-dependent, theory disproven, insufficient environment detail, or maintainer design call. No upstream comments were posted.

## Evidence

- Source: current recording path, stale-reference fallback, and public issue history.
- Runtime: frame counts, port readiness, decoded screenshot pixels, trusted click state, and actual click effect.
- Tests: no new tests were appropriate because no production change was made.
- Review: contributor-only; upstream maintainers have not accepted the verdicts.

## Transferable lesson

A green reproduction attempt is not a conclusion. Explain what makes it green and verify that the green is not a broken fixture, missing precondition, or trivial observation before deciding to close, reroute, or keep watching.

## Exceptions

One green run cannot disprove intermittent behavior. Use repetition and instrumentation for probabilistic failures. When the reporter's environment is unavailable, prefer insufficient detail over disproven.

## Candidate changes

- Reference rule: Unfold Triage should explain a green before accepting non-reproduction.
- Eval: an old issue whose first green comes from a closed port or trivial artifact check.
- Coverage gap: evidence-backed verdicts need a safe handoff to the upstream tracker.

## Confidentiality review

All issues and inspected source are public. Private session transcripts and local triage notes are omitted.
