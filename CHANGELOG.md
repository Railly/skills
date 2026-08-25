# Changelog

## 0.0.6 - 2026-08-24

Staged execution now occupies the span between the solution and review gates, and Test Strength no longer treats an enumerated table or a helper-level red as protection.

### Added

- `software-factory`, an experimental staged execution protocol that fixes thresholds before the diff exists, requires observed command output at every stage boundary, marks unrunnable stages as owed evidence, and ends a run on a repeated repair reversal
- Behavior and trigger evals covering reported completion, post-hoc thresholds, missing stage tooling, repair loops, single-context self-review, and the mechanical-change skip
- Round 011 registering the candidate with its overlap question against `test-strength`, `simplify`, and `work-intake` left open by design

### Changed

- `test-strength` requires falsification at the call site the product executes, not only at the definition site, and reports both results when they differ
- `test-strength` requires a falsifier per enumerated cell, names one gap per unexercised entry instead of an aggregate, and uses entry deletion as the protection check
- The published workflow graph names `software-factory` at the change step instead of unowned implementation

## 0.0.5 - 2026-08-24

Workstream Reconcile turns historical handoffs into a current operating queue by checking their volatile claims against authoritative sources.

### Added

- `workstream-reconcile`, a read-only orchestration skill for reconciling handoffs with live GitHub, local Git, releases, deployments, and package artifacts
- Separate historical delta and current operating-state classifications, including explicit handling for unpushed work, review responses, integration, releases, verification, and proven stalls
- Behavior and trigger evals covering local-only fixes, new human feedback, release lag, age-based false stalls, and degraded GitHub access
- Missing maturity and installer registration for the existing experimental `work-intake` skill, restoring repository validation

### Fixed

- Invalid `xref` YAML frontmatter that caused the installer to omit the skill, plus validator coverage for ambiguous unquoted scalars

## 0.0.4 - 2026-08-14

The contributor-side selection gate is now named for the lifecycle phase it owns: Issue Intake.

### Added

- `issue-intake` as the canonical `backlog -> qualify -> human choice -> Issue Contract seed` skill
- Optional `xref` graph evidence for prioritization and clustering without making it a required dependency or selection authority

### Changed

- Active documentation, workflow diagrams, evals, maturity metadata, and installer references now use `issue-intake`

### Deprecated

- `pick-an-issue`, retained as a self-contained compatibility alias for one release

## 0.0.3 - 2026-08-14

Solution Gate can now audit existing work without letting it define the contract, and renders each decision in the smallest auditable visual instead of defaulting to HTML.

### Added

- Candidate-audit mode for `solution-gate`, which reconstructs the contract and solution shapes before revealing an existing PR or patch
- Primitive-contract mismatch as failure shape S12, harvested from agent-browser #1669
- Additional public case and gate-run evidence from agent-browser, Portless, wterm, gateway-spend, and Vercel Labs Emulate

### Changed

- Solution Gate adapts the smallest-view principle from [HumanLayer's `show-me` skill](https://github.com/humanlayer/skills/tree/main/plugins/show-me/skills/show-me), routing ownership, call flow, contract, state, and diff questions to compact text or Mermaid views while reserving HTML for dense multi-view artifacts
- Visual outputs keep observed evidence and proposed shapes separate, trace observations to probe IDs, and preserve `observed`, `inferred`, and `guessed` marks

### Fixed

- Markdown link validation no longer treats code spans or fenced code as links
- Published case validation for the agent-browser #1669/#1670 trust-store record

## 0.0.2 - 2026-08-08

Unfold was one protocol with four modes. It is now nine skills with their own trigger boundaries, a maturity ladder that separates distribution from evidence, and 56 recorded cases behind them.

### Added

- `review-gate`, the pre-review pass on a diff: deterministic checks first, then review lenses selected by what the diff changes. Harvested from maintainer review rounds and compared against an answer key in a blind replication round
- `record-a-case`, which captures maintenance work as an evidence ledger and keeps validation, human review, maintainer acceptance, and delivery independent
- `solution-gate`, which gates the shape of a fix before it is written: two proposers on different model families, falsifiable predictions probed before synthesis, and scoring against a catalog of recorded fix-failure shapes
- `handoff`, which closes an open working cycle so the next session resumes without rereading the transcript
- `trail-decisions` and `signature-repro` as candidates; `quality-baseline`, `performance-proof`, `test-strength`, and `resilience-audit` as experimental
- The Issue Contract as a phase-neutral state carrier, not an installable skill
- 53 further public-safe cases across agent-browser, portless, wterm, native, radius, petdex, ai-cli, and this repository, bringing the ledger to 56
- Four eval rounds, including a blind replication of `review-gate` against an answer key and a lifecycle audit that reassigned every skill's channel
- `Stable`, `Candidates`, and `Experimental` groups in the interactive installer

### Changed

- Distribution channel and evidence maturity are now separate axes. `foundry/maturity.json` is the source of truth, and a skill can be installable without being validated
- Validation covers frontmatter, progressive disclosure, internal links, maturity metadata, public-case boundaries, Issue Contracts, eval metadata, and executable fixtures
- Live Foundry output stays out of the distribution surface. Run reports, ledgers, and decision trails live under `foundry/`, never inside a skill

### Deprecated

- Unfold, retained under `foundry/deprecated` for provenance. Its modes were absorbed by the skills that replaced them

### Fixed

- The `validate` job, red on `main` since 2026-07-30: an unregistered installer group, a maturity decision path that resolved one directory too deep, run data shipped inside `review-gate`, and a SKILL.md over the size limit

Still dogfooded, not validated. `review-gate` is the only skill compared against a baseline, and that comparison exposed verification losses alongside its catches.

## 0.0.1 - 2026-07-12

First public release of the evidence-driven maintenance workflow.

### Added

- Unfold as a shared mission protocol with Learn, Triage, Change, and Review modes
- Pick an Issue as a contributor-side shortlist, comparison matrix, recommendation, and human-selection gate
- Public-safe maintenance cases and foundry governance
- Trigger, behavior, transfer, and executable fixture infrastructure

### Absorbed

- `guided-contribution` into Unfold Change
- `repro-an-issue` into Unfold Triage
- `prove-the-test` into Unfold Review

The release is dogfooded, not validated. Controlled comparisons remain future work.
