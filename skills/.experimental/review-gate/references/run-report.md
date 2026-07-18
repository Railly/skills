# Run report — schema v0

Every gate run emits one JSON file to `evals/runs/<date>-<repo>-<shortsha>.json` alongside the prose report. Same content, two views: prose for the human, JSON for the ledger. The runs directory is the dataset that makes the step-6 decision review (n≈20) computable; without it, calibration questions stay unanswerable.

While `schemaVersion` is 0 the schema mutates freely during dogfood — record friction inline here or in PAPERCUTS.md, change the shape, move on. CLI hardening (fail-closed validation, ledger append) waits until the schema survives 5 consecutive runs unchanged.

## Schema

```json
{
  "schemaVersion": 0,
  "run": {
    "date": "YYYY-MM-DD",
    "repo": "",
    "base": "",
    "head": "",
    "status": "complete|incomplete",
    "gaps": []
  },
  "provenance": {
    "author_model": "",
    "reviewer_model": "",
    "same_family": false
  },
  "lenses": [
    { "name": "", "status": "run|skipped", "reason": "" }
  ],
  "deterministic": [
    { "check": "", "outcome": "pass|finding-fixed|acknowledged", "reason": "" }
  ],
  "findings": [
    {
      "id": "",
      "state": "confirmed|unverified|refuted|exempted|issue_candidate",
      "claim": "",
      "evidence": "",
      "layer": "",
      "source": "lens|gate|map",
      "path": ""
    }
  ],
  "exemptions": [
    { "claim": "", "evidence": "" }
  ],
  "issue_candidates": [
    { "title": "", "evidence": "", "why_out_of_scope": "" }
  ]
}
```

## Field semantics

These restate the SKILL.md rules as data constraints — a report violating them is malformed even if the JSON parses:

- **`run.status: incomplete`** — set whenever a lens runtime dies, a deterministic check could not run, or any step's complete-when was not reached. Each cause goes in `run.gaps` as one sentence. An incomplete run is never presented as a pass; this is the run-level twin of "a verification gap is not a refutation".
- **`provenance.same_family: true`** — author and reviewer share a model family. Recorded, not blocking, but the prose report must carry a visible warning: a same-family reviewer shares the author's priors and blind spots.
- **`findings[].state`**:
  - `confirmed` — evidence attached, reproduced or forced at the layer of the claim.
  - `unverified` — the empirical layer was unavailable; the gap is named in `evidence`. Never silently dropped.
  - `refuted` — carries the refutation, at the claim's own layer (a unit test of a callee does not refute a caller-ordering claim).
  - `exempted` — an absence or silence exonerated; its one-sentence evidence lives in `evidence` and is mirrored in `exemptions`. An exemption whose evidence cannot be stated in one sentence is a finding, not an exemption.
  - `issue_candidate` — real defect outside the diff's scope; mirrored in `issue_candidates` with why it is out of scope.
- **`findings[].layer`** — the layer of the claim (caller ordering, end-to-end path, contract narrowing, unit seam...). This is what makes "refute at the layer of the claim" checkable after the fact.
- **`findings[].source`** — `gate` (deterministic layer), `lens` (judgment pass), `map` (Impact Map convergence/confidence item). `path` carries the propagation path (`X → Y via call`) when the source is the map.
- **`lenses[].status: skipped`** requires a `reason`. Every catalog lens appears in the array — the step-3 complete-when, as data.
- **`deterministic[].outcome: acknowledged`** requires a `reason` — the step-2 rule that nothing is skipped silently.

## Frozen until signal

Explicit, so it does not get re-litigated per session:

- **CLI hardening** (validate fail-closed, ledger append, `gate init`): after 5 consecutive runs with no schema change.
- **Lens calibration / agreement metrics / adjudication**: frozen until the gate-miss ledger reaches n≈20 *and* the misses concentrate in the judgment layer. If the misses turn out to be missing deterministic gates, the jury machinery is never needed.

Fixture: `evals/runs/_example.json` is a synthetic minimal instance kept in sync with this schema.
