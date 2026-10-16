# Review Gate: vercel-labs/agent-browser

Date: 2026-09-17
Repository: vercel-labs/agent-browser
Base: `aff6125c023b810ea3f2e5deec5379e9a4270bdc`
Head: `837f9adf6f28345f072638cfd2832b722edfafe1`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: sequential_isolated
- Runtime receipt: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/compiler-fix-review-receipt.json
- Degraded from: fx_worker
- Schema failures: 0
- Independence gap: Claude independently reviewed immutable source and the decision trail; executable validation was performed by the primary OpenAI agent. FX was unavailable in the established runtime record.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/contract.md
- Spec status: pass
- Acceptance reviewed: C1, C2, C3, C4, C5, C6, C7, C8

## Stage receipts

- Test Strength: unavailable at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Selected local evidence passed; full specialist completeness is not claimed for the explicit remaining partitions.
- Resilience Audit: unavailable at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Selected local evidence passed; full specialist completeness is not claimed for the explicit remaining partitions.
- Security Review: pass

## Verified properties

- P1: V4 adapter emits the expected create/stop protocol and preserves returned ownership. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/restored-focused.log
- P2: Failed or canceled stop retains the same ID and a replacement is refused. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-rust-full.log
- P3: Create and stop response-body waits honor their configured request deadlines. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/restored-focused.log
- P4: Failed explicit and automatic setup restore the tested configuration fields. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/restored-focused.log
- P5: CDP failure retains known ownership and suppresses endpoint credentials. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/restored-focused.log
- P6: Ordinary commands preserve page state and closing an attachment preserves external Chrome. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-chrome.log

## Deterministic checks

- `restored-focused`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/restored-focused.log
- `mutation-campaign`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/mutation-campaign.log
- `final-rust-full`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-rust-full.log
- `final-chrome`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-chrome.log
- `final-clippy`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-clippy.log
- `final-format`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-format.log
- `final-diff`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-diff.log
- `docs-build`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/docs-build.log; shared existing dependencies linked only for the build and then unlinked.
- `built-cli`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/dogfood.json
- `exact-source-and-signature`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/commit.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/publication.json
- `live-cloud-current-source`: acknowledged. The simplified binary was not rerun against live Browser Use Cloud because the clipboard credential was no longer available. Earlier same-day live evidence verifies the producer contract, not this exact source.

## Judgment lenses

- Inverse regression surface: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- New-domain matrix: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Resolution-rule consistency across consumers: run. F3 corrected both launch guards to respect existing CDP and auto-connect precedence; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md
- Shell re-parse append domain: skipped. No shell command construction changed.
- Emission channel and one-shot latch reachability: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Shim hermeticity: skipped. Contributor adds no external-binary shim.
- Deliberate-default check: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Fresh-seam scan: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Substrate differential corpus: skipped. No substrate-modeling guard or detector added.
- Reference-implementation oracle: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- New-failure-outcome propagation: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Flag-propagation dispatch sweep: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Error-path forcing: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Non-destructive recovery: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Cancellation and timeout hygiene: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Boundary pipeline trace: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Substrate verification: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Dogfood the built artifact: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Newly-asserted invariant ownership: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Docs-behavior parity: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Demonstrative example: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Choice audit: run. Final source/trail review and scoped local evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/invariant-matrix.json. Unexecuted producer/partition coverage is recorded as gaps.
- Complexity budget: skipped. No per-element loop, membership or candidate scan added.

## Findings

- F3: confirmed, fixed. Browser Use setup timeout could incorrectly wrap higher-precedence CDP/auto-connect paths. Evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md

## Gaps

- The simplified binary was not rerun against live Browser Use Cloud because the clipboard credential was no longer available. Earlier same-day live evidence verifies the producer contract, not this exact source.
- Eight representative mutations were killed. Exhaustive per-partition falsification, structured fuzz/property campaigns, and all post-attach caller-failure partitions were not executed.
- The simplified binary was not rerun against live Browser Use Cloud because the clipboard credential was no longer available. Earlier same-day live evidence verifies the producer contract, not this exact source.

## Limits and provenance

- Author model: OpenAI Codex simplification of existing contributor-derived implementation
- Reviewer model: claude-fable-5, fresh immutable contexts
- Same family: no
- Independent challenge: satisfied. Normative protocol schema, historical producer stop acknowledgment, and completed cross-family source/trail review: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/simplify-2026-09-17/final-independent-review.md
