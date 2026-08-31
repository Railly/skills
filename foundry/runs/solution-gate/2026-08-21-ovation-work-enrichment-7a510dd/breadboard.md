# Work enrichment breadboard and slices

Selected shape: E, two-speed internal work enrichment.

## Places

| # | Place | Description |
| --- | --- | --- |
| P1 | Repository workspace | Existing activity list and repository overview. Agents remains in the right shell. |
| P2 | Work filters dialog | Existing non-blocking filter configuration surface. |
| P3 | Issue/PR detail | Existing provider-native detail surface with internal navigation and GitHub actions. |
| P4 | Ovation backend | GitHub reads, enrichment computation, persistence, and API. |

## UI affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
| --- | --- | --- | --- | --- | --- | --- |
| U1 | P1 | activity row | provider-native work row | click | → P3 | — |
| U2 | P1 | activity row | optional rank while Priority is active | render/hover | — | — |
| U3 | P1 | activity row | optional exceptional relationship signal | render | — | — |
| U4 | P1 | repository overview | enrichment freshness and coverage summary | render | — | — |
| U5 | P2 | filters dialog | Calculate or refresh priority | click | → N8 | — |
| U6 | P1 | AgentsPane | existing agents/runs controls | interact | existing agent flow | — |
| U7 | P2 | filters dialog | Priority sort | click | → N2 | — |
| U8 | P2 | filters dialog | Needs attention filter | click | → N2 | — |
| U9 | P2 | filters dialog | Updated, Created, Number sorts | click | → N2 | — |
| U10 | P3 | Related work | typed related source references | click | → P3 | — |
| U11 | P3 | Related work | raw signals, freshness, and capability coverage | render | — | — |
| U12 | P3 | existing detail | discussion, actions, dispatch, diff/files/checks | interact | existing detail flow | — |

## Code affordances

| # | Place | Component | Affordance | Control | Wires Out | Returns To |
| --- | --- | --- | --- | --- | --- | --- |
| N1 | P1 | workspace loader | GET completed `WorkEnrichment` | call | → N10 | → S1 |
| N2 | P1/P2 | list projection | apply existing filters plus Priority/Needs attention | call | → S2 | → U1, U2, U3 |
| N3 | P1/P3 | enrichment join | join by provider source identity | call | — | → N2, U10, U11 |
| N4 | P4 | GitHub client | paginate every open Issue and Pull Request | call | → N5 | → N5 |
| N5 | P4 | priority formula v1 | score comments, reactions, and age; stable tie-break | call | → N7 | → N7 |
| N6 | P4 | relationship analyzer | emit precision-audited typed relationships | call | → N7 | → N7 |
| N7 | P4 | enrichment builder | construct one versioned provider-neutral projection | call | → N9 | → N9 |
| N8 | P1 | refresh handler | POST idempotent refresh | click/call | → N11 | → U4 |
| N9 | P4 | completed store | atomically publish latest completed projection | write | → S1 | → N1 |
| N10 | P1/P3 | client resource | retain provider-native rows if enrichment is absent or fails | observe | → N3 | → U1, U4, U10, U11 |
| N11 | P4 | attempt lifecycle | claim queued/running/failed attempt without replacing completion | call | → S3, N4, N6 | → N8, U4 |
| N12 | P4 | Factory reset | explicit clear | call | → S1, S3 | — |

## Data stores

| # | Place | Store | Description | Returns To |
| --- | --- | --- | --- | --- |
| S1 | P4 | latest completed `WorkEnrichment` | Canonical coherent projection keyed by repository. | → N1, N3 |
| S2 | P1 | existing filter preference | Browser-local usability preference, never canonical enrichment or dispatch state. | → N2, U7, U8, U9 |
| S3 | P4 | active/failed attempt overlay | Separate lifecycle from latest completion. | → N1, U4 |
| S4 | P1/P3 | provider-native work items | Existing GitHub-derived rows and detail. | → U1, U12, N3 |

## Wiring summary

```text
S4 provider work ───────────────→ U1 existing rows ──click──→ P3 detail
            └──→ N3 identity join ←── S1 latest completed enrichment
                                  ├──→ N2 list projection → U2/U3
                                  └──→ U10/U11 Related work

U5 refresh → N8 POST → N11 attempt overlay → N4 complete inventory → N5 rank
                                      └────→ N6 relationships
                              N5 + N6 → N7 projection → N9 atomic publish → S1

U6 AgentsPane remains independent of every enrichment wire.
```

## Slice summary

| # | Slice | Mechanism | Affordances | Demo |
| --- | --- | --- | --- | --- |
| V1 | Complete priority in existing list | E1, E2, E5, E6, E8 | U1-U2, U4-U7, U9, N1-N5, N7-N10, S1-S2, S4 | On `agent-browser`, calculate Priority and see all 660 open items participate, including old high-signal work outside the latest 100; switch back to Updated; Agents stays visible. |
| V2 | Refresh continuity and reset | E4, E9 | N11-N12, S3 | Refresh while an old result remains visible, force failure and see it marked stale, reload, then clear only through Factory reset. |
| V3 | Contextual relationship evidence | E3, E6, E7 | U3, U8, U10-U11, U12, N3, N6 | Filter Needs attention, open an item internally, and inspect a precise Related work section without a separate triage queue. |

## V1: independently mergeable production slice

V1 deliberately excludes deep relationship crawling, generic file overlap, diff history, automatic refresh, and a new job system. It replaces the false bounded priority claim with a useful complete one and restores the Agents ownership boundary.

### V1 contract

- Add an in-tree `WorkEnrichment` projection for priority only.
- Paginate all open Issues and Pull Requests using the existing GitHub client.
- Formula v1: `comments × 3 + reactions × 2 + min(12, daysOpen / 30)`. Stable tie-break: normalized source identity.
- Record `coverage.total`, `coverage.ranked`, `coverage.complete`, `computedAt`, and `formulaVersion`.
- Persist one compact completed projection per repository. No in-flight mutation yet; V1 may compute through the existing explicit action and atomically publish only on success.
- Restore `AgentsPane` on repository desktop and mobile surfaces.
- Add Priority to existing sort choices. When absent, its filter cell offers `Calculate priority`; it becomes selectable only after complete ranking coverage exists.
- Calculation is explicit. GET, reload, and repository switching never start it. V1 publishes only the completed result and keeps local busy/error feedback in the dialog; durable attempt state belongs to V2.
- When Priority is active, show rank in the existing row and expose raw score inputs on hover. Default Updated rows remain visually unchanged.
- Existing local filter persistence may remember `Priority`; invalid or unavailable Priority falls back to Updated without dispatch.
- Keep all existing provider-native rows and routes when no enrichment exists.

### V1 validation

- Unit: REST pagination combines pages and deduplicates provider identities.
- Unit: 101st-page item can rank first.
- Unit: formula and stable tie-breaking are deterministic at a fixed clock.
- Unit: incomplete coverage refuses Priority.
- Unit: missing enrichment leaves Updated sorting unchanged.
- Unit: removing pagination, coverage guard, or provider identity tie-break makes a distinct test fail.
- Component: repository surface renders AgentsPane, not RepositoryTriagePane, in desktop and mobile.
- Component: Priority exposes rank only while active; Updated remains unchanged.
- Integration: explicit computation publishes one coherent completed projection; failure does not overwrite an existing one.
- Reset: existing Factory reset removes the completed projection.
- Typecheck: `bun run --cwd apps/web check`.

### V1 deletion list from the candidate

- Remove `@vercel-labs/xref` and its lockfile entry.
- Remove `RepositoryTriagePane` ownership from the Agents shell.
- Remove the queue, scanner search/filters, overlap modal, node/seed copy, and Xref action labels from the product surface.
- Rename Xref-specific internal types and modules to `WorkEnrichment` terminology as they are recreated.
- Do not carry the candidate's full node graph into the priority payload.

## Later-slice gates

- V2 must use the full temporal transition table and a DB-backed active claim before automatic refresh or multi-instance dispatch.
- V3 cannot ship an exceptional row signal until a labeled sample supports its precision threshold.
- Durable background execution and item-addressable rows remain optional follow-ups, not prerequisites hidden inside V1.
