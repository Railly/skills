# Skill foundry shaping

## Source

> I love this actually, especially the promise, like it's evidence-driven methods for agentic engineering, dogfooded on real maintenance work.
>
> What are the real work in Vercel apps, because I've been doing these thingies, I was solving these issues actually, but I didn't, like, record all of the cases actually, the issues that I've been done, I've been doing.
>
> So probably we'll need to refactor a bit since right now nobody's using this. So probably we'll need to rethink about how we wanna move forward these Riley skills.
>
> Do you think it's a good idea to have separate repos, like a private one with Vercel-specific thingies and an agnostic one where we push or promote skills that we validate with evals actually?

## Frame

Railly Skills needs a repeatable way to turn real maintenance work into portable agent methods without leaking private context, overfitting to one organization, or publishing a new skill after every anecdote.

The product is not a catalog of prompts. It is a foundry that promotes observed methods only after evidence, transfer, and regression checks.

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| R0 | Preserve the promise: evidence-driven methods for agentic engineering, dogfooded on real maintenance work | Core |
| R1 | Capture an issue, the method used, the outcome, and the transferable lesson | Must |
| R2 | Never move confidential company evidence into a personal or public repository | Must |
| R3 | Keep published skills agnostic across repositories, stacks, editors, and agents | Must |
| R4 | Require behavior evals before promoting a candidate method | Must |
| R5 | Trace rules, exemplars, linters, and evals back to observed cases | Must |
| R6 | Keep a human decision at the promotion boundary | Must |
| R7 | Avoid an empty router; a router must own shared state, evidence, and artifacts across modes | Must |
| R8 | Produce a public, explainable governance model suitable for a blog post | Must |
| R9 | Distinguish public maintenance evidence from approved private evidence | Must |
| R10 | Support contributor and maintainer work without encoding one employer's process | Must |

## Shapes

### A. One public repository

All skills, cases, experiments, and evals live in `Railly/skills`.

Strength: simple and transparent.

Risk: cannot hold confidential evidence and encourages premature publication.

### B. Personal private incubator and public repository

All work begins in a personal private repository and graduates to `Railly/skills`.

Strength: clear staging boundary.

Risk: company-confidential evidence may not be permitted in a personal repository, even when private. Public cases are hidden unnecessarily.

### C. Evidence-tiered foundry

Public issues and pull requests can become public cases directly. Confidential work stays in an organization-approved private system. Only generalized, sanitized candidates cross into `Railly/skills`, where they must pass promotion evals.

Strength: respects evidence ownership while keeping public development open.

Risk: requires explicit provenance and sanitization checks.

## Fit check

| Requirement | A | B | C |
|---|:---:|:---:|:---:|
| R0 | Yes | Yes | Yes |
| R1 | Yes | Yes | Yes |
| R2 | No | No | Yes |
| R3 | Partial | Partial | Yes |
| R4 | Yes | Yes | Yes |
| R5 | Yes | Yes | Yes |
| R6 | Yes | Yes | Yes |
| R7 | Yes | Yes | Yes |
| R8 | Yes | Partial | Yes |
| R9 | No | Partial | Yes |
| R10 | Partial | Partial | Yes |

Selected shape: **C. Evidence-tiered foundry**.

## Selected shape

### C1. Public stable surface

`Railly/skills` contains agnostic methods, public or sanitized exemplars, behavior evals, governance, and releases.

### C2. Evidence ownership

- Public repository issue or PR: eligible for a public case.
- Internal repository, Slack, incident, customer data, or private review: remains in an approved company system.
- Ambiguous provenance: do not copy it. Record only that a coverage gap exists.

### C3. Case extraction

Every candidate starts as a case, not a rule. A case records the failure, deterministic signal, method, outcome, evidence, and candidate lesson.

### C4. Human classification

A reviewer classifies the lesson as a skill method, reference rule, exemplar, deterministic check, behavior eval, coverage gap, or no change.

### C5. Promotion gate

A candidate must pass trigger, method, outcome, transfer, and negative evals against both a no-skill baseline and the current released skill.

### C6. Protocol decision

Do not create a repository-wide `railly` router. Consolidate the maintenance loop into `unfold` because Learn, Triage, Change, and Review share one mission, evidence chain, and artifact contract. Keep mode instructions behind progressive-disclosure references. Keep backlog selection separate because it occurs before a maintenance mission exists.

### C7. Governance artifacts

- [Foundry overview](README.md)
- [Governance and promotion](governance.md)
- [Case template](case-template.md)
- [Behavior eval protocol](eval-protocol.md)
- [First promotion round](rounds/001-prove-the-test/decision.md)
