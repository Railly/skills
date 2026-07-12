# Case: Preserve configuration provenance in user output

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/274 and https://github.com/vercel-labs/portless/pull/300
Issue or PR: https://github.com/vercel-labs/portless/issues/274 and https://github.com/vercel-labs/portless/pull/300
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said Portless printed `Name "foo" (from portless.json)` when the value was configured in `package.json`.

## Red signal

- Setup: PR #300 test retained while `cli.ts` and `config.ts` were restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/cli.test.ts src/config.test.ts -t 'package.json as the name source' --maxWorkers=1`
- Expected: output names the actual configuration source.
- Actual: 1 focused failure after revert.
- Why this signal was trustworthy: the fixture placed configuration in `package.json` and asserted built CLI output.
- Evidence handles: `packages/portless/src/cli.test.ts:1688`; `/tmp/274-red.log`.

## Method used

1. Action: found issue and linked PR during survey. Reason: narrow provenance bug. Evidence obtained: PR #300. Result: selected.
2. Action: cherry-picked patch. Reason: inspect data flow from loader to UI. Evidence obtained: commit `2e3411d`. Result: applied.
3. Action: ran focused CLI and config tests. Reason: verify source metadata crosses layers. Evidence obtained: pass. Result: green.
4. Action: reverted loader and CLI implementation. Reason: falsify the behavior. Evidence obtained: 1 failure. Result: red.

## Outcome

Tested locally through built CLI output. Not pushed or shipped.

## Evidence

### Source

- `packages/portless/src/config.ts:23`: `LoadedConfig` includes source metadata.
- `packages/portless/src/config.ts:39`: JSON source assignment.
- `packages/portless/src/config.ts:68`: package source assignment.
- `packages/portless/src/cli.ts:3378`: displays the propagated source.

### Runtime

- Built CLI fixture output contained `package.json`.

### Tests

- `packages/portless/src/cli.test.ts:1688`: exact user-facing regression.

### History and review

- `2e3411d640e839fcb5ecd42a66cb63fe8858d262`: local head.
- https://github.com/vercel-labs/portless/pull/300: linked patch.

### Inferences

- Other config-derived messages may benefit from the same provenance object.

### Unknowns

- No inventory of all user-visible provenance messages was performed.

## Transferable lesson

> When multiple loaders normalize into one value, carry provenance beside the value until presentation, because reconstructing origin later produces plausible but false diagnostics.

- Why it transfers: layered configuration is common across languages.
- Where it does not apply: systems with exactly one source.
- Known exceptions: sensitive source locations may need redaction.

## Candidate changes

### Skill method

- Treat provenance as data, not a UI guess.

### Reference rule

- Normalized configuration objects should retain source identity when humans see diagnostics.

### Exemplar

- None

### Deterministic check

- One fixture per source asserting identical value and distinct source label.

### Behavior eval

- None

### Coverage gap

- Other diagnostics were not audited.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “The diagnostic names the wrong config file when values can come from two places.”
Expected invocation: provenance propagation.
Observable pass signal: loader returns value plus source.

### Negative or near-miss trigger

Prompt: “The config value itself is parsed incorrectly.”
Expected non-invocation: do not stop at provenance.
Observable pass signal: parsing semantics are tested.

### Method assertion

Scenario: two source formats normalize identically.
Required behavior: test both labels through presentation.
Observable pass signal: swapping sources changes only the label.

### Outcome assertion

Scenario: built CLI output assertion passes.
Required artifact or evidence: tested status.
Observable pass signal: exact output and SHA are recorded.

### Transfer holdout

Different repository or stack: Java application loading YAML or environment variables.
Changed incidental details: no Node package files.
Expected transferable behavior: retain source identity through normalization.
Observable pass signal: diagnostics name YAML versus environment correctly.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add reference rule. Provenance-as-data is the smallest general rule supported.

## Missing evidence

- Audit of all configuration diagnostics.
