# Case: Map generic runtime settings to framework flags

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/263 and https://github.com/vercel-labs/portless/pull/272
Issue or PR: https://github.com/vercel-labs/portless/issues/263 and https://github.com/vercel-labs/portless/pull/272
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter requested passing Portless's assigned `PORT` as Wrangler's `--port`; Wrangler also uses `--ip` rather than the common `--host` bind flag.

## Red signal

- Setup: PR #272 tests retained while `cli-utils.ts` and `cli.ts` were restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/cli-utils.test.ts -t 'wrangler' --maxWorkers=1`
- Expected: direct and `npx` Wrangler commands receive `--port` and `--ip`, while explicit flags are preserved.
- Actual: 4 focused failures after revert.
- Why this signal was trustworthy: table-driven command transformation tests asserted exact argv variants.
- Evidence handles: `packages/portless/src/cli-utils.test.ts:473`; `/tmp/263-red.log`.

## Method used

1. Action: found issue #263 and PR #272. Reason: deterministic argument mapping. Evidence obtained: linked implementation. Result: selected.
2. Action: cherry-picked and resolved a docs conflict with newer multi-TLD text. Reason: apply cleanly to current base. Evidence obtained: commit `befd218`. Result: branch created.
3. Action: ran 116 `cli-utils` tests. Reason: validate framework flag matrix. Evidence obtained: all passed. Result: green.
4. Action: reverted implementation. Reason: prove Wrangler cases depend on the change. Evidence obtained: 4 failures. Result: red.

## Outcome

Tested as command transformation. No Wrangler process was launched.

## Evidence

### Source

- `packages/portless/src/cli-utils.ts:1000`: Wrangler maps host binding to `--ip`.

### Runtime

- Unknown. No live Wrangler dev server.

### Tests

- `packages/portless/src/cli-utils.test.ts:473`: exact direct-command regression.

### History and review

- `befd21853c4327c20aeeca86f29c088d0000d8a0`: local head.
- https://github.com/vercel-labs/portless/pull/272: linked patch.

### Inferences

- Wrangler should bind to Portless's assigned port and address.

### Unknowns

- Current Wrangler CLI compatibility and actual bind behavior.

## Transferable lesson

> When normalizing framework launches, model semantic settings separately from framework-specific flag names, because equal concepts often use incompatible CLI syntax.

- Why it transfers: adapters routinely map port, host, and strictness differently.
- Where it does not apply: tools that consume a shared environment contract.
- Known exceptions: flags may change across framework versions.

## Candidate changes

### Skill method

- Build a framework adapter table from semantic settings to exact argv.

### Reference rule

- Preserve explicit user flags over injected defaults.

### Exemplar

- Wrangler's `--ip` versus common `--host`.

### Deterministic check

- Direct, wrapped, explicit-flag, and wrong-flag cases.

### Behavior eval

- None

### Coverage gap

- Live framework version.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “Add a framework whose bind-address flag differs from existing adapters.”
Expected invocation: semantic adapter mapping.
Observable pass signal: direct and wrapped argv tests pass.

### Negative or near-miss trigger

Prompt: “The framework already honors `PORT` and `HOST`.”
Expected non-invocation: do not inject redundant flags.
Observable pass signal: argv remains unchanged.

### Method assertion

Scenario: user supplies an explicit bind flag.
Required behavior: injected default must not duplicate or override it.
Observable pass signal: exact argv contains one user value.

### Outcome assertion

Scenario: transformation tests only.
Required artifact or evidence: outcome remains tested.
Observable pass signal: live bind remains unknown.

### Transfer holdout

Different repository or stack: Java launcher mapping address to `--server.address`.
Changed incidental details: no Wrangler or Node.
Expected transferable behavior: semantic mapping and explicit override preservation.
Observable pass signal: exact Java argv is correct.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add exemplar. The adapter-table pattern is clear, but one case does not justify a new skill.

## Missing evidence

- Live Wrangler verification and version matrix.
