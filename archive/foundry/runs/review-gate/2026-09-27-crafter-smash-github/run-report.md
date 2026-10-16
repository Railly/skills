# Review Gate: crafter-games/crafter-smash

Date: 2026-09-27
Repository: crafter-games/crafter-smash
Base: `3b38d550e2003b0c30a14adcfa111ef94e27dc01`
Head: `5ec5b11df437270c9d8083093f23271d02a43cc0`
Profile: mechanical
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: pass

## Execution

- Mode: single_context
- Runtime receipt: none
- Degraded from: none
- Schema failures: 0
- Independence gap: Mechanical HTML/CSS diff received a focused self-review and direct browser verification; no independent reviewer.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-27-crafter-smash-github/contract.md
- Spec status: not_applicable
- Acceptance reviewed: A1, A2, A3

## Stage receipts

- Test Strength: not_triggered. No protocol, parser, event handler or tests changed; the anchor reuses existing menu dispatch and was directly exercised.
- Resilience Audit: not_triggered. No persistence, requests, resource ownership or failure-path code changed.
- Security Review: missing

## Verified properties

- P1: The title screen exposes a usable repository link without obstructing the menu. Real Chromium file URL: mouse and ArrowUp + Enter each created a GitHub tab while the original game remained on title. ArrowDown + Enter still opened character select, where the GitHub link has no client rect. Screenshots inspected at 1440x900 and 390x844; measured at 320x568 and 844x390 after the short-height spacing fix. Link bottom 66px; logo top 87.27px and 85.17px. No browser errors. git diff --check passed. Product has no build, dependencies, or test suite.

## Deterministic checks

- `git diff --check`: pass
- `native build and unit suite`: acknowledged. Not present; the repository is a dependency-free static game.
- `gate.sh all`: pass

## Judgment lenses

- Inverse regression surface (promoted): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- New-domain matrix (promoted): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Resolution-rule consistency across consumers (promoted): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Shell re-parse append domain (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Emission channel and one-shot latch reachability (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Shim hermeticity (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Deliberate-default check (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Fresh-seam scan (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Substrate differential corpus (promoted): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Reference-implementation oracle (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- New-failure-outcome propagation (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Flag-propagation dispatch sweep (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Error-path forcing (promoted): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Non-destructive recovery (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Cancellation and timeout hygiene (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Boundary pipeline trace (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Substrate verification (promoted): run
- Dogfood the built artifact (candidate): run
- Newly-asserted invariant ownership (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Docs-behavior parity (candidate): run
- Demonstrative example (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Choice audit (candidate, needs a decision trail to fire): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.
- Complexity budget (candidate): skipped. Static anchor and scoped CSS only; no matching runtime, parsing, state, documentation or algorithm change.

## Findings

- F1: confirmed, fixed. undefined Evidence: Short-height logo overlap corrected and verified at 320x568 and 844x390.

## Gaps

None.

## Limits and provenance

- Author model: GPT-6
- Reviewer model: GPT-6
- Same family: yes
- Independent challenge: not satisfied. Mechanical static presentation change.
