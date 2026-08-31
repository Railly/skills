# Skill Benchmark: security-review

**Model**: gpt-5.6-sol
**Date**: 2026-08-31T01:13:26Z
**Evals**: 1, 2, 3, 4, 5 (1 run each per configuration)

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 100% ± 0% | 89% ± 15% | +0.11 |
| Time | 13.9s ± 0.6s | 5.5s ± 1.5s | +8.4s |
| Tokens | 16326 ± 50 | 13325 ± 125 | +3001 |

## Analysis

- The candidate passed all 18 assertions; the baseline passed 16 of 18.
- Uplift came from explicit taxonomy: `hardening` for equivalent-authority plugin inheritance and `verification_gap` for unknown proxy behavior.
- The other three cases passed in both configurations and act as safety regression controls.
- The skill added about 8.4 seconds and 3,001 tokens per response because it loaded the classification and receipt references.
