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

When the diff is in a TS/JS or Rust repo and the `radius` CLI is on PATH, also run `radius impact --base <merge-base>` here and save the JSON to `evals/radius-dogfood/<date>-<repo>.json` in this skill's directory. The Impact Map is a deterministic input, not a gate: it ranks where the diff propagates so the lens passes in step 4 spend budget on the right symbols. Two reading rules carry over from the radius skill: convergence items (2+ changed symbols reaching the same impacted item) outrank raw confidence, and when `visibilityBoundary.unresolvedCalls` dwarfs `edges` the map under-covers — say so in the report; absence of impact is not safety. CLI absent or repo in a language radius does not cover (anything outside TS/JS/Rust) → skip silently, the gate does not depend on it. Rust maps want `rust-analyzer` on PATH for semantic resolution; without it radius degrades to syntactic edges and says so on stderr — treat such a map as under-covering. A `visibilityBoundary.scipStale: true` map was built from a stale semantic index; fine for orientation, not for a shipping review. Cross-language edges (TS↔Rust FFI/NAPI/IPC) do not exist yet: for a diff crossing that border, the map covers each side separately and `gate.sh callers` walks the boundary.

**Complete when:** every deterministic gate reports pass, or each finding is fixed or acknowledged with a reason.

## 3. Reconstruct the subsystem model, then frame the fix as an assumption

Do this **before** reading the delta as changed lines. The recurring miss on portless (#365, #366, #367 round 3, all caught by the maintainer) has one shape: the gate reasoned from the diff and matched it against past findings, while the maintainer reasoned from the whole system and probed the seam the fix assumed correct. A catalog derived from a reviewer's past outputs always runs one round behind the model that generates them. This step buys back the gap by starting where the maintainer starts.

Two moves, in order:

1. **Build the model of the subsystem the diff touches, sourced from the repo and the conventions file's subsystem invariants, not from the diff.** Three axes recur and each has burned a portless round:
   - **Process and channel topology.** Which processes exist (CLI vs detached daemon), which stdio each is attached to, where each one's output actually lands. A diagnostic emitted on the wrong process reaches a log the user never opens (#367: warning in the daemon → `proxy.log`, user attached to the CLI saw nothing).
   - **Consumers of every rule the fix touches.** A resolution/precedence/injection rule is applied by *every* path that reconstructs the value from user input, not only the primary resolver — error builders, 404/suggestion text, secondary matchers. Enumerate them all (#365: resolver applied longest-match, the 404 suggestion re-split the host naively).
   - **The fix's own new guard as an artifact under test.** When the diff adds a detector/guard, its input domain is the domain the *composed helpers* accept (runner wrappers, quoted metacharacters, redirections, partial-flag cells), never the argument positions the guard inspects — cells derived from the guard inherit its blind spot (#366).
2. **Then frame the fix as an assumption and name the adjacent layer.** For each change ask: *what layer does this fix assume correct but never touch?* Emission vs detection, one consumer vs all, the guard vs its full input domain, the happy path vs the warm-up call that pre-consumes a one-shot latch. That named adjacent layer is a candidate finding before any lens runs; the lenses in step 4 then verify or clear it.

Source the model from `conventions.md` **subsystem invariants** and the repo's own code, and grow it: an adjacent layer that turns out to hold a real seam becomes a new subsystem invariant in the harvest (step 6), so the model — not just the lens list — is what compounds.

**Complete when:** the affected subsystem's process/channel topology and the consumer set of every rule the diff touches are written down, and each change in the diff has its assumed-correct adjacent layer named as a candidate to carry into the lens passes.

## 4. Select and run lenses

Read [references/gates.md](references/gates.md). Each **lens** declares a trigger, a property of the diff. Run each triggered lens as its own focused pass over the full diff, against the subsystem model from step 3 (each lens must clear or confirm the adjacent layers named there); a merged mega-pass dilutes every lens it carries. When an Impact Map exists from step 2, each lens inspects the convergence items first, then top-confidence items, and findings cite the propagation path (`X → Y via call`) — but always spend passes beyond the map too: in the radius A/B, reviewers who only followed the map missed bugs free exploration caught. The map directs attention; directed attention is also narrowed attention. Prefer a reviewer model different from the one that wrote the diff: a same-model reviewer shares its priors and its blind spots. Whichever way it lands, record `author_model` and `reviewer_model` in the run report; when they share a family, set `same_family: true` and carry a visible warning in the prose report — recorded, not blocking.

**Complete when:** every lens in the catalog is classified as triggered-and-run or skipped-with-reason.

## 5. Verify findings before reporting

**When the change is not the reviewer's own, drive the feature as a user first — before trusting any test or static reasoning.** Build the actual artifact from the PR branch and exercise the shipped surface the way a user would: run the new command with its real flags, real inputs, real error cases, and the real substrate (browser, filesystem, server) — not the author's test suite, which only asserts what the author already thought to check. A review that stands on passing tests plus reasoning surfaces nothing useful, because the real defects live exactly where the author's tests did not look. This is the empirical layer of "a verification gap is not a refutation," promoted to a mandatory step for external PRs: the dogfood pass is where candidate findings are born and where the confident-but-wrong ones die. Record what was driven (commands, inputs, observed output) in the run report; a surface that could not be driven (platform absent, credential missing) is named as an unverified gap, never silently assumed to work. Skip only for the reviewer's own diff, where authorship already carries the dogfooding — and even then, prefer to drive it. (Origin: 2026-07-22, Hunter on PR #1596 — a clean test-and-reason review was correct but hollow until the `a11y` command was actually run against a live page with real violations and a cross-frame iframe.)

Adversarially verify each candidate finding: reproduce it, or force the state it claims is reachable. Error paths are validated by forcing them, not by reasoning that they are unlikely. A drift or regression test added by the diff counts as unwritten until it has gone red once against the drift it guards.

Two rules bound what counts as a refutation:

- **Refute at the layer of the claim.** A claim about caller ordering or an end-to-end path is not refuted by a unit test of the callee's seam; a claim about a narrowed contract is not refuted by enumerating the producers known today (that is closure by enumeration, the same fallacy the stale-value gate names).
- **A verification gap is not a refutation.** When the empirical layer is unavailable (a browser that cannot launch, a platform not present), report the candidate as unverified with its gap named. Dropping it silently converts an environment limitation into a false negative.
- **An exemption is a claim.** Every absence or silence exonerated along the way (a required surface left untouched, a deterministic finding acknowledged away) is itself a finding-level claim and gets verified at its own layer before it exempts anything. A "this surface doesn't carry semantics" exemption is checked by reading the surface, not by assuming its genre (portless #363: a CLI help section with behavior prose was waved through as a terse listing).

The report is written twice from the same content: the prose report for the human, and a run report JSON at `evals/runs/<date>-<repo>-<shortsha>.json` in this skill's directory, per the schema in [references/run-report.md](references/run-report.md). The JSON is the ledger's view — findings with their states (`confirmed | unverified | refuted | exempted | issue_candidate`), lens dispositions, deterministic outcomes, and provenance. A run whose lens runtime dies or whose steps are left incomplete reports `run.status: incomplete` with each gap named; an incomplete run is never presented as a pass — this is the run-level twin of "a verification gap is not a refutation".

The prose report ends with two mandatory sections beyond the findings themselves:

- **Exemptions claimed** — every exemption, with its evidence, not just its conclusion, so a human can veto any of them cheaply. An exemption whose evidence cannot be stated in one sentence is a finding.
- **Issue candidates** — real defects and gaps that fall outside the diff's scope: pre-existing bugs surfaced while verifying, residuals deliberately descoped, coverage gaps beyond the change, upstream quirks worked around. Each carries a one-line title, the evidence already gathered, and why it is out of scope — enough to open an issue without re-deriving the work. Out-of-scope findings that stay buried in a "known/deferred" paragraph die there.

**Complete when:** for a non-authored change, the feature was driven as a user against its real substrate (or each undrivable surface named as a gap); every reported finding carries evidence, every dropped finding carries a refutation at the claim's own layer, the report carries both mandatory sections (empty is a valid state, silence is not), and the run report JSON is written with an honest `run.status`.

## 6. Harvest after external review

After any external review round on the same change, classify each external finding:

- Machine-checkable → new deterministic gate (extend `gate.sh` or the conventions surface map).
- Judgment-required → new lens in [references/gates.md](references/gates.md), with trigger and provenance.
- Project-specific norm → entry in the project's conventions file.
- **Reasoned from the system, not enumerable as a variant** → new or sharpened **subsystem invariant** in the conventions file, so step 3 reconstructs that seam next time. When a finding lives in an adjacent layer the fix assumed correct (wrong emission channel, an unenumerated consumer of a rule, a latch consumed by warm-up), a lens variant alone re-runs one round behind; the durable fix is that the model now includes the layer.

A finding an existing gate should have caught is a gate bug: record why it missed, both in the catalog entry's provenance and in the project conventions file's **gate-miss ledger** (date, finding, which gate missed, why, what closed it). The ledger keeps repo-local recurrence visible where the next review of that repo will actually look. Provenance is mandatory: a gate enters the catalog only from a recorded case or a confirmed external-review miss.

**Complete when:** every external finding is matched to an existing gate that missed (with the miss explained) or captured as a new gate with provenance.

## 7. Radius dogfood ledger

When a review used an Impact Map, append one line to `evals/radius-dogfood/ledger.jsonl` in this skill's directory:

```json
{"date":"YYYY-MM-DD","repo":"...","base":"...","changed":N,"impacted":N,"edges":N,"unresolvedCalls":N,"findings":N,"map_attributed":N,"convergence_inspected":N,"convergence_with_finding":N,"outside_map":N,"map_json":"<date>-<repo>.json"}
```

`map_attributed` = findings whose evidence cites a propagation path from the map. `outside_map` = findings from free exploration the map did not rank. When an external review round or a shipped regression later surfaces a bug in a change that had a map, run the **escape autopsy**: open the saved `map_json` and record in the gate-miss ledger whether the buggy symbol was in the map (in-map-but-missed = reading/anchoring failure; not-in-map = coverage gap → feeds radius `references/tuning.md`, never hand-tuned). The ledger and `evals/runs/` are swept by `/pulse`; decision review at n≈20 entries.
