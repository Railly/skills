# Skill provenance: simplify

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "simplify",
  "summary": "Simplify was derived from one recorded feature reduction that met a line budget while preserving behavior and verification gates.",
  "patterns": [],
  "evidence": [
    {
      "path": "foundry/rounds/009-register-simplify/README.md",
      "relationship": "application",
      "visibility": "public",
      "status": "active"
    }
  ],
  "decisions": [
    "foundry/rounds/009-register-simplify/README.md"
  ],
  "gaps": [
    {
      "id": "gap.simplify.transfer-baseline",
      "description": "Compare against no skill and broad quality audit on a transfer feature while scoring clarity and behavior preservation."
    }
  ]
}
```

## Provenance

Round 009 records a reduction from 1,450 to 996 additions with shared contracts, malformed-state preservation, Test Strength, Resilience pressure, and external review.

## Remaining boundary

The public-safe round is the application ledger. It omits private project detail and does not provide a transfer baseline.
