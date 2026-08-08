# Run log and pairing

Provenance for the gate: which runs happened, and which runtimes produced them. The method depends on neither.

## Run log

- **2026-07-29, portless #367 round-6 defects** (`foundry/runs/solution-gate/2026-07-29-portless-367-c0862b9.md`). Holdout: the implementer had already shipped a shape, sealed it before reading either proposal, and both proposers worked in clones that did not contain it. Both independently treated two separately-numbered defects as one root cause, and both reached the implementer's conclusion on a third. Both then found the same gap the implementer had missed, and named the same unstated cost in the shipped fix. Three grafts taken. First use, so the method is dogfooded once and evaluated zero times.

## Dogfood pairing

The pairing in use is `fable-5` and `gpt-5.6-sol` at high reasoning effort as proposers, with `claude-opus-5` synthesizing and implementing. Nothing in the method depends on those three; what it depends on is two proposers from different families and an implementer that proposed nothing. Record the three runtimes in the decision record so a later reader can tell a method result from a model result.

## Drawing the run (step 7 in full)

Prose is the wrong medium for behavior that is temporal, cross-process, or ordered, which is most of what this gate looks at. A sequence you can see is a sequence you can argue with. Produce one self-contained HTML page per run (no build step, no network, Mermaid inline or hand-drawn SVG) holding two clearly separated halves.

**Observed behavior, before and after.** This half is evidence. Every element traces to something that was run: a real terminal transcript, a measured duration, the actual contents of a file at a moment in time. Timelines and sequence diagrams beat paragraphs here because the defects are ordering defects. Nothing enters this half that was not observed, and anything that could not be driven is drawn as an explicit gap rather than a guess.

**Proposed shapes, side by side.** This half is argument, and it is labelled that way on the page. A clean diagram of a wrong design is more persuasive than a muddled diagram of a right one, so the visual carries no weight the probes did not give it: mark each proposed link with the same `observed` / `inferred` / `guessed` marks from step 3, in the drawing, where a reader cannot skip them.

Never merge the halves into one diagram. Merged, a proposal inherits the credibility of the measurements next to it, which is exactly the mistake a picture makes easy.

## The three rules of the forward chain (step 3 in full)

- **Every link names its mechanism, not just its effect.** "This adds a file" is an effect. "This adds a file, and the component that removes state has a hardcoded list with no coupling to writers" is a mechanism, and a mechanism can be checked.
- **Every link is marked `observed`, `inferred`, or `guessed`.** Observed means someone ran something and watched it. Inferred means it follows from code that was read. Guessed means it sounds right. A chain of five plausible steps reads as rigor and is usually four guesses wearing one observation, which is the specific way this step fails.
- **Branch where more than one effect is plausible, and include the branches that help.** One chain per proposal favors a neat story. A proposal whose forward pass has no harmful branch has not been traced, it has been advertised.

Do not add a backward five-whys pass. Diagnosis is not where this pipeline loses; the defect is usually already reproduced and understood by the time a shape is being chosen. Spending the budget on causes you already know buys nothing and pads the map.

## Operational notes for running proposers (step 2)

Two notes that cost a run each. `codex exec` reads stdin in addition to its prompt argument and blocks forever when nothing closes it: redirect from `/dev/null` for any non-interactive launch. And give each proposer its own working directory, or their builds and test ports collide.

Isolate structurally, not by instruction. When a candidate shape already exists (a shipped fix being re-examined, a branch under review), put the proposers in a checkout that does not contain it. A clone from the remote is enough when the work is unpushed. Telling a proposer not to look leaves you trusting a report; removing the object leaves nothing to trust.

## Why the arrow needs a gate

That arrow is where the evidence says defects concentrate. The portless gate-miss ledger records five separate rounds where the *fix* was the defective artifact: a fix that generalized past its finding, a fix that made the path it touched worse than before, a fix that reintroduced its own defect one variant deeper, a fix that left the reported bug open one flag deeper, and a guard that satisfied the invariant written for it and still missed. Review Gate's `covered` check exists because the fix commit is the least-reviewed commit on any branch. This gate exists because reviewing its lines was never the missing part.
