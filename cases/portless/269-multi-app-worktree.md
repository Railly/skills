# Case: Apply worktree identity at the multi-app caller

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/269 and https://github.com/vercel-labs/portless/pull/355
Issue or PR: https://github.com/vercel-labs/portless/issues/269 and https://github.com/vercel-labs/portless/pull/355
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said the zero-argument multi-app path skipped the worktree prefix, causing hostname collisions across worktrees.

## Red signal

- Setup: branch tests retained with `auto.ts` and `cli.ts` restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/auto.test.ts src/cli.test.ts -t 'worktree|prefixes all configured app names' --maxWorkers=1`
- Expected: every configured app receives the detected worktree prefix.
- Actual: 3 focused failures after revert; 5 other selected worktree tests still passed.
- Why this signal was trustworthy: it included helper tests and an end-to-end built CLI test for the multi-app caller.
- Evidence handles: `packages/portless/src/auto.test.ts:472`; `/tmp/269-red.log`.

## Method used

1. Action: found issue #269 and existing PR #355. Reason: avoid duplicating prior local work. Evidence obtained: PR authored by Railly Hugo. Result: selected.
2. Action: cherry-picked both commits onto current `main`. Reason: keep fix and caller-level test together. Evidence obtained: commits `7560d9e` and `f661873`. Result: clean branch.
3. Action: ran 8 focused tests. Reason: verify helper and multi-app wiring. Evidence obtained: all passed. Result: green.
4. Action: reverted both production files. Reason: prove the tests cover the changed caller. Evidence obtained: 3 failures. Result: red.

## Outcome

Tested through the built CLI. No simultaneous real worktrees and live apps were launched.

## Evidence

### Source

- `packages/portless/src/auto.ts:168`: reusable prefix application.
- `packages/portless/src/cli.ts:3673`: multi-app caller applies the prefix.

### Runtime

- Built CLI fixture exercised configured multi-app startup.

### Tests

- `packages/portless/src/auto.test.ts:472`: helper regression.
- Branch head includes caller-level CLI coverage in `packages/portless/src/cli.test.ts`.

### History and review

- `f661873f5fc18630b1e3fbe97d4fe73a83f3501f`: local head.
- https://github.com/vercel-labs/portless/pull/355: existing public PR.

### Inferences

- Distinct live worktrees should stop colliding if all paths share this caller.

### Unknowns

- Runtime cleanup and concurrent route registration across actual worktrees.

## Transferable lesson

> When namespace isolation is applied in one execution mode, test every sibling caller that constructs identities, because a correct helper does not prove all callers use it.

- Why it transfers: duplicated orchestration paths commonly bypass shared helpers.
- Where it does not apply: one canonical identity-construction path.
- Known exceptions: some callers may intentionally request global identity.

## Candidate changes

### Skill method

- Enumerate all identity-producing callers before declaring namespace fixes complete.

### Reference rule

- None

### Exemplar

- Helper plus caller-level falsification.

### Deterministic check

- Revert caller wiring and require end-to-end test failure.

### Behavior eval

- Multi-mode namespace consistency.

### Coverage gap

- Concurrent real worktrees.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “Single-app mode is isolated, but multi-app mode collides.”
Expected invocation: caller inventory and consistency check.
Observable pass signal: every identity-producing path is listed and tested.

### Negative or near-miss trigger

Prompt: “Two callers intentionally share one global route.”
Expected non-invocation: do not force isolation without contract evidence.
Observable pass signal: global identity remains unchanged.

### Method assertion

Scenario: helper exists but one caller bypasses it.
Required behavior: add a public-seam test for that caller.
Observable pass signal: helper-only revert distinction is visible.

### Outcome assertion

Scenario: CLI fixture passes, no concurrent runtime.
Required artifact or evidence: tested with runtime concurrency unknown.
Observable pass signal: status is not artifact verified.

### Transfer holdout

Different repository or stack: Kubernetes tool generating names for single and batch deploys.
Changed incidental details: namespace instead of git worktree.
Expected transferable behavior: both callers apply namespace identity.
Observable pass signal: batch resources no longer collide.

## Promotion recommendation

Provisional only. Do not promote before human review.

Modify existing skill. Add explicit caller inventory to `prove-the-test`'s helper-versus-caller guidance.

## Missing evidence

- Real concurrent worktree execution.
