# Ovation work enrichment candidate audit

Date: 2026-08-21

Target: `vercel-labs/ovation` at base `7a510dd71dd7c98b8db8fc61b75ea83dcffd7541`

Candidate: dirty local branch `railly/xref-panel-v1`

Candidate patch SHA-256: `53e038bd81e104597ba8579ed52d67c86a2a57edbd9cb542e56a1c1ea4930156`

Mode: candidate audit. Both reviewers used detached clean worktrees at the base commit and received the same evidence-only packet before the candidate was revealed.

Runtimes:

- reviewer A: Claude Fable 5 via Claude Code
- reviewer B: Cursor Grok 4.6
- synthesizer: Codex GPT-5

Artifacts:

- packet SHA-256: `72869267091f92ab0e3b94d95fe9c06fa0cac29f1f1885f4004291e8cd0295eb`
- Claude review SHA-256: `a9f5031a6d482faf35d3a212784bef494e99bbcd82b93e47a0cc18786afb312e`
- Grok review SHA-256: `7268dfccd9464437cfafbf4b74a71b41023d5f0820ae92284bc3371e0aee80d3`
- OpenAI direct reviewer attempt failed with HTTP 401; a Cursor Codex attempt returned an empty artifact and was not counted.

## Decision

**Verdict: Pass to detail. Candidate verdict: Absorb and recreate from main.**

Do not publish Xref and do not keep the local `@vercel-labs/xref` runtime dependency. Preserve the product and implementation learning from the prototype, then rebuild the selected `WorkEnrichment` shape inside Ovation.

The selected shape is [shaping.md](./shaping.md): complete lightweight priority over every discovered open Issue and Pull Request, plus a separately covered relationship layer projected into existing rows and detail. The Agents sidebar remains exclusively agents/runs. The dedicated Repository triage/Xref pane is removed from the target shape.

## Candidate reveal

The dirty candidate is useful evidence and a wrong product boundary:

- It adds `@vercel-labs/xref` as `file:../../../vercel/xref` in `apps/web/package.json`.
- It replaces `AgentsPane` with `RepositoryTriagePane` on repository surfaces in desktop and mobile.
- It creates a second queue with Attention, Review, Linked, Untracked, search, ranking, overlaps, and rerun controls.
- It improves temporal continuity by retaining the previous report in queued/running/failed snapshots.
- It uses 100 backlog seeds and a 240-node graph cap, then renders rank and score as though they were comparable over the repository.
- It introduces 1,030 possible PR-conflict pairs for the live `agent-browser` sample.

### Candidate comparison

| Dimension | Selected blind result after probes | Candidate | Delta |
| --- | --- | --- | --- |
| Contract observable | Existing work list and detail gain optional evidence; Agents remain available. | Separate Repository triage queue occupies Agents sidebar. | Material violation. |
| Primitive semantics | Complete paginated lightweight ranking; relationship analysis has independent coverage. | One bounded graph supplies both rank and relationship results. | Material violation. |
| Authority | GitHub rows remain primary; score is opt-in evidence. | Result queue and rank become the practical selection surface. | Material violation. |
| Lifecycle | Last completed projection plus separate attempt overlay. | One persisted snapshot preserves the old report but stores in-flight status as the canonical row. | Amendable mechanism, wrong boundary. |
| Compatibility | In-tree provider-neutral projection. | Local unpublished Xref package and Xref-specific types/copy. | Material violation. |
| Reusable work | Temporal transition intent, typed relationship vocabulary, internal-link routing, score explanation, exact reset integration. | Present in candidate. | Absorb concepts and focused helpers, not the pane or package seam. |

Credit: the prototype materially established the useful relationship vocabulary, internal navigation behavior, rerun continuity, and the need to show ranking explanations. Preserve that credit in the replacement change description.

## Probe log

| ID | Probe | Result | Affected shape/R |
| --- | --- | --- | --- |
| P1 | `gh api --paginate /repos/vercel-labs/agent-browser/issues?state=open&per_page=100` | 660 open items: 332 Issues and 328 PRs. Seven REST pages enumerate the full open set. | R6, E2 survived. |
| P2 | Aggregate list payload fields | 931 comments and 365 reactions are available directly across the 660 list rows. | E2 survived with a simpler formula. |
| P3 | Score all list rows using comments, reactions, and age | High-signal items #120, #25, #107, #279, and #483 rank near the top. All are absent from the candidate's priority rows. | Candidate ranking refuted; E2 survived. |
| P4 | GET live candidate snapshot from localhost | 100 seeds, 240 nodes, 159 ranked nodes, fetch failures, capped nodes, 625 KB JSON. | D and one-layer A refuted. |
| P5 | Count live overlaps | 1,030 pairs; 441 share at least two source files; only 2 also close the same issue. | Generic overlap surface refuted; R24 retained. |
| P6 | Two repeated GETs against the same live session | Same id, status, and generated timestamp; GET is read-only and does not dispatch. | R16 and E9 survived. |
| P7 | `gh api graphql` first Issue/PR | Comments, reactions, participants, file counts, and review totals exist on individual nodes. | Rich signals are possible. |
| P8 | GraphQL 50 Issues + 50 PRs with participants | `RESOURCE_LIMITS_EXCEEDED`. | Batched rich ranking is unverified; first formula stays REST-lightweight. |
| P9 | `bun run --cwd apps/web check` on candidate | Type generation and TypeScript check passed. | Candidate mechanics compile; product verdict unchanged. |
| P10 | `curl -I http://localhost:3000/vercel-labs/agent-browser` | HTTP 200; the user's existing dev server remained running. | Must-not-change process constraint satisfied. |

## Forward traces

### Selected Shape E

REST pagination over all open work **[observed P1]** → every discovered open item receives the same lightweight fields **[observed P2]** → formula v1 computes comparable scores **[inferred]** → Priority may honestly order all discovered open work **[inferred]**.

Helpful branch: formula raw fields remain visible **[proposed]** → an operator can override the score **[inferred]** → derived evidence does not become authority **[inferred]**.

Harmful branch: age/comments/reactions may favor popular stale requests **[guessed]** → formula version can produce a poor order **[guessed]**. Design-out: default remains Updated, score is explainable and opt-in, formula is versioned.

Separate relationship computation **[proposed]** → a relationship failure does not invalidate complete ranking **[inferred]** → useful priority survives partial graph coverage **[inferred]**.

Harmful branch: weak overlap rules emit hundreds of pairs **[observed P5]** → exceptional marks become noise **[inferred]**. Design-out: precision audit and per-type threshold before default visibility.

Latest-completed plus attempt overlay **[proposed]** → refresh does not overwrite completion **[inferred]** → failure leaves stable evidence usable **[inferred]**. Multi-instance DB claim remains an implementation verification target.

### Candidate

100 recent seeds plus a 240-node crawl **[observed P4]** → priority ranks only fetched nodes **[observed in code]** → repository triage shows rank/score **[observed in UI]** → high-signal older items disappear **[observed P3, harmful]**.

All open PR file intersections **[observed in code]** → 1,030 pairs **[observed P5]** → a dedicated conflict section and modal render them **[observed in UI]** → exceptional evidence becomes a bulk inbox **[inferred, harmful]**.

Repository route conditionally renders `RepositoryTriagePane` **[observed in code]** → Agents disappears on repository surfaces **[observed]** → analysis owns a control-plane boundary forbidden by the contract **[specified, harmful]**.

Local file dependency **[observed]** → Ovation build/runtime resolution depends on a sibling checkout **[inferred]** → deployment and ownership are not self-contained **[inferred, harmful]**.

## Failure-shape scoring

| Shape | Selected E | Candidate |
| --- | --- | --- |
| S1 over-reach | Designed out: no new queue, explorer, or relationship authority. | **Hit:** analysis replaces Agents and creates a second queue. |
| S2 under-reach | Designed out for ranking by complete pagination. Relationship coverage remains explicit. | **Hit:** fixes latest-100 presentation while missing older high-signal work. |
| S3 direction inheritance | Clear: complete ranking and partial relationships are distinct directions. | Hit: a larger node cap cannot repair incomplete seeds. |
| S4 proxy property | Clear: coverage measures participation in that exact formula. | **Hit:** node count and seed cap are adjacent to complete repository priority. |
| S5 unregistered peer | First slice reuses existing reset and repository persistence boundary. | Risk: package/runtime and pane lifecycle add peers outside active product ownership. |
| S6 peer-version blindness | N/A, no cross-process protocol. | N/A. |
| S7 wrong layer | Clear: existing rows/detail consume evidence. | **Hit:** correct signals delivered in the Agents layer. |
| S8 guard-derived cells | Tests derive from open-item domain and temporal table. | **Hit risk:** candidate cells derive from bounded scanner outputs. |
| S9 test pins wrong thing | Require mutations for pagination, stale preservation, Agents ownership, and missing-enrichment fallback. | **Hit risk:** typecheck passes without validating coverage or ownership. |
| S10 claim from prose | P1-P8 drive real GitHub data. | **Hit:** “repository” and “priority” exceed observed coverage. |
| S11 asymmetric validation | Coverage is capability-specific at every consumer. | **Hit:** rank display has weaker completeness validation than change diffing. |
| S12 primitive mismatch | Complete list primitive owns ranking; graph owns relationships. | **Hit:** bounded graph primitive used for repository-wide rank and conflict queue. |
| S13 invocation-state collapse | Designed out by explicit attempt overlay and reset-only clear. | Improved but incomplete: report is retained, yet in-flight state still occupies the canonical row and active dedupe remains process-local. |

S1 and S2 carry extra weight in candidate mode. The candidate hits both.

## Carried assumptions

- Comments, reactions, and age produce enough value for formula v1.
- The first compact projection remains small enough for one completed JSON document.
- Relationship refresh can remain bounded/explicit until runtime evidence requires a durable job system.
- A precision sample can establish defensible thresholds for row-level relationship signals.
- Priority preferences may remain in existing local filter storage, while the enrichment data stays server-canonical.

## Observed behavior

```text
agent-browser open work [P1]
├── 660 provider-native items
├── recent 100 become graph seeds [P4]
│   └── 240 fetched nodes → 159 ranked rows [P4]
├── old high-signal #120/#25/#107/#279/#483 absent [P3]
└── 1,030 overlap pairs [P5]

repository route [code]
└── right shell → RepositoryTriagePane
    └── AgentsPane unavailable on repository surface
```

## Proposed shape

```text
complete open-work inventory [observed feasible P1-P2]
└── formula v1: comments + reactions + age [proposed]
    └── optional Priority sort in existing work list [proposed]

separate relationship enrichment [proposed]
└── precision-audited exceptional references [proposed]
    ├── at most one compact row signal [proposed]
    └── Related work in existing detail [proposed]

latest completed projection + attempt overlay [proposed]
└── existing surfaces consume one coherent version [proposed]

right shell → AgentsPane [specified]
```

Format: text trees are sufficient because the disputed relationship is ownership and coverage, not spatial layout.

## Handoff

The selected Shape E, full R table, and first slice breadboard are in sibling records. Review Gate must receive R12 through R18 as executable must-not-change checks plus the ranking completeness and Agents ownership mutations.
