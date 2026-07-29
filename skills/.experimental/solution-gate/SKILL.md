---
name: solution-gate
description: "Experimental: Gate the shape of a fix before it is written. Two reviewer runtimes on different model families propose independently, each declaring falsifiable predictions; the cheapest refuting probe runs before any synthesis; proposals are scored against a catalog of recorded fix-failure shapes. Use when a diagnosed defect has more than one plausible solution shape, when the change alters a contract between components, or when it is the fix for a previous review round. Skip for mechanical changes. Awaiting real-work cases."
compatibility: Requires two reviewer runtimes on different model families, neither of them the runtime that will implement. Probes need the target repo buildable and runnable. Writes to a canonical Railly Skills checkout.
---

# Solution gate

[Review Gate](../../review-gate/SKILL.md) asks whether a diff is correct. Nothing asks whether it was the right thing to build. This gate sits on the arrow between a reproduced defect and the change that answers it, which the workflow leaves empty.

That arrow is where the evidence says defects concentrate. The portless gate-miss ledger records five separate rounds where the *fix* was the defective artifact: a fix that generalized past its finding, a fix that made the path it touched worse than before, a fix that reintroduced its own defect one variant deeper, a fix that left the reported bug open one flag deeper, and a guard that satisfied the invariant written for it and still missed. Review Gate's `covered` check exists because the fix commit is the least-reviewed commit on any branch. This gate exists because reviewing its lines was never the missing part.

**The failure mode this gate must not become.** Two models arguing about a design, with no contact with the substrate, is imagination sampling with two samplers — the thing Review Gate opens by rejecting. In the round that motivated this skill, every real finding came from driving the artifact and none from argument: the blind reviewer found the worst defect by building the *previous* release, starting that daemon, and measuring. Argument decides which proposal is better written. Only a probe decides which is true. Every step below exists to keep the debate anchored.

## 0. Decide whether this fires

Run it when any of these hold:

- The defect admits more than one solution shape, and the shapes differ in where state lives, which component owns a decision, or what a contract promises.
- The change alters a contract between components: a new field two processes must agree on, a changed return, a new failure outcome, a new persistent artifact.
- It is the fix for a finding from a previous review round. This is the empirically highest-risk commit class and gets the gate regardless of how small it looks.

Skip it for mechanical work: a wording correction, a missing allowlist entry, a rename, a fix whose shape the defect fully determines. A gate that runs on everything becomes ceremony, and ceremony gets skipped exactly when it was needed. Record the skip and its reason; that record is what makes the trigger tunable later.

**Complete when:** the trigger is answered yes with which clause fired, or no with a reason, in one line.

## 1. State the defect as a contract, not a symptom

Write, before any proposal exists:

- **The property that is violated**, in one sentence containing no symptom, no timing, and no reproduction steps. "A CLI waits 4.1 seconds" is a symptom. "A process decides another process's behavior from its own environment" is the property.
- **The observable that must change**, and how it will be measured. This becomes the shared success criterion, so proposals cannot each define their own win condition.
- **What must not change.** Enumerate the behaviors currently working that pass through the same code. This is the S1 tripwire, written before anyone is invested in a design.

Hand this to both proposers as the entire brief. Do not include a proposed fix, a hint, or a preference: a brief that names a direction gets that direction back from both runtimes, and their agreement will read as convergence.

**Complete when:** the property, the observable, and the must-not-change list exist and contain no proposed solution.

## 2. Two independent proposals, blind to each other

Run two reviewer runtimes **on different model families**, neither of them the runtime that will implement. Same-family proposers share priors and blind spots, and their agreement carries no information. The implementer is excluded because it will be the one grafting and must not be defending.

Each returns, in this structure and no other:

- **Shape** — where state lives, who owns each decision, what the contract becomes. Not code.
- **Predictions** — at least two statements that are observably true if the shape is right and observably false if it is wrong, each naming the command or measurement that would show it. A prediction that cannot fail is not a prediction.
- **Cost** — what it adds: files, fields, round trips, migration, a thing future changes must remember.
- **What it makes worse** — mandatory, never "nothing". Every real design trades something. A proposal claiming no downside has not found its own.
- **Rejected alternatives** — what else was considered and the fact that killed each.

Run them concurrently and do not let either see the other's output. Record both verbatim before any judgment.

**Complete when:** two structured proposals exist, produced independently, each with falsifiable predictions and a stated downside.

## 3. Run the cheapest probe that could refute

Collect every prediction from both proposals. For each, ask what the *smallest* observation would refute it — not a spike, not an implementation. Usually one of: measure the current behavior, grep for a consumer nobody enumerated, build the previous release and run it, force the error path, read the installed tool's own option table.

Run those probes now, before scoring. Record the command and its output.

A probe is not proof that a shape is correct; it is a cheap chance to kill a wrong one before it is argued for. Predictions that survive stay predictions, and any that cannot be probed with the environment available is recorded as an unverified assumption attached to its proposal — never quietly upgraded to a fact.

**Complete when:** every prediction is refuted, survived, or named unprobeable with the reason; each carries its command and observed output.

## 4. Score against the recorded failure shapes

Read [references/failure-shapes.md](references/failure-shapes.md) and score each surviving proposal against every shape. This is the objective half: each shape is a recorded case, so "does this repeat S1" has a citable answer and two readers can disagree about a fact instead of a taste.

A hit is not a rejection. It is a cost that must be designed out or accepted out loud, with its reason, in the record. What is not allowed is a hit passing silently.

Weight **S1 (over-reach)** and **S2 (under-reach)** highest when the change is itself a fix for a previous round.

**Complete when:** both proposals carry a per-shape verdict, each hit either designed out or accepted with a stated reason.

## 5. Synthesize, and say which kind of synthesis it was

The implementing runtime now decides, and states which of these happened:

- **One proposal whole**, because it dominates on the probes and the shapes. Say what the other one had that was genuinely better and why it was still not taken.
- **A graft**, because each proposal owns a different part of the answer. Name the seam and check it: two shapes composed can satisfy each proposer's predictions and violate a property neither was watching.
- **Neither**, because the probes refuted both. Say what the probes taught and return to step 1 with a sharper property. This outcome is a success of the gate, not a failure of it, and it is cheap here and expensive after implementation.

Take proposals with tongs. Both proposers are confident by construction and neither ran the code. A prediction that survived a probe is evidence; a rationale that reads well is not. Where a proposal asserts something load-bearing that no probe touched, it stays an assumption in the record and gets verified during implementation, not before.

**Complete when:** the chosen shape is written down with its synthesis kind, the losing material is accounted for, and every carried assumption is listed.

## 6. Record and hand off

Write the decision to the canonical `Railly/skills` checkout, resolved through `RAILLY_SKILLS_REPO`, `~/Programming/railly/skills`, or `~/railly-skills` (`scripts/resolve-source-root.mjs`). Never into the target repo or an installed copy. The record holds both proposals verbatim, the probe log, the shape scoring, and the synthesis — a decision whose losing alternatives are not preserved cannot be re-examined when the fix turns out wrong.

Then hand off:

- The carried assumptions become verification targets for the implementation, and belong in [trail-decisions](../trail-decisions/SKILL.md) as rows with their predicates.
- The must-not-change list from step 1 becomes a checklist for Review Gate step 5, where each entry is driven rather than reasoned about.
- If a probe refuted a proposal by exposing a defect outside the current scope, that is an issue candidate, not a footnote.

When a fix that passed this gate is later found defective, the failure is harvested back into [references/failure-shapes.md](references/failure-shapes.md) with its provenance, the same discipline Review Gate applies to its own catalog. A shape enters only from a recorded case.

**Complete when:** the record exists at the canonical root, assumptions are handed to implementation, and the must-not-change list is handed to review.

## Dogfood pairing

The pairing in use is `fable-5` and `gpt-5.6-sol` at high reasoning effort as proposers, with `claude-opus-5` synthesizing and implementing. Nothing in the method depends on those three; what it depends on is two proposers from different families and an implementer that proposed nothing. Record the three runtimes in the decision record so a later reader can tell a method result from a model result.
