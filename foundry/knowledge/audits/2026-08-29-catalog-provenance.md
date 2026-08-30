# Catalog provenance audit

Date: 2026-08-29
Scope: all 19 skills in `foundry/maturity.json`

## Method

The audit started from the maturity decision for each skill, then searched `cases/`, `foundry/runs/`, and `foundry/rounds/` for representative application evidence and known gaps. The sources selected into provenance were read before classification. A skill-name mention, planned invocation, filename collision, generic output shape, or raw invocation count was not classified as application evidence.

When the corpus supported a real application, the provenance page links one compact representative record. When the decision asserted use without a retrievable method record, the page preserves an explicit gap. No missing case was reconstructed from inference.

## Decisions

| Skill | Classification | Representative evidence or gap |
|---|---|---|
| `before-after` | gap | Repeated private use reported, no public application case |
| `factory-loop` | applied | `cases/skills/factory-loop-v0.0.8-exact-state-release.md` |
| `handoff` | gap | Human override, repository case explicitly owed |
| `herdr-workstreams` | gap | Originating design session, no end-to-end setup run |
| `issue-intake` | evaluated, gap | Focused boundary A/B, no renamed-procedure application case |
| `performance-proof` | gap | Search hit was a title collision, not an application |
| `quality-baseline` | applied | `cases/portless/369-partial-write-orphan-block.md` |
| `record-a-case` | gap | Corpus exists, but historical records omit explicit procedure application |
| `resilience-audit` | applied, registry drift | `foundry/runs/resilience-audit/2026-08-12-wterm-116.md` |
| `review-gate` | applied and evaluated | Agent-browser dogfood case plus blind round 002 |
| `signature-repro` | applied | `cases/agent-browser/1461-doctor-version-query-hang.md` |
| `simplify` | applied | Public-safe application ledger in round 009 |
| `software-factory` | gap | Contract tests only, registration says no real run |
| `solution-gate` | applied | `foundry/runs/solution-gate/2026-07-29-portless-367-c0862b9.md` |
| `test-strength` | applied and transferred | Direct json-render run plus portless Review Gate use |
| `trail-decisions` | gap | Candidate hit was a future-tense handoff note |
| `work-intake` | gap | Registered contract, no real assessment record |
| `workstream-reconcile` | applied | Two real reassessments summarized in round 011 |
| `xref` | applied | Public run corpus across five issue or pull-request families |

## Result

All 19 registered skills now have one provenance page. Four current non-experimental maturity claims remain unsupported by active application evidence in the repository graph: `before-after`, `handoff`, `issue-intake`, and `record-a-case`. They remain visible warnings until a new case is recorded or a human changes maturity. The audit does not mutate maturity automatically.

The exhaustive audit covers all 276 current exact-token skill-file pairs across `cases/`, `foundry/runs/`, and `foundry/rounds/`. Each pair has a reviewed classification, application-support verdict, rationale, and fingerprint in `2026-08-29-textual-match-audit.json`. No unselected textual match is silently treated as evidence.
