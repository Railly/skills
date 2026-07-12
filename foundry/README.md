# Skill Foundry

The foundry turns real maintenance work into candidate methods, evaluates them, and promotes only changes that earn their context and maintenance cost.

```text
real work
→ case
→ candidate lesson
→ baseline comparison
→ human review
→ promote or reject
```

## Surfaces

- [SHAPING.md](SHAPING.md): why the foundry exists and which repository shape was selected.
- [governance.md](governance.md): evidence ownership, maturity, and promotion rules.
- [case-template.md](case-template.md): how to record a real issue, method, outcome, and lesson.
- [eval-protocol.md](eval-protocol.md): how to compare no skill, current skill, and candidate skill.
- [candidates/](candidates): aggregated rules, exemplars, eval ideas, and coverage gaps awaiting a round.
- [rounds/](rounds): immutable promotion decisions and benchmark summaries.

## Maturity

The repository started as a vibes-driven catalog. Existing skills are not grandfathered into validation. They move through the same lifecycle as new candidates:

```text
experimental
→ dogfooded
→ evaluated
→ validated
→ deprecated
```

Validated requires a repeatable positive effect across holdouts and trials, plus human review. A green benchmark with weak fixtures or zero delta does not qualify.

Current status is tracked in [maturity.json](maturity.json).

## Cases and exemplars

A case belongs in [../cases](../cases) when its evidence is public or safely sanitized. It stays outside the agent runtime surface.

An exemplar belongs under `skills/<name>/references/` only when a promotion round demonstrates that loading it improves behavior. The case remains the evidence record; the exemplar is a smaller teaching artifact derived from it.

## First results

[Round 001](rounds/001-prove-the-test/decision.md) tested a plausible proof-record and exemplar addition for `prove-the-test`. The candidate tied the current skill in two rounds and had a weaker subprocess fallback. The foundry rejected the skill change and promoted only the eval infrastructure.

Before v0.0.1, `guided-contribution`, `repro-an-issue`, and `prove-the-test` were also reviewed as public trigger surfaces. Their useful behavior was absorbed into Unfold Change, Triage, and Review because the methods share one mission and evidence chain. The original names remain in [deprecated](deprecated) and Git history.

Rejection and absorption are intended outcomes of this system. A new skill is the most expensive result, not the default one.

## Current candidates

- [agent-browser evidence pack](candidates/2026-07-agent-browser-evidence-pack.md): unvalidated Triage and Review rules awaiting a baseline round.
- [record-a-case](../skills/.experimental/record-a-case): installable candidate for conservative post-work case capture. It defaults synthetic backfills to unvalidated and pending human review.
