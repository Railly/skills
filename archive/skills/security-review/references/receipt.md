# Security receipt

Emit JSON or an equivalently structured manifest stage with:

```json
{
  "status": "pass|findings|incomplete",
  "fingerprint": {
    "repository": "owner/repo",
    "base_sha": "full sha",
    "head_sha": "full sha",
    "dirty_digest": "digest or clean",
    "changed_path_digest": "digest",
    "skill_revision": "revision"
  },
  "claim": {
    "property": "authorization",
    "attacker": "remote unauthenticated web origin",
    "scope": "stated issue or change"
  },
  "trust_model": {
    "assets": [],
    "principals": [],
    "boundaries": [],
    "entrypoints": [],
    "sinks": []
  },
  "observations": [
    {
      "id": "SEC-001",
      "classification": "confirmed_vulnerability",
      "scope": "in_scope_security_regression",
      "prerequisites": [],
      "chain": {
        "capability": "",
        "reachability": "",
        "control": "",
        "boundary": "",
        "impact": ""
      },
      "confidence": "high",
      "evidence": []
    }
  ],
  "verification": {
    "authorized_scope": "",
    "commands": [],
    "cleanup": "",
    "gaps": []
  },
  "merge_relevance": {
    "security_blockers": [],
    "follow_ups": [],
    "routed_non_security_defects": []
  },
  "artifact": "private-or-sanitized-report-path"
}
```

`status: pass` means the stated security claim is supported and no security blocker remains. It does not assert that the whole diff is merge-ready.

`status: findings` means at least one supported security blocker remains.

`status: incomplete` means a material verification gap prevents a security conclusion.

Each observation must retain its evidence handle. Do not place exploit instructions, live credentials, private paths, or sensitive target details in a public receipt.
