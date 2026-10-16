# Review Gate: vercel-labs/issue-graph

Date: 2026-09-27
Repository: vercel-labs/issue-graph
Base: `44a9e181367e42a7e0c1955c9eb75d34b4089c1e`
Head: `c4cc8ba76ab184166e0063d3beeb5e051534c951`
Profile: mechanical
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: pass

## Execution

- Mode: sequential_isolated
- Runtime receipt: focused-review.json
- Degraded from: native_subagent
- Schema failures: 1
- Independence gap: Native reviewer returned workspace acknowledgement, not substantive review. This focused pass is same-author; mechanical profile does not require independent challenge.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-27-issue-graph-docs-audit/contract.md
- Spec status: not_applicable
- Acceptance reviewed: A1, A2, A3, A4

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Ten representative mutations rejected at intended assertions; restored implementation passes. Final 42 targeted tests pass after final text-only corrections. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/review-final-checks.json
- Resilience Audit: not_triggered. No new runtime mutation, lifecycle, retry, timeout or cleanup behavior. Existing storage is documented and exercised.
- Security Review: missing

## Verified properties

- P1: Guides describe actual scopes, defaults, aliases and local writes. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/review-final-checks.json; /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/query.json; /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/replay-after-remove.json; focused-review.json
- P2: Emitted schema covers every advertised command and matches parser defaults. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/mutation-summary.json; /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/mutation-restored.log; /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/final-artifact.json
- P3: Docs source links reflect the public repository and guides cover exported dashboard APIs. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/public-facts.json; /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/browser-source-menu.txt; /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/site-checks.json; /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/library-sample.mjs
- P4: Shorter bundled guidance retains essential routing and boundaries. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/final-artifact.json; /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/review-final-checks.json

## Deterministic checks

- `git diff --check; gate style/surfaces`: pass. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/review-final-checks.json
- `root lint, typecheck, tests and build`: pass. 738 tests pass: /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/core-check-final.log; final metadata recompiled in final-artifact.json.
- `final schema/skill targeted verification`: pass. 42 tests: /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/review-final-checks.json
- `docs lint/typecheck/test/build/routes`: pass. 96 tests and 90 HTTP route checks: docs-check-final.log, docs-build-final.log, docs-routes-final.log; final text refinements reran 96 tests.
- `package consumption`: pass. Node24: 45 commands and 16 fixture calls in package-final.log; final compiled metadata and skill checked separately.
- `force-red and restored green`: pass. Ten targeted mutations rejected: mutation-summary.json.
- `stale-value and documentation-sibling sweep`: pass. Zero hits for retired internal-repository, alias-rejection, blanket 1000-default and partial-schema wording in current guides/help.
- `GitHub CI exact head`: pass. Run 36349720573 succeeded on c4cc8ba76ab184166e0063d3beeb5e051534c951: core, package Node20/22/24, docs production and preview. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-audit-2026-09-27/ci-final.json

## Judgment lenses

- Inverse regression surface: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- New-domain matrix: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Resolution-rule consistency across consumers: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Shell re-parse append domain: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Emission channel and one-shot latch reachability: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Shim hermeticity: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Deliberate-default check: run. Parser checks cover default 80 versus 1000 scopes and reconcile aliases, with falsifying mutations.
- Fresh-seam scan: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Substrate differential corpus: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Reference-implementation oracle: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- New-failure-outcome propagation: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Flag-propagation dispatch sweep: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Error-path forcing: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Non-destructive recovery: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Cancellation and timeout hygiene: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Boundary pipeline trace: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.
- Substrate verification: run. Saved captures, frozen replay URLs, retained query history, and browser edit-source target observed directly.
- Dogfood the built artifact: run. Packed CLI 45-command consumer smoke and live public-repository read-only workflows pass; final compiled schema/skill checked after last text changes.
- Newly-asserted invariant ownership: run. Traced all HTML export and snapshot paths, cluster apply and runs removal; fixed omitted graph dashboard-model write.
- Docs-behavior parity: run. Changed prose checked against help, argument parser, live CLI, library exports and filesystem outputs.
- Demonstrative example: run. Executed the library example with built exports and real captured graph; CLI examples produced query, replay and scoped config artifacts.
- Choice audit: skipped. No decision-trail artifact was created.
- Complexity budget: skipped. No changed runtime dispatch, resolution, lifecycle, input processing or complexity behavior triggers this lens.

## Findings

- F1: confirmed, fixed. Graph local-write schema omitted saved dashboard model on HTML export. Evidence: src/cli.ts wantsHtml path calls writeDashboardModel unless noSnapshot; final docs and schema include it.

## Gaps

None.

## Limits and provenance

- Author model: Codex session (model identifier not recorded)
- Reviewer model: Same-author sequential focused pass
- Same family: yes
- Independent challenge: not satisfied. Mechanical documentation and static command metadata update. No runtime collection, parser, persistence, or permission behavior changes.
