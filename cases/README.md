# Case inventory

This inventory tracks public-safe metadata. Private review text and identities remain outside this repository.

A case records evidence. It does not become a rule, exemplar, or skill merely by existing.

## Published case studies

- [Portless #352: match the full routing discriminator](portless/0352-tailscale-authority-matching.md)
- [Portless #355: test the changed caller](portless/0355-changed-caller-coverage.md)
- [agent-browser #1532: falsify a renderer-revival regression](agent-browser/1532-discarded-tab-revival.md)

## Cases

| Case | Source | Validation | Delivery | Primary lesson | Foundry action |
|---|---|---|---|---|---|
| Portless #241 | [issue](https://github.com/vercel-labs/portless/issues/241) · [PR](https://github.com/vercel-labs/portless/pull/247) | unvalidated | local verification | preserve caller runtime precedence | review reference-rule candidate |
| Portless #263 | [issue](https://github.com/vercel-labs/portless/issues/263) · [PR](https://github.com/vercel-labs/portless/pull/272) | unvalidated | local verification | map semantic settings to framework flags | review exemplar candidate |
| Portless #269 | [issue](https://github.com/vercel-labs/portless/issues/269) · [PR](https://github.com/vercel-labs/portless/pull/355) | unvalidated case; contributor-validated PR follow-up | PR open | test the changed caller, not only its helper | round 1 fixture; exemplar rejected |
| Portless #274 | [issue](https://github.com/vercel-labs/portless/issues/274) · [PR](https://github.com/vercel-labs/portless/pull/300) | unvalidated | local verification | carry provenance through normalization | review reference-rule candidate |
| Portless #285 | [issue](https://github.com/vercel-labs/portless/issues/285) · [PR](https://github.com/vercel-labs/portless/pull/303) | unvalidated | local verification | drive the public wrapper seam | corroborating round 1 case |
| Portless #288 | [issue](https://github.com/vercel-labs/portless/issues/288) · [PR](https://github.com/vercel-labs/portless/pull/302) | unvalidated | local verification | probe the exact downstream address | review reference-rule candidate |
| Portless #305 | [issue](https://github.com/vercel-labs/portless/issues/305) · [PR](https://github.com/vercel-labs/portless/pull/306) | unvalidated | unit-tested only | separate resolver proof from platform proof | retain as coverage gap |
| Portless #310 | [issue](https://github.com/vercel-labs/portless/issues/310) · [PR](https://github.com/vercel-labs/portless/pull/350) | unvalidated | local verification | propagate alternate hosts through every validator | review eval candidate |
| Portless #343 | [issue](https://github.com/vercel-labs/portless/issues/343) · [PR](https://github.com/vercel-labs/portless/pull/349) | unvalidated | local verification | build the current-base artifact before accepting a patch | review deterministic-check candidate |
| Portless #346 | [issue](https://github.com/vercel-labs/portless/issues/346) · [PR](https://github.com/vercel-labs/portless/pull/348) | unvalidated | local verification | compose additive modes without replacing explicit config | review exemplar candidate |
| Portless PR #352 | [PR](https://github.com/vercel-labs/portless/pull/352) | contributor-validated | PR open | use the full routing discriminator before fallback | retained as a case, not loaded by a skill |
| Portless PR #355 | [PR](https://github.com/vercel-labs/portless/pull/355) | contributor-validated | PR open | mutate the changed caller; surface subprocess output | round 1 evidence; exemplar rejected |
| agent-browser PR #1532 | [PR](https://github.com/vercel-labs/agent-browser/pull/1532) | contributor-validated | PR open | prove red before green; distinguish proxy from exact trigger | round 1 evidence; exemplar rejected |

One merged case remains to be backfilled. It is not required for round 1 because merge status and technical validation are independent dimensions.

## Lesson clusters

### A. Test teeth and changed-path coverage

Cases: Portless #269, #285, PR #355, agent-browser PR #1532.

Repeated method: remove the production behavior while retaining the committed test, require a bug-specific failure, then restore and require green. When the change lives in caller wiring, drive and mutate that caller rather than only its helper.

Destination: existing `prove-the-test` method and behavior fixtures. The proposed exemplars and proof-record text did not outperform the current skill and were rejected.

### B. Reproduction-path parity

Case: Portless PR #352.

Repeated method: compare port, configuration, entry point, build, and network path before accepting a failed reproduction attempt.

Destination: retain as a case until an eval demonstrates that an exemplar changes behavior.

### C. Configuration and adapter boundaries

Cases: Portless #241, #263, #274, #285, #346.

Candidate lessons: preserve user precedence, retain provenance, map semantic options explicitly, and verify values through every wrapper boundary.

Destination: retain as unvalidated reference or exemplar candidates.

### D. Runtime and platform boundaries

Cases: Portless #288, #305, #310, #343, PR #352, PR #355.

Candidate lessons: probe the exact consumed address, distinguish unit proof from affected-platform proof, propagate public hostnames downstream, and build the current-base artifact.

Destination: coverage gaps and future promotion rounds.
