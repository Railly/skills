# Case inventory

This inventory tracks public-safe metadata. Private review text and identities remain outside this repository.

A case records evidence. It does not become a rule, exemplar, or skill merely by existing.

## Published case studies

- [Portless #352: match the full routing discriminator](portless/0352-tailscale-authority-matching.md)
- [Portless #355: test the changed caller](portless/0355-changed-caller-coverage.md)
- [agent-browser #1532: falsify a renderer-revival regression](agent-browser/1532-discarded-tab-revival.md)

### Portless unvalidated backfill

- [#241: preserve runtime precedence](portless/241-runtime-precedence.md)
- [#263: map generic settings to framework flags](portless/263-framework-flags.md)
- [#269: apply worktree identity at the caller](portless/269-multi-app-worktree.md)
- [#274: preserve configuration provenance](portless/274-config-provenance.md)
- [#285: forward flags through package scripts](portless/285-package-script-flags.md)
- [#288: probe the downstream address](portless/288-downstream-address.md)
- [#305: bypass Windows command-length limits](portless/305-windows-command-length.md)
- [#310: extend shared-host allowlists](portless/310-shared-host-allowlist.md)
- [#343: route public tunnel metadata](portless/343-tunnel-route-metadata.md)
- [#346: preserve LAN TLDs](portless/346-lan-tlds.md)

### agent-browser maintenance backfill

- [#1291: bound unreachable state origins](agent-browser/1291-state-load-timeout.md)
- [#1105: detect swallowed exceptions behind silent success](agent-browser/1105-select-silent-success.md)
- [#1204: verify exporter payloads through the artifact](agent-browser/1204-har-response-bodies.md)
- [#1266: pierce every pipeline stage](agent-browser/1266-shadow-dom-locators.md)
- [#1336: isolate implicit setup with an A/B/C matrix](agent-browser/1336-implicit-relaunch.md)
- [#1367: trace server identity across shutdown](agent-browser/1367-shutdown-race.md)
- [#1378: reproduce loud and silent subprocess failures](agent-browser/1378-profile-lock.md)
- [#1445: test the reporter's claimed boundary](agent-browser/1445-frame-identity.md)
- [#1460: use a working contrast to find the seam](agent-browser/1460-frame-aware-locators.md)
- [Disproven batch: explain the green](agent-browser/disproven-current-main.md)
- [Cross-case session observations](agent-browser/session-observations.md)

## Cases

| Case | Source | Validation | Delivery | Primary lesson | Foundry action |
|---|---|---|---|---|---|
| [Portless #241](portless/241-runtime-precedence.md) | [issue](https://github.com/vercel-labs/portless/issues/241) · [PR](https://github.com/vercel-labs/portless/pull/247) | unvalidated | PR open | preserve caller runtime precedence | review reference-rule candidate |
| [Portless #263](portless/263-framework-flags.md) | [issue](https://github.com/vercel-labs/portless/issues/263) · [PR](https://github.com/vercel-labs/portless/pull/272) | unvalidated | PR open | map semantic settings to framework flags | review exemplar candidate |
| [Portless #269](portless/269-multi-app-worktree.md) | [issue](https://github.com/vercel-labs/portless/issues/269) · [PR](https://github.com/vercel-labs/portless/pull/355) | unvalidated | PR open | test the changed caller, not only its helper | round 1 fixture; exemplar rejected |
| [Portless #274](portless/274-config-provenance.md) | [issue](https://github.com/vercel-labs/portless/issues/274) · [PR](https://github.com/vercel-labs/portless/pull/300) | unvalidated | PR open | carry provenance through normalization | review reference-rule candidate |
| [Portless #285](portless/285-package-script-flags.md) | [issue](https://github.com/vercel-labs/portless/issues/285) · [PR](https://github.com/vercel-labs/portless/pull/303) | unvalidated | PR open | drive the public wrapper seam | corroborating round 1 case |
| [Portless #288](portless/288-downstream-address.md) | [issue](https://github.com/vercel-labs/portless/issues/288) · [PR](https://github.com/vercel-labs/portless/pull/302) | unvalidated | PR open | probe the exact downstream address | review reference-rule candidate |
| [Portless #305](portless/305-windows-command-length.md) | [issue](https://github.com/vercel-labs/portless/issues/305) · [PR](https://github.com/vercel-labs/portless/pull/306) | unvalidated | PR open | separate resolver proof from platform proof | retain as coverage gap |
| [Portless #310](portless/310-shared-host-allowlist.md) | [issue](https://github.com/vercel-labs/portless/issues/310) · [PR](https://github.com/vercel-labs/portless/pull/350) | unvalidated | PR open | propagate alternate hosts through every validator | review eval candidate |
| [Portless #343](portless/343-tunnel-route-metadata.md) | [issue](https://github.com/vercel-labs/portless/issues/343) · [PR](https://github.com/vercel-labs/portless/pull/349) | unvalidated | PR open | build the current-base artifact before accepting a patch | review deterministic-check candidate |
| [Portless #346](portless/346-lan-tlds.md) | [issue](https://github.com/vercel-labs/portless/issues/346) · [PR](https://github.com/vercel-labs/portless/pull/348) | unvalidated | PR open | compose additive modes without replacing explicit config | review exemplar candidate |
| Portless PR #352 | [PR](https://github.com/vercel-labs/portless/pull/352) | contributor-validated | PR open | use the full routing discriminator before fallback | retained as a case, not loaded by a skill |
| Portless PR #355 | [PR](https://github.com/vercel-labs/portless/pull/355) | contributor-validated | PR open | mutate the changed caller; surface subprocess output | round 1 evidence; exemplar rejected |
| [agent-browser PR #1532](agent-browser/1532-discarded-tab-revival.md) | [PR](https://github.com/vercel-labs/agent-browser/pull/1532) | unvalidated | PR open | prove red before green; distinguish proxy from exact trigger | round 1 evidence; exemplar rejected |
| [agent-browser #1291](agent-browser/1291-state-load-timeout.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1291) · [branch](https://github.com/Railly/agent-browser/tree/fix/state-load-unreachable-origin) | unvalidated | local | bound each batch item and cancel abandoned side effects | Review rule and eval candidate |
| [agent-browser #1105](agent-browser/1105-select-silent-success.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1105) · [branch](https://github.com/Railly/agent-browser/tree/fix/select-non-select-errors) | unvalidated | local | observe the substrate when success output may lie | Review rule and eval candidate |
| [agent-browser #1204](agent-browser/1204-har-response-bodies.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1204) · [branch](https://github.com/Railly/agent-browser/tree/fix/har-response-bodies) | unvalidated | local | verify serialized payloads through the artifact | record only |
| [agent-browser #1266](agent-browser/1266-shadow-dom-locators.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1266) · [branch](https://github.com/Railly/agent-browser/tree/fix/shadow-dom-locators) | unvalidated | local | cross every stage of a boundary-piercing pipeline | exemplar and eval candidate |
| [agent-browser #1336](agent-browser/1336-implicit-relaunch.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1336) · [branch](https://github.com/Railly/agent-browser/tree/fix/storage-state-implicit-relaunch) | unvalidated | local | isolate hidden setup with an A/B/C matrix | exemplar and eval candidate |
| [agent-browser #1367](agent-browser/1367-shutdown-race.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1367) · [branch](https://github.com/Railly/agent-browser/tree/fix/close-shutdown-race) | unvalidated | local | timeline server identity; reject work after shutdown decision | Triage and Review rule candidates |
| [agent-browser #1378](agent-browser/1378-profile-lock.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1378) · [branch](https://github.com/Railly/agent-browser/tree/fix/profile-lock-collision) | unvalidated | local | reproduce loud and silent subprocess failures | exemplar and eval candidate |
| [agent-browser #1445](agent-browser/1445-frame-identity.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1445) · [branch](https://github.com/Railly/agent-browser/tree/fix/frame-select-oopif) | unvalidated | local | test the reporter's claimed boundary | Triage rule and eval candidate |
| [agent-browser #1460](agent-browser/1460-frame-aware-locators.md) | [issue](https://github.com/vercel-labs/agent-browser/issues/1460) · [branch](https://github.com/Railly/agent-browser/tree/fix/semantic-locators-active-frame) | unvalidated | local | use a working contrast to find the reusable seam | exemplar and eval candidate |
| [agent-browser disproven batch](agent-browser/disproven-current-main.md) | public issues linked in case | unvalidated | local | explain why current main is green | Triage rule and eval candidate |
| [agent-browser session observations](agent-browser/session-observations.md) | public case cluster | unvalidated | local | cross-case operational and diagnostic patterns | candidate generator only |

One merged case remains to be backfilled. It is not required for round 1 because merge status and technical validation are independent dimensions.

## Lesson clusters

### A. Test teeth and changed-path coverage

Cases: Portless #269, #285, PR #355, agent-browser PR #1532.

Repeated method: remove the production behavior while retaining the committed test, require a bug-specific failure, then restore and require green. When the change lives in caller wiring, drive and mutate that caller rather than only its helper.

Destination: Unfold Review behavior fixtures. The proposed exemplars and proof-record text did not outperform the prior standalone skill and were rejected.

### B. Reproduction as a controlled experiment

Cases: Portless PR #352; agent-browser #1291, #1336, #1367, #1445, and the disproven batch.

Repeated method: verify the reported path and preconditions, run the control outside the claimed boundary, timeline process identity when state crosses commands, and explain a green before accepting non-reproduction.

Destination: [candidate pack](../foundry/candidates/2026-07-agent-browser-evidence-pack.md) for a controlled Unfold Triage round.

### C. Substrate and artifact verification

Cases: agent-browser #1105, #1204, #1266, #1291, and #1336.

Repeated method: distrust a success output implicated by the bug, inspect the real substrate or serialized artifact, and verify external side effects end to end.

Destination: retain as Unfold Review rule and eval candidates.

### D. Configuration and adapter boundaries

Cases: Portless #241, #263, #274, #285, #346.

Candidate lessons: preserve user precedence, retain provenance, map semantic options explicitly, and verify values through every wrapper boundary.

Destination: retain as unvalidated reference or exemplar candidates.

### E. Runtime and platform boundaries

Cases: Portless #288, #305, #310, #343, PR #352, PR #355.

Candidate lessons: probe the exact consumed address, distinguish unit proof from affected-platform proof, propagate public hostnames downstream, and build the current-base artifact.

Destination: coverage gaps and future promotion rounds.
