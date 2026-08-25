# Issue Contract: Railly/skills factory-loop

Status: proof-ready
Source: manual request to publish the Factory Loop orchestrator
Target repository: Railly/skills
Base: dc2ab9752e1398fae7c16cf153c0c3304ff11a62
Branch: feat/factory-loop

## Outcome

Railly Skills publishes one experimental `factory-loop` skill that routes a single engineering work item through the smallest complete evidence path without absorbing the methods owned by its delegated skills.

## Observed

`origin/main` publishes the component skills and Herdr runtime adapter, but no installable skill owns end-to-end phase order, evidence invalidation, re-entry, or promotion authority.

## Expected

The installed router enters at the earliest incomplete state, delegates every phase to its owner, preserves Spec and Standards as separate verdicts on one exact state, stops for explicit promotion authority, and remains compatible with Herdr as an optional visibility layer.

## Acceptance

- A1: `factory-loop` is installable from the experimental marketplace and routes selection, admission, contract, shape, execution, Spec, Standards, Before After, promotion, delivery, and case capture in order.
- A2: `software-factory` owns only implementation through real-behavior proof and orders bounded simplification, applicable resilience hardening, final-code Test Strength, and proof without owning final Review Gate.
- A3: code or contract changes invalidate dependent downstream evidence and route to the earliest affected phase.
- A4: commit, push, PR, merge, release, deployment, and communication each require explicit authority for the exact reviewed state.
- A5: Herdr remains an optional runtime adapter whose topology and lifecycle do not satisfy Spec, Standards, or factory stages.
- A6: release metadata, public documentation, evals, tests, and the workflow graph register Factory Loop as experimental in `0.0.8` and Foundry Round 013.

## Non-goals

- N1: Replace the methods of Issue Intake, Work Intake, Solution Gate, Software Factory, Review Gate, Before After, Ship, Handoff, Workstream Reconcile, or Record a Case.
- N2: Absorb `software-factory-maintenance`, which retains maintainer queue, merge, release, and production responsibilities.
- N3: Promote Factory Loop beyond experimental before a real end-to-end dogfood and baseline comparison.
- N4: Make Herdr mandatory or bind the workflow to one agent runtime or model.

## Invariants

- I1: Green tests never imply a Spec pass, and a clean Standards review never fills a missing Spec verdict.
- I2: Visibility never upgrades prose into evidence or an agent lifecycle state into phase completion.
- I3: Later production or test changes invalidate every dependent downstream artifact.
- I4: Mechanical skips are explicit and never silently skip proof, review, or authority gates.
- I5: Component skills retain their existing standalone triggers and portable non-Herdr Agent fallback.

## Change surface

Expected:

- `skills/.experimental/factory-loop/`
- `skills/.experimental/software-factory/`
- marketplace, maturity, changelog, README, workflow graph, evals, tests, and Foundry Round 013

Must inspect:

- `herdr-workstreams`, `solution-gate`, `review-gate`, and `software-factory-maintenance` boundaries
- release numbering and Foundry round numbering after `v0.0.7`
- exact-state invalidation, promotion authority, installer registration, and public workflow ordering

## Verification

- [x] `bun scripts/validate-skills.mjs` -> A1, A2, A6, I5
- [x] `bun scripts/validate-issue-contracts.mjs` -> A1, A2, A3, A4, A5, A6, I1, I2, I3, I4, I5
- [x] `bun scripts/verify-eval-fixtures.mjs` -> existing executable fixture corpus regression; Factory Loop evals are structural until a dedicated harness exists
- [x] `bun test scripts/lib/*.test.mjs` -> A2, A3, A5, A6, I1-I3, I5
- [x] `cd www && bun run check && bun run build` -> A6
- [ ] independent Spec review -> A1, A2, A3, A4, A5, A6, I1, I2, I3, I4, I5
- [ ] exact-state Review Gate -> Standards
- [ ] verified current-state Before After -> human acceptance
- [ ] GitHub PR checks and published `v0.0.8` -> delivery

## Risk

- tier: R2
- human gate: approve exact reviewed state before delivery; verify public release after merge.

## Promotion

- deterministic: pass on integrated working tree
- spec: pending
- standards: pending
- delivery: authorized, pending exact-state gates

## Handoff

- exact next command: run independent Spec review against this contract
- authority boundary: Hunter authorized commit, push, PR, merge, and release for the exact state that passes Spec, Standards, checks, and release verification.
- known gaps: current Before After predates the `v0.0.7` integration and must be regenerated.

## Contract changes

- 2026-08-25: rebased from `946b484` to `dc2ab97`, preserved Herdr as an optional runtime adapter, moved the release from `0.0.7` to `0.0.8`, and moved the Foundry decision from Round 012 to Round 013.
