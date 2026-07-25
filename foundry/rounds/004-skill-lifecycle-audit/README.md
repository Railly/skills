# Round 004: Skill lifecycle audit

Status: approved and implemented
Date: 2026-07-25
Scope: Vercel Labs issue solving and the full Railly Skills catalog
Human decision: Hunter approved the recommendations on 2026-07-25.

## Decision question

Which skills are actually carrying the Vercel Labs issue workflow, which overlap, and what should happen to Unfold?

## Evidence reviewed

- All 10 skills that were installable at the start of the audit and their linked method references.
- All 37 case records in the canonical corpus: 19 agent-browser, 17 Portless, and 1 Native.
- All eval definitions, trigger sets, fixtures, 18 Review Gate run reports, and 8 Radius dogfood snapshots.
- 34 Claude session files containing Vercel Labs repository evidence.
- SkillKit 90-day invocation data after a fresh session scan.
- The five-contract retrospective [Issue Contract pilot](../../candidates/2026-07-issue-contract-pilot/README.md).

The session scan distinguishes explicit `Skill` tool calls from skill names copied into prompts or injected documentation. Text mentions are not treated as usage.

## Limits

- Explicit calls undercount methods followed implicitly from injected instructions.
- The 34-session filter finds repository evidence, not a clean issue-only cohort.
- Artifact-producing skills such as Record a Case can be useful even when the transcript lacks an explicit call.
- Most cases predate the consolidated Unfold release, so they prove the value of its component operations more strongly than they test the umbrella itself.
- Invocation counts show adoption, not causal improvement. Baselines and prospective outcomes still decide promotion.

## Usage findings

### Explicit calls in the 34-session Vercel corpus

| Skill | Calls | Interpretation |
|---|---:|---|
| `review-gate` | 6 | Repeated operational unit across Portless, agent-browser, Native, Radius, and Petdex-adjacent work |
| `gh-graph` | 3 | Repeated backlog and relationship survey unit |
| `pick-an-issue` | 1 | Used once at intake for agent-browser #1528 |
| `repro-an-issue` | 1 | Used in the same #1528 issue chain before it was removed |
| `prove-the-test` | 1 | Used in the same #1528 issue chain before it was removed |
| `unfold` | 0 | No explicit call in the corpus |
| `record-a-case` | 0 | Cases were often written as workflow output without a recorded explicit skill call |
| Experimental catalog | 0 | No explicit Vercel issue call for the six current experimental or candidate skills |

SkillKit's broader 90-day index reports `review-gate` 9, `gh-graph` 5, `pick-an-issue` 3, `record-a-case` 2, `repro-an-issue` 1, `prove-the-test` 1, and `unfold` 1. The single Unfold event occurred during the current audit, not a Vercel issue implementation.

## Eval findings

| Skill | Method cases | Trigger cases | Recorded runs | Lifecycle signal |
|---|---:|---:|---:|---|
| Unfold | 8 | 7 | 0 | Broad fixture coverage, no baseline run and no observed operational use |
| Pick an Issue | 2 | 6 | 0 | Narrow contract, real use, baseline missing |
| Record a Case | 3 | 6 | 0 | Large real corpus, baseline missing |
| Review Gate | 0 | 6 | 18 | 15 complete runs, 55 findings, 38 marked confirmed |
| Signature Repro | 4 | 0 | 0 | Coherent niche, trigger boundary and baseline missing |
| Test Strength | 3 | 4 | 0 | Coherent proof method, overlaps Unfold Review |
| Quality Baseline | 3 | 4 | 0 | No observed use |
| Performance Proof | 3 | 4 | 0 | No observed use |
| Resilience Audit | 3 | 4 | 0 | No observed use |
| Trail Decisions | 0 | 0 | 0 | No observed use and its original target-repo log path violated the canonical-source rule |

Review Gate has the strongest lifecycle evidence. Its run corpus is not perfectly normalized: five older reports omit `run.repo`, three reports are incomplete, and seven name gaps. Those are ledger-quality issues, not evidence that the method is unused.

## Case findings

The 37 cases cluster around small, named operations:

- Establish a controlled red signal and explain a green control.
- Trace the actual process, caller, sink, adapter, or artifact boundary.
- Regenerate a matrix when a trigger or accepted domain widens.
- Revert or mutate the decisive production behavior while retaining the test.
- Drive the built artifact when tests and code reading cannot expose the user-visible defect.
- Run Standards review independently from deterministic verification.
- Harvest external misses into project conventions, deterministic gates, or focused lenses.

The corpus does not show a four-mode umbrella being invoked as a unit. It shows phase-specific operations, durable contracts, and a review loop.

## Lifecycle recommendation

| Skill | Current state | Recommendation | Reason |
|---|---|---|---|
| `review-gate` | stable, evaluated | Keep | Strongest usage and run evidence |
| `record-a-case` | stable, dogfooded | Keep, then baseline | The corpus proves utility, but not improvement over an unskilled ledger |
| `pick-an-issue` | stable, dogfooded | Keep narrow | Selection is a distinct attention gate and should not own reproduction or implementation |
| `unfold` | deprecated, archived | Removed from runtime | Zero explicit Vercel calls, broad trigger surface, no baseline, and each useful mode has a clearer destination |
| `signature-repro` | candidate, experimental | Keep niche | Useful only when the reporter environment or hardware is unavailable |
| `test-strength` | experimental | Evaluate as proof successor | It owns falsification and test teeth more clearly than Unfold Review |
| `trail-decisions` | candidate, experimental | Redesign and dogfood once | Centralize trails in this repo before judging value |
| `quality-baseline` | experimental | Freeze | No issue-work usage. Keep out of the default workflow |
| `performance-proof` | experimental | Freeze | Use only for an evidenced performance claim |
| `resilience-audit` | experimental | Freeze | Use only when failure-path risk triggers it |

## Approved Unfold decomposition

Do not rename the umbrella. Split only the parts that earn an independent contract:

| Unfold mode | Destination |
|---|---|
| Learn | Revisit later as the existing `repo-map` product direction, not as an issue-solving prerequisite |
| Triage | A literal reproduction phase that creates and updates the Issue Contract. Evaluate the method before restoring a `repro-an-issue` skill |
| Change | No dedicated skill. Implement from the Issue Contract under normal task authority |
| Review | `test-strength` for behavioral proof, then `review-gate` for Standards review |
| `.unfold/` artifacts | Replace with canonical Issue Contracts and Foundry evidence under this repo |

This decomposition restores the vocabulary seen in real sessions without immediately recreating the two removed skills. The first prospective Issue Contract round should determine whether reproduction needs a dedicated skill or only a contract section and gate.

## Active issue workflow

```text
pick-an-issue
  -> Issue Contract seed
  -> reproduce and map current behavior
  -> implement from acceptance IDs
  -> deterministic proof
  -> Spec review against the contract
  -> review-gate
  -> record-a-case
```

`signature-repro`, `test-strength`, `performance-proof`, and `resilience-audit` are conditional lenses, not mandatory pipeline stages.

## Post-deprecation validation

1. Run three prospective Issue Contract missions from the canonical source repo.
2. Record handoff recovery, scope additions, acceptance changes, Spec rounds, Standards rounds, and external findings.
3. Evaluate `test-strength` against Unfold Review and no-skill baselines.
4. Measure whether `pick-an-issue` produces a usable contract seed without taking ownership of reproduction.

## Implemented surfaces

- Archived the complete Unfold source and eval corpus under `foundry/deprecated/unfold/`.
- Removed Unfold from the marketplace and active maturity registry.
- Changed Pick an Issue to seed `foundry/missions/<owner-repo>/`.
- Added the canonical Issue Contract template and validator.
- Kept Spec state explicit and separate inside Review Gate run reports.
- Kept Test Strength Experimental until a baseline comparison exists.
- Centralized all cases, contracts, eval runs, and Foundry logs in the source repository.

Unfold was moved to `foundry/deprecated/unfold/`, removed from the marketplace and active maturity registry, and retained with all references, fixtures, and evals. No successor skill was promoted without a baseline.
