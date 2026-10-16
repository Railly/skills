# Round 006: Usage-based reclassification

Status: proposed, awaiting human decision
Date: 2026-08-11
Scope: every skill in `foundry/maturity.json` after Round 005 registered `xref`

## Decision question

SkillKit's 90-day index shows invocation counts for every registered skill except `resilience-audit` (0). Does invocation count alone justify promoting a skill's maturity, or does the registry require the same evidence bar already applied to `unfold` in Round 004: a recorded case or run, not a raw call count?

## Why this round exists

Round 004 explicitly warned against trusting SkillKit counts alone: `unfold`'s single post-deprecation invocation "occurred during the current audit, not a Vercel issue implementation." Treating a call count as proof of value would have kept a skill alive that the same round deprecated for lack of operational use. This round applies that same discipline going the other direction: high SkillKit counts are a lead to verify, not a promotion in themselves.

## Method

For every experimental or candidate skill with SkillKit invocations, grep `cases/` and `foundry/runs/` for the skill name, then read each hit to determine whether it documents the method actually being applied and producing an outcome, or is a coincidental match (a filename substring, a future-tense reference, a PR title that happens to contain the words).

## Evidence reviewed

| Skill | SkillKit 90d | Real match found | Verdict |
|---|---:|---|---|
| `signature-repro` | 1 | `cases/agent-browser/1461-doctor-version-query-hang.md`: "solution-gate and signature-repro both applied as written and needed no revision" | Real, applied |
| `quality-baseline` | 1 | `cases/portless/369-partial-write-orphan-block.md`: "Ran the quality-baseline pass over the repository; `hosts.ts` ranked lowest on branch coverage... its three write functions had no tests at all": the pass produced the finding that led to the fix | Real, applied |
| `test-strength` | 6 | `foundry/runs/review-gate/2026-08-11-portless-366-60394ae.md` and the matching #374 run: "Four independent test-strength mutations failed for the intended reason and passed after restoration" | Real, applied |
| `handoff` | 7 | Only filename-substring collisions (`agent-browser-ca-trust-handoff-2026-08-08.md` in an unrelated vault path) | Coincidental, not evidence |
| `performance-proof` | 2 | Only a PR title slug (`wterm/0112-noisy-performance-proof.md`, "a performance PR may prove only a simpler scheduler") | Coincidental, not evidence |
| `trail-decisions` | 4 | `foundry/runs/solution-gate/2026-08-10-agent-browser-1677-548b159b.md`: "carry these predicates into `trail-decisions`": a forward-looking handoff note, not a record of the skill running | Coincidental, not evidence |
| `resilience-audit` | 0 | None | No change |

## Decision

Promote maturity (channel unchanged) for the three skills with a verified applied case:

- `signature-repro`: experimental -> **dogfooded**
- `quality-baseline`: experimental -> **dogfooded**
- `test-strength`: experimental -> **dogfooded**

No maturity change for `handoff`, `performance-proof`, `trail-decisions`, or `resilience-audit`. Their SkillKit counts stand as adoption signal only, per the same limit Round 004 already recorded: "invocation counts show adoption, not causal improvement."

## Follow-up

- `handoff`, `performance-proof`, and `trail-decisions` were called in real sessions without leaving a recorded case. That is a recording gap, not a skill-quality problem: file cases for the next real use of each so the next audit has evidence to check rather than a coincidental grep hit.
- `resilience-audit` remains untriggered after 90 days. Re-check at the next lifecycle audit; if it stays untriggered across two more audit cycles, revisit whether its trigger boundary is too narrow to be discoverable rather than assuming the boundary is simply working as designed.
