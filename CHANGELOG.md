# Changelog

## Unreleased

### Added

- A schema-v1 work-item manifest with risk profiles, wall-time budgets, transactional stage receipts, outcome telemetry, close-cycle status, and dependency-aware evidence reuse
- A bounded orchestration contract that stops identical invalid Agent calls after the first schema failure and records degraded execution
- Skill installation identity diagnostics for linked, exact-copy, diverged, and missing packages, including canonical package drift from the declared Git revision
- Reversible development-link migration with source-revision preflight, backups, dry-run, and rollback
- Deterministic Review Gate Markdown generation from the validated JSON report

### Changed

- Review Gate is a thin exact-state orchestrator that consumes Test Strength and Resilience Audit receipts instead of duplicating their procedures
- Active Issue Contracts require a validated manifest sidecar, while historical closed missions remain compatible
- Handoff and Record a Case project compact state and outcome annotations from the shared manifest
- CI runs strict SkillKit package audits

## 0.0.10 - 2026-08-31

Security-sensitive changes now have a dedicated threat-boundary review that keeps vulnerability classification separate from the final merge gate.

### Added

- `security-review`, an evaluated experimental skill for attacker modeling, trust boundaries, exploitability chains, safe boundary verification, and merge-relevance classification
- Classification guidance for vulnerabilities, hardening, non-security defects, informational observations, and verification gaps
- An exact-state security receipt contract consumed by Review Gate
- Five behavior evals covering DNS rebinding, equivalent-authority plugin inheritance, cross-tenant credential leakage, lifecycle defects, missing deployment assumptions, and security-keyword near misses
- Round 014 recording the ownership boundary and the 100% versus 89.3% baseline result

## 0.0.9 - 2026-08-30

Skill usage can now become durable private evidence, and repeated cases can compile into reusable knowledge without turning raw sessions into public artifacts.

### Added

- Private usage receipt compilation with explicit redaction, provenance, confidence, and review boundaries
- A compiled knowledge layer connecting cases, patterns, skill guidance, and impact evidence
- An atomic proposal impact loop with candidate, evaluation, falsification, decision, and ledger artifacts
- Knowledge validation, projection checks, textual-match audits, and behavior fixtures in CI

### Changed

- `record-a-case` can capture sanitized receipt-derived cases while preserving the boundary between private evidence and public procedure
- Foundry documentation now defines the source-of-truth and promotion path from evidence to reusable skill guidance

## 0.0.8 - 2026-08-25

The published workflow now has a master router, while staged execution keeps ownership of implementation evidence, runs final Test Strength after applicable resilience hardening, and can materialize independent passes visibly through Herdr.

### Added

- `factory-loop`, an experimental orchestrator for earliest-incomplete routing, read-only admission, contract and shape gates, staged execution, separate Spec and Standards verdicts, before/after acceptance, explicit promotion authority, re-entry, and Case capture
- Behavior and trigger evals covering admission, re-entry, resilience ordering, exact-head acceptance, stale evidence, shape-changing feedback, and handoff reconciliation
- Round 013 recording the orchestration boundary and the questions required for promotion

### Changed

- `software-factory` now delegates applicable hardening to `resilience-audit` before final `test-strength`, invalidates dependent evidence whenever a later stage changes code or tests, and retains Herdr as an optional visible runtime adapter
- The README and public workflow graph show `work-intake`, Software Factory, Before After, the human promotion gate, and evidence-aware re-entry

## 0.0.7 - 2026-08-25

Herdr Workstreams turns a selected engineering queue into visible repo-scoped workspaces with one optional portfolio cockpit and specialists launched only when their owning workflow needs them.

### Added

- `herdr-workstreams`, an experimental Herdr runtime adapter with one workspace per exact checkout, an optional single-pane `00-control` cockpit, minimal persistent leads and runtimes, and visible on-demand specialist agents
- Human-readable workspace, tab, pane, and globally unique agent naming, with idempotent reuse based on workspace label plus exact cwd
- Behavior and trigger evals covering queue materialization, external context roots, minimal topology, visible Solution Gate specialists, idempotent resume, portability outside Herdr, and the control-cockpit boundary
- Round 012 registering the adapter as experimental with its first end-to-end dogfood run still owed

### Changed

- `solution-gate`, `software-factory`, and `review-gate` may launch their agent-backed passes visibly through Herdr while retaining ownership of method, evidence, and verdict

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
