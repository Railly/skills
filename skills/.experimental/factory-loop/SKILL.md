---
name: factory-loop
description: "Orchestrate one engineering work item from selection or admission through contract, solution shape, staged execution, exact-head review, before/after acceptance, human promotion, and case capture. Use when the user asks to run the full factory, take an issue or change to PR-ready, resume an interrupted engineering cycle, or coordinate the Railly Skills workflow end to end. Enter at the earliest incomplete state. Do not use for a single isolated phase such as issue selection, shaping, implementation, review, or visualization."
compatibility: Requires the applicable phase skills, a repository with runnable checks, and explicit human authority before mutation and promotion.
allowed-tools:
  - Skill(issue-intake)
  - Skill(work-intake)
  - Skill(solution-gate)
  - Skill(software-factory)
  - Skill(review-gate)
  - Skill(before-after)
  - Skill(handoff)
  - Skill(workstream-reconcile)
  - Skill(ship)
  - Skill(record-a-case)
  - Agent
---
# Factory loop

Route one work item through the smallest complete evidence path. The loop owns phase order, admission, evidence freshness, re-entry, and human gates. Each delegated skill owns its method.

```text
select? → admit → contract → shape → execute → Spec → review → show → human promote → deliver → record
                       ↑          │                                        │
                       └─ reshape ┴─ successor run ← feedback ─────────────┘
```

`software-factory-maintenance` is a separate maintainer workflow for queue cleanup, contributor branches, merge, release, and production verification. Do not silently substitute it for this gated loop.

`herdr-workstreams` is an optional runtime adapter, not another lifecycle owner. When this loop runs inside Herdr, delegated gates and factory stages may use it for visible on-demand specialists. Topology and lifecycle state never satisfy a phase or upgrade prose into evidence.

## 1. Locate the earliest incomplete state

Inventory the selected source, source revision, Issue Contract, accepted shape or Formula, repository HEAD, diff, stage evidence, review report, acceptance artifact, promotion state, and case. Treat remembered or agent-reported completion as a lead.

If no item is selected, invoke `issue-intake` and stop for the user's choice. If a handoff exists, invoke `workstream-reconcile` and route from its current evidence, not its historical stage label. Do not rerun a complete phase unless later changes invalidated it.

**Complete when:** one current work item and its earliest incomplete phase are named with evidence.

## 2. Admit before mutation

Invoke `work-intake` for one selected issue, pull request, or manual request. Preserve its pinned source identity, intent, recommended Formula, unknowns, allowed actions, and forbidden actions. Stop for explicit human confirmation. Revalidate the source revision immediately before admission.

Classification never grants mutation authority. A changed source, unpinned skill revision, or unconfirmed Formula blocks entry.

Follow the admitted Formula's minimum path. Support, investigation, bug reproduction, and pull-request review stop at their own human decision and durable record unless that decision admits a successor change. Only mechanical and non-mechanical change Formulas continue through implementation and promotion.

**Complete when:** the human admitted one current Formula or declined it, with no mutation during intake.

## 3. Freeze the contract and shape

For an unverified bug, reproduce the claim at the user-visible layer before proposing a fix. Freeze acceptance IDs, must-not-change behavior, non-goals, risks, and proof commands in the Issue Contract.

For a non-mechanical change, invoke `solution-gate`; let it orchestrate `shaping`, and require a passing fit check plus an independently mergeable accepted slice. A mechanical change records why its mechanism is determined and skips Solution Gate without silently skipping later proof or review.

**Complete when:** an executable contract and accepted slice exist, or the run stops with the unresolved contract decision.

## 4. Execute through the staged factory

Invoke `software-factory` with the admitted Formula and accepted contract. It owns implementation, bounded reduction, resilience classification and hardening, final test strength, and real-behavior proof. Preserve its independent-pass evidence and unavailable or owed items.

Thrashing returns to Solution Gate. A stage failure stops the run. Do not route around either result.

**Complete when:** one exact diff and repository state have complete factory evidence, or the stopped stage is recorded.

## 5. Gate Spec and Standards separately

Run an independent Spec check against every accepted ID and must-not-change behavior. Record `pass`, `fail`, or `not_provided`; green tests never imply Spec approval.

Only after Spec passes, invoke `review-gate` on the exact current HEAD or immutable diff. A review finding that preserves the contract starts a successor factory run. A finding that changes the contract or shape returns to Solution Gate.

**Complete when:** Spec and Standards both pass the same exact code state, with gaps kept explicit.

## 6. Build the human acceptance artifact

After Review Gate passes, invoke `before-after` for every behavioral, visual, or quantitative change. Compare the reviewed head with its declared baseline on one shared basis. Strictly mechanical work may record `not_applicable` with the observable reason.

The artifact presents evidence; it does not replace Spec, Test Strength, Resilience Audit, or Review Gate.

**Complete when:** the reviewed change has a verified browser-openable comparison, or a justified mechanical exemption.

## 7. Stop at the promotion gate

Present the contract outcome, exact reviewed HEAD, factory evidence, Spec and Standards verdicts, before/after path, gaps, and proposed external action. Require explicit human authority before commit, push, PR creation or update, merge, release, deployment, or external communication. After approval, route commit, push, and PR actions to `ship`; route any other named action only to its owning workflow when available. If an owning workflow is unavailable, report the missing dependency and stop instead of recreating a partial delivery path.

Promotion applies only to the exact reviewed state. Never infer one external action from authority for another.

**Complete when:** the human approves a named action on an exact state, requests a successor, or declines promotion.

## 8. Re-enter without stale evidence

Any code or contract change invalidates every downstream artifact that depended on it. Contract or shape changes return to Solution Gate. Code-only corrections start a successor Software Factory run, then repeat Spec, Review Gate, and Before After. Presentation-only edits may preserve code evidence only when their compared source identities remain unchanged.

When the cycle ends open, invoke `handoff`. On resume, reconcile and enter at the earliest incomplete state.

## 9. Close and compound

After the authorized outcome is delivered, declined, disproved, or otherwise closed, invoke `record-a-case`. Keep technical validation, human review, maintainer acceptance, and delivery independent. An open interruption uses Handoff instead. A case may propose a Foundry lesson; it does not automatically change a skill or gate.

**Complete when:** the durable case reconstructs the cycle and the next state is closed or explicitly handed off.
