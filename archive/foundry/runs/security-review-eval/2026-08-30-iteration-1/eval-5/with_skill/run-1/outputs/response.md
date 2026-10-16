{
  "status": "pass",
  "classification": "non_security_defect",
  "scope": "unrelated_bug",
  "severity": "none",
  "confidence": "high",
  "reason": "The parser corrupts only a local display label. It reaches no security-sensitive sink, crosses no trust boundary, and grants no attacker new capability.",
  "merge_relevance": {
    "security_blockers": [],
    "routed_non_security_defects": ["Fix as a correctness/UI bug."]
  }
}