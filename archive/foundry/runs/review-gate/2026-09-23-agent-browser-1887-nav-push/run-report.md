# Review Gate: vercel-labs/agent-browser

Date: 2026-09-23
Repository: vercel-labs/agent-browser
Base: `c32c6e83a9408e0ca6fa4784a3757851f1e29274`
Head: `b88f469c7c05ed3abaf2264ef940dbbf67e6203a`
Profile: mechanical
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-sha256:02dbea86720f75b4d8bd513340bc5a2590b915ced95790a7d6729e6da7d2d80d`
Verdict: pass

## Execution

- Mode: single_context
- Runtime receipt: none
- Degraded from: native_subagent
- Schema failures: 2
- Independence gap: Native worker acknowledged instructions but did not perform the requested review, including follow-up. Parent performed the focused mechanical review. No independent or cross-family review is claimed.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-23-agent-browser-1887-nav-push/contract.md
- Spec status: pass
- Acceptance reviewed: A1, A2, A3

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-sha256:152b1f2073db38ee43657fc15a138424cb231f05c5b4d643d4228ac306efb833`. The exact tested dirty tree is now committed without any content changes. identity.json verifies the full binary diff and all recorded input hashes. Nine breadcrumb cases failed before the fix and passed after; production suite passed 516 checks.
- Resilience Audit: not_triggered. No runtime state, resource acquisition, retry, cancellation, external mutation or cleanup changes.
- Security Review: missing

## Verified properties

- P1: All nine affected pages have the original independent section in native search, while the existing routes, content and Features membership remain intact. /Users/raillyhugo/Programming/vercel/agent-browser-1887-nav-verification/fix-validation.json; identity.json maps the tested dirty tree to the exact commit.

## Deterministic checks

- `style`: pass. gate.sh style passed.
- `surfaces`: pass. No runtime command path in the surface map changed; legacy navigation already expresses the intended sections.
- `force-red`: pass. Nine intended breadcrumb failures before, nine passes after.
- `Biome format staged JSON`: pass. No formatting changes needed.
- `Exact tested-state identity`: pass. Full diff and recorded source hashes match committed content.
- `Docs test/type-check/build/routes`: pass. 90 unit/oracle checks and 516 production-suite checks; type-check/build pass.
- `Head coverage`: finding-fixed. New commit initially had no report; this report covers the exact commit.
- `Focused mechanical review`: pass. focused-review.md: no findings; same-context limitation documented.

## Judgment lenses

- Inverse regression surface: run. Frozen legacy oracle, WebMCP control, real search/DOM and production route checks verify the narrowed navigation change.
- New-domain matrix: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Resolution-rule consistency across consumers: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Shell re-parse append domain: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Emission channel and one-shot latch reachability: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Shim hermeticity: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Deliberate-default check: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Fresh-seam scan: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Substrate differential corpus: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Reference-implementation oracle: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- New-failure-outcome propagation: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Flag-propagation dispatch sweep: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Error-path forcing: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Non-destructive recovery: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Cancellation and timeout hygiene: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Boundary pipeline trace: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Substrate verification: run. Frozen legacy oracle, WebMCP control, real search/DOM and production route checks verify the narrowed navigation change.
- Dogfood the built artifact: run. Frozen legacy oracle, WebMCP control, real search/DOM and production route checks verify the narrowed navigation change.
- Newly-asserted invariant ownership: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Docs-behavior parity: run. Frozen legacy oracle, WebMCP control, real search/DOM and production route checks verify the narrowed navigation change.
- Demonstrative example: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Choice audit: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.
- Complexity budget: skipped. No corresponding runtime mechanism changed; this diff contains only navigation metadata and test assertions.

## Findings

None.

## Gaps

None.

## Limits and provenance

- Author model: GPT-6
- Reviewer model: GPT-6 (parent focused review)
- Same family: yes
- Independent challenge: not satisfied. Mechanical profile requires one focused review, not a cross-family high-risk challenge.
