# PR #1879 simplification

Published signed commit `837f9adf6f28345f072638cfd2832b722edfafe1` to `vercel-labs/agent-browser:fix/browser-use-v4-provider`. GitHub verified the signature and preserved Magnus Müller as human coauthor. Magnus PR #1691 remains at `da4c99f`.

| Added lines relative to main aff6125 | Before | After |
|---|---:|---:|
| Runtime | 561 | 353 |
| Tests | 847 | 433 |
| Docs/help | 73 | 72 |
| Total | 1481 | 858 |

Six files in both versions; no untracked PR files, dependency additions or source relocation. The PR removes 71 base lines, for a net change of +787. The new append-only commit itself adds 437 and deletes 1057 lines. There are 8 new tests rather than 23. The tests' added lines fell 49%; total additions fell 42%.

Removed disk recovery receipts, storage preflight and callback plumbing that existed only for the receipt write. Consolidated repeated HTTP fixtures and assertions into protocol/state tables. Centralized API error handling and ownership registration. Kept distinct wire, timeout, cancellation, retry, rollback, error-redaction and Chrome-continuity checks. A reviewer-found CDP/provider precedence issue was fixed within the existing launch guards.

The runtime no longer persists pending browser IDs across daemon exit. Documentation directs manual recovery to the Cloud dashboard. Same-ID retry remains available while the daemon is alive. Detailed partitions and removed obligations are in `invariant-matrix.json`; measurements reconcile with clean Git status in `measurements.json`.

Validation on the final source: 1395 Rust tests passed, real Chrome continuity passed, built CLI missing-key and local-state smoke checks passed, production Clippy and formatting passed, docs built with Bun/Webpack. Eight deliberate faults failed executed tests and the restored source passed. A compiler failure in an initial probe was kept as a failed setup artifact, not credited as a killed mutant. Independent Claude review and its follow-ups finished without blockers.

The reduction and publication are complete. The broader merge report remains incomplete: this exact source was not rerun against live Cloud because the clipboard credential was gone, and exhaustive fuzz/property/per-partition failure campaigns were not run. Earlier live Cloud evidence remains historical evidence for commit 427d7a4 and the producer contract. No merge or release occurred.

Canonical review: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-17-agent-browser-1879-837f9ad/run-report.json
Publication: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/publication.json
Checks: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-checks.json
