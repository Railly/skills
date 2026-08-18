# Case: Final grid equality does not prove atomic rendering

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-11
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/114, final head `16c3b5606442c45df7b8df42668b96bce860f79e`, merge commit `a360d2138b09e58830e69e50619f2aad54e5b01f`

> Technical validation, behavior-specific performance proof, human review, maintainer approval, and merge are complete. No release newer than 0.3.3 contains this change yet.

## Observed condition or claim

The DOM scheduler already held synchronized-output blocks when a `TerminalCore` exposed mode 2026 state. The Ghostty adapter did not expose that state, so the same DOM renderer painted every intermediate update even though Ghostty parsed the control sequence.

Both the broken and fixed implementations ended with the same correct grid.

## Red signal

In five deterministic synchronized bursts:

```text
main Ghostty: 26 median renders, 0 final mismatches
PR Ghostty:    1 median render,  0 final mismatches
```

A screenshot taken after completion showed identical final content. Final-grid equality therefore could not distinguish atomic rendering from 25 intermediate paints.

## Method used

1. Exposed synchronized-output active state from Ghostty's committed WASM.
2. Added a monotonic generation that increments only on inactive-to-active transitions, including saved-mode restore.
3. Reused the existing DOM scheduler contract instead of adding a second Ghostty-specific scheduler.
4. Ran five fresh deterministic bursts against main and the PR.
5. Forced `synchronizedOutput()` to return false while retaining the benchmark. The result returned to 25 to 26 renders in all five runs.
6. Restored the implementation and recovered one render in all five runs.
7. Kept write latency outside the claim because it remained within harness noise.
8. Built a side-by-side browser view labeled main and PR #114 for human inspection, while treating render counts as the actual proof.

## Outcome

PR #114 merged on 2026-08-11 as `a360d21`.

- Ghostty exposes mode 2026 and generation state through `TerminalCore`.
- The existing DOM scheduler paints one closing frame for the deterministic burst.
- Final grid mismatches remain zero.
- The forced mutation restores the defect signal.
- CI, Vercel deployment, Socket checks, and Vercel Agent Review are green.

The final head rebased onto merged PR #113, regenerated the committed WASM, passed the full gate, and received human approval before merge.

## Evidence

- Source: PR #114, pre-rebase head `fad6c50cb652cc6282ec44f900690c5456c9505e`, final head `16c3b5606442c45df7b8df42668b96bce860f79e`, merge commit `a360d2138b09e58830e69e50619f2aad54e5b01f`.
- Runtime: real committed Ghostty WASM and a browser evidence lab.
- Tests: the final head passed 41 Ghostty tests, 115 DOM tests, the full test suite, build, type-check, lint, format, and two reproducible containerized WASM builds with SHA-256 `f9e1b39ad9f0cf004a62b148d1443209888128bfc53c281601096dbefdab01a2`.
- Review: every required GitHub check passed on the final head, ctate approved the PR, and it merged on 2026-08-11.
- Artifact: five-run before, after, mutation, and restoration render-count evidence; side-by-side visual inspection confirmed equal final grids.

## Transferable lesson

Atomic rendering is a temporal property. A final screenshot or final-grid assertion cannot prove it. Count observable paints during the protected interval, then force the adapter signal off and require the intermediate-render count to return.

## Exceptions

The proof covers synchronized-output render coalescing. It does not claim lower write latency, pixel identity across cores, or correctness of unrelated terminal protocols.

## Candidate changes

- Deterministic check: atomic-output tests must count intermediate renders and include a fix-absent mutation; final-grid equality is supporting evidence only.

## Confidentiality review

The case contains only public repository, PR, commit, checks, aggregate benchmark results, and generic terminal behavior. It excludes local paths, private discussion, and internal environment identifiers.
