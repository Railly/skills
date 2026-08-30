# Skill provenance: record-a-case

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "record-a-case",
  "summary": "Record a Case produced much of the repository corpus, but historical cases usually omit whether the published procedure was explicitly applied.",
  "patterns": [],
  "evidence": [],
  "decisions": [
    "foundry/rounds/003-distribution-ladder/README.md"
  ],
  "gaps": [
    {
      "id": "gap.record-a-case.explicit-application",
      "description": "Record a prospective case that identifies the procedure version and shows which required fields or checks changed the resulting ledger."
    }
  ]
}
```

## Current support

Round 003 promoted the skill because it had captured real maintenance work. Round 004 later found zero explicit calls in the Vercel issue corpus and noted that cases were often written as workflow output without a recorded procedure invocation.

## Required evidence

The next case should distinguish using the skill from merely producing a case-shaped document, then compare the result against an unstructured ledger.
