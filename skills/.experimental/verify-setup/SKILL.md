---
name: verify-setup
description: "Give a repository its own executable verification kit under .agents/verify: doctor, deterministic checks, per-feature drivers that observe the real surface and keep evidence tied to the exact tree, and an enforcer table. Use when a repo has no way for an agent to prove a change works, when setting up verification for a new repo, when adding a driver for a feature, when a done claim was wrong because the wrong surface was checked, or when the verify-before-done hook blocks for lack of evidence. Do not use to review a diff (review-gate) or to record a case (record-a-case)."
compatibility: "Requires git, bash, and Node or Bun for the scaffold. Drivers use whatever the surface needs, such as agent-browser, curl, or the repo's own CLI."
---

# Verify setup

A repo is verifiable when an agent that has never seen it can run one command and get evidence, from the surface a user touches, that a change works. Prose that says how to check is not enough. This skill ships scripts.

## Kit

`node scripts/scaffold.mjs <repo-root> [--local]` copies the kit into `<repo>/.agents/verify/` and never overwrites. `--local` adds `.agents/verify/` to `.git/info/exclude`, so the kit works on this machine without ever being versioned. Use it for repos you do not own:

| File | Contract |
|---|---|
| `doctor.sh` | exit 0 only when every precondition the drivers need exists |
| `check.sh` | types, lint, unit tests; non-zero on any failure |
| `observe.sh <feature>` | runs `drive/<feature>.sh` with `EVIDENCE_DIR` set, writes `meta.json` with HEAD, tree digest, exit code, artifact count |
| `fresh.sh` | exit 0 when a passing observation exists for the current tree; the Stop hook calls it |
| `drive/<feature>.sh` | reaches the feature as a user does and writes proof into `EVIDENCE_DIR` |
| `features/<feature>.md` | where it lives, how a user reaches it, how to drive it, what usually lies |
| `ENFORCERS.md` | rule to enforcer table |

`evidence/` is gitignored. The tree digest covers tracked changes and untracked files, so evidence from before an edit never counts after it.

## Procedure

1. Read the repo's README, CI config, and agent instructions. List the surfaces: CLI, HTTP API, web UI, desktop, library.
2. Scaffold the kit. Fill `doctor.sh` with the real binaries, env vars and services. Fill `check.sh` with the commands CI runs, fastest first.
3. Pick the three to five features changes touch most often (git log, open issues). For each, write the driver and the feature file.
4. A driver observes the outcome, not a proxy. A CLI driver runs the built binary and asserts on output. A web driver uses agent-browser to screenshot and asserts on the DOM or text. An API driver curls the running service and asserts on the body, not only the status.
5. Fill "What usually lies" from real failures: cases in the canonical repo under `cases/<repo>/`, review findings, and papercuts.
6. Prove the kit before handing it over: `doctor.sh`, `check.sh`, then `observe.sh <feature>` for every driver, on a clean tree. Open each screenshot and look at it. Then break the feature on purpose (or revert a known fix) and confirm the driver fails. A driver that cannot fail is not a driver.
7. Report the commands run, exit codes, and evidence paths.

## Rules

- Never mark a driver done because it exited 0. It is done when it has been seen to fail on a broken state and pass on a fixed one.
- Drivers are deterministic and idempotent. They clean up what they start, also on failure.
- Do not mock the surface. If the real surface needs credentials or a service that is unavailable, `doctor.sh` fails with that reason; never fall back to a fake.
- Label each claim in reports as measured, inferred, or guess.
- In a repo you do not own, scaffold with `--local`. Proposing the kit upstream is a human decision.

## Maintenance

When a change adds or moves a feature, update its driver and feature file in the same diff. When a mistake escapes, add a check that fails on that mistake and a row in `ENFORCERS.md`.
