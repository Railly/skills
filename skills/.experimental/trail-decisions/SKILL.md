---
name: trail-decisions
description: "Candidate: Keep a decision trail (a.k.a. show-your-work) while implementing, so a later reviewer can audit the choices and not just the diff. A TSV appended one row per real decision (what, why, evidence), written in the moment, never reconstructed. Use at the start of any implementation task an agent runs unattended or that a human reviews after stepping away. Consumed by review-gate's choice-audit lens. Experimental and awaiting baseline evaluation."
compatibility: Requires a writable working directory. The self-audit step wants a reviewer runtime on a different model family than the writer.
---

# Trail decisions

A diff shows *what* changed. It never shows the choices behind it: the buffer that got doubled, the port derived from a hash, the daemon assumed not to restart. Those choices compile and pass tests and still ship the wrong behavior — the fix looks fine, the decision was bad. The only way to review a choice is to see it stated. This skill makes the writing agent state its choices as it makes them, so the reviewer audits reasoning instead of re-deriving it from code.

It is PAPERCUTS.md for the act of building: a line captured in the moment, append-only, worthless until something else sweeps it. PAPERCUTS is swept by `/pulse`; this trail is swept by [review-gate](../review-gate/SKILL.md)'s choice-audit lens. One difference decides whether it earns its place: a papercut records friction you already felt, so it is self-justifying; a decision row records a choice that did not feel wrong when you made it, so its value is realized only when a second actor questions the consequence. Write the trail anyway — an honest record of what you chose is useful to the next reader even if no lens ever audits it.

## 1. Open the trail

Start `.decisions.tsv` in the working directory at the start of the task (not the end — a trail reconstructed from the finished diff is fiction, it records the choices you can now see were made, not the ones you actually weighed). One header row, then one row per decision:

```
ts	phase	decision	why	evidence	result
```

- **ts** — ISO8601, when the decision was made.
- **phase** — the workstream or slice it belongs to.
- **decision** — what you chose, one line. If it does not fit on one line the decision is not crisp yet; sharpen it, do not wrap it.
- **why** — the reason in plain words. The reason is the auditable part; a decision with no stated why is an undeclared choice wearing a row.
- **evidence** — a pointer that proves it happened: commit SHA, `file:line`, PR number, an artifact or trace path. Never a paragraph, never a retelling.
- **result** — the outcome or the predicate you are now betting on ("assumes the daemon does not restart mid-session").

**Complete when:** the file exists with its header before the first edit lands.

## 2. Append as you decide

Append a row the moment a choice is made, not in a batch at the end. Log a decision when you: pick one approach over an alternative you considered; make an assumption about runtime, environment, or an external contract; take a symptom fix knowing the root cause is elsewhere; hardcode, cap, or derive a value; or work around something. Skip the mechanical (renames, formatting, obvious plumbing) — a trail that logs everything logs nothing, the signal is the choices a reviewer would want to question.

The bar for a row: *would a reviewer who trusted the diff still want to ask "why this and not that?"* If yes, it is a row. The buffer-doubling fix that happens to pass is exactly this: it earns a row that says "doubled the buffer to clear the failing case" with the honest `why`, and that row is what lets the reviewer ask the question the green tests never would.

**Complete when:** every choice meeting the bar has a row, appended when it happened.

## 3. Append-only, fix the log not the story

A wrong call gets a **new row that supersedes it**, never an edit or a delete. The trail is a history, not a final state; the superseding row (with its own why) is itself evidence of how the work moved. If the finished work diverged from what a row claims, the row is wrong and gets superseded — fix the log to match reality, never reword reality to match the log. The one dishonesty this skill cannot survive is a trail groomed to look clean.

**Complete when:** no row was edited or deleted; every reversal is a superseding row.

## 4. Self-audit before handing back

Before returning the work, spawn a reviewer on a **different model family** than the writer to read `.decisions.tsv` against the transcript and the diff, and flag decisions that look risky, suboptimal, or unsupported by their stated evidence — flag, do not redo. A same-family auditor shares the writer's blind spots and will wave through the same bad call (the review-gate lesson: the reviewer model must differ from the author). Its output is a short list of rows worth a second look, handed to whoever reviews next; it does not gate the work.

**Complete when:** the trail has been read by a different-family auditor and its flagged rows are attached to the handoff, or the absence of an auditor runtime is stated.

## Where this connects

- **[review-gate](../review-gate/SKILL.md)** consumes `.decisions.tsv`: when the file exists, the choice-audit lens loads it as a first-class review surface and questions each declared decision by its consequence, not by whether the diff looks right. Without a trail that lens has nothing to fire on — this skill is the input that makes it exist.
- Provenance the choice-audit lens will carry: Taelin's MatMul buffer-doubling (a symptom fix that passed and shipped the wrong behavior; only caught by asking what the agent decided) plus four agent-browser misses where a declared-looking decision was the bug — most cleanly #1041, a daemon port derived from a djb2 hash of the session name, fine in the diff, blocked by Hyper-V at runtime (maintainer-confirmed).

## Status

Experimental. The honest gap: the trail's value depends on the reviewer questioning it, and that half is measured by review-gate's choice-audit lens, which is itself a candidate awaiting a recorded miss it caught that a mapless review did not. Adopt this skill in a real implementation pipeline, collect two or three genuine trails, then promote the lens on that evidence — not before. Emitting the trail must be triggered by the writing workflow (a goal template line, or a hook), not left to be invoked by memory; a decision log nobody remembers to start is the empty file that proves nothing.
