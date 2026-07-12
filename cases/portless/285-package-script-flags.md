# Case: Forward injected flags through package scripts

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/285 and https://github.com/vercel-labs/portless/pull/303
Issue or PR: https://github.com/vercel-labs/portless/issues/285 and https://github.com/vercel-labs/portless/pull/303
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said zero-argument mode with `bun run dev` did not inject Vite's `--port`, so the proxy targeted a different port and returned 502.

## Red signal

- Setup: PR #303 regression test retained and `cli.ts` restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/cli.test.ts -t 'forwards Vite port flags through bun run dev' --maxWorkers=1`
- Expected: the built CLI launches the package script with the injected framework flags.
- Actual: 1 focused failure after revert.
- Why this signal was trustworthy: it exercised zero-argument script resolution through the built CLI rather than testing only a helper.
- Evidence handles: `packages/portless/src/cli.test.ts:1627`; `/tmp/285-red.log`.

## Method used

1. Action: found issue #285 and PR #303 during backlog cross-reference. Reason: exact CLI symptom and regression seam. Evidence obtained: linked PR. Result: selected.
2. Action: cherry-picked the patch. Reason: preserve the prior implementation and authorship. Evidence obtained: commit `b583912`. Result: branch created.
3. Action: ran the focused built-CLI test after unrelated full-file failures. Reason: isolate the issue claim. Evidence obtained: 1 pass. Result: green.
4. Action: reverted `cli.ts`. Reason: prove caller-level coverage. Evidence obtained: 1 failure. Result: red.

## Outcome

Tested through the built CLI. No live Vite server was started, so the disappearance of the 502 was not artifact verified.

## Evidence

### Source

- `packages/portless/src/cli.ts:1469`: package-script flag injection function.
- `packages/portless/src/cli.ts:3430`: passes script context from zero-argument mode.

### Runtime

- `pnpm --filter portless build`: passed.

### Tests

- `packages/portless/src/cli.test.ts:1627`: wired CLI regression.

### History and review

- `b583912574a2aaf94a48259882249497d1a7bb71`: local head.
- https://github.com/vercel-labs/portless/pull/303: related implementation.

### Inferences

- Vite should bind the assigned port when invoked through Bun.

### Unknowns

- Live Vite process and actual proxy response.

## Transferable lesson

> When a wrapper injects arguments into a command hidden behind a package script, verify that arguments cross every runner boundary, because correct flags at the outer command can be silently dropped.

- Why it transfers: task runners and package scripts form nested argument boundaries.
- Where it does not apply: direct executable invocations.
- Known exceptions: runners differ on whether they require an argument separator.

## Candidate changes

### Skill method

- Trace final argv through every wrapper, script, and runner.

### Reference rule

- Runner-specific argument separators must be verified, not assumed.

### Exemplar

- Built-CLI caller test instead of helper-only test.

### Deterministic check

- Capture final child argv for zero-argument script mode.

### Behavior eval

- None

### Coverage gap

- Live child bind and proxy request.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “Injected flags work for direct commands but disappear through `run dev`.”
Expected invocation: nested argv tracing.
Observable pass signal: final child argv is captured and asserted.

### Negative or near-miss trigger

Prompt: “The child receives the flag but rejects its value.”
Expected non-invocation: do not focus on forwarding.
Observable pass signal: agent inspects value semantics instead.

### Method assertion

Scenario: command passes through two runners.
Required behavior: test the public wrapper seam.
Observable pass signal: reverting caller wiring turns the test red.

### Outcome assertion

Scenario: argv test passes without live service.
Required artifact or evidence: outcome is tested only.
Observable pass signal: no claim that HTTP 502 was observed disappearing.

### Transfer holdout

Different repository or stack: Python launcher invoking a Make target.
Changed incidental details: no Bun or Vite.
Expected transferable behavior: trace arguments into the final process.
Observable pass signal: final process receives the injected port.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add exemplar. The caller-level regression demonstrates the helper-versus-wiring trap.

## Missing evidence

- Live Vite bind and proxy request.
