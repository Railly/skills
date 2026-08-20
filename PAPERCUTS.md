# Papercuts

Small friction found while working in this repository: a script that died, a stale
doc, a hook that failed silently, a hardcoded path, a confusing step. One line each,
logged the moment it happens.

```bash
echo "- [$(date -u '+%Y-%m-%dT%H:%MZ')] <what you were doing> -> <what got in the way> (probable fix: <guess>)" >> PAPERCUTS.md
```

Distinct from a case, which records a transferable lesson from real maintenance work,
and from an issue, which records a defect in shipped behavior. This file records
friction in the workflow itself.

## Open

- [2026-08-20T04:00Z] running review-gate from a session -> the installed copy under a vault's `.agents/skills` is a physical directory, not a symlink, so it silently freezes at install time and the running method is not the canonical one (probable fix: install by symlink, and let kai-doctor check 2b flag copies that diverge)
- [2026-08-20T04:05Z] aggregating lens coverage over the runs corpus -> `lens.name` is free text with no normalization, so 135 raw strings stood for 83 lenses and every per-lens count was fragmented across spellings (probable fix: normalize on read via `scripts/lib/run-report-identity.mjs`; applied)
- [2026-08-20T04:05Z] counting run reports -> `foundry/runs/review-gate/` holds 142 run reports and 81 Radius impact maps under the same filename convention, so a naive count overstates the corpus by 57% (probable fix: classify by shape via `artifactType`; applied for reading, the directory split is still open)
- [2026-08-20T04:10Z] asking which lens earns its place -> `findings[].source` is the bare string "lens" in 334 of 501 findings and never names which one, so per-lens yield is structurally unanswerable (probable fix: add a `lens` field to each finding referencing its `lenses[]` entry)
- [2026-08-20T04:10Z] reading a run report's provenance -> it records author and reviewer model but not which version of the method ran, and `schemaVersion` stayed 0 while the schema grew from 7 to 14 fields (probable fix: record a gate version or skill SHA per run, as `foundry/eval-protocol.md` already asks for with `owner/repo@sha`)
- [2026-08-20T04:15Z] running `validate-run-report.mjs --structural` over a July report -> it fails on fields that did not exist yet, so the accumulated corpus cannot be re-validated mechanically (probable fix: version the schema and gate validation on the recorded version)
- [2026-08-20T04:20Z] running `bun scripts/validate-skills.mjs` -> fails with "work-intake: missing maturity registry entry"; the skill is untracked and its round 006 is written, but it has no entry in `foundry/maturity.json` (probable fix: an owner decision on channel and maturity, not an agent one)
