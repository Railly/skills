# Review Gate: vercel-labs/agent-browser

Date: 2026-09-17
Repository: vercel-labs/agent-browser
Base: `fbd046c23a2c1156891bda294aaaee715c23b3f1`
Head: `d272adda97a8c4d94d2111c846a304c0c0e4b0fa`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: sequential_isolated
- Runtime receipt: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-review-receipt.json
- Degraded from: fx_worker
- Schema failures: 0
- Independence gap: Claude CLI reviewed immutable supplied source in fresh contexts with tools disabled. It did not independently execute tests and overlaps one implementation family. Saved normative OpenAPI is the independent protocol oracle.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/reconciled-contract.md
- Spec status: pass
- Acceptance reviewed: R0, R1, R2, R3, R4, R5, R6, R7, R8, R9, R10, R11

## Stage receipts

- Test Strength: unavailable at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. The specialist artifact exists with status incomplete; local critical proofs passed, but no full passing receipt is available. Missing exhaustive falsifier/property/fuzz and hosted producer coverage.
- Resilience Audit: unavailable at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. The specialist artifact exists with status incomplete; local critical proofs passed, but no full passing receipt is available. Hosted and remaining post-commit failure/retry partitions are unverified.
- Security Review: pass

## Verified properties

- P1: Provider create failure returns within the client deadline without holding the daemon indefinitely. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/mutation-results.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/dogfood.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/idle-proof.json
- P2: Failed/canceled stop retains the same ID and pending ownership prevents replacement. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/mutation-results.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/mutations-restored-green.log
- P3: Known allocation is recorded in memory before waiting for the receipt; acknowledgment is required to clear it. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/mutation-results.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/specialist-model.md
- P4: Failed explicit and automatic setup restore configuration, and canceled cleanup clears local launch bookkeeping. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/mutation-results.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md
- P5: Ordinary commands retain real Chrome state; closing an external attachment does not terminate its producer. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/continuity-fixed.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-owned-continuity.log
- P6: Hosted Cloud create/stop and advertised profile/recording behavior match the local contract. No Browser Use Cloud credential available; no hosted account observations.

## Deterministic checks

- `final-fmt`: pass. Exit 0: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-fmt.log
- `final-clippy`: pass. Exit 0: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-clippy.log
- `final-suite`: pass. Exit 0: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-suite.log
- `final-owned-continuity`: pass. Exit 0: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-owned-continuity.log
- `final-build`: pass. Exit 0: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-build.log
- `docs-build`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-docs-build.json
- `mutations`: pass. All seven faults failed behaviorally; restored group green.
- `style`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/gate-style.log
- `surface/caller/sibling sweeps`: acknowledged. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md
- `extended all-target Clippy`: acknowledged. Pre-existing unbounded-range lint in untouched browser.rs tests on Rust 1.98; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/extended-clippy-classification.md
- `exact-state`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-source-identity.json file hashes revalidated after commit; no source tree change during signing.

## Judgment lenses

- Inverse regression surface: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- New-domain matrix: run. Triggered by endpoint acceptance, receipt recovery, new ownership callback or decision trail; reviewed in immutable Claude packets and final-review-disposition.md, with remaining verification limits explicit.
- Resolution-rule consistency across consumers: skipped. No changed discovery/precedence rule; the new env helper has one production caller shared by both launch families.
- Shell re-parse append domain: skipped. No shell command construction changed.
- Emission channel and one-shot latch reachability: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Shim hermeticity: skipped. Contributor adds no external-binary shim.
- Deliberate-default check: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Fresh-seam scan: run. Triggered by endpoint acceptance, receipt recovery, new ownership callback or decision trail; reviewed in immutable Claude packets and final-review-disposition.md, with remaining verification limits explicit.
- Substrate differential corpus: skipped. No substrate-modeling guard or detector added.
- Reference-implementation oracle: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- New-failure-outcome propagation: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Flag-propagation dispatch sweep: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Error-path forcing: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Non-destructive recovery: run. Triggered by endpoint acceptance, receipt recovery, new ownership callback or decision trail; reviewed in immutable Claude packets and final-review-disposition.md, with remaining verification limits explicit.
- Cancellation and timeout hygiene: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Boundary pipeline trace: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Substrate verification: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Dogfood the built artifact: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Newly-asserted invariant ownership: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Docs-behavior parity: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Demonstrative example: run. Focused source/claim review and empirical disposition: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/scoped-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/followup-independent-review.md; /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/deterministic-dispositions.md. Local results and Cloud gaps are separated in specialist-model.md.
- Choice audit: run. Triggered by endpoint acceptance, receipt recovery, new ownership callback or decision trail; reviewed in immutable Claude packets and final-review-disposition.md, with remaining verification limits explicit.
- Complexity budget: skipped. No per-element loop, membership or candidate scan added.

## Findings

- F1: confirmed, fixed. Original create call could block daemon beyond client timeout. Evidence: Original stalled binary reproduction, fixed bounded binary proof and timeout mutation.
- F2: confirmed, fixed. Original failed stop reported success and discarded remote ID. Evidence: Original cleanup reproduction; final same-ID retry and cancellation mutants.
- F3: confirmed, fixed. Failed setup/canceled cleanup could leave configuration and launch bookkeeping stale. Evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-17-agent-browser-1691/final-review-disposition.md

## Gaps

- No live Browser Use Cloud credential: hosted create/CDP/stop, billing, profile persistence, recording and repeated-stop semantics remain unverified.
- A positive stop is covered by real HTTP adapter bytes, while caller retries are covered separately; successful stop through the complete CLI wire was not exercised.
- Seven critical mutations were killed, but exhaustive per-partition parser/caller mutations, property generation and structured fuzz campaigns were not run.
- Windows/filesystem-specific fault partitions, receipt deletion permission failure, post-attach provider state-load rollback and cancellation during stream status publication were not directly forced.
- No live Browser Use Cloud credential: hosted create/CDP/stop, billing, profile persistence, recording and repeated-stop semantics remain unverified.
- A positive stop is covered by real HTTP adapter bytes, while caller retries are covered separately; successful stop through the complete CLI wire was not exercised.

## Limits and provenance

- Author model: Claude CLI implementation plus OpenAI parent corrections
- Reviewer model: claude-fable-5 in fresh isolated contexts
- Same family: yes
- Independent challenge: satisfied. Normative Cloud API schema captured before fixes; separate Claude scoped/follow-up review found cancellation issues that were corrected and mutation-tested. This is not full cross-family runtime validation.
