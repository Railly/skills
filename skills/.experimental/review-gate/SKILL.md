---
name: review-gate
description: "Candidate: Run a pre-review gate on a diff before pushing or requesting review: deterministic checks first, then focused lenses selected by what the diff changes. Use before opening or updating a PR, when asked to pre-review a change, or after an external review round to harvest each finding into a new gate. Experimental and awaiting baseline evaluation."
compatibility: Requires git and bash for the deterministic layer. Lens passes need a reviewer runtime; prefer a model different from the one that wrote the diff.
---

# Review gate

A **gate** is a check with a binary outcome and provenance from a recorded case. The gate exists to make external review rounds boring: every finding a reviewer would raise is caught before the push, and every finding they still raise becomes a new gate. The success metric is external findings per review round, trending to zero.

Generic review is imagination sampling: each pass surfaces a different subset of the defect space and converges slowly. Gates replace imagination with enumerable checks wherever a check exists, and spend model judgment only where judgment is required.

## 1. Load or bootstrap the conventions file

Find the project's conventions file: `cases/<repo>/conventions.md` in this repository, or a review-conventions document inside the target repo. It supplies the surface map, oracle pointers, house norms, and the gate-miss ledger.

When none exists, build one now from the target repo's own instruction files (AGENTS.md, CLAUDE.md, CONTRIBUTING.md, docs README) before running the deterministic layer. Compile, don't just read: every prose rule of the form "when you change X, update Y and Z" becomes a line in the ```surfaces block, and every house rule that inverts or extends a universal gate becomes a norms entry. Recording the file's absence is not a substitute for building it — a norm left as prose runs as judgment, and judgment can exonerate what a check would flag (portless #363: the AGENTS.md docs rule was read, applied by hand, and still missed, because it never became a surfaces line).

**Complete when:** a conventions file is loaded, or one has been bootstrapped from the repo's instruction files and its surface map runs under `gate.sh surfaces`.

## 2. Run the deterministic layer

Run every applicable check in [scripts/gate.sh](scripts/gate.sh): `style`, `surfaces` (needs the conventions file), `stale` for each contract value the diff renames or retires, `siblings` for each behavior delta the diff documents — pick the keyword that names the feature (the noun a section heading would use, not the bug), and every file that mentions it yet is absent from the diff must be updated or exempted — and `callers` for each function whose contract the diff changes (a new failure outcome, a new return field, changed semantics): every call site outside the diff is read for state mutated before the call, or acknowledged. Callers are enumerated by the check, never from memory: attention follows the diff, and the callers a contract change breaks are precisely the code the diff never shows (1532 round 2). These checks are cheap and have full recall on their class; a finding here is fixed or explicitly acknowledged, never skipped silently.

When the diff is in a TS/JS or Rust repo and the `radius` CLI is on PATH, also run `radius impact --base <merge-base>` here and save the JSON to `evals/radius-dogfood/<date>-<repo>.json` in this skill's directory. The Impact Map is a deterministic input, not a gate: it ranks where the diff propagates so the lens passes in step 3 spend budget on the right symbols. Two reading rules carry over from the radius skill: convergence items (2+ changed symbols reaching the same impacted item) outrank raw confidence, and when `visibilityBoundary.unresolvedCalls` dwarfs `edges` the map under-covers — say so in the report; absence of impact is not safety. CLI absent or repo in a language radius does not cover (anything outside TS/JS/Rust) → skip silently, the gate does not depend on it. Rust maps want `rust-analyzer` on PATH for semantic resolution; without it radius degrades to syntactic edges and says so on stderr — treat such a map as under-covering. A `visibilityBoundary.scipStale: true` map was built from a stale semantic index; fine for orientation, not for a shipping review. Cross-language edges (TS↔Rust FFI/NAPI/IPC) do not exist yet: for a diff crossing that border, the map covers each side separately and `gate.sh callers` walks the boundary.

**Complete when:** every deterministic gate reports pass, or each finding is fixed or acknowledged with a reason.

## 3. Select and run lenses

Read [references/gates.md](references/gates.md). Each **lens** declares a trigger, a property of the diff. Run each triggered lens as its own focused pass over the full diff; a merged mega-pass dilutes every lens it carries. When an Impact Map exists from step 2, each lens inspects the convergence items first, then top-confidence items, and findings cite the propagation path (`X → Y via call`) — but always spend passes beyond the map too: in the radius A/B, reviewers who only followed the map missed bugs free exploration caught. The map directs attention; directed attention is also narrowed attention. Prefer a reviewer model different from the one that wrote the diff: a same-model reviewer shares its priors and its blind spots. Whichever way it lands, record `author_model` and `reviewer_model` in the run report; when they share a family, set `same_family: true` and carry a visible warning in the prose report — recorded, not blocking.

**Complete when:** every lens in the catalog is classified as triggered-and-run or skipped-with-reason.

## 4. Verify findings before reporting

Adversarially verify each candidate finding: reproduce it, or force the state it claims is reachable. Error paths are validated by forcing them, not by reasoning that they are unlikely. A drift or regression test added by the diff counts as unwritten until it has gone red once against the drift it guards.

Two rules bound what counts as a refutation:

- **Refute at the layer of the claim.** A claim about caller ordering or an end-to-end path is not refuted by a unit test of the callee's seam; a claim about a narrowed contract is not refuted by enumerating the producers known today (that is closure by enumeration, the same fallacy the stale-value gate names).
- **A verification gap is not a refutation.** When the empirical layer is unavailable (a browser that cannot launch, a platform not present), report the candidate as unverified with its gap named. Dropping it silently converts an environment limitation into a false negative.
- **An exemption is a claim.** Every absence or silence exonerated along the way (a required surface left untouched, a deterministic finding acknowledged away) is itself a finding-level claim and gets verified at its own layer before it exempts anything. A "this surface doesn't carry semantics" exemption is checked by reading the surface, not by assuming its genre (portless #363: a CLI help section with behavior prose was waved through as a terse listing).

The report is written twice from the same content: the prose report for the human, and a run report JSON at `evals/runs/<date>-<repo>-<shortsha>.json` in this skill's directory, per the schema in [references/run-report.md](references/run-report.md). The JSON is the ledger's view — findings with their states (`confirmed | unverified | refuted | exempted | issue_candidate`), lens dispositions, deterministic outcomes, and provenance. A run whose lens runtime dies or whose steps are left incomplete reports `run.status: incomplete` with each gap named; an incomplete run is never presented as a pass — this is the run-level twin of "a verification gap is not a refutation".

The prose report ends with two mandatory sections beyond the findings themselves:

- **Exemptions claimed** — every exemption, with its evidence, not just its conclusion, so a human can veto any of them cheaply. An exemption whose evidence cannot be stated in one sentence is a finding.
- **Issue candidates** — real defects and gaps that fall outside the diff's scope: pre-existing bugs surfaced while verifying, residuals deliberately descoped, coverage gaps beyond the change, upstream quirks worked around. Each carries a one-line title, the evidence already gathered, and why it is out of scope — enough to open an issue without re-deriving the work. Out-of-scope findings that stay buried in a "known/deferred" paragraph die there.

**Complete when:** every reported finding carries evidence, every dropped finding carries a refutation at the claim's own layer, the report carries both mandatory sections (empty is a valid state, silence is not), and the run report JSON is written with an honest `run.status`.

## 5. Harvest after external review

After any external review round on the same change, classify each external finding:

- Machine-checkable → new deterministic gate (extend `gate.sh` or the conventions surface map).
- Judgment-required → new lens in [references/gates.md](references/gates.md), with trigger and provenance.
- Project-specific norm → entry in the project's conventions file.

A finding an existing gate should have caught is a gate bug: record why it missed, both in the catalog entry's provenance and in the project conventions file's **gate-miss ledger** (date, finding, which gate missed, why, what closed it). The ledger keeps repo-local recurrence visible where the next review of that repo will actually look. Provenance is mandatory: a gate enters the catalog only from a recorded case or a confirmed external-review miss.

**Complete when:** every external finding is matched to an existing gate that missed (with the miss explained) or captured as a new gate with provenance.

## 6. Radius dogfood ledger

When a review used an Impact Map, append one line to `evals/radius-dogfood/ledger.jsonl` in this skill's directory:

```json
{"date":"YYYY-MM-DD","repo":"...","base":"...","changed":N,"impacted":N,"edges":N,"unresolvedCalls":N,"findings":N,"map_attributed":N,"convergence_inspected":N,"convergence_with_finding":N,"outside_map":N,"map_json":"<date>-<repo>.json"}
```

`map_attributed` = findings whose evidence cites a propagation path from the map. `outside_map` = findings from free exploration the map did not rank. When an external review round or a shipped regression later surfaces a bug in a change that had a map, run the **escape autopsy**: open the saved `map_json` and record in the gate-miss ledger whether the buggy symbol was in the map (in-map-but-missed = reading/anchoring failure; not-in-map = coverage gap → feeds radius `references/tuning.md`, never hand-tuned). The ledger and `evals/runs/` are swept by `/pulse`; decision review at n≈20 entries.
