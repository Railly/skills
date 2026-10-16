# Review Gate: vercel-labs/issue-graph

Date: 2026-09-30
Repository: vercel-labs/issue-graph
Base: `b2efac49bba7fe3c88f54dbf39b5ac12cb8ad426`
Head: `b2efac49bba7fe3c88f54dbf39b5ac12cb8ad426`
Profile: standard
Skill revision: `git:3220a18e46b8611f1f2520e736b2bca127a3b541`
Verdict: incomplete

## Execution

- Mode: sequential_isolated
- Runtime receipt: /Users/raillyhugo/Programming/vercel/issue-graph-plain-research-2026-09-23/experiments/2026-09-30/plain-reference-pilot-v1/final-review-runtime.json
- Degraded from: fx_worker
- Schema failures: 2
- Independence gap: Fresh Sonnet review contexts; second-family shape challenge unavailable.

## Contract

- Path: /Users/raillyhugo/Programming/vercel/issue-graph-plain-research-2026-09-23/experiments/2026-09-30/plain-reference-pilot-v1/contract.md
- Spec status: bounded local implementation complete
- Acceptance reviewed: R0, R1, R2, R3, R4, R5, R6

## Stage receipts

- Test Strength: pass at `git:3220a18e46b8611f1f2520e736b2bca127a3b541`. Five mutants fail the expected behavioral assertion; restored 19/19 green. Final full suite 1169/58. Real gh/Linear responses and built offline replay exercised. Scope is the new reference path, not a universal adapter conformance claim.
- Resilience Audit: unavailable at `git:3220a18e46b8611f1f2520e736b2bca127a3b541`. Process nonzero/oversize/30-second timeout, sibling preservation, response chronology, budget and concurrent immutable saves exercised. Post-commit disk/stdout failures and other filesystems not injected.
- Security Review: incomplete

## Verified properties

- P1: Source identity and support workflow remain separate Real reference capture, browser observation, wrong-ID and state-overwrite mutations.
- P2: Matching saved references reconstruct offline; changed context is rejected Compiled CLI with empty PATH, identical model, checksum and CLI-wiring mutations.
- P3: Failed destinations preserve siblings within read budget Unsupported-ID regression, malformed responses, process exit/oversize/timeout, budget mutation.

## Deterministic checks

- `typecheck`: pass. /Users/raillyhugo/Programming/vercel/issue-graph-plain-research-2026-09-23/experiments/2026-09-30/plain-reference-pilot-v1/final-typecheck.log
- `lint`: pass. /Users/raillyhugo/Programming/vercel/issue-graph-plain-research-2026-09-23/experiments/2026-09-30/plain-reference-pilot-v1/final-lint.log
- `tests`: pass. /Users/raillyhugo/Programming/vercel/issue-graph-plain-research-2026-09-23/experiments/2026-09-30/plain-reference-pilot-v1/final-tests.log
- `build`: pass. /Users/raillyhugo/Programming/vercel/issue-graph-plain-research-2026-09-23/experiments/2026-09-30/plain-reference-pilot-v1/final-build.log
- `package`: pass. /Users/raillyhugo/Programming/vercel/issue-graph-plain-research-2026-09-23/experiments/2026-09-30/plain-reference-pilot-v1/final-package.log

## Judgment lenses

- contract-drift: run. R0-R6 mapped and empirical limits kept
- security: run. Scoped receipt consumed; gap preserved
- new failure propagation: run. Invalid-native-ID batch abort fixed
- flag propagation: run. CLI sidecar wiring mutant and built replay
- docs-behavior parity: run. README/help/guide/schema mapped
- complexity budget: run. No new dependencies/framework; bounded sequential reads, no invented LOC threshold
- choice audit: run. Separate live capture and offline import retained
- empirical drive: run. Real gh/fx and local browser

## Findings

- F1: confirmed, fixed. Unsupported native ID aborted sibling reads Evidence: Per-target unsupported-identity now tested through reconstructed model
- F2: refuted, not_applicable. Duplicate citations produce duplicate requests Evidence: Canonical lowercase dictionary key plus mixed-case repeat regression
- F3: refuted, not_applicable. CLI can omit coverage and swallow partial failure Evidence: Actual offline builder unconditionally supplies coverage

## Gaps

- Post-commit disk/stdout failures and other filesystem/ACL substrates were not exercised.
- Incremental review does not cover the previous full Plain port.
- Second-family shape challenge unavailable; human semantic adjudication and human time savings remain unmeasured.
- Human comparative quality remains unevaluated.

## Limits and provenance

- Author model: Codex/GPT-6 family; exact runtime ID unavailable
- Reviewer model: anthropic/claude-sonnet-5
- Same family: no
- Independent challenge: satisfied. Separate reviewer context plus authenticated provider receipts and compiled offline replay.
