# Skill provenance: test-strength

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "test-strength",
  "summary": "Test Strength has public application records where deliberate mutations failed at the intended behavioral assertions and recovered after restoration.",
  "patterns": [],
  "evidence": [
    {
      "path": "foundry/runs/test-strength/2026-08-19-json-render-311.md",
      "relationship": "application",
      "visibility": "public",
      "status": "active"
    },
    {
      "path": "foundry/runs/review-gate/2026-08-11-portless-366-60394ae.md",
      "relationship": "transfer",
      "visibility": "public",
      "status": "active"
    }
  ],
  "decisions": [
    "foundry/rounds/006-usage-based-reclassification/README.md"
  ],
  "gaps": [
    {
      "id": "gap.test-strength.baseline-comparison",
      "description": "Compare the method against ordinary test execution on held-out changes."
    }
  ]
}
```

## Provenance

The json-render run records six mutation families, real React boundaries, repeated execution, and one explicit browser-memory gap. Earlier portless runs supplied the evidence used for the dogfooded promotion.

## Remaining boundary

The method has applied and transfer evidence but no controlled baseline comparison.
