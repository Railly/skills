---
name: solution-gate
description: "Gate whether a fix or existing contributor PR is the right thing to build. Use before implementation when a defect has multiple solution shapes or changes a contract, especially session state, long-lived process configuration, restart or reuse behavior, fixes to prior review findings, and decisions to adopt, absorb, recreate, or substantially amend an existing PR or patch. In candidate-audit mode, reconstruct the contract and propose solutions without seeing the candidate, probe discriminating cases, then reveal and compare it. Skip mechanical changes."
---
# Solution gate
[Review Gate](../review-gate/SKILL.md) asks whether a diff is correct. Nothing asks whether it was the right thing to build. This gate sits on the arrow between a reproduced defect and the change that answers it, which the workflow leaves empty. Requires two reviewer runtimes on different model families, neither of them the implementer. Probes need the target repo buildable and runnable. Records go to the canonical Railly Skills checkout.
That arrow is where the evidence says defects concentrate: the portless gate-miss ledger records five rounds where the *fix* was the defective artifact, each recorded in [references/runs.md](references/runs.md). The fix commit is the least-reviewed commit on any branch, and reviewing its lines was never the missing part.

**The failure mode this gate must not become.** Two models arguing about a design, with no contact with the substrate, is imagination sampling with two samplers, the thing Review Gate opens by rejecting. In the round that motivated this skill every real finding came from driving the artifact and none from argument: the blind reviewer found the worst defect by building the *previous* release, starting that daemon, and measuring. Argument decides which proposal is better written; only a probe decides which is true. Every step below exists to keep the debate anchored.

## 0. Decide whether this fires

Run it when any of these hold:

- The defect admits more than one solution shape, and the shapes differ in where state lives, which component owns a decision, or what a contract promises.
- The change alters a contract between components: a new field two processes must agree on, a changed return, a new failure outcome, a new persistent artifact.
- It is the fix for a finding from a previous review round. This is the empirically highest-risk commit class and gets the gate regardless of how small it looks.
- A PR, patch, or contributor shape already exists and the decision is whether to adopt, absorb, recreate, amend, or reject it.

Skip it for mechanical work: a wording correction, a missing allowlist entry, a rename, a fix whose shape the defect fully determines. A gate that runs on everything becomes ceremony, and ceremony gets skipped exactly when it was needed. Record the skip and its reason, which is what makes the trigger tunable later.

Choose one mode. Use the workflow below for a greenfield fix. When a candidate already exists, read and follow [candidate-audit.md](references/candidate-audit.md); it replaces steps 1–2, delays candidate inspection until after step 5, then rejoins at synthesis.

**Complete when:** the trigger and mode are named, or the skip has a reason, in one line.

## 1. State the defect as a contract, not a symptom

Write, before any proposal exists:

- **The property that is violated**, in one sentence containing no symptom, no timing, and no reproduction steps. "A CLI waits 4.1 seconds" is a symptom. "A process decides another process's behavior from its own environment" is the property.
- **The observable that must change**, and how it will be measured. This becomes the shared success criterion, so proposals cannot each define their own win condition.
- **What must not change.** Enumerate the behaviors currently working that pass through the same code, including continuity across the ordinary multi-command workflow when a session or long-lived process exists. This is the S1 tripwire, written before anyone is invested in a design.

Hand this to both proposers as the entire brief. Do not include a proposed fix, a hint, or a preference: a brief that names a direction gets that direction back from both runtimes, and their agreement will read as convergence.

**Every factual claim in the brief carries a file:line, and the line is read before the brief is sent.** The brief is the one input to this method that nothing gates, and a wrong load-bearing fact in it propagates to both proposers at once, where their shared error will look like independent agreement. Cheap to prevent: if you cite a mechanism, open the line you are citing. (Origin: agent-browser #1670, 2026-08-08. The brief asserted a daemon spawned with `Stdio::null()` on stderr, citing a line that was the Windows `taskkill` path; the real spawn used `Stdio::piped()`, read only on early exit and then dropped. One proposer corrected it unprompted and neither was misled, so the conclusion survived by luck rather than by design.)

**Complete when:** the property, the observable, and the must-not-change list exist, contain no proposed solution, and every factual claim in them has been read at its cited line.

### 1A. Make state transitions explicit
If any input or configuration can survive one invocation, read and apply [references/temporal-contracts.md](references/temporal-contracts.md) before proposals exist. Parser shape and current unit tests do not define lifetime. Omission is not removal unless the contract proves equivalence, and every clear needs an explicit representation.
**Complete when:** every persistent input has the required transition table, restart and reuse both have observable predicates, and the must-not-change list includes workflow continuity.

## 2. Two independent proposals, blind to each other
Run two reviewer runtimes **on different model families**, neither of them the runtime that will implement. Same-family proposers share priors and blind spots, and their agreement carries no information. The implementer is excluded because it will be the one grafting and must not be defending.

Isolate structurally, not by instruction: when a candidate shape already exists, put the proposers in a checkout that does not contain it. Telling a proposer not to look leaves you trusting a report; removing the object leaves nothing to trust. Isolation mechanics and the two launch gotchas that cost a run each are in [references/runs.md](references/runs.md).

Each returns, in this structure and no other:

- **Shape**: where state lives, who owns each decision, what the contract becomes. Not code.
- **Predictions**: at least two statements that are observably true if the shape is right and observably false if it is wrong, each naming the command or measurement that would show it. A prediction that cannot fail is not a prediction.
- **Cost**: what it adds: files, fields, round trips, migration, a thing future changes must remember.
- **What it makes worse**: mandatory, never "nothing". Every real design trades something. A proposal claiming no downside has not found its own.
- **Rejected alternatives**: what else was considered and the fact that killed each.

Run them concurrently and do not let either see the other's output. Record both verbatim before any judgment.

**Complete when:** two structured proposals exist, produced independently, each with falsifiable predictions and a stated downside.

## 3. Trace each proposal forward, and mark every link

A proposal's stated downside is its first-order effect. The defects that cost the most are not there. They are two and three steps out, where the fix for one finding becomes the cause of the next, and each round's author could not see it because they were reasoning one step at a time.

For each proposal, build a chain forward from the change itself:

```
the change → first-order effect → second → third → fourth → fifth
```

Three rules make this a map instead of a story: every link names its **mechanism**, not just its effect; every link is marked **`observed`, `inferred`, or `guessed`**; and the pass **branches** wherever more than one effect is plausible. A chain of five plausible steps reads as rigor and is usually four guesses wearing one observation. No backward five-whys pass: the defect is already reproduced by the time a shape is being chosen.

Each rule with its failure mode in [references/runs.md](references/runs.md).

**The chain is not a forecast.** It is a list of claims cheap enough to check, ranked by how load-bearing they are. Its only product is the next step's target.

**Complete when:** each proposal has a forward chain of at least three orders, every link carries a mechanism and an evidence mark, and at least one harmful branch exists per proposal.

## 4. Run the cheapest probe that could refute

Collect every prediction from both proposals, and every link from step 3 marked `guessed` or `inferred`. Rank them by how much the proposal rests on them, then work down that list. **Probe the weakest load-bearing link before the endpoints:** an endpoint prediction is what a proposal claims about its result, and the link is where its reasoning is actually wrong. For each, ask what the *smallest* observation would refute it: not a spike, not an implementation. Usually one of: measure the current behavior, grep for a consumer nobody enumerated, build the previous release and run it, force the error path, read the installed tool's own option table.

Run those probes now, before scoring, and record the command and its output. A probe is not proof that a shape is correct; it is a cheap chance to kill a wrong one before it is argued for. Predictions that survive stay predictions, and any that cannot be probed with the environment available is recorded as an unverified assumption attached to its proposal, never quietly upgraded to a fact.

When step 1A applies, at least one probe must execute two or more commands or actions against the same live session. Record effective state and continuity observables before and after. Exit code alone is insufficient. Probe each restart rule in both directions: a real change causes replacement, while omission, repetition of the same value, or another semantic no-op preserves the session. A fingerprint or unit test may prove mechanics, but it cannot define the product contract by itself.

**Complete when:** every prediction is refuted, survived, or named unprobeable with the reason; each carries its command and observed output; and every temporal contract has a same-session sequence that distinguishes change, omission, and explicit clear.

## 5. Score against the recorded failure shapes
Read [references/failure-shapes.md](references/failure-shapes.md) and score each surviving proposal against every shape. This is the objective half: each shape is a recorded case, so "does this repeat S1" has a citable answer and two readers can disagree about a fact instead of a taste.

A hit is not a rejection. It is a cost that must be designed out or accepted out loud, with its reason, in the record; what is not allowed is a hit passing silently. Weight **S1 (over-reach)** and **S2 (under-reach)** highest when the change is itself a fix for a previous round.

**Complete when:** both proposals carry a per-shape verdict, each hit either designed out or accepted with a stated reason.

## 6. Synthesize, and say which kind of synthesis it was

The implementing runtime now decides, and states which of these happened:

- **One proposal whole**, because it dominates on the probes and the shapes. Say what the other one had that was genuinely better and why it was still not taken.
- **A graft**, because each proposal owns a different part of the answer. Name the seam and check it: two shapes composed can satisfy each proposer's predictions and violate a property neither was watching.
- **Neither**, because the probes refuted both. Say what the probes taught and return to step 1 with a sharper property. This outcome is a success of the gate, not a failure of it, and it is cheap here and expensive after implementation.

Take proposals with tongs: both proposers are confident by construction and neither ran the code. A prediction that survived a probe is evidence, a rationale that reads well is not, and anything load-bearing that no probe touched stays an assumption verified during implementation.

**Complete when:** the chosen shape is written down with its synthesis kind, the losing material is accounted for, and every carried assumption is listed.

## 7. Draw it, and keep evidence separate from proposal

Prose is the wrong medium for behavior that is temporal, cross-process, or ordered, which is most of what this gate looks at. Produce one self-contained HTML page per run (no build step, no network) holding two halves that are never merged: **observed behavior** before and after, where every element traces to something that was run, and **proposed shapes** side by side, labelled as argument and carrying the same `observed` / `inferred` / `guessed` marks from step 3. Merged into one diagram, a proposal inherits the credibility of the measurements next to it. Full guidance in [references/runs.md](references/runs.md).

**Complete when:** one HTML page opens with no build step, its observed half traces every element to a command that was run, and its proposal half is labelled as argument with evidence marks visible in the drawing.

## 8. Record and hand off
Write the decision to the canonical `Railly/skills` checkout, resolved through `RAILLY_SKILLS_REPO`, `~/Programming/railly/skills`, or `~/railly-skills` (`scripts/resolve-source-root.mjs`). Never into the target repo or an installed copy. The record holds both proposals verbatim, the forward chains, the probe log, the shape scoring, the synthesis, and the HTML page from step 7: a decision whose losing alternatives are not preserved cannot be re-examined when the fix turns out wrong.

Then hand off. The carried assumptions become verification targets for the implementation, and belong in [trail-decisions](../.experimental/trail-decisions/SKILL.md) as rows with their predicates. The must-not-change list from step 1 becomes a checklist for Review Gate step 5, where each entry is driven rather than reasoned about. A probe that refuted a proposal by exposing a defect outside the current scope is an issue candidate, not a footnote.
When a fix that passed this gate is later found defective, the failure is harvested back into [references/failure-shapes.md](references/failure-shapes.md) with its provenance, the same discipline Review Gate applies to its own catalog. A shape enters only from a recorded case. The run log and the pairing in use are in [references/runs.md](references/runs.md); the method depends on two proposers from different families and an implementer that proposed nothing, not on any particular runtime.
**Complete when:** the record exists at the canonical root, assumptions are handed to implementation, and the must-not-change list is handed to review.
