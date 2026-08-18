# Candidate audit

Use this mode when a PR, patch, branch, proposed fix, or contributor implementation already exists. The candidate is evidence only after the blind result exists. Before reveal, it is a contamination source.

## A0. Snapshot and seal the candidate

Capture retrieval handles, current head, status, author, linked issues, review state, and related PRs. Do not summarize its mechanism. Save the candidate diff, body, commits, reviews, and implementation notes outside both reviewers' working directories.

Create clean checkouts from the candidate's base commit or current base branch. Verify that neither checkout contains the candidate commits or locally generated audit artifacts.

**Complete when:** the candidate can be recovered later and neither reviewer can inspect it.

## A1. Build an evidence-only problem packet

Allowed inputs:

- reporter-observed behavior and reproducible symptoms;
- public command, API, security, compatibility, or product contracts;
- behavior and source from the base branch;
- external primary specifications required to understand the contract;
- constraints stated independently of any proposed mechanism.

Excluded inputs:

- candidate diff, body, commit messages, tests, reviews, branch name, or implementation notes;
- solution hints copied from an issue or discussion;
- names of primitives, libraries, flags, files, or components introduced by the candidate;
- claims whose only source is the candidate author.

When the issue itself proposes a fix, rewrite it into reporter evidence and product constraints, preserving the original separately for reveal. Mark every packet claim `observed`, `specified`, `reported`, or `unknown`, with its source.

**Complete when:** a reader can reconstruct the problem but cannot infer the candidate's chosen mechanism from the packet.

## A2. Reconstruct the contract blindly

Send the same packet to two reviewers on different model families, blind to each other and to the candidate. Ask each for:

- the property the product must provide;
- the observable success condition;
- the must-not-change set;
- trust, authority, ownership, lifecycle, and compatibility boundaries involved;
- a discriminator matrix containing cases where superficially similar mechanisms diverge;
- the step 1A transition table for every input that can outlive one command or process;
- unknowns that block a sound shape.

Do not request a solution yet. Agreement on a solution is meaningless when the reviewers silently solved different contracts.

Reconcile the two contract drafts. Preserve disagreements, probe load-bearing ones, and obtain one shared contract before proposals begin. Human product judgment decides irreducible product ambiguity. A candidate test or fingerprint may reveal its mechanism, but it cannot decide whether later omission means reuse or removal.

**Complete when:** one shared contract and discriminator matrix exist without reference to a candidate mechanism, and every persistent input distinguishes omission from explicit clear.

## A3. Generate blind solution shapes

Give the reconciled contract to both reviewers. Each returns the normal Solution Gate proposal structure: shape, falsifiable predictions, cost, what it worsens, and rejected alternatives. Keep them blind to each other and to the candidate.

Record both verbatim. Continue through the main skill's forward-chain, refuting-probe, and failure-shape steps for these blind proposals.

The discriminator matrix is mandatory probe input. A happy path shared by several mechanisms proves none of them. Prefer cells where one plausible mechanism must accept and another must reject.

**Complete when:** the blind shapes have been traced, probed, and scored before any candidate artifact is opened.

## A4. Reveal and trace the candidate

Only now open the candidate. State its mechanism from code, not its description. Treat it as a third proposal and run the same forward-chain, probe, and failure-shape passes. Do not grandfather candidate tests as evidence; determine which shared-contract cells they actually discriminate.

Compare the selected blind shape and candidate:

| Dimension | Blind result | Candidate | Delta |
|---|---|---|---|
| Contract observable | | | |
| Primitive semantics | | | |
| Authority and trust boundary | | | |
| Negative discriminator cells | | | |
| Ownership and lifecycle | | | |
| Temporal transitions and continuity | | | |
| Compatibility and portability | | | |
| Reusable implementation | | | |
| New accepted costs | | | |

For every claimed equivalence between the candidate and blind result, name a probe that would fail if they differed. Prose similarity is not equivalence.

**Complete when:** every material delta is observed, inferred, guessed, or unknown, and the candidate has faced the same bar as the blind proposals.

## A5. Decide with credit preserved

Choose one:

- **Adopt:** candidate implements the selected contract and survives the discriminator matrix.
- **Amend:** candidate's shape is sound and bounded changes close every material delta.
- **Absorb and recreate:** useful implementation exists inside a wrong or unsafe shape; rebuild from base and retain author credit.
- **Reject:** candidate violates the contract or depends on a refuted assumption.
- **Return to contract:** reveal exposes unresolved product ambiguity or refutes all shapes.

The synthesis record names reusable work, rejected mechanism, credit plan, carried assumptions, and the exact probes handed to implementation and Review Gate.

**Complete when:** the candidate verdict is explicit, credit is accounted for, and no difference is dismissed only because work already exists.
