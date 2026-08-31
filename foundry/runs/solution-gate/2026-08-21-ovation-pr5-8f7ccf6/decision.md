# Ovation PR 5 production boundary candidate audit

Date: 2026-08-21

Target: `vercel-labs/ovation` PR #5 at `8f7ccf65a59caa7d27fe0bc8f9ec866fef3e1143`

Base: `04b41227dd5e5e20bdd74d9505656be8e7cc4870`

Mode: candidate audit. Two blind reviewers used separate clean detached worktrees at the base commit and received the same frozen evidence packet before candidate reveal.

Runtimes:

- reviewer A: OpenAI GPT-5.6 Sol via Codex and Vercel AI Gateway
- reviewer B: Cursor Grok 4.6
- synthesizer: Codex GPT-5

## Decision

**Verdict: Pass to detail. Candidate verdict: Absorb and recreate the production data boundary inside PR #5.**

Preserve the candidate's approved Triage surface, local fixed formula, complete-backlog intent, latest-good-result behavior, and focused UI. Replace its production boundary with a durable repository projection:

- bounded, resumable calculation through the existing endpoint;
- Postgres-owned generation, active calculation, and accepted-report pointers;
- immutable compact rank rows and validated publication;
- authorized active-repository report pages outside root hydration;
- numeric Repository rank as the only Triage ordering key;
- the existing small filter cookie for first-render preference continuity;
- a new v2 authority that ignores legacy writes during rolling deployment.

Do not add Xref packaging, Trigger.dev, a dedicated Xref panel, formula controls, prompt injection, or historical run picking.

## Decisive evidence

- Authenticated localhost POST for `vercel-labs/agent-browser`: HTTP 200, 660 ranked items, 6.57 seconds, 7,394,108 response bytes.
- The compact 660-row projection is 71,720 bytes; its first 100 rows are 11,122 bytes.
- GitHub requests each time out after 15 seconds, but the full paginator has no overall request budget. One-shot execution therefore remains unbounded for unknown larger repositories.
- Shared Postgres transactions and normalized GitHub cache rows already exist, so request-driven continuation needs no new job platform.
- The candidate reset fence is process-local while persistence is shared.
- The root layout accepts cookie-selected repository keys and serializes every selected report without the API scope guard.
- The candidate's local formula is fixed and versioned, but the sidebar re-sorts rounded scores instead of persisted ranks.

The anonymous curl probe returned HTTP 401 and was rejected. The browser-session measurement is the accepted runtime evidence.

## Candidate credit

The candidate established the product language, local formula, complete-backlog calculation, item Triage view, and preservation of a previous completed result after recalculation failure. Preserve this credit in the amended PR. The rejected mechanisms are the cookie/root hydration index, raw GitHub response, process-local reset, weak persisted validation, and rounded-score ordering.

## Failure catalog

S1 and S2 are designed out by preserving existing workflows and testing the class across old items, long repository names, rounded ties, reset races, malformed reports, revoked scopes, and payload growth. S4 is designed out by checking durable generation and active calculation identity rather than process liveness. S5 and S6 are designed out by one v2 lifecycle owner and by ignoring legacy writes during rollout. S7 is designed out by tracing accepted rank rows to the route loader, client state, sidebar, and item tab. S9 requires independent removal tests for generation, calculation identity, uniqueness, formula validation, and authorization. S11 is designed out by authorization at the authoritative DAL. S12 is designed out by a conditional Postgres pointer update matching publish-if-current semantics. S13 is designed out by preserving omission and reserving deletion for explicit reset.

## Detail handoff

Implementation proceeds as three vertical slices:

1. Trusted compact reload: no raw backlog response, no report arrays in root hydration, rank 1 restored without a default-sort frame.
2. Bounded resumable calculation: fixed provider-page budget per POST, durable progress, prior accepted result retained.
3. Reset and failure races: cross-process generation fence, rolling-deploy old-writer test, malformed-report mutations.

Review Gate receives all D1-D10 cases from the frozen contract plus route-payload slopes at 0, 1, 8, and 32 reports and a two-process reset race.

Canonical detailed artifacts live in Hunter's vault:

- `05_Areas/vercel/ovation-pr5-solution-gate-2026-08-21.md`
- `05_Areas/vercel/ovation-pr5-detail-and-slices-2026-08-21.md`
- `05_Areas/vercel/solution-gate-runs/ovation-pr5/`

Format: Markdown tables and one Mermaid breadboard are sufficient because the disputed relationships are lifecycle, ownership, and delivery boundaries.
