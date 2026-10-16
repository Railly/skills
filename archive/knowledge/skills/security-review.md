# Skill provenance: security-review

## Metadata

```json
{
  "schema_version": 1,
  "kind": "skill",
  "skill": "security-review",
  "summary": "Security Review separates exploitability and trust-boundary evidence from merge policy, lifecycle defects, and defense-in-depth hardening.",
  "patterns": [],
  "evidence": [
    {
      "path": "foundry/runs/security-review-eval/2026-08-30-iteration-1/benchmark.md",
      "relationship": "evaluation",
      "visibility": "public",
      "status": "active"
    }
  ],
  "decisions": [
    "foundry/rounds/014-register-security-review/README.md"
  ],
  "gaps": [
    {
      "id": "gap.security-review.transfer",
      "description": "Repeat the comparison on a held-out repository and stack, then run multiple trials per configuration."
    },
    {
      "id": "gap.security-review.real-application",
      "description": "Record a complete real-work application whose exact-state receipt is consumed by Review Gate."
    }
  ]
}
```

## Evaluation

The originating comparison passed all 18 assertions with the skill and 16 of 18 without it. The gains were explicit hardening classification for a receiver with equivalent authority and explicit verification-gap classification when reverse-proxy trust behavior was unknown.

## Remaining boundary

The current evidence is one originating evaluation suite. It does not establish repeatability, transfer, or a reduction in real external-review findings.
