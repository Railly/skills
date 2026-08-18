# Run log and pairing

Provenance for the gate: which runs happened, and which runtimes produced them. The method depends on neither.

## Run log

- **2026-07-29, portless #367 round-6 defects** (`foundry/runs/solution-gate/2026-07-29-portless-367-c0862b9.md`). Holdout: the implementer had already shipped a shape, sealed it before reading either proposal, and both proposers worked in clones that did not contain it. Both independently treated two separately-numbered defects as one root cause, and both reached the implementer's conclusion on a third. Both then found the same gap the implementer had missed, and named the same unstated cost in the shipped fix. Three grafts taken. First use, so the method is dogfooded once and evaluated zero times.
- **2026-08-11, portless #366 and #374 follow-ups** (`foundry/runs/solution-gate/2026-08-11-portless-366-374-60394ae-10dc32d.md`). Seven defects were reproduced before implementation. For #366, the synthesized shape used a parsed framework-owned argv region instead of adding three independent scans. For #374, a process-boundary probe refuted shortening the production compatibility wait: the existing in-process mock could not answer while `spawnSync` blocked its event loop, while a separate-process producer answered in 58 ms. The synthesis preserved the old-daemon window and made producer states explicit. Both implementations later passed Review Gate with mechanism-specific mutations. Second recorded Portless use; first run to reject a production change by locating the failure in test orchestration.
- **2026-08-13, retrospective candidate audit of agent-browser #1669** (`cases/agent-browser/1669-spki-bypass-is-not-ca-trust.md`). The original run knew Chromium's SPKI flag was stronger than adding a root but optimized validation around the inherited primitive. A post-review discriminator matrix separated trust from bypass: wrong hostname, separately keyed leaf, and omitted CA. Chrome 151 reproduced both semantic deltas, while an isolated Linux NSS store accepted the CA-built chain and retained hostname rejection. This became the first candidate-audit regression case and S12.
- **2026-08-17, agent-browser #1669 temporal escape autopsy** (`foundry/runs/review-gate/2026-08-17-agent-browser-1669-daemon-ca-stickiness-0329596.md`). The gate explicitly chose restart on adding, changing, or removing `ca_cert`; the implementation fingerprinted `Option<ca_cert>`, and a unit test protected `Some → None` as a change. The matrix ran one command per session, so it never exercised `open --ca-cert → snapshot` without the flag. Linux reproduction showed the second command changed daemon PID, target, URL, fingerprint, and returned `about:blank`; repeating the flag preserved continuity. This added the mandatory temporal transition table, same-session probes, inverse restart checks, and S13.

## Dogfood pairing

The proposer and synthesizer runtimes are not fixed. The first Portless run used `fable-5` and `gpt-5.6-sol` as proposers with `claude-opus-5` synthesizing. The 2026-08-11 run used Fable 5 and OpenAI GPT-5.5 as proposers with the Codex root runtime synthesizing. What the method requires is two proposers from different model families and a synthesizer that proposed neither candidate. Record all three runtimes in each decision record so a later reader can separate a method result from a model result.

## Method evolution

On 2026-08-17, Solution Gate stopped owning a parallel proposal schema and became an orchestrator around Shaping. Earlier runs remain valid evidence for blind isolation, forward tracing, probes, failure scoring, and synthesis, but their proposal sections predate the native R, parts, flags, and fit-check artifacts now required. New runs feed probe evidence back through Shaping before the verdict and defer detailing, breadboarding, and slicing until the gate passes.

## Rendering the run (step 7 in full)

The visual is an audit surface, not evidence and not decoration. Pick the smallest representation that exposes the disputed ownership, order, state, or contract without making the reader decode a larger artifact.

| Question | Smallest useful view |
|---|---|
| Where does state or responsibility live? | Shallow file or component tree |
| Which calls and boundaries execute? | Call tree or compact pseudocode |
| What contract changes? | Types and signatures |
| What changes while most structure remains? | Diff-shaped tree, pseudocode, or signatures |
| Which process acts first, or which message crosses a boundary? | Mermaid sequence diagram |
| Which states and transitions matter? | Mermaid state diagram |
| Do several coordinated views or spatial UI need one surface? | Self-contained HTML, no build step or network |

Default to an inline Markdown visual in the decision record. Escalate to HTML only when a single text or Mermaid view would hide a material relationship. Record the format choice in one line so repeated HTML is visible as a method cost rather than accepted ceremony.

**Observed behavior, before and after.** This is evidence. Every node or transition cites a probe ID whose log contains the command and output. Nothing enters this visual unless it was observed. Undriven behavior appears as an explicit gap, never as a plausible arrow.

**Proposed shapes, side by side.** This is argument and is labelled that way. Mark every proposed node or link `observed`, `inferred`, or `guessed`. A clean picture of a wrong design carries no weight beyond the probes behind those marks.

Never merge evidence and proposal into one visual. They may share an artifact only as separately titled panels with no shared arrows or unlabeled transitions. Merged, a proposal inherits the credibility of the measurements next to it.

Keep only the calls, files, states, signatures, and boundaries needed to distinguish the surviving shapes. A visual that restates the whole run makes the decision harder to audit.

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
