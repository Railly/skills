# Skill provenance: record-a-case

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "record-a-case",
  "summary": "Record a Case now has an explicit schema 2 application that links a reviewed case to compiled knowledge without mutating installable procedure.",
  "patterns": [
    "pattern.drive-the-shipped-surface"
  ],
  "evidence": [
    {
      "path": "cases/skills/compiled-knowledge-pointer-boundary.md",
      "relationship": "application",
      "visibility": "public",
      "status": "active"
    }
  ],
  "decisions": [
    "foundry/rounds/003-distribution-ladder/README.md"
  ],
  "gaps": []
}
```

## Current support

Round 003 promoted the skill because it had captured real maintenance work. Round 004 later found zero explicit calls in the Vercel issue corpus and noted that cases were often written as workflow output without a recorded procedure invocation. The compiled-knowledge pointer case identifies the procedure commit, preserves independent status axes, selects one validated disposition, and links the case to an existing pattern.

## Required evidence

Future cases should exercise `create-candidate` and `gap` on real evidence. The current application proves `link-existing`, the legacy compatibility boundary, and the prohibition on procedural mutation during case compilation.
