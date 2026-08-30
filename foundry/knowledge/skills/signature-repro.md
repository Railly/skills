# Skill provenance: signature-repro

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "signature-repro",
  "summary": "Signature Repro was applied as written to agent-browser #1461 when the reporter platform was unavailable.",
  "patterns": [],
  "evidence": [
    {
      "path": "cases/agent-browser/1461-doctor-version-query-hang.md",
      "relationship": "application",
      "visibility": "public",
      "status": "active"
    }
  ],
  "decisions": [
    "foundry/rounds/006-usage-based-reclassification/README.md"
  ],
  "gaps": [
    {
      "id": "gap.signature-repro.baseline-comparison",
      "description": "Compare structural-signature triage against an unstructured unavailable-platform investigation."
    }
  ]
}
```

## Provenance

The #1461 case states that Signature Repro and Solution Gate were both applied as written and needed no revision. Round 006 read and classified that hit before promoting maturity.

## Remaining boundary

The niche method has one applied case and no baseline comparison.
