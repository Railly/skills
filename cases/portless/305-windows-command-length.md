# Case: Bypass Windows shell command-length limits

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/305 and https://github.com/vercel-labs/portless/pull/306
Issue or PR: https://github.com/vercel-labs/portless/issues/305 and https://github.com/vercel-labs/portless/pull/306
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said Windows returned `'<bin>' is not recognized` when inherited PATH exceeded 8191 characters.

## Red signal

- Setup: PR #306 tests on macOS, implementation restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/cli-utils.test.ts -t 'resolveWindowsExecutable' --maxWorkers=1`
- Expected: executable resolution follows PATH and PATHEXT without relying on `cmd.exe` command parsing.
- Actual: 18 focused failures after revert.
- Why this signal was trustworthy: deterministic for the new resolver logic, but not sufficient to prove the Windows runtime symptom.
- Evidence handles: `packages/portless/src/cli-utils.test.ts:1131`; `/tmp/305-red.log`.

## Method used

1. Action: selected the issue because it had a precise platform limit and linked PR. Reason: bounded implementation and unit seam. Evidence obtained: PR #306. Result: selected despite unavailable Windows runtime.
2. Action: cherry-picked the patch. Reason: review existing resolution logic. Evidence obtained: commit `19a804c`. Result: applied.
3. Action: ran all `cli-utils` tests. Reason: check resolver and surrounding behavior. Evidence obtained: 130 passes. Result: green.
4. Action: reverted `cli-utils.ts`. Reason: falsify tests. Evidence obtained: 18 failures. Result: resolver tests have teeth.

## Outcome

Tested at unit level, not artifact verified on Windows. The original symptom remains un-reproduced in this session.

## Evidence

### Source

- `packages/portless/src/cli-utils.ts:901`: Windows executable resolver.
- `packages/portless/src/cli-utils.ts:989`: direct resolved executable spawn path.

### Runtime

- Unknown for Windows. No SSM or Windows host was used.

### Tests

- `packages/portless/src/cli-utils.test.ts:1131`: resolver suite.

### History and review

- `19a804cf09cf6e6fd82c7e8f358dee1bc74bb272`: local branch head.
- https://github.com/vercel-labs/portless/pull/306: linked implementation.

### Inferences

- Direct spawning should avoid the shell's 8191-character command limit.

### Unknowns

- Whether the exact long-PATH command succeeds on Windows.

## Transferable lesson

> When a platform shell imposes a command-length limit, resolve the executable deterministically and invoke the process API directly, then verify on the affected platform.

- Why it transfers: shell wrappers add platform-specific parsing and size limits.
- Where it does not apply: commands requiring shell syntax or built-ins.
- Known exceptions: scripts may still require an interpreter wrapper.

## Candidate changes

### Skill method

- Separate resolver unit proof from affected-platform runtime proof.

### Reference rule

- Direct execution is not equivalent to shell execution for built-ins and scripts.

### Exemplar

- None

### Deterministic check

- Resolver matrix for PATH, PATHEXT, absolute paths, and missing binaries.

### Behavior eval

- None

### Coverage gap

- Actual Windows process launch with PATH longer than 8191 characters.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “A Windows child command disappears only when PATH is very long.”
Expected invocation: shell-limit and direct-spawn investigation.
Observable pass signal: agent creates a long-PATH runtime reproduction.

### Negative or near-miss trigger

Prompt: “A shell pipeline using `|` fails.”
Expected non-invocation: do not replace the shell blindly.
Observable pass signal: agent preserves required shell semantics.

### Method assertion

Scenario: patch replaces shell execution.
Required behavior: test PATH/PATHEXT and one real platform process.
Observable pass signal: both unit and runtime evidence exist.

### Outcome assertion

Scenario: only resolver tests ran on macOS.
Required artifact or evidence: mark Windows runtime as unknown.
Observable pass signal: no claim of artifact verification.

### Transfer holdout

Different repository or stack: Python launcher on Windows.
Changed incidental details: `subprocess` instead of Node spawn.
Expected transferable behavior: direct executable invocation plus platform test.
Observable pass signal: oversized environment launch succeeds.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add deterministic check. The resolver matrix is proven; the platform outcome is not.

## Missing evidence

- Windows runtime reproduction and final binary validation.
