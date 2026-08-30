# Skill provenance: review-gate

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "review-gate",
  "summary": "Review Gate is backed by recorded applications and a blind answer-key evaluation, including evidence of both catches and misses.",
  "patterns": [
    "pattern.drive-the-shipped-surface"
  ],
  "evidence": [
    {
      "path": "cases/agent-browser/1596-dogfood-invalid-selector.md",
      "relationship": "application",
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
  "decisions": [
    "foundry/rounds/002-review-gate-blind-replication/README.md",
    "foundry/rounds/003-distribution-ladder/README.md"
  ],
  "gaps": []
}
```

## Provenance

The dogfood case records a real Review Gate run where deterministic checks, lenses, and the author's green suite missed an invalid-selector failure. Driving the built CLI found the defect and disproved a separate code-reading hypothesis.

Round 002 compared blind Review Gate runs against six maintainer findings. It caught three directly, generated two more but dropped them with wrong-layer refutations, and missed one docs-precision item. A browser-capable rerun improved the score and preserved the remaining limitation.

## Procedure impact

This evidence motivates the real-surface dogfood step and the rule that refutation must occur at the layer of the claim. An unavailable empirical boundary is recorded as a verification gap, not converted into a pass.
