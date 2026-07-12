# Promotion round 1: prove the changed path

## Decision

Promote the evaluation layer and keep `prove-the-test` unchanged. The candidate exemplar and proof-record text tied the current skill at 20/20, so it did not earn promotion.

See the [round 1 benchmark](round-1.md) and the stronger [round 2 benchmark](round-2.md).

## Evidence accepted

| Case | Accepted evidence | Withheld claim |
|---|---|---|
| Portless PR #355 | public PR describes caller-level e2e, fix-absent red, and helper-only insufficiency | Windows production behavior and maintainer endorsement |
| agent-browser PR #1532 | public PR describes two fix-absent failures, 904 passing tests, and real-browser proxy dogfood | exact Memory Saver equivalence and final-artifact dogfood |

Portless #269 and #285 corroborate the pattern but remain unvalidated backfills. They may inform fixture design, not promotion claims.

## Candidate tested

1. Preserve the existing method text.
2. Add a concise proof-record contract containing:
   - changed production seam;
   - fix-absent command and bug-specific failure;
   - restored command and green result;
   - unverified boundary.
3. Add sanitized public exemplars for caller wiring and deterministic trigger proxies.
4. Add behavior fixtures for positive trigger, near miss, helper-versus-caller, subprocess diagnostics, and cross-stack transfer.
5. Keep subprocess stdout/stderr capture in the exemplar until a second contributor-validated case supports promotion to a core rule.

## Evaluation matrix

Run each fixture against:

| Variant | Meaning |
|---|---|
| no-skill | model behavior without consulting a skill |
| current | released `prove-the-test` snapshot |
| candidate | current skill plus proof record and exemplars |

## Promotion gate outcome

| Gate | Outcome |
|---|---|
| No behavioral regression | pass, 20/20 ties current |
| Measurable improvement | fail, zero candidate delta |
| Transfer holdout | pass for current and candidate |
| Trigger boundary | 10/10 semantic audit; runtime invocation not measured |
| Evidence precision | no measured improvement; runner contract contaminated the signal |
| Confidentiality | pass; only public technical evidence entered fixtures |

Result after two rounds: reject the candidate skill text and exemplars. Keep the current method and publish the reproducible eval infrastructure as the durable outcome.
