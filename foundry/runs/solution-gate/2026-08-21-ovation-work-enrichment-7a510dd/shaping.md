# Ovation work enrichment shaping

Date: 2026-08-21

Mode: candidate audit

Base: `vercel-labs/ovation` at `7a510dd71dd7c98b8db8fc61b75ea83dcffd7541`

## Frame

Ovation presents GitHub Issues and Pull Requests as repository work, but update chronology alone does not expose high-attention work or relationships such as competing implementations, broken closing relationships, supersession, and meaningful file overlap. The desired outcome is to help an operator find and understand consequential repository work inside the existing GitHub-native workflow without creating another issue tracker, another control plane, or a new source of authority.

## Reconciled requirements

| ID | Status | Requirement |
| --- | --- | --- |
| R0 | Core goal | Operators can find and understand consequential repository work inside the existing GitHub-native workflow without a second tracker or control plane. |
| R1 | Settled | Derived analysis is read-only evidence. It never mutates GitHub, admits work, dispatches a run, or becomes selection authority. |
| R2 | Settled | GitHub identity and state remain authoritative and provider-native. |
| R3 | Settled | Existing activity, work filters, internal navigation, Issue/PR detail, and Agents sidebar remain the daily workflow. |
| R4 | Settled | The Agents sidebar stays owned by agents and runs on repository and item surfaces. |
| R5 | Settled | Ordinary rows stay compact. Derived density appears only when it changes a decision. |
| R6 | Settled | Repository-wide priority is exposed only when every discovered open item participated in the comparable ranking. Partial analysis states coverage and never implies complete ordering. |
| R7 | Settled | Freshness, coverage, formula version, and explainable raw signals are available to consumers. |
| R8 | Settled | Ovation has no published or local external analysis package at runtime. |
| R9 | Settled | Server-persisted enrichment is canonical across reloads and deployments. |
| R10 | Settled | Refresh preserves the previous completed enrichment until atomic replacement. Failure leaves it usable and visibly stale. |
| R11 | Settled | The first production slice is independently mergeable and revertible with bounded deterministic validation. |
| R12 | Settled | Updated, Created, and Number sorts remain available and behave as now. |
| R13 | Settled | Existing kind, author, state, and direction filters remain available. |
| R14 | Settled | Existing rows, internal routes, detail, GitHub actions, run dispatch, and Agents workflows remain usable without enrichment. |
| R15 | Settled | GitHub or enrichment read failure cannot hide provider-native work. |
| R16 | Settled | Reload or repository switching cannot dispatch duplicate analysis or erase the last completed result. |
| R17 | Settled | Existing Factory reset is the explicit clear boundary. Omission and normal refresh never clear enrichment. |
| R18 | Settled | Consumers see one coherent enrichment version and never mix fields from different computations. |
| R19 | Derived | User-facing copy uses work language. Xref, nodes, seeds, crawl depth, and scanner action codes are not product concepts. |
| R20 | Derived | Complete lightweight inventory and deeper relationship analysis are separate computation layers with separate coverage. |
| R21 | Derived | Enrichment joins through provider-neutral source identity: provider, owner, repository, item number, and kind. |
| R22 | Derived | A graph explorer and a dedicated repository-analysis pane are out of the first production shape. |
| R23 | Derived | The work list remains useful before the first computation, during refresh, after failure, and for items lacking enrichment. |
| R24 | Undecided | Which relationship types and thresholds are precise enough for an exceptional row signal without alert fatigue. |
| R25 | Undecided | Whether deeper relationship refresh eventually requires durable background execution. |
| R26 | Undecided | Whether one repository snapshot remains sufficient after relationship coverage expands. |

## Shapes before probing

| Shape | Mechanism | Origin |
| --- | --- | --- |
| A: Versioned snapshot in existing surfaces | Full or coverage-scoped scanner, last-completed plus in-flight overlay, compact row/detail enrichment, Agents restored. | Claude reviewer |
| B: Ephemeral compute on read | List-only computation cached with a TTL, no durable enrichment lifecycle. | Claude reviewer |
| C: Item-addressable incremental index | Per-item enrichment rows, manifest publication, durable incremental crawler. | Claude reviewer |
| D: Dedicated analysis pane | Preserve the candidate's repository pane as the primary finding surface and harden its persistence. | Candidate and both reviewer negative cases |
| E: Two-speed internal enrichment | Complete lightweight ranking for every open item plus separate contextual relationship evidence, one durable last-completed projection, no dedicated pane. | Post-probe composition of A and the useful part of the ranking shape |

## Shape E parts

| Part | Mechanism | Flag |
| --- | --- | --- |
| E1 | `WorkEnrichment` is an in-tree, provider-neutral projection keyed by source identity. It carries computation id, timestamps, coverage per capability, formula version, explainable priority signals, and typed exceptional relationships. | No Xref types or package boundary. |
| E2 | Lightweight inventory paginates every open Issue and Pull Request. The first formula uses fields available on complete list payloads: comments, reactions, and age. Stable tie-breaking uses source identity. | Participants or inbound references enter only after a bounded batched source is proven. |
| E3 | Relationship analysis is a separate layer. It may be partial without invalidating the complete ranking. It emits only precision-audited relationships such as competing closing PRs, broken closing links, supersession, and thresholded meaningful overlap. | No generic overlap feed. |
| E4 | Server persistence owns latest completed enrichment and a separate attempt overlay. Refresh never overwrites completed data. Completion atomically replaces it; failure marks the old data stale. | DB-backed in-flight claim before automatic or multi-instance refresh. |
| E5 | Existing work filters gain `Priority` and `Needs attention`. Priority is enabled only under complete ranking coverage. Existing sorts and filters remain. | Default remains Updated. |
| E6 | Existing rows remain provider-native and compact. Priority sort may show rank and score on hover; otherwise a row shows at most one exceptional relationship signal. | No score badge in the default list. |
| E7 | Existing Issue/PR detail gets a compact `Related work` section with internal links, raw evidence, freshness, and coverage. | No graph explorer. |
| E8 | Repository overview may show a quiet freshness or attention summary, but the right sidebar always renders Agents. | No repository triage destination. |
| E9 | GET is read-only. Explicit refresh is idempotent. Factory reset is the only clear. | Browser storage may remember filter choice but is not canonical enrichment. |

## Post-probe fit check

| Req | Requirement | Status | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R0 | Operators can find and understand consequential repository work inside the existing GitHub-native workflow without a second tracker or control plane. | Core goal | ✅ | ❌ | ✅ | ❌ | ✅ |
| R1 | Derived analysis is read-only evidence. It never mutates GitHub, admits work, dispatches a run, or becomes selection authority. | Settled | ✅ | ✅ | ✅ | ❌ | ✅ |
| R2 | GitHub identity and state remain authoritative and provider-native. | Settled | ✅ | ✅ | ✅ | ✅ | ✅ |
| R3 | Existing activity, work filters, internal navigation, Issue/PR detail, and Agents sidebar remain the daily workflow. | Settled | ✅ | ✅ | ✅ | ❌ | ✅ |
| R4 | The Agents sidebar stays owned by agents and runs on repository and item surfaces. | Settled | ✅ | ✅ | ✅ | ❌ | ✅ |
| R5 | Ordinary rows stay compact. Derived density appears only when it changes a decision. | Settled | ✅ | ✅ | ✅ | ❌ | ✅ |
| R6 | Repository-wide priority is exposed only when every discovered open item participated in the comparable ranking. Partial analysis states coverage and never implies complete ordering. | Settled | ✅ | ✅ | ✅ | ❌ | ✅ |
| R7 | Freshness, coverage, formula version, and explainable raw signals are available to consumers. | Settled | ✅ | ❌ | ✅ | ❌ | ✅ |
| R8 | Ovation has no published or local external analysis package at runtime. | Settled | ✅ | ✅ | ✅ | ❌ | ✅ |
| R9 | Server-persisted enrichment is canonical across reloads and deployments. | Settled | ✅ | ❌ | ✅ | ✅ | ✅ |
| R10 | Refresh preserves the previous completed enrichment until atomic replacement. Failure leaves it usable and visibly stale. | Settled | ✅ | ❌ | ✅ | ✅ | ✅ |
| R11 | The first production slice is independently mergeable and revertible with bounded deterministic validation. | Settled | ✅ | ✅ | ❌ | ❌ | ✅ |
| R12 | Updated, Created, and Number sorts remain available and behave as now. | Settled | ✅ | ✅ | ✅ | ✅ | ✅ |
| R13 | Existing kind, author, state, and direction filters remain available. | Settled | ✅ | ✅ | ✅ | ✅ | ✅ |
| R14 | Existing rows, internal routes, detail, GitHub actions, run dispatch, and Agents workflows remain usable without enrichment. | Settled | ✅ | ✅ | ✅ | ❌ | ✅ |
| R15 | GitHub or enrichment read failure cannot hide provider-native work. | Settled | ✅ | ❌ | ✅ | ✅ | ✅ |
| R16 | Reload or repository switching cannot dispatch duplicate analysis or erase the last completed result. | Settled | ✅ | ❌ | ✅ | ❌ | ✅ |
| R17 | Existing Factory reset is the explicit clear boundary. Omission and normal refresh never clear enrichment. | Settled | ✅ | ❌ | ✅ | ✅ | ✅ |
| R18 | Consumers see one coherent enrichment version and never mix fields from different computations. | Settled | ✅ | ❌ | ✅ | ✅ | ✅ |
| R19 | User-facing copy uses work language. Xref, nodes, seeds, crawl depth, and scanner action codes are not product concepts. | Derived | ✅ | ✅ | ✅ | ❌ | ✅ |
| R20 | Complete lightweight inventory and deeper relationship analysis are separate computation layers with separate coverage. | Derived | ❌ | ❌ | ❌ | ❌ | ✅ |
| R21 | Enrichment joins through provider-neutral source identity: provider, owner, repository, item number, and kind. | Derived | ✅ | ✅ | ✅ | ❌ | ✅ |
| R22 | A graph explorer and a dedicated repository-analysis pane are out of the first production shape. | Derived | ✅ | ✅ | ❌ | ❌ | ✅ |
| R23 | The work list remains useful before the first computation, during refresh, after failure, and for items lacking enrichment. | Derived | ✅ | ❌ | ✅ | ❌ | ✅ |
| R24 | Which relationship types and thresholds are precise enough for an exceptional row signal without alert fatigue. | Undecided | ❌ | ❌ | ❌ | ❌ | ✅ |
| R25 | Whether deeper relationship refresh eventually requires durable background execution. | Undecided | ✅ | ❌ | ❌ | ❌ | ✅ |
| R26 | Whether one repository snapshot remains sufficient after relationship coverage expands. | Undecided | ✅ | ✅ | ❌ | ✅ | ✅ |

Notes:

- A fails R20 because it treats the crawl as one coverage domain. E preserves A's lifecycle while separating ranking from relationships.
- B fails persistence and stale fallback by design.
- C precommits to item rows and durable crawling before the first slice needs them.
- D fails on product ownership even after its persistence fix. It remains a second queue in the Agents shell.
- E keeps R24, R25, and R26 open behind capability flags. Ranking can ship without claiming that relationship coverage is complete.

## Discriminator matrix

| Case | Required observation | E |
| --- | --- | --- |
| 660 open items, only recent 100 deeply crawled | Priority covers all 660 or is absent; relationship coverage is labeled separately. | Complete lightweight rank, partial relationships. |
| High-signal old issue outside recent 100 | It can rank above recent work. | Included by paginated inventory. |
| Relationship refresh fails | Existing priority and last completed relationships stay usable and visibly stale. | Attempt overlay does not replace completion. |
| Enrichment absent | GitHub rows and internal routes behave as today. | Optional join. |
| Two tabs or instances refresh | One attempt wins without duplicate computation. | DB claim when refresh becomes externally reachable. |
| One common source file touched by many PRs | No generic conflict flood. | Relationship threshold or omission. |
| Repository surface | Agents remain available. | No pane substitution. |
| User selects Updated | Existing ordering is byte-for-byte independent of enrichment. | Enrichment is not consulted. |
| User selects Priority with incomplete ranking | The UI refuses to imply a full order. | Sort disabled with coverage reason. |
| Explicit Factory reset | Enrichment clears. | Existing reset boundary only. |

## Selected shape

**E: Two-speed internal work enrichment.**

It preserves Shape A's good lifecycle and existing-surface ownership, adds the complete lightweight ranking that the live API probe proved viable, and keeps expensive relationship evidence contextual and independently coverage-scoped. No graph explorer, triage pane, package publication, or Xref vocabulary survives into the product contract.

## Carried assumptions

- REST issue-list pagination remains the first ranking substrate because the equivalent GraphQL participants query exceeded resource limits at 50 Issues plus 50 PRs.
- Comments, reactions, and age are sufficient for a useful first explainable priority formula. Participant breadth and inbound references remain future versioned inputs.
- A one-row completed JSON projection is sufficient for the first slice when it stores compact item summaries rather than the full graph.
- Deep relationship computation can remain explicit or bounded until its runtime needs a durable job system.
- Relationship precision thresholds will be chosen from labeled repository samples before any default row badge ships.

## Required verification targets

- 101st and later pages participate in ranking.
- Deleting pagination makes a complete-coverage test fail.
- Priority is unavailable under incomplete coverage.
- Removing previous-completed preservation makes a temporal test fail.
- Removing the Agents rendering invariant makes a workspace test fail.
- Missing enrichment leaves provider-native rows and routes unchanged.
- Same-result refresh does not duplicate item identities.
- Explicit reset clears; omission and GET do not.
