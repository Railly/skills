# Skill provenance: software-factory

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "software-factory",
  "summary": "Software Factory has contract tests and a registration rationale, but no recorded real-work application of the complete staged protocol.",
  "patterns": [],
  "evidence": [],
  "decisions": [
    "foundry/rounds/011-register-software-factory/README.md"
  ],
  "gaps": [
    {
      "id": "gap.software-factory.real-run",
      "description": "Run the full protocol on real work and measure whether staging adds a catch beyond direct use of the delegated methods."
    }
  ]
}
```

## Current support

The registration round explicitly records no run. Structural contract tests support ordering but do not establish that the orchestration changes an engineering outcome.

## Required evidence

The first case must answer whether staging or its thrashing rule adds value beyond Review Gate and the delegated component skills.
