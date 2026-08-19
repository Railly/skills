# Run report: schema v0

Every gate run emits one JSON file to `foundry/runs/review-gate/<date>-<repo>-<shortsha>.json` under the canonical source root, alongside the prose report. Same content, two views: prose for the human, JSON for the ledger. The runs directory is the dataset that makes the step-6 decision review (n≈20) computable; without it, calibration questions stay unanswerable.

While `schemaVersion` is 0 the schema mutates freely during dogfood: record friction inline here or in PAPERCUTS.md, change the shape, move on. CLI hardening (fail-closed validation, ledger append) waits until the schema survives 5 consecutive runs unchanged.

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
    "verdict": "pass|findings|incomplete",
    "gaps": []
  },
  "contract": {
    "path": "",
    "spec_status": "not_provided|pending|pass|fail|not_applicable",
    "acceptance_reviewed": [],
    "gaps": []
  },
  "provenance": {
    "author_model": "",
    "reviewer_model": "",
    "same_family": false
  },
  "risk": {
    "level": "standard|high",
    "triggers": [],
    "independent_challenge": {
      "required": false,
      "satisfied": true,
      "method": "cross_family_review|human_review|reference_oracle|substrate_corpus|not_required",
      "artifact": "relative/or/absolute/local-artifact.txt",
      "evidence": ""
    }
  },
  "claim_inventory": [
    {
      "source": "contract|design|user_facing|implementation",
      "location": "",
      "status": "reviewed|not_provided|not_applicable",
      "properties": [],
      "evidence": ""
    }
  ],
  "properties": [
    {
      "id": "",
      "claim": "",
      "kind": "correctness|confidentiality|integrity|availability|durability|atomicity|authorization|lifecycle|other",
      "status": "verified|unverified",
      "oracle": {
        "observes": "",
        "layer": "",
        "method": "",
        "proxy_only": false
      },
      "proxy_challenge": {
        "proxy": "",
        "counterexample": "",
        "attempted": true,
        "outcome": "separated|not_separated",
        "evidence": ""
      },
      "substrates": [
        {
          "name": "",
          "status": "exercised|unverified",
          "evidence": ""
        }
      ],
      "evidence": ""
    }
  ],
  "behavioral_strength": {
    "assessment": "required|not_required",
    "triggers": [],
    "dimensions": {
      "values": [],
      "exclusions": [],
      "evidence": ""
    },
    "oracle": {
      "source": "",
      "independent": true,
      "evidence": ""
    },
    "producer": {
      "name": "",
      "status": "exercised|unverified|not_applicable",
      "evidence": ""
    },
    "falsification": [
      {
        "mutation": "",
        "red_evidence": "",
        "restored_green_evidence": ""
      }
    ],
    "evidence": ""
  },
  "assumptions": [
    {
      "id": "",
      "source": "",
      "claim": "",
      "status": "verified|unverified|refuted",
      "evidence": ""
    }
  ],
  "side_effects": {
    "assessment": "none|present",
    "evidence": "",
    "commit_points": [
      {
        "id": "",
        "effect": "",
        "owner": "",
        "commit_event": "",
        "later_fallible_stages": [],
        "failure_partitions": [
          {
            "ownership_region": "",
            "covers": [],
            "forced": true,
            "residual_observed": "",
            "cleanup_owner": "",
            "retry": {
              "attempted": true,
              "outcome": "success|documented_recovery|failed",
              "evidence": ""
            },
            "evidence": ""
          }
        ]
      }
    ]
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
      "path": "",
      "resolution": "open|fixed|not_applicable"
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

These restate the SKILL.md rules as data constraints: a report violating them is malformed even if the JSON parses:

- **`run.status: incomplete`**: set whenever a lens runtime dies, a deterministic check could not run, or any step's complete-when was not reached. Each cause goes in `run.gaps` as one sentence. An incomplete run is never presented as a pass; this is the run-level twin of "a verification gap is not a refutation".
- **`run.verdict`** separates execution completion from approval. `pass` requires `run.status: complete`, no gaps, every proof obligation resolved, and no open `confirmed` or `unverified` finding. A completed review may still have `verdict: findings`.
- **`contract.spec_status`** records the state supplied by a separate Spec review. Review Gate never promotes it to `pass`. When no Issue Contract or Spec result was supplied, use `not_provided` or `not_applicable` and explain any delivery impact in `contract.gaps`.
- **`provenance.same_family: true`**: author and reviewer share a model family. Recorded, not blocking, but the prose report must carry a visible warning: a same-family reviewer shares the author's priors and blind spots.
- **`risk.level: high`**: use when the change handles secrets, auth, destructive operations, durable or externally visible state, concurrency, process lifecycle, cross-platform guarantees, or remote side effects. High risk requires `independent_challenge.satisfied: true`.
- **`risk.independent_challenge.artifact`**: a non-empty local file containing the durable review output, trace, corpus, or report. Relative paths resolve from the run report. An unchecked URL or a claim that another reviewer was used is not auditable evidence.
- **`claim_inventory`**: contains exactly the four source classes `contract`, `design`, `user_facing`, and `implementation`. Each is reviewed and maps its material claims to property IDs, or records `not_provided` or `not_applicable` with evidence. This makes omission visible before proof begins.
- **`properties`**: the proof ledger. Every material changed property appears once. `oracle.observes` names the property, not the implementation signal used as a proxy. A complete run requires every property to be `verified`, `proxy_only: false`, and every listed substrate to be `exercised` with evidence.
- **`properties[].proxy_challenge`**: names the convenient implementation observable, constructs a state where it could hold while the property fails, and executes that counterexample. `separated` means the proxy was falsified as an oracle and cannot be the property evidence. `not_separated` means this attempt did not distinguish them; the direct oracle is still required.
- **`behavioral_strength`**: always present. Set `assessment: required` when the diff implements or changes a protocol, parser, serializer, state machine, lifecycle, browser or OS event translation, adapter, or compatibility layer. A required assessment names its triggers, records an explicit dimension table and justified exclusions, uses an oracle independent of production, exercises the real input producer, and carries at least one bug-specific red/restored-green mutation. `not_required` needs one-sentence evidence. A selected example list is not a dimension table, and a hand-built object is not real-producer evidence.
- **`assumptions`**: every carried assumption from the design gate, issue contract, implementation trail, or subsystem model. A complete run contains no `unverified` or `refuted` assumption.
- **`side_effects.assessment`**: always explicit. `none` requires evidence explaining why the diff creates no durable or externally visible commit point. `present` requires at least one commit point.
- **`commit_points[].later_fallible_stages`**: enumerate every stage that can fail after the effect becomes durable or externally visible. `failure_partitions[].covers` must cover every stage at least once. Each partition names its ownership region, is forced, records residual state and cleanup ownership, and immediately retries the same user operation. A complete run accepts only `success` or an already documented recovery path.
- **`findings[].state`**:
  - `confirmed`: evidence attached, reproduced or forced at the layer of the claim.
  - `unverified`: the empirical layer was unavailable; the gap is named in `evidence`. Never silently dropped.
  - `refuted`: carries the refutation, at the claim's own layer (a unit test of a callee does not refute a caller-ordering claim).
  - `exempted`: an absence or silence exonerated; its one-sentence evidence lives in `evidence` and is mirrored in `exemptions`. An exemption whose evidence cannot be stated in one sentence is a finding, not an exemption.
  - `issue_candidate`: real defect outside the diff's scope; mirrored in `issue_candidates` with why it is out of scope.
- **`findings[].resolution`**: `open` blocks a pass; `fixed` records a finding corrected before the final exact-head gate; `not_applicable` is only for exempted, refuted, or issue-candidate entries.
- **`findings[].layer`**: the layer of the claim (caller ordering, end-to-end path, contract narrowing, unit seam...). This is what makes "refute at the layer of the claim" checkable after the fact.
- **`findings[].source`**: `gate` (deterministic layer), `lens` (judgment pass), `map` (Impact Map convergence/confidence item). `path` carries the propagation path (`X → Y via call`) when the source is the map.
- **`lenses[].status: skipped`** requires a `reason`. Every catalog lens appears in the array: the step-3 complete-when, as data.
- **`deterministic[].outcome: acknowledged`** requires a `reason`: the step-2 rule that nothing is skipped silently.

## Frozen until signal

Explicit, so it does not get re-litigated per session:

- **CLI hardening** (validate fail-closed, ledger append, `gate init`): after 5 consecutive runs with no schema change.
- **Lens calibration / agreement metrics / adjudication**: frozen until the gate-miss ledger reaches n≈20 *and* the misses concentrate in the judgment layer. If the misses turn out to be missing deterministic gates, the jury machinery is never needed.

Fixture: `evals/run-report-example.json` is a synthetic minimal instance kept in sync with this schema.

Validate with:

```bash
scripts/gate.sh report <run-report.json>
```
