# Skill provenance: resilience-audit

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "resilience-audit",
  "summary": "Resilience Audit now has public run evidence that forced failure and pressure paths, despite its older experimental registry summary.",
  "patterns": [],
  "evidence": [
    {
      "path": "foundry/runs/resilience-audit/2026-08-12-wterm-116.md",
      "relationship": "application",
      "visibility": "public",
      "status": "active"
    }
  ],
  "decisions": [
    "foundry/rounds/004-skill-lifecycle-audit/README.md"
  ],
  "gaps": [
    {
      "id": "gap.resilience-audit.registry-refresh",
      "description": "Run a promotion round that evaluates the newer application corpus and updates or retains maturity explicitly."
    }
  ]
}
```

## Provenance

The wterm #116 run found double scroll anchoring, a bounded identity failure, and unbounded adapter cache growth while preserving explicit unaffected behaviors and environment limits.

## Registry drift

The maturity summary predates the recorded runs and still describes the method as untriggered. This page exposes the newer evidence without changing maturity automatically.
