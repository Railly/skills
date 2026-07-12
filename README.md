# Railly Skills

**Evidence-driven methods for agentic engineering, dogfooded on real maintenance work.**

Railly Skills turns real maintenance work into portable agent protocols. It favors retrievable evidence over confident prose and keeps public methods agnostic across repositories, stacks, editors, and agents.

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

## Workflow

```mermaid
flowchart LR
  Backlog[Issue backlog] --> Pick[pick-an-issue]
  Pick --> Choice{User chooses}
  Choice --> Triage[Unfold Triage]
  Learn[Unfold Learn] -. supports .-> Triage
  Triage --> Change[Unfold Change]
  Change --> Review[Unfold Review]
  Review --> Result[Evidence-backed result]
```

Each mode can also be entered directly. A diff can begin at Review; a read-only question can remain in Learn.

## Maturity

v0.0.1 is an honest first release, not a validation claim. Both public skills are **dogfooded**. The consolidated Unfold protocol and the Pick an Issue selection matrix still need controlled comparisons against no-skill and prior-skill baselines.

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

Or clone and link one skill:

```bash
git clone https://github.com/Railly/skills.git ~/railly-skills
ln -s ~/railly-skills/skills/unfold ~/.claude/skills/unfold
```

For Codex, Cursor, and other compatible agents, install or link the same folder under the corresponding project or personal skills directory.

## Repository structure

```text
skills/    installable runtime surface
cases/     public-safe evidence ledger
foundry/   governance, candidates, absorbed methods, eval rounds, and decisions
scripts/   deterministic validation and eval machinery
```

The installable surface stays flat while the catalog is small. Candidate and absorbed methods live outside `skills/` so they cannot be installed accidentally.

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
