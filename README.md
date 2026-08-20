# Agentic Engineering, Applied

**Evidence-driven methods, dogfooded on real engineering work.**

These skills turn real engineering work into portable agent protocols. They favor retrievable evidence over confident prose and keep public methods agnostic across repositories, stacks, editors, and agents.

## Skills

### Issue Intake

[Issue Intake](skills/issue-intake) surveys an external backlog, qualifies three to five candidates, presents an evidence-backed comparison matrix, recommends one, and lets the user make the final choice. It can use `xref` as an optional graph backend, but keeps qualification and selection at the skill boundary. It ends at selection and creates the canonical Issue Contract seed.

### Record a Case

[Record a Case](skills/record-a-case) captures completed, interrupted, or backfilled maintenance work as an evidence ledger. It keeps validation, human review, maintainer acceptance, and delivery independent.

### Review Gate

[Review Gate](skills/review-gate) runs a pre-review pass on a diff before pushing: deterministic checks first, then focused review lenses selected by what the diff changes. External review findings are harvested back into the catalog.

### Solution Gate

[Solution Gate](skills/solution-gate) orchestrates Shaping before implementation. It freezes an evidence-backed contract, runs isolated Shaping passes, probes their weakest assumptions, feeds evidence back into their fit checks, and gates the surviving shape before detailing, breadboarding, or slicing.

## Issue Contract

The [Issue Contract](foundry/missions) is a phase-neutral state carrier, not an installable skill. It preserves outcome, observed and expected behavior, acceptance IDs, non-goals, invariants, change surface, verification claims, risk, promotion state, and the exact handoff command.

## Candidate skills

Candidate skills are installable methods ready for focused dogfooding.

### Trail Decisions

[Trail Decisions](skills/.experimental/trail-decisions) keeps an append-only implementation decision trail so review can inspect choices and evidence, not only the final diff.

### Signature Repro

[Signature Repro](skills/.experimental/signature-repro) investigates platform-specific or hardware-dependent bugs through structural and visual signatures observable on available machines.

## Experimental skills

Experimental skills have coherent trigger and method contracts, but still need real-work cases and baseline comparison.

### Before After

[Before After](skills/.experimental/before-after) turns a bug fix, feature, benchmark, or migration into a minimal browser-openable comparison. It puts old and new behavior on one shared basis, supports screenshotable visual repros, exact benchmark tables, and small feature simulators, and uses the official Vercel report foundation.

### Handoff

[Handoff](skills/.experimental/handoff) closes a working cycle so the next session resumes without rereading the transcript. It verifies state against git before asserting it, keeps delivery, verification, and human judgment independent, and stacks each session onto the prior document instead of overwriting it. Closed work with a transferable lesson goes to Record a Case instead.

### Quality Baseline

[Quality Baseline](skills/.experimental/quality-baseline) identifies repository-wide quality gaps before changes, rejects unsupported findings, and ranks one measurable pilot.

### Performance Proof

[Performance Proof](skills/.experimental/performance-proof) joins profiling, complexity analysis, representative benchmarks, semantic checks, and regression guards before accepting an algorithm or data-structure change.

### Test Strength

[Test Strength](skills/.experimental/test-strength) proves that tests detect the intended defect using falsification, mutation, properties, real boundaries, and artifact checks.

### Resilience Audit

[Resilience Audit](skills/.experimental/resilience-audit) forces timeouts, cancellation, retries, partial state, overload, cleanup, dependency failure, and concurrency paths.

### Simplify

[Simplify](skills/.experimental/simplify) reduces code, diff size, duplication, tests, and maintenance surface within a bounded target while preserving behavior and proving that consolidated regression protection still detects defects.

### Xref

[Xref](skills/.experimental/xref) snapshots the complete reference graph around a GitHub issue or pull request to surface competing work, orphans, structural links, and file-overlap risks before work begins.

## Workflow

```mermaid
flowchart LR
  Baseline[quality-baseline] --> Gap[Verified gap]
  Backlog[Issue backlog] --> Intake[issue-intake]
  Intake --> Choice{User chooses}
  Gap --> Choice
  Choice --> Contract[Issue Contract]
  Contract --> Reproduce[Reproduce and map]
  Reproduce --> Gate[solution-gate]
  Gate --> Shape[shaping]
  Shape --> Change[Implement acceptance IDs]
  Change --> Proof[Deterministic proof]
  Proof --> Spec[Spec review]
  Spec --> Review[review-gate]
  Review --> Case[record-a-case]
  Case --> Result[Evidence-backed result]
  Change -.cycle ends open.-> Handoff[handoff]
  Handoff -.next session.-> Change
```

Enter at the earliest incomplete state. A reproduced issue can begin at implementation, and an existing diff can begin at proof or review.

Not every cycle reaches a case. When work stops with the cycle still open, `handoff` carries state to the next session; `record-a-case` takes over once the work closes and leaves a transferable lesson.

## Maturity

Distribution channel and evidence maturity are separate. Stable contains four canonical skills. Solution Gate is stable by explicit human promotion backed by multiple dogfood runs, while its orchestration redesign and formal baseline comparison remain unevaluated. Candidate and Experimental skills remain installable without implying validation.

The source of truth is [foundry/maturity.json](foundry/maturity.json).

| State | Meaning |
|---|---|
| experimental | Coherent method and trigger boundary, without real-work use |
| dogfooded | Used on real work, without a reliable baseline comparison |
| evaluated | Compared against a baseline, but evidence remains incomplete or inconclusive |
| validated | Repeatable positive effect across holdouts and trials, with human review |
| deprecated | Retained for provenance but no longer recommended |

## Install

Install interactively into supported agents:

```bash
bunx skills add Railly/skills
```

The interactive installer exposes three distinct groups: `Stable`, `Candidates`, and `Experimental`. Install only the stable surface with:

```bash
bunx skills add Railly/skills --skill issue-intake --skill record-a-case --skill review-gate --skill solution-gate
```

Install a candidate explicitly with:

```bash
bunx skills add Railly/skills --skill signature-repro
```

Install an experimental skill explicitly with:

```bash
bunx skills add Railly/skills --skill quality-baseline
```

`--all` includes all three groups.

Or clone and link one skill:

```bash
git clone https://github.com/Railly/skills.git ~/railly-skills
ln -s ~/railly-skills/skills/review-gate ~/.claude/skills/review-gate
```

For Codex, Cursor, and other compatible agents, install or link the same folder under the corresponding project or personal skills directory.

## Repository structure

```text
skills/                 stable installable surface
skills/.experimental/   candidate and experimental installable surfaces
cases/                  public-safe evidence ledger
foundry/                governance, lessons, eval rounds, live runs, and decisions
scripts/                deterministic validation and eval machinery
```

Stable skills stay flat. Candidate and Experimental skills use the standard `skills/.experimental/` catalog recognized by the skills CLI. The maturity registry assigns their distribution channel, and the plugin manifest supplies the visible `Stable`, `Candidates`, and `Experimental` installer groups.

All cases, evals, run reports, decision trails, and Foundry logs follow the [canonical source repository policy](foundry/source-of-truth.md). Installed copies under `.agents/skills`, `.claude/skills`, or another agent directory are read-only distribution surfaces.

## Skill foundry

Real work becomes a case before it becomes an instruction:

```text
maintenance work
→ case
→ candidate lesson
→ baseline comparison
→ human review
→ promote, absorb, or reject
```

Read the [foundry overview](foundry), [governance](foundry/governance.md), [source repository policy](foundry/source-of-truth.md), [Issue Contract workflow](foundry/missions), [eval protocol](foundry/eval-protocol.md), and [case template](foundry/case-template.md). Deprecated methods and the archived Unfold protocol remain under [foundry/deprecated](foundry/deprecated).

Public issues and pull requests may become public cases. Confidential evidence stays in an organization-approved private system; only generalized, sanitized lessons cross into this repository.

## Validate

```bash
bun scripts/validate-skills.mjs
bun scripts/validate-issue-contracts.mjs
bun scripts/verify-eval-fixtures.mjs
```

CI checks frontmatter, progressive disclosure, internal links, maturity metadata, public-case boundaries, Issue Contracts, eval metadata, and executable fixtures.

## License

MIT (c) Railly Hugo
