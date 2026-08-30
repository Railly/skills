# Compiled Knowledge Layer Current-State Spike

## Context

The Foundry contains a large evidence corpus and an explicit skill maturity lifecycle, but the links between evidence, compiled lessons, and current skill procedures are distributed across prose and directories.

## Goal

Describe the existing evidence surfaces, current provenance mechanics, coverage gaps, and concrete integration points for a compiled knowledge layer.

## Questions

| ID | Question |
|---|---|
| X1-Q1 | Which current directories correspond to raw evidence, decisions, compiled knowledge, and executable procedures? |
| X1-Q2 | How does the repository currently link a registered skill to the evidence that justifies its maturity and content? |
| X1-Q3 | Which registered skills have no direct case mention by skill name? |
| X1-Q4 | Which relationships do current validators enforce, and which remain prose-only? |
| X1-Q5 | Where can a knowledge layer live without entering installed skill packages or target repositories? |

## Findings

### X1-Q1: Existing layers

| Function | Current surface | Observation |
|---|---|---|
| Raw or near-raw execution evidence | `foundry/runs/`, `foundry/trails/`, live mission evidence | Rich but heterogeneous; some run families have JSON schemas, others are prose or artifacts. |
| Consolidated real-work evidence | `cases/` | Cases are evidence ledgers and transferable lessons, not immutable raw transcripts. |
| Decisions and evaluation | `foundry/rounds/`, `foundry/candidates/`, skill evals | Decisions persist, including rejection and gaps, but are organized by round rather than reusable pattern. |
| Project-specific compiled knowledge | `cases/<repo>/conventions.md` | Useful for the next review in one repository, but not a cross-skill knowledge layer. |
| Executable procedure | `skills/`, `skills/.experimental/` | Correctly separated from cases and run reports. |
| Catalog state | `foundry/maturity.json` | Tracks channel, maturity, summary, and one decision path per skill. |

The missing function is a central projection that connects evidence to reusable patterns and patterns to current skill procedures.

### X1-Q2: Current provenance

- `maturity.json` points each skill to a decision round, not to a complete evidence set.
- Some skill documents include case provenance inside prose, references, or gate catalogs.
- `record-a-case` selects a provisional destination, but does not consolidate the new lesson against an existing cross-skill pattern index.
- `review-gate` has the strongest harvest loop. Its cases, gates, conventions, and run reports still require domain knowledge to connect.
- Round 006 used grep plus manual inspection because a textual skill-name match is not proof that the method ran.

### X1-Q3: Catalog coverage snapshot

Snapshot taken on 2026-08-29 from 19 registered skills. Counts below are direct skill-name mentions, not validated applications.

| Skill | Direct case mentions | Direct run mentions | Maturity |
|---|---:|---:|---|
| issue-intake | 1 | 0 | dogfooded |
| record-a-case | 1 | 1 | dogfooded |
| review-gate | 32 | 26 | evaluated |
| solution-gate | 10 | 45 | dogfooded |
| before-after | 0 | 0 | dogfooded |
| factory-loop | 3 | 0 | experimental |
| handoff | 5 | 38 | dogfooded |
| herdr-workstreams | 0 | 0 | experimental |
| performance-proof | 1 | 0 | experimental |
| quality-baseline | 1 | 0 | dogfooded |
| resilience-audit | 0 | 8 | experimental |
| signature-repro | 1 | 0 | dogfooded |
| simplify | 0 | 1 | dogfooded |
| software-factory | 1 | 2 | experimental |
| test-strength | 2 | 10 | dogfooded |
| trail-decisions | 0 | 2 | experimental |
| work-intake | 0 | 0 | experimental |
| workstream-reconcile | 0 | 0 | dogfooded |
| xref | 2 | 25 | dogfooded |

This snapshot reveals discovery gaps, not final maturity errors. For example, a case may demonstrate a method without naming the skill, while a run may mention a skill without applying it. The knowledge layer needs explicit typed links so neither inference is required.

### X1-Q4: Validation gap

Current validation checks:

- registered skill and maturity entries
- skill frontmatter and internal links
- case schema fields and public-safety rules
- eval and trigger fixture presence
- decision path existence

Current validation does not check:

- every skill has a provenance record
- dogfooded or higher maturity has at least one linked applied case or run
- evidence links resolve and carry a relationship type
- every skill change identifies its motivating patterns
- rejected or superseded proposals remain queryable
- pattern summaries and indexes are current

### X1-Q5: Boundary

The canonical location is a new Foundry-only surface under `foundry/`. It must not live inside installed skill directories, target repositories, or generated website data. Installed packages may contain a small promoted procedure, but not the evidence corpus or proposer memory.

## Acceptance

Complete. We can describe the current surfaces, the missing relationships, the catalog coverage caveat, the validator gaps, and the safe repository boundary for a compiled knowledge layer.
