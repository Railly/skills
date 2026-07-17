---
name: review-gate
description: "Candidate: Run a pre-review gate on a diff before pushing or requesting review: deterministic checks first, then focused lenses selected by what the diff changes. Use before opening or updating a PR, when asked to pre-review a change, or after an external review round to harvest each finding into a new gate. Experimental and awaiting baseline evaluation."
compatibility: Requires git and bash for the deterministic layer. Lens passes need a reviewer runtime; prefer a model different from the one that wrote the diff.
---

# Review gate

A **gate** is a check with a binary outcome and provenance from a recorded case. The gate exists to make external review rounds boring: every finding a reviewer would raise is caught before the push, and every finding they still raise becomes a new gate. The success metric is external findings per review round, trending to zero.

Generic review is imagination sampling: each pass surfaces a different subset of the defect space and converges slowly. Gates replace imagination with enumerable checks wherever a check exists, and spend model judgment only where judgment is required.

## 1. Load the conventions file

Find the project's conventions file: `cases/<repo>/conventions.md` in this repository, or a review-conventions document inside the target repo. It supplies the surface map, oracle pointers, and house norms. Without one, run only the universal gates and record its absence in the report.

**Complete when:** the conventions file is loaded, or the report records that none exists.

## 2. Run the deterministic layer

Run every applicable check in [scripts/gate.sh](scripts/gate.sh): `style`, `surfaces` (needs the conventions file), and `stale` for each contract value the diff renames or retires. These checks are cheap and have full recall on their class; a finding here is fixed or explicitly acknowledged, never skipped silently.

**Complete when:** every deterministic gate reports pass, or each finding is fixed or acknowledged with a reason.

## 3. Select and run lenses

Read [references/gates.md](references/gates.md). Each **lens** declares a trigger, a property of the diff. Run each triggered lens as its own focused pass over the full diff; a merged mega-pass dilutes every lens it carries. Prefer a reviewer model different from the one that wrote the diff: a same-model reviewer shares its priors and its blind spots.

**Complete when:** every lens in the catalog is classified as triggered-and-run or skipped-with-reason.

## 4. Verify findings before reporting

Adversarially verify each candidate finding: reproduce it, or force the state it claims is reachable. Error paths are validated by forcing them, not by reasoning that they are unlikely. A drift or regression test added by the diff counts as unwritten until it has gone red once against the drift it guards.

Two rules bound what counts as a refutation:

- **Refute at the layer of the claim.** A claim about caller ordering or an end-to-end path is not refuted by a unit test of the callee's seam; a claim about a narrowed contract is not refuted by enumerating the producers known today (that is closure by enumeration, the same fallacy the stale-value gate names).
- **A verification gap is not a refutation.** When the empirical layer is unavailable (a browser that cannot launch, a platform not present), report the candidate as unverified with its gap named. Dropping it silently converts an environment limitation into a false negative.

**Complete when:** every reported finding carries evidence and every dropped finding carries a refutation at the claim's own layer.

## 5. Harvest after external review

After any external review round on the same change, classify each external finding:

- Machine-checkable → new deterministic gate (extend `gate.sh` or the conventions surface map).
- Judgment-required → new lens in [references/gates.md](references/gates.md), with trigger and provenance.
- Project-specific norm → entry in the project's conventions file.

A finding an existing gate should have caught is a gate bug: record why it missed. Provenance is mandatory: a gate enters the catalog only from a recorded case or a confirmed external-review miss.

**Complete when:** every external finding is matched to an existing gate that missed (with the miss explained) or captured as a new gate with provenance.
