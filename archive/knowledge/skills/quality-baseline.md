# Skill provenance: quality-baseline

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "quality-baseline",
  "summary": "Quality Baseline has a public application where the audit exposed untested write paths that led directly to a fix.",
  "patterns": [],
  "evidence": [
    {
      "path": "cases/portless/369-partial-write-orphan-block.md",
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
      "id": "gap.quality-baseline.baseline-comparison",
      "description": "Compare the audit against unstructured repository inspection on a transfer repository."
    }
  ]
}
```

## Provenance

The portless #369 case records the pass ranking `hosts.ts` lowest on branch coverage and exposing three untested write functions. The finding produced the subsequent fix.

## Remaining boundary

One successful application supports dogfooding, not causal improvement over a no-skill baseline.
