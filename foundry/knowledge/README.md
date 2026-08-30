# Compiled knowledge

This directory is the durable layer between evidence and procedures.

- `patterns/` contains authored transferable knowledge.
- `skills/` contains authored provenance pages for registered skills.
- `impact.jsonl` preserves append-only proposal outcomes, candidate identities, evaluation handles, decisions, and active-skill digests.
- `index.md`, `coverage.md`, and `graph.json` are generated projections.
- `audits/2026-08-29-textual-match-audit.json` classifies every current exact-token skill-file match in the evidence corpus.

Run:

```bash
bun scripts/validate-knowledge.mjs
bun scripts/compile-knowledge.mjs
bun scripts/compile-knowledge.mjs --check
bun scripts/audit-knowledge-matches.mjs --check
bun scripts/build-proposal-packet.mjs record-a-case
bun scripts/record-impact.mjs foundry/runs/proposal-impact/<run>/impact-record.json
```

`--enforce-maturity` upgrades unsupported non-experimental maturity claims from warnings to errors. It stays optional until the three visible prospective evidence gaps are resolved or their maturity changes.

## Authored pattern contract

Every file in `patterns/` has a JSON block under `## Metadata` with:

- `schema_version`: `1`
- `kind`: `pattern`
- `id`: stable `pattern.<slug>` identifier matching the filename
- `title`, `summary`, and `status`
- `evidence`: one or more public repository paths or approved private pointers
- `skills`: named and status-bearing relationships to registered skills
- `supersedes`: referenced pattern IDs

Pattern statuses are `candidate`, `active`, `contradicted`, `superseded`, or `stale`.

## Authored skill provenance contract

Every file in `skills/` has a JSON block under `## Metadata` with:

- `schema_version`: `1`
- `kind`: `skill`
- `skill`: registered skill name matching the filename
- `summary`
- `patterns`: pattern IDs used by the procedure
- `evidence`: case, run, or evaluation relationships
- `decisions`: repository-relative Foundry decisions
- `gaps`: explicit missing evidence, never fabricated proof

The compiler joins these pages with `foundry/maturity.json`. `coverage.md` exposes missing pages, unsupported maturity, applied evidence, linked patterns, and declared gaps across the full catalog.

The initial full-catalog classification is recorded in [the 2026-08-29 provenance audit](audits/2026-08-29-catalog-provenance.md). Its [generated coverage](audits/2026-08-29-textual-match-coverage.md) summarizes the reviewed application, evaluation, decision, reference, planned, and incidental relationships.

Every audited skill-file pair stores a fingerprint of its exact matching lines. A new match, removed match, or changed matching line makes validation fail until a maintainer reads and reclassifies it. Application evidence linked from a provenance page cannot contradict the reviewed audit verdict.

## Proposal impact contract

The packet builder returns only one registered skill's active digest, provenance, linked patterns, prior impacts, reviewed catalog outcomes, and selected evidence handles. A proposal produces one atomic `foundry/runs/proposal-impact/<run>/candidate.patch` or a no-action result outside the active skill tree. The patch must contain exactly one file diff whose old and new headers both name the target's active `SKILL.md`.

Every line in `impact.jsonl` records one unique proposal ID, source patterns or an explicit no-action reason, candidate artifact and digest, all three evaluation variants, decision authority and rationale, active-skill before and after digests, and supersession history. The schema is closed at every object level, so unknown fields fail validation and cannot enter normalized serialization. Rejection, absorption, supersession, and no-change require byte-identical active procedure. Acceptance additionally requires a changed active digest, passing eval evidence, and human authority.

The impact recorder validates the full history before append, verifies the final record after append, and treats an identical retry as a no-op. A reused ID with different bytes fails.

## Evidence relationships

Evidence relationships are `origin`, `application`, `evaluation`, `transfer`, `contradiction`, or `rejection`. Skill relationships are `motivates`, `supports`, `contradicts`, or `supersedes`. Every evidence and skill relationship has status `active`, `contradicted`, `superseded`, or `stale`.

Public evidence must resolve to a tracked file inside this repository. Approved private evidence uses the opaque form `private:<system>:<id>`. Private pointers never contain paths, URLs, credentials, or free-form descriptions.

## Runtime boundary

The installer continues to ship only the selected skill procedure and its disclosed references or scripts. Cases, runs, patterns, provenance pages, and generated projections remain Foundry-side development inputs.
