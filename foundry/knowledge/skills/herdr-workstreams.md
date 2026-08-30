# Skill provenance: herdr-workstreams

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "herdr-workstreams",
  "summary": "Herdr Workstreams is derived from one portfolio topology design session and has no completed end-to-end setup run.",
  "patterns": [],
  "evidence": [],
  "decisions": [
    "foundry/rounds/012-register-herdr-workstreams/README.md"
  ],
  "gaps": [
    {
      "id": "gap.herdr-workstreams.end-to-end-run",
      "description": "Run setup twice on real repositories and prove exact workspace reuse, visible specialist recovery, and no duplicate topology."
    }
  ]
}
```

## Current support

The registration round records the observed topology problem, available runtime primitives, and ownership boundaries. It explicitly says no end-to-end setup run completed.

## Required evidence

The first case must cover a fresh setup and a reuse pass, including exact checkout matching and one specialist that blocks or returns incomplete output.
