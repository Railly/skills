# Round 013: register factory-loop

## Candidate

`factory-loop`, the master router for one engineering work item across the existing Railly Skills lifecycle.

## Problem

The public workflow already names intake, contract, shaping, implementation, proof, review, and case capture, but no installable skill owns the transitions. `software-factory` intentionally begins only after a shape or Formula is accepted and ends before final review. `herdr-workstreams` materializes approved work and specialist passes but does not own method or phase order. `software-factory-maintenance` owns maintainer queue cleanup, contributor branches, merge, release, and production verification, not the gated contributor workflow.

Without a router, an agent can invoke the right methods in the wrong order, trust a stale handoff, preserve proof after the diff changes, create the acceptance artifact before final review, or infer PR authority from implementation authority.

## Shape

Keep `software-factory` narrow and add a separate orchestrator. `factory-loop` owns:

- finding the earliest incomplete current state;
- read-only classification and explicit human admission before mutation;
- respecting the minimum admitted Formula so support, investigation, reproduction, and review do not become unauthorized change runs;
- the contract and Solution Gate boundary for non-mechanical work;
- delegation to Software Factory rather than restating implementation methods;
- separate Spec and Standards verdicts on one exact code state;
- Before After only after Review Gate passes;
- explicit human authority for each external promotion action and narrow routing to its owning workflow;
- successor routing and downstream evidence invalidation;
- handoff reconciliation and final Case capture.

The delegated skills continue to own their methods. The loop does not implement Shaping, Test Strength, Resilience Audit, Review Gate, Before After, or Record a Case internally.

Herdr remains an optional runtime adapter. Solution Gate, Software Factory, and Review Gate may materialize independent passes visibly through `herdr-workstreams`, while Factory Loop retains routing, evidence freshness, and authority gates. Visibility never satisfies a phase.

## Execution-order correction

Software Factory previously listed Test Strength before hardening while its stage table left hardening unowned. A Resilience Audit can find a defect, change production code, and add a regression test, which makes earlier mutation evidence stale. The revised order is:

```text
implement → simplify → resilience-audit when triggered → test-strength → real behavior
```

Every run classifies resilience applicability. Only triggered boundaries invoke the full audit. Any hardening change invalidates downstream strength and proof evidence.

## Decision

Register `factory-loop` as experimental. Keep `software-factory` experimental while adding explicit `resilience-audit` delegation and final-code Test Strength. Update the public workflow to show admission, the staged factory, acceptance evidence, and the human promotion gate.

## Evidence status

The component methods are backed by different maturity levels, but the complete router has no recorded real-work run or baseline comparison. Its first dogfood run must measure whether it prevents a skipped phase, stale artifact, or authority error without forcing irrelevant stages.

## Promotion questions

1. Does earliest-incomplete routing save work without trusting stale state?
2. Does the resilience classification trigger on real failure boundaries and stay out of mechanical changes?
3. Does exact-state invalidation prevent stale Test Strength, Review Gate, or Before After evidence?
4. Does the promotion gate distinguish commit, push, PR, merge, release, deployment, and communication authority?
5. Does the router add coordination value without recreating the deprecated broad Unfold protocol?
