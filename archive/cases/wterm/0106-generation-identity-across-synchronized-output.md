# Case: A repeated mode needs generation identity across the real boundary

Status: reviewed
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-09
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/106, merge commit `9bc197a5f4bd8781ac6e301b67035f91f9980a43`

## Observed condition or claim

PR #106 added DEC synchronized output mode 2026 to the built-in core and held DOM rendering until a block closed. The first implementation treated the feature as a boolean paint suppression flag.

The full host contract was larger:

- responses must still leave while paint is held
- resize must not expose a partial frame
- an unterminated block needs bounded recovery
- recovery must flush the frame and allow later writes to paint
- ordinary payload must not extend the recovery ceiling
- a real `ESU → BSU` transition must start a fresh full deadline even when the final boolean remains `true`

## Red signal

Several rounds passed their immediate tests while adjacent ownership seams remained wrong. The final miss was generation inheritance: generation 2 could reuse generation 1's remaining timeout because the DOM saw only “still held” and the regression test manually changed a mocked generation rather than sending close-and-open bytes through the parser and committed WASM.

Documentation also described an inactivity timeout while the intended runtime contract was a fixed maximum from BSU. The prose and the timer could not both be true.

## Method used

1. Modeled synchronized-output recovery as one transition jointly owned by the terminal core and DOM scheduler.
2. Added a monotonic generation to the core, WASM exports, shared interface, and DOM state machine.
3. Sent real `ESU → BSU` bytes through the committed WASM so the parser, generation increment, post-write state read, timer cancellation, and timer re-arm all participated.
4. Forced ordinary payload near the deadline to prove it does not reset the clock.
5. Forced timeout recovery, a later fresh block, queued RAF cancellation, resize while held, destroy cleanup, and response callback failure.
6. Reconciled both public behavior passages with the fixed-per-BSU contract.
7. Re-ran Review Gate against the exact final head after integrating #105.

## Outcome

PR #106 merged on August 9, 2026.

- Each real synchronized-output generation receives a fresh one-second recovery deadline.
- Ordinary payload cannot postpone recovery.
- Timeout recovery paints the pending frame and later output continues painting.
- A later synchronized block becomes atomic again.
- Host responses remain independent of paint suppression.
- Resize and queued render work remain held or cancelled correctly.
- Callback failures are rethrown only after recovery or closing-frame bookkeeping.
- Public docs state a fixed maximum from the opening sequence, not inactivity.

## Evidence

- Source: PR #106 at final head `01b7809282518c9d9f22d14ad0613840f3614a53`; merged as `9bc197a5f4bd8781ac6e301b67035f91f9980a43`.
- Runtime: committed-WASM probes sent BSU, payload, ESU, and a second BSU. Generation 2 stayed hidden through 999 milliseconds of its own deadline and painted after approximately one second. Payload at 900 milliseconds did not extend generation 1.
- Tests: `sync-generation-probe.test.ts` covers real-WASM generation re-arm and payload non-extension; the DOM suite covers close, timeout, recovery, later blocks, callback failure, resize, queued RAF, and destroy.
- Review: ctate approved the final head after the generation fix; CI, Vercel Agent Review, Vercel deployment, and Socket checks passed.
- Artifact: ReleaseSmall WASM matched the committed binary; the exact-head Review Gate is `foundry/runs/review-gate/2026-08-08-wterm-01b7809.md`.

## Transferable lesson

A boolean cannot distinguish two consecutive occurrences that end in the same state. When correctness depends on “this is a new occurrence,” carry identity across the authoritative boundary and test the transition through that boundary. Manually changing a mock field proves the scheduler can react to a number; it does not prove the parser, core, artifact, adapter, and scheduler agree on when a new generation begins.

## Exceptions

The one-second ceiling is a recovery bound for malformed or interrupted streams, not an inactivity debounce. This case validates the built-in core's mode-2026 path; alternative cores may omit the optional capability.

## Candidate changes

- Deterministic check: require exact-head Review Gate coverage after every rebase, merge, or final fix commit before presenting a branch as reviewed.

## Confidentiality review

All retrieval handles are public GitHub commits, checks, tests, and pull-request state. The technical review finding is described from the public final implementation and regression evidence without private discussion or identity.
