# Pattern: Drive the shipped surface

## Metadata

```json
{
  "schema_version": 1,
  "kind": "pattern",
  "id": "pattern.drive-the-shipped-surface",
  "title": "Drive the shipped surface",
  "status": "active",
  "summary": "Exercise the artifact and boundary a user actually receives before treating tests or code reading as behavioral proof.",
  "evidence": [
    {
      "path": "cases/agent-browser/1596-dogfood-invalid-selector.md",
      "relationship": "origin",
      "visibility": "public",
      "status": "active"
    },
    {
      "path": "foundry/rounds/002-review-gate-blind-replication/README.md",
      "relationship": "evaluation",
      "visibility": "public",
      "status": "active"
    }
  ],
  "skills": [
    {
      "name": "review-gate",
      "relationship": "motivates",
      "status": "active"
    }
  ],
  "supersedes": []
}
```

## Problem

Green tests and plausible source reasoning can both agree while missing behavior at the shipped boundary. The same review can also produce a false finding when its model of the runtime is incomplete.

## Root cause

The author and reviewer often inspect the same abstractions and inherit the same input model. Unit seams prove local behavior, but they do not prove caller ordering, packaging, real protocol behavior, user-visible errors, or the artifact that will actually ship.

## Strategy

Build or install the real artifact, drive its public surface with representative and adversarial inputs, and observe the external effect. Refute a claim only with evidence from the layer where the claim lives. If that layer cannot be exercised, preserve the result as a verification gap.

## Exceptions

A lower seam is sufficient when the claim is explicitly local to that seam. Unavailable hardware or credentials can justify a gap or a narrower structural proof, but never an unqualified pass.

## History

The agent-browser case supplied the concrete dogfood failure. Foundry round 002 independently showed the adjacent-layer version of the same problem when valid candidates were dropped using unit evidence against caller-level claims.
