# Review Gate: vercel-labs/agent-browser

Date: 2026-09-28
Repository: vercel-labs/agent-browser
Base: `fad34d20403e67619cde5340731575745e2762e6`
Head: `498ee9bc59e6451db7be31a6c7c8d637c77e1ad0`
Profile: standard
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-tree:54c8a332dab0febea175fc4fc375785e8745e6c4`
Verdict: incomplete

## Execution

- Mode: fx_worker
- Runtime receipt: /Users/raillyhugo/Programming/railly/skills/foundry/runs/simplify/2026-09-28-agent-browser-2014/review-fx.json
- Degraded from: native_subagent
- Schema failures: 2
- Independence gap: Independent cross-family review exists; packaged runtime identity requirement is unmet. Final requested visible-click assertion was checked locally and by final E2E.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/simplify/2026-09-28-agent-browser-2014/contract.md
- Spec status: not_required
- Acceptance reviewed: Preserve distinct invariants, Production unchanged, Reduce duplicated fixtures, Signed append-only update

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-tree:369ace973c03bda72436c007404164de98aa6dca`. coverage-model.json, four intentional force-red logs, full restored final unit and auth runs; independent Kimi invariant assessment.
- Resilience Audit: not_triggered. Parent-to-reduction diff changes test scaffolding only. No production persistence, retry, cleanup, concurrency, or recovery implementation changed. Parent resilience receipt remains historical, not re-fingerprinted as a current full-PR pass.
- Security Review: pass

## Verified properties

- P1: The reduced tests detect incorrect credential destinations and missing remote-handle cleanup. /Users/raillyhugo/Programming/railly/skills/foundry/runs/simplify/2026-09-28-agent-browser-2014/coverage-model.json
- P2: PR additions fall from 731 to 483, including test additions from 496 to 248, with production unchanged. /Users/raillyhugo/Programming/railly/skills/foundry/runs/simplify/2026-09-28-agent-browser-2014/after-metrics.json

## Deterministic checks

- `rust unit and integration`: pass. 1392 unit, 6 integration; unit-final.log.
- `auth e2e`: pass. 6 tests including consolidated 26-row matrix; auth-final.log.
- `fmt`: pass. fmt-final.log; subsequent Clippy ran after set -e.
- `CI Clippy`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/simplify/2026-09-28-agent-browser-2014/clippy-ci-final.log
- `all-target Clippy`: acknowledged. Three base-present warnings outside changed code: browser.rs unbounded range, cdp/client.rs large error, e2e screenshot chunks_exact; production-and-lint-proof.json.
- `style`: pass. gate-style-final.log
- `surfaces`: acknowledged. Mechanical file-level trigger only: actions.rs changes exclusively test module, so user-facing surfaces have no reduction delta.
- `timings`: pass. No added wait ceiling.
- `git diff --check`: pass. No whitespace errors.
- `exact reviewed state`: pass. validated-state.json records the two final file digests and staged diff.
- `signed commit`: pass. New signed append-only commit; same validated file hashes and clean worktree.

## Judgment lenses

- Inverse regression surface: run. Independent frozen-packet review and accepted disposition; review.md.
- New-domain matrix: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Resolution-rule consistency across consumers: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Shell re-parse append domain: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Emission channel and one-shot latch reachability: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Shim hermeticity: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Deliberate-default check: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Fresh-seam scan: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Substrate differential corpus: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Reference-implementation oracle: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- New-failure-outcome propagation: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Flag-propagation dispatch sweep: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Error-path forcing: run. Independent frozen-packet review and accepted disposition; review.md.
- Non-destructive recovery: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Cancellation and timeout hygiene: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Boundary pipeline trace: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Substrate verification: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Dogfood the built artifact: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Newly-asserted invariant ownership: run. Independent frozen-packet review and accepted disposition; review.md.
- Docs-behavior parity: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Demonstrative example: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Choice audit: skipped. No corresponding runtime mechanism changes in this test-only diff; prior full implementation review remains historical.
- Complexity budget: run. Independent frozen-packet review and accepted disposition; review.md.

## Findings

- R1: refuted, not_applicable. Merged mock fails to compile from removed imports. Evidence: Module-wide use super::* exists later; final 1392 tests compiled and passed.
- R2: confirmed, fixed. Visible submit click assertion was dropped. Evidence: Added visibleClicked marker and assertion; final auth E2E passes.

## Gaps

- Native reviewer attempts exceeded the per-operation failure limit; two acknowledgements are not counted as reviews.
- Independent FX review completed via stored Fireworks credential, but no packaged vercel-ai-gateway/API-key-mode receipt exists.

## Limits and provenance

- Author model: Codex
- Reviewer model: moonshotai/kimi-k3-fast via Fireworks
- Same family: no
- Independent challenge: satisfied. Reviewer traced each removed row to retained invariant coverage; false compile finding refuted by compiler and later module import, visible-click assertion restored.
