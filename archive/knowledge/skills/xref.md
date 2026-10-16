# Skill provenance: xref

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "xref",
  "summary": "xref has a public run corpus across multiple issues and pull requests, including a triage analysis grounded in current graph and runtime evidence.",
  "patterns": [],
  "evidence": [
    {
      "path": "foundry/runs/xref/2026-08-10-agent-browser-326-86-triage-analysis.md",
      "relationship": "application",
      "visibility": "public",
      "status": "active"
    }
  ],
  "decisions": [
    "foundry/rounds/005-register-xref/README.md"
  ],
  "gaps": [
    {
      "id": "gap.xref.trigger-and-baseline-eval",
      "description": "Run trigger and negative-trigger evals plus a no-skill comparison on a fresh issue."
    }
  ]
}
```

## Provenance

The selected run resolved two overloaded session-isolation issues by combining graph relationships with a main-binary verification. Round 005 records eighteen artifacts across five issue or pull-request families.

## Remaining boundary

Adoption and recorded use support dogfooding. Trigger precision and causal improvement remain unevaluated.
