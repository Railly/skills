# Review Gate: vercel-labs/issue-graph

Date: 2026-09-27
Repository: vercel-labs/issue-graph
Base: `8de9132367c6f69859160df40f8235cb6676894b`
Head: `e78e205b141537c6d28486b3c8e1cf68dd166938`
Profile: high-risk
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: pass

## Execution

- Mode: sequential_isolated
- Runtime receipt: security-review-root.json
- Degraded from: none
- Schema failures: 2
- Independence gap: Root performed source/config security review. A native reviewer is still running; no native finding is assumed. Independent high-risk challenge is captured pre-change production GitHub/npm behavior.

## Contract

- Path: contract.md
- Spec status: not_required
- Acceptance reviewed: A1, A2, A3, A4

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. 157 release tests, 736 total tests; seven meaningful mutations fail intended assertions including real process command call sites; restored clean tree and green tests.
- Resilience Audit: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Forced failure before/after GitHub release creation, conflict and lookup failure, plus retained archive after npm acceptance and propagation failures. Recovery never changes archive or tag.
- Security Review: pass

## Verified properties

- P1: Release plan accepts only canonical main push/dispatch identities and skips published versions /Users/raillyhugo/Programming/vercel/issue-graph-evidence/release-automation-2026-09-27/real-plan.outputs; real-published-skip.log; mutation-push-support.log; mutation-plan-command-wiring.log
- P2: Failed publish recovery uses verified retained bytes and outputs publish=false only for identical registry archive /Users/raillyhugo/Programming/vercel/issue-graph-evidence/release-automation-2026-09-27/check-0.log; mutation-retry-byte-verification.log; mutation-prepare-command-wiring.log
- P3: GitHub release shell preserves matching tags and recovers ambiguous or partial creation without duplicate writes /Users/raillyhugo/Programming/vercel/issue-graph-evidence/release-automation-2026-09-27/pressure-results.json; github-release-pressure.sh
- P4: Automatic publication retains scoped OIDC permissions, all consumer dependencies, exact artifact IDs and main-only Release environment /Users/raillyhugo/Programming/vercel/issue-graph-evidence/release-automation-2026-09-27/environment-before.json; environment-after.json; environment-branch-policy.json; check-0.log

## Deterministic checks

- `bun run check`: pass. Lint/typecheck/736 tests/build on frozen source;157 focused release tests; existing informational dashboard lint diagnostics unchanged.
- `style and surfaces`: pass. deterministic-1.log
- `stale release policy and callsites`: pass. Retired manual-only statement absent; all affected callers inspected in changed files.
- `siblings`: acknowledged. Only untouched match is the test reading release.yml from disk; it makes no release policy claim.
- `timings`: pass. 12 attempts, max30second delays,211seconds total wait plus at most360seconds of requests; publish job15minute ceiling. HTTP status retries and exhausted budget tested.
- `force red and restored green`: pass. Seven killed mutants,157 tests restored green, isolated worktree clean.

## Judgment lenses

- Inverse regression surface: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- New-domain matrix: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Resolution-rule consistency across consumers: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Shell re-parse append domain: skipped. No matching change: shell parsing/shims/heuristic recovery/decision trail/per-element complexity/reference implementation replacement are absent.
- Emission channel and one-shot latch reachability: skipped. No matching change: shell parsing/shims/heuristic recovery/decision trail/per-element complexity/reference implementation replacement are absent.
- Shim hermeticity: skipped. No matching change: shell parsing/shims/heuristic recovery/decision trail/per-element complexity/reference implementation replacement are absent.
- Deliberate-default check: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Fresh-seam scan: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Substrate differential corpus: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Reference-implementation oracle: skipped. No matching change: shell parsing/shims/heuristic recovery/decision trail/per-element complexity/reference implementation replacement are absent.
- New-failure-outcome propagation: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Flag-propagation dispatch sweep: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Error-path forcing: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Non-destructive recovery: skipped. No matching change: shell parsing/shims/heuristic recovery/decision trail/per-element complexity/reference implementation replacement are absent.
- Cancellation and timeout hygiene: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Boundary pipeline trace: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Substrate verification: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Dogfood the built artifact: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Newly-asserted invariant ownership: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Docs-behavior parity: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Demonstrative example: run. Scoped to exact release lifecycle, process/registry boundaries, source identity, artifact wiring, bounded failures, and contributor recovery guidance.
- Choice audit: skipped. No matching change: shell parsing/shims/heuristic recovery/decision trail/per-element complexity/reference implementation replacement are absent.
- Complexity budget: skipped. No matching change: shell parsing/shims/heuristic recovery/decision trail/per-element complexity/reference implementation replacement are absent.

## Findings

None.

## Gaps

None.

## Limits and provenance

- Author model: Codex root
- Reviewer model: Root focused pass; native reviewer pending before merge
- Same family: yes
- Independent challenge: satisfied. Captured pre-change real GitHub Actions run accepted npm0.3.2 but failed verification after15seconds on404; live registry state independently supplies absent0.4.0/published0.3.2 classes. Byte identity and immutable version behavior come from the existing publisher/consumer boundary. Native review additionally challenges the frozen diff.
