---
name: solution-gate
description: "Orchestrate Shaping to decide whether a fix or contributor PR is the right thing to build. Use before implementation when a defect has multiple solution shapes, changes a contract or persistent state, follows a prior review finding, or requires adopting, amending, absorbing, recreating, or rejecting an existing patch. Freeze the evidence-backed contract, run isolated Shaping passes, refute their weakest assumptions, feed evidence back into their fit checks, then gate the selected shape. Skip mechanical changes."
allowed-tools:
  - Skill(shaping)
  - Agent
---
# Solution gate
[Review Gate](../review-gate/SKILL.md) asks whether a diff is correct. Solution Gate asks whether the selected shape deserves implementation. It orchestrates the `shaping` skill:

```text
reproduced defect → frozen contract → blind Shaping passes → probes → reshaping → verdict → detail/breadboard/slice → implementation → Review Gate
```

Solution Gate owns evidence, contamination control, adversarial probes, failure-shape scoring, and the verdict. Shaping owns requirements, solution options, parts, fit checks, flagged unknowns, and post-verdict detailing. Do not maintain a second proposal format or fit check here. Read [references/shaping-orchestration.md](references/shaping-orchestration.md) before running the gate.

## 0. Decide whether this fires
Run it when shapes differ in state ownership, component boundaries, lifecycle, compatibility, authority, or contract; when fixing a prior review finding; or when an existing candidate must be adopted, amended, absorbed, recreated, or rejected.

Skip wording, snapshots, renames, allowlist entries, and other changes whose mechanism is fully determined. Record the reason. Choose greenfield or candidate-audit mode. For a candidate, also follow [references/candidate-audit.md](references/candidate-audit.md).

**Complete when:** mode and trigger are named, or the skip has a reason.

## 1. Freeze the shaping input
Before any shape exists, write an evidence-only packet:

- Frame: violated property and desired outcome, not symptoms or a fix.
- Settled requirements: observable success and external product constraints.
- Must-not-change requirements: working workflows crossing the same code.
- Unknowns: unresolved facts, never silently converted into requirements.
- Source handles: every factual mechanism claim points to a line or command actually read or run.

If state can survive an invocation, apply [references/temporal-contracts.md](references/temporal-contracts.md). Ordinary workflow continuity belongs in R, and omission remains distinct from explicit clear.

Freeze this packet as the shared input to Shaping. Shaping may discover candidate requirements, but labels them derived or undecided instead of rewriting settled product constraints.

**Complete when:** the packet contains no proposed mechanism, all load-bearing facts have evidence handles, and persistent state has a transition contract.

## 2. Orchestrate independent Shaping passes
Invoke `shaping` in two isolated reviewer runs on different model families, neither being the implementer. Give both the same frozen packet and no candidate artifact. Each pass produces:

- the complete R table, preserving settled, derived, and undecided status;
- materially distinct shapes with mechanism parts and flagged unknowns;
- a binary R × Shape fit check with failure notes;
- a recommended survivor, rejected alternatives, and required spikes.

Do not ask for Solution Gate's old proposal schema. Predictions, costs, and harmful branches are extracted from shaped mechanisms during the adversarial pass. If only one shape is physically possible, record the evidence instead of manufacturing alternatives.

**Complete when:** two independent shaping artifacts exist, or the record proves the solution is mechanically determined.

## 3. Reconcile without averaging
Compare both R tables first. Preserve product-policy disagreements for human judgment. Probe disagreements about current behavior. Add a derived R only when standalone and evidence-backed.

Normalize equivalent shapes without erasing provenance. Do not vote or average. A fit-check majority is not evidence, and model agreement does not upgrade a guess.

**Complete when:** one reconciled R table exists, disagreements retain provenance, and every surviving shape traces to its shaping artifact.

## 4. Attack the shaped mechanisms
For each survivor, trace at least three forward effects. Every link names its mechanism and is marked `observed`, `inferred`, or `guessed`; branch into harmful effects.

Extract falsifiable predictions from the weakest load-bearing links and run the cheapest probes that could refute them. For persistent state, execute multiple actions against the same live session and measure continuity beyond exit code. Test restart rules in both directions. Unit tests and fingerprints prove mechanics, not product contracts.

Record command, exit code, output, and affected R or shape part. Unprobeable claims stay assumptions.

**Complete when:** each load-bearing prediction is refuted, survived, or explicitly unverified.

## 5. Feed evidence back into Shaping
Return probe results to the shaping artifacts. Through `shaping`, update R status, shape parts, flags, failure notes, and fit checks. A refuted mechanism becomes ❌ or is reshaped; do not patch the verdict around it.

If composing parts from different shapes, create a new named shape, run its full fit check, and probe its seam. If every shape fails, return to the Frame or R instead of choosing the least broken option.

**Complete when:** the selected shape passes the updated fit check with no hidden flags, or Shaping records that no shape survives.

## 6. Apply the failure catalog and decide
Score the selected shape against every case in [references/failure-shapes.md](references/failure-shapes.md). Each hit is designed out or accepted explicitly. Weight S1 and S2 higher for fixes to prior review findings.

Issue one verdict:

- **Pass to detail:** the shaped mechanism survived probes and failure scoring.
- **Reshape:** evidence invalidated a part but the Frame and R remain sound.
- **Return to contract:** product ambiguity or wrong requirements block selection.
- **Reject candidate:** candidate mode only; the revealed implementation violates the selected contract.

Candidate mode may additionally say adopt, amend, or absorb and recreate, with credit preserved. A graft is not a verdict until Shaping represents and checks it as a new shape.

**Complete when:** the verdict cites the final shaping artifact, probe evidence, catalog hits, and carried assumptions.

## 7. Hand back to Shaping and Review Gate
Only after **Pass to detail**, resume `shaping` for detailing, breadboarding, and slicing. Solution Gate does not own those artifacts. Hand settled R and the must-not-change set to Review Gate as executable checks, and carried assumptions to implementation as verification targets.

Record the decision in the canonical Railly Skills checkout resolved through `RAILLY_SKILLS_REPO`, `~/Programming/railly/skills`, or `~/railly-skills` via `scripts/resolve-source-root.mjs`, never an installed copy. Keep observed behavior separate from proposed diagrams as described in [references/runs.md](references/runs.md).

**Complete when:** Shaping receives the verdict and evidence, implementation receives assumptions, and Review Gate receives the complete must-not-change set.
