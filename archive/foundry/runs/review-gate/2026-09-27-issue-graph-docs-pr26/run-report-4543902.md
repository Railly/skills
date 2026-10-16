# Review Gate: vercel-labs/issue-graph

Date: 2026-09-27
Repository: vercel-labs/issue-graph
Base: `9f34143ba67f87647735f532573dcb7dff6c90da`
Head: `454390242864850160deb26a2829aff14a15032d`
Profile: mechanical
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: pass

## Execution

- Mode: sequential_isolated
- Runtime receipt: focused-review.json
- Degraded from: none
- Schema failures: 0
- Independence gap: Same-author focused review; no independent approval. Mechanical documentation profile does not require an independent challenge.

## Contract

- Path: contract.md
- Spec status: not_required
- Acceptance reviewed: A1, A2, A3, A4

## Stage receipts

- Test Strength: not_triggered. No production behavior, parser, serializer, lifecycle, protocol or regression test logic added; existing content assertions point at the modern rerun constant.
- Resilience Audit: not_triggered. No new runtime writes, cleanup, retry, timeout or cancellation behavior.
- Security Review: missing

## Verified properties

- P1: The authored query/config examples reproduce the documented filters, scoped weights and frozen replay. 15 invocations passed, including history rejection; 14 matched open issues meet the documented minimum.
- P2: The new guide is navigable and exact links load the documented filtered view while preserving full embedded data and assets. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/docs-pr26-2026-09-27/checks.json

## Deterministic checks

- `style`: pass. gate.sh style and git diff --check pass.
- `surfaces`: acknowledged. site.ts only adds the modern rerun example constant. discovery.ts and CONTRIBUTING.md do not consume that constant and retain correct install/access guidance.
- `siblings`: acknowledged. Untouched ISSUE_GRAPH_HOME passages in README, status and canonical skill already describe the correct shared state; no duplicate prose needed.
- `stale`: pass. No retired flags remain in README or authored web guides; canonical skill retains only its explicit compatibility list and captured fixtures retain historical provenance.
- `docs and skill tests`: pass. 96 docs tests and 36 bundled-skill tests pass.
- `build and browser`: pass. CLI/static dashboard and production docs build; HTTP suite and agent-browser checks pass.

## Judgment lenses

- Inverse regression surface: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- New-domain matrix: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Resolution-rule consistency across consumers: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Shell re-parse append domain: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Emission channel and one-shot latch reachability: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Shim hermeticity: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Deliberate-default check: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Fresh-seam scan: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Substrate differential corpus: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Reference-implementation oracle: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- New-failure-outcome propagation: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Flag-propagation dispatch sweep: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Error-path forcing: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Non-destructive recovery: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Cancellation and timeout hygiene: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Boundary pipeline trace: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Substrate verification: run. Focused source-contract review plus real extracted CLI examples, filesystem and browser verification recorded in focused-review.json.
- Dogfood the built artifact: run. Focused source-contract review plus real extracted CLI examples, filesystem and browser verification recorded in focused-review.json.
- Newly-asserted invariant ownership: run. Focused source-contract review plus real extracted CLI examples, filesystem and browser verification recorded in focused-review.json.
- Docs-behavior parity: run. Focused source-contract review plus real extracted CLI examples, filesystem and browser verification recorded in focused-review.json.
- Demonstrative example: run. Focused source-contract review plus real extracted CLI examples, filesystem and browser verification recorded in focused-review.json.
- Choice audit: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.
- Complexity budget: skipped. Documentation-only diff does not change the runtime behavior that triggers this lens.

## Findings

None.

## Gaps

None.

## Limits and provenance

- Author model: Codex root agent
- Reviewer model: same Codex root agent
- Same family: yes
- Independent challenge: not satisfied. Mechanical profile uses a focused sequential review and real CLI/browser evidence.
