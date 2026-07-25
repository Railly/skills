# Agentic Engineering, Applied

**Evidence-driven methods, dogfooded on real engineering work.**

These skills turn real engineering work into portable agent protocols. They favor retrievable evidence over confident prose and keep public methods agnostic across repositories, stacks, editors, and agents.

## Skills

### Unfold

[Unfold](skills/unfold) carries one unfamiliar-codebase mission through the earliest unfinished mode:

| Mode | Outcome |
|---|---|
| Learn | Evidence-backed architecture, flow traces, progressive zoom, and reconstruction |
| Triage | Deterministic red signal, failure map, surviving hypothesis, and Change Surface |
| Change | Complete implementation under `guided`, `execute`, or `execute-with-approval` collaboration |
| Review | Change Surface review, revert proof, restored green, and artifact verification |

The modes reuse one mission and evidence chain instead of restarting repository exploration at every phase.

### Pick an Issue

[Pick an Issue](skills/pick-an-issue) surveys an external backlog, qualifies three to five candidates, presents an evidence-backed comparison matrix, recommends one, and lets the user make the final choice. It ends at selection and hands a bug to Unfold Triage or a specified enhancement to Unfold Change.

### Record a Case

[Record a Case](skills/record-a-case) captures completed, interrupted, or backfilled maintenance work as an evidence ledger. It keeps validation, human review, maintainer acceptance, and delivery independent.

### Review Gate

[Review Gate](skills/review-gate) runs a pre-review pass on a diff before pushing: deterministic checks first, then focused review lenses selected by what the diff changes. External review findings are harvested back into the catalog.

## Candidate skills

Candidate skills are installable methods ready for focused dogfooding.

### Trail Decisions

[Trail Decisions](skills/.experimental/trail-decisions) keeps an append-only implementation decision trail so review can inspect choices and evidence, not only the final diff.

### Signature Repro

[Signature Repro](skills/.experimental/signature-repro) investigates platform-specific or hardware-dependent bugs through structural and visual signatures observable on available machines.

## Experimental skills

Experimental skills have coherent trigger and method contracts, but still need real-work cases and baseline comparison.

### Quality Baseline

[Quality Baseline](skills/.experimental/quality-baseline) identifies repository-wide quality gaps before changes, rejects unsupported findings, and ranks one measurable pilot.

### Performance Proof

[Performance Proof](skills/.experimental/performance-proof) joins profiling, complexity analysis, representative benchmarks, semantic checks, and regression guards before accepting an algorithm or data-structure change.

### Test Strength

[Test Strength](skills/.experimental/test-strength) proves that tests detect the intended defect using falsification, mutation, properties, real boundaries, and artifact checks.

### Resilience Audit

[Resilience Audit](skills/.experimental/resilience-audit) forces timeouts, cancellation, retries, partial state, overload, cleanup, dependency failure, and concurrency paths.

## Workflow

```mermaid
flowchart LR
  Baseline[quality-baseline] --> Gap[Verified gap]
  Backlog[Issue backlog] --> Pick[pick-an-issue]
  Pick --> Choice{User chooses}
  Gap --> Choice
  Choice --> Triage[Unfold Triage]
  Learn[Unfold Learn] -. supports .-> Triage
  Triage --> Change[Unfold Change]
  Change --> Proof[test-strength, performance-proof, or resilience-audit]
  Proof --> Review[review-gate]
  Review --> Case[record-a-case]
  Case --> Result[Evidence-backed result]
```

Each mode can also be entered directly. A diff can begin at Review; a read-only question can remain in Learn.

## Maturity

Distribution channel and evidence maturity are separate. Stable currently contains three dogfooded skills and the evaluated Review Gate. Candidate and Experimental skills remain installable without implying validation.

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
bunx skills add Railly/skills --skill unfold --skill pick-an-issue --skill record-a-case --skill review-gate
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
ln -s ~/railly-skills/skills/unfold ~/.claude/skills/unfold
```

For Codex, Cursor, and other compatible agents, install or link the same folder under the corresponding project or personal skills directory.

## Repository structure

```text
skills/                 stable installable surface
skills/.experimental/   candidate and experimental installable surfaces
cases/                  public-safe evidence ledger
foundry/                governance, lessons, eval rounds, and decisions
scripts/                deterministic validation and eval machinery
```

Stable skills stay flat. Candidate and Experimental skills use the standard `skills/.experimental/` catalog recognized by the skills CLI. The maturity registry assigns their distribution channel, and the plugin manifest supplies the visible `Stable`, `Candidates`, and `Experimental` installer groups.

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

Read the [foundry overview](foundry), [governance](foundry/governance.md), [eval protocol](foundry/eval-protocol.md), and [case template](foundry/case-template.md). Historical methods absorbed into Unfold are recorded under [foundry/deprecated](foundry/deprecated).

Public issues and pull requests may become public cases. Confidential evidence stays in an organization-approved private system; only generalized, sanitized lessons cross into this repository.

## Validate

```bash
bun scripts/validate-skills.mjs
bun scripts/verify-eval-fixtures.mjs
```

CI checks frontmatter, progressive disclosure, internal links, maturity metadata, public-case boundaries, eval metadata, and executable fixtures.

## License

MIT (c) Railly Hugo
