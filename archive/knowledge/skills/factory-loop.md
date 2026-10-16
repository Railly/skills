# Skill provenance: factory-loop

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "factory-loop",
  "summary": "Factory Loop has one complete public dogfood case proving exact-state routing and evidence invalidation, without a baseline comparison.",
  "patterns": [],
  "evidence": [
    {
      "path": "cases/skills/factory-loop-v0.0.8-exact-state-release.md",
      "relationship": "application",
      "visibility": "public",
      "status": "active"
    }
  ],
  "decisions": [
    "foundry/rounds/013-register-factory-loop/README.md"
  ],
  "gaps": [
    {
      "id": "gap.factory-loop.baseline-comparison",
      "description": "Compare the complete router against ad hoc phase selection on a transfer work item."
    }
  ]
}
```

## Provenance

The registration round had no complete run. The later v0.0.8 release case records the first end-to-end application, including exact-tree invalidation, independent Spec and Standards gates, Before After evidence, and authorized promotion.

## Remaining boundary

The case proves orchestration safety on one repository release. It does not establish an improvement over an agent selecting the same component methods without Factory Loop.
