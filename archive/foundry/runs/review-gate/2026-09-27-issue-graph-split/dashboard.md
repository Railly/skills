# Review Gate: vercel-labs/issue-graph

Date: 2026-09-27
Repository: vercel-labs/issue-graph
Base: `fcc0d9ec6ec3066fa55956e2465b987f12f3212f`
Head: `77d53c77cb101cc5c83899c5f2e4d6b2c339656d`
Profile: standard
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: native_subagent
- Runtime receipt: none
- Degraded from: none
- Schema failures: 1
- Independence gap: Same-family reviewers; final CSS fixes validated by author.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-27-issue-graph-split/contract.md
- Spec status: not_separately_authored
- Acceptance reviewed: split, granular-commits, pr-state, no-private-data, preserve-original

## Stage receipts

- Test Strength: incomplete. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/split-prs-2026-09-27/dashboard-counts-red.log
- Resilience Audit: incomplete. Existing failure-path tests pass; no current formal stage receipt.
- Security Review: not_triggered. Generic UI metadata and repository count reads; no new credential boundary.

## Verified properties

- P1: Provider-neutral dashboard changes are isolated from Linear integration. All 31 original paths accounted for; all original file hashes remain unchanged.
- P2: Changed boundaries preserve documented local behavior. 650 dashboard tests / 765 integration tests; 45 / 59 package commands; real-data browser checks; Linear docs 96 tests and 90 routes. Live Linear SDK remains a named gap.

## Deterministic checks

- `git diff --check`: pass. Final branch range clean.
- `surfaces`: pass. Canonical conventions gate passed.
- `style`: acknowledged. The only em dash matches represent the unavailable-count UI glyph and its literal documentation, not prose punctuation.
- `tests/typecheck/lint/build/package`: pass. /Users/raillyhugo/Programming/vercel/issue-graph-evidence/split-prs-2026-09-27
- `original worktree preservation`: pass. 31 SHA-256 digests equal the pre-split manifest.

## Judgment lenses

- focused correctness: run. focused correctness review
- built artifact: run. Local package installation and browser/docs checks.
- remaining catalog: skipped. User requested rapid split/publication; full formal gate explicitly incomplete.

## Findings

- D1: confirmed, fixed. Superseded marker missing CSS category Evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-27-issue-graph-split/reviewer-messages.json
- D2: confirmed, fixed. PR path markers missing hover outline Evidence: Computed hover stroke 2.5px; superseded marker has inset box shadow.

## Gaps

- Formal Test Strength and Resilience receipts were not regenerated for this split; prior tests and mutation evidence are retained without claiming a complete formal gate.
- Reviewer uses the same model family; no cross-family assurance.

## Limits and provenance

- Author model: gpt-6
- Reviewer model: inherited parent model
- Same family: yes
- Independent challenge: not satisfied. focused correctness review
