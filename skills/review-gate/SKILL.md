---
name: review-gate
description: "Gate a diff before pushing or requesting review: deterministic checks first, then focused lenses selected by what the diff changes. Use before opening or updating a PR, when asked to pre-review a change, or after an external review round to harvest each finding into a new gate."
compatibility: Requires git and bash for the deterministic layer. Lens passes need a reviewer runtime; prefer a model different from the one that wrote the diff.
---

# Review gate

A **gate** is a check with a binary outcome and provenance from a recorded case. The gate exists to make external review rounds boring: every finding a reviewer would raise is caught before the push, and every finding they still raise becomes a new gate. The success metric is external findings per review round, trending to zero.

Generic review is imagination sampling: each pass surfaces a different subset of the defect space and converges slowly. Gates replace imagination with enumerable checks wherever a check exists, and spend model judgment only where judgment is required.

## Canonical write root

Resolve the canonical `Railly/skills` checkout before writing through `RAILLY_SKILLS_REPO`, `~/Programming/railly/skills`, or `~/railly-skills`. The canonical resolver is `scripts/resolve-source-root.mjs`. Cases, conventions, Impact Maps, run reports, and ledgers always go there. Never write them into the target repo, `.agents/skills`, `.claude/skills`, or another installed copy. If the source root is unavailable, keep the review read-only and report each blocked artifact.

## 0. Preserve the Spec boundary

When the handoff names an Issue Contract, read it and record its path, Spec review status, reviewed acceptance IDs, and gaps in the run report. Review Gate owns Standards review, not Spec review. Never infer a Spec pass from green checks or a clean Standards result; a missing state remains `not_provided`.

## 1. Load or bootstrap the conventions file

Find the project's conventions file at `cases/<repo>/conventions.md` under the canonical source root. Read instruction and review-convention documents in the target repo as inputs, but keep the compiled surface map, oracle pointers, house norms, and gate-miss ledger in the canonical file.

When none exists, build one now from the target repo's own instruction files (AGENTS.md, CLAUDE.md, CONTRIBUTING.md, docs README) before running the deterministic layer. Compile, don't just read: every prose rule of the form "when you change X, update Y and Z" becomes a line in the ```surfaces block, and every house rule that inverts or extends a universal gate becomes a norms entry. Recording the file's absence is not a substitute for building it: a norm left as prose runs as judgment, and judgment can exonerate what a check would flag (portless #363: the AGENTS.md docs rule was read, applied by hand, and still missed, because it never became a surfaces line).

**Complete when:** a conventions file is loaded, or one has been bootstrapped from the repo's instruction files and its surface map runs under `gate.sh surfaces`.

## 2. Run the deterministic layer

Run every applicable check in [scripts/gate.sh](scripts/gate.sh): `style`, `surfaces` (needs the conventions file), `stale` for each contract value the diff renames or retires, `siblings` for each behavior delta the diff documents: pick the keyword that names the feature (the noun a section heading would use, not the bug), and every file that mentions it yet is absent from the diff must be updated or exempted: and `callers` for each function whose contract the diff changes (a new failure outcome, a new return field, changed semantics): every call site outside the diff is read for state mutated before the call, or acknowledged. Callers are enumerated by the check, never from memory: attention follows the diff, and the callers a contract change breaks are precisely the code the diff never shows (1532 round 2). Two more run on their own triggers rather than per-symbol. `covered <runs-dir>` runs **first**, before anything else: a run report must exist for the exact HEAD sha, because a rebase or force-push retires every earlier report and the commit that fixes the previous round's findings is by construction the least-reviewed commit on the branch. `shellmeta` runs whenever the diff adds or edits a detector that scans a string for shell metacharacters. `artifacts <cleanup-source>` runs whenever the diff starts writing a new persistent file under a state, cache, or config directory: the writer and the remover are joined by nothing but a hardcoded list, so they drift in the one direction no test covers. `rawinput <accessor>` runs whenever the diff deepens a resolution or discovery rule: it is the sweep `callers` structurally cannot do, because a site that re-derives the answer inline from the raw input never calls the resolver. `execdeps <conventions.md>` runs whenever an added production path invokes a new external executable: every first-party installer and sandbox bootstrap named in the conventions file must install the package that provides it. An actionable runtime error is not an exemption when the product already promises to install the feature's system dependencies. These checks are cheap and have full recall on their class; a finding here is fixed or explicitly acknowledged, never skipped silently.

When the diff is in a TS/JS or Rust repo and the `radius` CLI is on PATH, also run `radius impact --base <merge-base>` here and save the JSON to `foundry/runs/review-gate/radius-dogfood/<date>-<repo>.json` under the canonical source root. The Impact Map is a deterministic input, not a gate: it ranks where the diff propagates so the lens passes in step 4 spend budget on the right symbols. Two reading rules carry over from the radius skill: convergence items (2+ changed symbols reaching the same impacted item) outrank raw confidence, and when `visibilityBoundary.unresolvedCalls` dwarfs `edges` the map under-covers. Say so in the report; absence of impact is not safety. CLI absent or repo in a language radius does not cover (anything outside TS/JS/Rust) → skip silently, the gate does not depend on it. Rust maps want `rust-analyzer` on PATH for semantic resolution; without it radius degrades to syntactic edges and says so on stderr. Treat such a map as under-covering. A `visibilityBoundary.scipStale: true` map was built from a stale semantic index; fine for orientation, not for a shipping review. Cross-language edges (TS↔Rust FFI/NAPI/IPC) do not exist yet: for a diff crossing that border, the map covers each side separately and `gate.sh callers` walks the boundary.

**Complete when:** every deterministic gate reports pass, or each finding is fixed or acknowledged with a reason.

## 3. Reconstruct the subsystem model, then frame the fix as an assumption

Do this **before** reading the delta as changed lines. The recurring miss on portless (#365, #366, #367 round 3, all caught by the maintainer) has one shape: the gate reasoned from the diff and matched it against past findings, while the maintainer reasoned from the whole system and probed the seam the fix assumed correct. A catalog derived from a reviewer's past outputs always runs one round behind the model that generates them. This step buys back the gap by starting where the maintainer starts.

Two moves, in order:

1. **Build the model of the subsystem the diff touches, sourced from the repo and the conventions file's subsystem invariants, not from the diff.** Three axes recur and each has burned a portless round:
   - **Process and channel topology.** Which processes exist (CLI vs detached daemon), which stdio each is attached to, where each one's output actually lands. A diagnostic emitted on the wrong process reaches a log the user never opens (#367: warning in the daemon → `proxy.log`, user attached to the CLI saw nothing).
   - **Consumers of every rule the fix touches.** A resolution/precedence/injection rule is applied by *every* path that reconstructs the value from user input, not only the primary resolver: error builders, 404/suggestion text, secondary matchers. Enumerate them all (#365: resolver applied longest-match, the 404 suggestion re-split the host naively).
   - **The fix's own new guard as an artifact under test.** When the diff adds a detector/guard, its input domain is the domain the *composed helpers* accept (runner wrappers, quoted metacharacters, redirections, partial-flag cells), never the argument positions the guard inspects: cells derived from the guard inherit its blind spot (#366).
2. **Then frame the fix as an assumption and name the adjacent layer.** For each change ask: *what layer does this fix assume correct but never touch?* Emission vs detection, one consumer vs all, the guard vs its full input domain, the happy path vs the warm-up call that pre-consumes a one-shot latch. That named adjacent layer is a candidate finding before any lens runs; the lenses in step 4 then verify or clear it.
3. **Build the claim inventory and proof ledger before reading the author's tests.** Follow [references/proof-obligations.md](references/proof-obligations.md): inventory contract, design, user-facing, and implementation claims; distinguish properties from proxies; challenge each proxy; map durable commit points and later failures; carry design assumptions; and classify high-risk work.

Source the model from `conventions.md` **subsystem invariants** and the repo's own code, and grow it: an adjacent layer that turns out to hold a real seam becomes a new subsystem invariant in the harvest (step 6), so the model: not just the lens list: is what compounds.

**Complete when:** all four claim sources are inventoried; the topology and consumer set are written down; every material property has a direct oracle, proxy challenge and substrate list; every durable commit point has its later fallible stages; every carried assumption is listed; and high-risk work has an independent challenge source or an explicit gap.

## 4. Select and run lenses

Read [references/gates.md](references/gates.md). Each **lens** declares a trigger, a property of the diff. Run each triggered lens as its own focused pass over the full diff, against the subsystem model from step 3 (each lens must clear or confirm the adjacent layers named there); a merged mega-pass dilutes every lens it carries. When an Impact Map exists from step 2, each lens inspects the convergence items first, then top-confidence items, and findings cite the propagation path (`X → Y via call`): but always spend passes beyond the map too: in the radius A/B, reviewers who only followed the map missed bugs free exploration caught. The map directs attention; directed attention is also narrowed attention. Prefer a reviewer model different from the one that wrote the diff: a same-model reviewer shares its priors and its blind spots. **Freeze the tree while a reviewer runs.** Editing the checkout under an in-flight reviewer invalidates its line citations and can refute findings it never got to see; branch or copy the tree if you want to keep working. (Origin: agent-browser #632 recreation, 2026-07-30: the implementer fixed a finding mid-review, so the reviewer's report cited an intermediate tree and every finding had to be re-verified against the final one.) Whichever way it lands, record `author_model` and `reviewer_model` in the run report; when they share a family, set `same_family: true` and carry a visible warning in the prose report: recorded, not blocking.

When a guard has now failed review twice on the same class, stop selecting lenses for it and build a substrate differential corpus instead (see the catalog entry). A third imagination pass is evidence that the input space is larger than the reviewer's model of it.

**Run `test-strength` as a mandatory behavioral proof obligation** when the diff implements or changes a protocol, parser, serializer, state machine, lifecycle, browser or OS event translation, adapter, or compatibility layer. This is not satisfied by selecting the new-domain matrix, reference-oracle, substrate, and dogfood lenses independently. Record one explicit behavioral model with its dimensions and exclusions, an oracle independent of the implementation, semantically valid producer transitions, fix-absent mutations, and a real-producer boundary drive. If any item is absent, the run is incomplete.

**Complete when:** every lens in the catalog is classified as triggered-and-run or skipped-with-reason.

## 5. Verify findings before reporting

**When the change is not the reviewer's own, drive the feature as a user first, before trusting any test or static reasoning.** Build the actual artifact from the PR branch and exercise the shipped surface the way a user would: run the new command with its real flags, real inputs, real error cases, and the real substrate (browser, filesystem, server), not the author's test suite, which only asserts what the author already thought to check. A review that stands on passing tests plus reasoning surfaces nothing useful, because the real defects live exactly where the author's tests did not look. This is the empirical layer of "a verification gap is not a refutation," promoted to a mandatory step for external PRs: the dogfood pass is where candidate findings are born and where the confident-but-wrong ones die. Record what was driven (commands, inputs, observed output) in the run report; a surface that could not be driven (platform absent, credential missing) is named as an unverified gap, never silently assumed to work. Skip only for the reviewer's own diff, where authorship already carries the dogfooding. Even then, prefer to drive it. (Origin: 2026-07-22, Hunter on PR #1596. Provenance: [1596-dogfood-invalid-selector](../../cases/agent-browser/1596-dogfood-invalid-selector.md). The clean test-and-reason review produced zero findings and one false claim; driving the built binary with adversarial inputs killed the false claim and surfaced a real one, an invalid CSS selector leaked a raw JS error, shipped as PR #1604. Drive the invalid-input cell, not just the valid inputs the author tested.)

Adversarially verify each candidate finding: reproduce it, or force the state it claims is reachable. Error paths are validated by forcing them, not by reasoning that they are unlikely. A drift or regression test added by the diff counts as unwritten until it has gone red once against the drift it guards. For a mandatory `test-strength` trigger, include the skill's report evidence in the Review Gate report; “matrix run” or “reference vectors run” without the dimensions, oracle provenance, producer provenance, and mutations is not evidence.

Execute every obligation in [references/proof-obligations.md](references/proof-obligations.md), not a convenient approximation.

Two rules bound what counts as a refutation:

- **Refute at the layer of the claim.** A claim about caller ordering or an end-to-end path is not refuted by a unit test of the callee's seam; a claim about a narrowed contract is not refuted by enumerating the producers known today (that is closure by enumeration, the same fallacy the stale-value gate names).
- **A verification gap is not a refutation.** When the empirical layer is unavailable (a browser that cannot launch, a platform not present), report the candidate as unverified with its gap named. Dropping it silently converts an environment limitation into a false negative.
- **An exemption is a claim.** Every absence or silence exonerated along the way (a required surface left untouched, a deterministic finding acknowledged away) is itself a finding-level claim and gets verified at its own layer before it exempts anything. A "this surface doesn't carry semantics" exemption is checked by reading the surface, not by assuming its genre (portless #363: a CLI help section with behavior prose was waved through as a terse listing).

The report is written twice from the same content: the prose report for the human, and a run report JSON at `foundry/runs/review-gate/<date>-<repo>-<shortsha>.json` under the canonical source root, per the schema in [references/run-report.md](references/run-report.md). The JSON is the ledger's view: risk classification, properties and their oracles, carried assumptions, commit points and retry evidence, findings, lens dispositions, deterministic outcomes, and provenance. A run whose lens runtime dies or whose proof obligation is incomplete reports `run.status: incomplete` with each gap named; an incomplete run is never presented as a pass.

Run `scripts/gate.sh report <run-report.json>` before writing `Status: pass`. The validator fails closed when a complete report contains proxy-only evidence, an unexercised substrate, an unverified assumption, an uncovered post-commit failure stage, a retry that was not attempted, or high-risk work without an independent challenge source.

The prose report ends with two mandatory sections beyond the findings themselves:

- **Exemptions claimed**: every exemption, with its evidence, not just its conclusion, so a human can veto any of them cheaply. An exemption whose evidence cannot be stated in one sentence is a finding.
- **Issue candidates**: real defects and gaps that fall outside the diff's scope: pre-existing bugs surfaced while verifying, residuals deliberately descoped, coverage gaps beyond the change, upstream quirks worked around. Each carries a one-line title, the evidence already gathered, and why it is out of scope: enough to open an issue without re-deriving the work. Out-of-scope findings that stay buried in a "known/deferred" paragraph die there.

**Complete when:** the feature was driven at its real substrate or each gap is named; every property, assumption, and commit-point partition is resolved; every finding and refutation has evidence at its own layer; the mandatory prose sections exist; and `gate.sh report` accepts the exact-head JSON.

## 6. Harvest after external review

After any external review round on the same change, classify each external finding:

- Machine-checkable → new deterministic gate (extend `gate.sh` or the conventions surface map).
- Judgment-required → new lens in [references/gates.md](references/gates.md), with trigger and provenance.
- Project-specific norm → entry in the project's conventions file.
- **Reasoned from the system, not enumerable as a variant** → new or sharpened **subsystem invariant** in the conventions file, so step 3 reconstructs that seam next time. When a finding lives in an adjacent layer the fix assumed correct (wrong emission channel, an unenumerated consumer of a rule, a latch consumed by warm-up), a lens variant alone re-runs one round behind; the durable fix is that the model now includes the layer.

A finding an existing gate should have caught is a gate bug: record why it missed, both in the catalog entry's provenance and in the project conventions file's **gate-miss ledger** (date, finding, which gate missed, why, what closed it). The ledger keeps repo-local recurrence visible where the next review of that repo will actually look. Provenance is mandatory: a gate enters the catalog only from a recorded case or a confirmed external-review miss.

Two checks on the harvest itself, because a harvested rule is written under the same pressure as a fix and fails the same ways.

**A new deterministic gate is born red AND green.** Red on the defect that motivated it is already the rule. Green on correct work is the missing half: run the new check against a diff that should pass: an unrelated branch in the same repo, or the fixed version of the same diff: before it enters the catalog. A gate that reports correct work as a defect is a gate that gets ignored, and it will be ignored precisely when it is right. (Origin: portless #367 round 6, 2026-07-29. `gate.sh artifacts` was force-red at birth, shipped, and on its first real use reported two findings against the correct fix: registering the filename through a constant shared by writer and remover, and removing orphaned temp files by prefix: the two things the gate exists to ask for. Only running it against the fix surfaced that.)

**A force-red harness restores from a snapshot, never from version control.** `git checkout --` over a working tree reverts the fix along with the mutation, so every case after the first runs against unmodified code and reports a meaningless green. Copy the target files to a temp path before the first mutation and restore from there, on clean exit and on kill. Verify each mutation actually applied before trusting its verdict: a pattern that silently fails to match produces the same green as a surviving mutation. (Origin: agent-browser #1594, 2026-07-30. A harness using `git checkout --` destroyed an hour of uncommitted work on its first restore and reported four false greens before the pattern was noticed.)

**An invariant harvested from one symptom inherits that symptom's direction.** A reviewer reports the direction that bit them. The rule you write from it describes a root cause, and a root cause almost always runs both ways. Before recording it, state the cause in one sentence with no symptom in it, then ask what the opposite direction looks like and whether it is reachable. (Origin: portless #367 round 6, 2026-07-29. The maintainer reported a CLI reading its own environment to describe a daemon as *waiting 4.1s for a publication that never comes*; the invariant was written in that direction. The same cause runs the other way: the CLI discarding a real failure the daemon did publish: which is worse, was reachable, and was found later by a blind reviewer driving the binary rather than by the harvest.)

**Complete when:** every external finding is matched to an existing gate that missed (with the miss explained) or captured as a new gate with provenance; every new deterministic gate has been run red on its defect and green on a correct diff; and every new invariant has had its opposite direction stated and either found unreachable or recorded as its own finding.

## 7. Radius dogfood ledger

When a review used an Impact Map, append one line to `foundry/runs/review-gate/radius-dogfood/ledger.jsonl` under the canonical source root:

```json
{"date":"YYYY-MM-DD","repo":"...","base":"...","changed":N,"impacted":N,"edges":N,"unresolvedCalls":N,"findings":N,"map_attributed":N,"convergence_inspected":N,"convergence_with_finding":N,"outside_map":N,"map_json":"<date>-<repo>.json"}
```

`map_attributed` = findings whose evidence cites a propagation path from the map. `outside_map` = findings from free exploration the map did not rank. When an external review round or a shipped regression later surfaces a bug in a change that had a map, run the **escape autopsy**: open the saved `map_json` and record in the gate-miss ledger whether the buggy symbol was in the map (in-map-but-missed = reading/anchoring failure; not-in-map = coverage gap → feeds radius `references/tuning.md`, never hand-tuned). The canonical ledger and run directory are swept by `/pulse`; decision review at n≈20 entries.
