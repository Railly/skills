# Case: Do not shadow the user's runtime selection

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/241 and https://github.com/vercel-labs/portless/pull/247
Issue or PR: https://github.com/vercel-labs/portless/issues/241 and https://github.com/vercel-labs/portless/pull/247
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said child processes inherited Portless's Node instead of the version selected by asdf, nvm, fnm, or mise because Portless prepended its own executable directory to PATH.

## Red signal

- Setup: a Unix PATH beginning with a user-managed Node directory; regression test added locally; `cli-utils.ts` restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/cli-utils.test.ts -t 'preserves the user' --maxWorkers=1`
- Expected: augmented PATH leaves the user's runtime selection ahead of Portless's runtime.
- Actual: old code produced `/opt/homebrew/Cellar/node/26.4.0/bin:...` and the test failed.
- Why this signal was trustworthy: expected PATH was independent and the failure printed the unwanted runtime directory first.
- Evidence handles: `packages/portless/src/cli-utils.test.ts:43`; `/tmp/241-red.log`.

## Method used

1. Action: found issue #241 and PR #247. Reason: precise PATH mutation. Evidence obtained: linked patch without tests. Result: selected with a coverage concern.
2. Action: cherry-picked and resolved a current-base conflict while preserving the `cwd` parameter. Reason: apply only the platform condition. Evidence obtained: commit `35fe510`. Result: implementation patched.
3. Action: noticed no regression test existed and added one. Reason: PR could otherwise remain green when wrong. Evidence obtained: commit `31e1f81`. Result: focused test passed.
4. Action: restored old implementation. Reason: falsify the new guard. Evidence obtained: exact PATH mismatch and 1 failure. Result: deterministic red.

## Outcome

Tested on macOS through the actual PATH builder. Windows behavior was covered only by the existing surrounding suite.

## Evidence

### Source

- `packages/portless/src/cli-utils.ts:875`: PATH builder.
- `packages/portless/src/cli-utils.ts:881`: Portless Node is appended only on Windows.

### Runtime

- `/tmp/241-red.log`: old implementation placed `/opt/homebrew/Cellar/node/26.4.0/bin` first.

### Tests

- `packages/portless/src/cli-utils.test.ts:43`: new Unix regression.

### History and review

- `31e1f81322e1db7dac57b7bce41235af67419b65`: local head.
- `35fe510dd891c31e4e4c56ff288ddc4b1d17af78`: implementation commit.
- https://github.com/vercel-labs/portless/pull/247: original patch.

### Inferences

- Version-manager shims should now remain authoritative for spawned children.

### Unknowns

- End-to-end child `node --version` under each version manager.

## Transferable lesson

> When augmenting PATH for child tools, add only required tool directories and preserve the caller's runtime precedence, because prepending the wrapper's runtime silently overrides user policy.

- Why it transfers: wrappers across languages often mutate PATH.
- Where it does not apply: hermetic launchers that intentionally pin runtimes.
- Known exceptions: platform command wrappers may require the launcher runtime to remain discoverable later in PATH.

## Candidate changes

### Skill method

- Compare PATH precedence before and after wrapper augmentation.

### Reference rule

- Preserve caller-selected runtime precedence unless pinning is explicit.

### Exemplar

- Existing patch lacked a test; local falsification supplied one.

### Deterministic check

- Assert exact PATH prefix and revert the platform condition.

### Behavior eval

- None

### Coverage gap

- Real version managers and Windows `.cmd` launch.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “A wrapper launches a different runtime version than my shell.”
Expected invocation: PATH precedence inspection.
Observable pass signal: wrapper runtime directory and user shim order are compared.

### Negative or near-miss trigger

Prompt: “The tool explicitly promises a pinned hermetic runtime.”
Expected non-invocation: do not preserve external runtime precedence.
Observable pass signal: pinned runtime remains first by contract.

### Method assertion

Scenario: platform-specific command wrappers need runtime discovery.
Required behavior: append on affected platform, avoid prepending elsewhere.
Observable pass signal: Unix user runtime remains first and platform wrapper tests pass.

### Outcome assertion

Scenario: PATH builder test only.
Required artifact or evidence: status tested, version-manager e2e unknown.
Observable pass signal: no shipped claim.

### Transfer holdout

Different repository or stack: Python CLI wrapper installed with one interpreter.
Changed incidental details: pyenv instead of Node managers.
Expected transferable behavior: child `python` follows the caller unless pinning is explicit.
Observable pass signal: PATH begins with pyenv shim.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add reference rule. Runtime precedence preservation is compact and broadly applicable.

## Missing evidence

- End-to-end launches under nvm, fnm, asdf, mise, and Windows.
