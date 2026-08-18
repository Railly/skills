# Round 005: Register xref

Status: proposed, awaiting human decision
Date: 2026-08-11
Scope: full Railly Skills catalog vs. installed skills and SkillKit 90-day usage

## Decision question

`xref` was installed and actively used, with real run evidence already accumulating under `foundry/runs/xref/`, but it was never entered into `maturity.json`, `skills/`, or the `.claude-plugin` marketplace manifest. Should it enter the registry, and at what channel and maturity?

## Evidence reviewed

- `foundry/runs/xref/`: 18 run artifacts (HTML/JSON/TXT/MD) dated 2026-08-10, covering agent-browser #1068 (post #1589), #1589 (post-merge), #326/#86 (triage + clustering), #896 (post #1589), and a session-isolation cross-check.
- SkillKit 90-day invocation data: `xref` called 14 times, the fourth most-invoked skill in the corpus behind `deslop`, `review-gate`, and `record-a-case`.
- The installed source: `~/.claude/skills/xref` (symlink) -> `~/.agents/skills/xref/SKILL.md`, not present anywhere in this repository before this round.
- Cross-check against the four names retired in [Round 004](../004-skill-lifecycle-audit/README.md): `xref` is unrelated to any of them and does not overlap `pick-an-issue`, `gh-graph`, or `review-gate` in trigger surface: it answers "what does this PR/issue already connect to", not "what should I work on" or "does this diff pass review".

## Limits

- No trigger or negative-trigger eval has been run; adoption evidence comes from real session usage, not a holdout comparison.
- No baseline (no-skill vs. xref) comparison exists yet.
- The tool itself (`vercel-labs/xref` CLI) is internal to the Vercel org and not installable from a public registry, same constraint already accepted for other Vercel-context skills in this catalog.

## Usage findings

| Signal | Value |
|---|---:|
| SkillKit 90-day invocations | 14 |
| Recorded runs in `foundry/runs/xref/` | 18 |
| Distinct issues/PRs covered | 5 (agent-browser #1068, #1589, #326/#86, #896, session-isolation) |
| Prior registry presence | None (absent from `maturity.json`, `skills/`, and the marketplace manifest before this round) |

## Recommendation

Register `xref` at channel `experimental`, maturity `dogfooded`: the same bar applied to `pick-an-issue`, `record-a-case`, and `solution-gate` at their first registration: real use on real work with recorded evidence, no baseline yet.

## Proposed changes (staged, not committed)

- Added `skills/.experimental/xref/SKILL.md`, copied verbatim from the installed source.
- Added an `xref` entry to `foundry/maturity.json` pointing to this round.
- Added `./skills/.experimental/xref` to the `experimental` plugin in `.claude-plugin/marketplace.json`.

## Follow-up

- Run a trigger/negative-trigger eval against near-miss requests (e.g. "review this diff" should route to `review-gate`, not `xref`).
- Compare against a no-skill baseline on a fresh issue to confirm the orphan/duplicate-detection claim.
