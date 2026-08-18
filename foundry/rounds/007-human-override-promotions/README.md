# Round 007: Human override promotions

Status: proposed, awaiting commit
Date: 2026-08-11
Scope: three direct decisions from Hunter after reviewing the Round 006 snapshot

## Decision question

Round 006 promoted only the skills with a verified applied case in `cases/` or `foundry/runs/`. Hunter reviewed that snapshot and made three calls that are not fully backed by a recorded case in this repository. `governance.md` requires "a human approves promotion" as the final step of every promotion — this round records that step explicitly, including where it runs ahead of the recorded evidence.

## Decisions

### 1. Deprecate `pick-an-issue`

Hunter: "de ellos, diria que pick an issue ya no lo uso deprecar creo." SkillKit shows 1 invocation in 90 days, consistent with his read.

- Archived the original implementation under `foundry/deprecated/pick-an-issue/`.
- A later v0.0.4 migration renamed the canonical method to `issue-intake` and restored `skills/pick-an-issue/` as a self-contained deprecated compatibility alias for one release.
- New workflows use `issue-intake`; the alias remains in the stable installer only to avoid breaking existing invocations.

### 2. Promote `handoff` to dogfooded

Hunter: "handoff muy dogfooded subelo." SkillKit shows 7 invocations in 90 days, the second-highest count in the registry.

- **Evidence gap**: Round 006 checked `cases/` and `foundry/runs/` for `handoff` and found only filename-substring collisions (e.g. `agent-browser-ca-trust-handoff-2026-08-08.md` in an unrelated vault path), not a recorded application of the method. This promotion runs on Hunter's personal dogfooding experience, not on a case this repository can point to.
- Maturity set to `dogfooded` in `foundry/maturity.json` on his explicit call. Channel unchanged (`experimental`) — he named it for a maturity bump, not a distribution change.
- Follow-up: file a case for the next real handoff so the registry has evidence of its own, not just a human's word for it.

### 3. Promote `solution-gate` and keep `review-gate` in the stable channel

Hunter: "para stable pondria review gate y solution gate muy buenos la verdad." `review-gate` was already stable. `solution-gate` was `experimental` channel with `dogfooded` maturity from its own evidence (portless #367, plus later agent-browser #1670/#1677 runs found during this review).

- Moved `skills/.experimental/solution-gate/` to `skills/solution-gate/`.
- Updated `.claude-plugin/marketplace.json`: `solution-gate` moved from the `experimental` plugin's skill list to the `stable` plugin's skill list, alongside `record-a-case` and `review-gate`.
- Updated `foundry/maturity.json` channel to `stable`.
- Unlike `handoff`, this promotion has multiple recorded runs behind it (`runs/solution-gate/2026-07-29-portless-367-c0862b9.md` and the agent-browser cases surfaced in Round 006) — the channel change tracks evidence that already existed, not a pure override.

## Net effect on the registry

| Skill | Before | After |
|---|---|---|
| `pick-an-issue` | stable / dogfooded | original archived; deprecated compatibility alias retained for v0.0.4 |
| `handoff` | experimental / experimental | experimental / **dogfooded** (human override, case still missing) |
| `solution-gate` | experimental / dogfooded | **stable** / dogfooded |

## Note on process

This round mixes two different kinds of promotion in one place: `solution-gate` is evidence-led (the case backing it already existed, this round just acted on it), while `handoff` is human-led with the evidence still owed. Keeping the distinction explicit here, rather than writing both as if they had the same footing, is what lets the next audit tell them apart.
