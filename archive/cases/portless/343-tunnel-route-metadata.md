# Case: Route public tunnel hosts through stored metadata

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/343 and https://github.com/vercel-labs/portless/pull/349
Issue or PR: https://github.com/vercel-labs/portless/issues/343 and https://github.com/vercel-labs/portless/pull/349
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said a Tailscale Funnel URL in a git worktree returned Portless's own 404 because the public hostname was not registered in the proxy route table.

## Red signal

- Setup: PR #349 tests on `railly/issue-343-tailscale-route`, with `proxy.ts` and `types.ts` restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/proxy.test.ts -t 'tailscale public URL|tailscale hostnames via URL' --maxWorkers=1`
- Expected: requests addressed to the stored public hostname reach the route.
- Actual: 2 focused failures after revert.
- Why this signal was trustworthy: it drove the proxy routing seam with route metadata and an incoming host, without requiring live Tailscale.
- Evidence handles: `packages/portless/src/proxy.test.ts:246`; `/tmp/343-red.log`.

## Method used

1. Action: cross-referenced issue #343 and two open PRs. Reason: compare existing solutions. Evidence obtained: PR #349 and #352 URLs. Result: used #349 as local base.
2. Action: cherry-picked #349 and ran the build. Reason: validate against current `main`. Evidence obtained: TypeScript error for missing `tailscaleUrl` on the narrow route type. Result: proposed PR did not compile.
3. Action: changed `findRoute` to accept `RouteInfo`. Reason: align the matcher with metadata it reads. Evidence obtained: commit `a23f8c7`. Result: declaration build passed.
4. Action: ran focused green and implementation-revert red tests. Reason: verify behavior and coverage. Evidence obtained: 2 green, then 2 red. Result: tested.

## Outcome

Tested. The original linked patch was not artifact-valid until the local type correction. No live Funnel request was made.

## Evidence

### Source

- `packages/portless/src/proxy.ts:35`: public URL hostname normalization.
- `packages/portless/src/proxy.ts:109`: route metadata comparison.

### Runtime

- Initial `pnpm --filter portless build`: failed with TS2339.
- Build after `a23f8c7`: passed.

### Tests

- `packages/portless/src/proxy.test.ts:246`: public hostname routing regression.

### History and review

- `a23f8c748b6c5a300aab1514715f24ad426d2645`: corrected local head.
- https://github.com/vercel-labs/portless/pull/349: source implementation.
- https://github.com/vercel-labs/portless/pull/352: alternative linked attempt reviewed at cross-reference level only.

### Inferences

- Live Funnel traffic should follow the tested host matcher, but the external service path remains unverified.

### Unknowns

- Tailscale configuration, DNS, and worktree behavior end to end.

## Transferable lesson

> When routing depends on optional metadata, type the internal seam with the full domain object and compile the public artifact before trusting focused tests.

- Why it transfers: passing tests can coexist with broken declaration or package builds.
- Where it does not apply: untyped projects without build artifacts.
- Known exceptions: a deliberately narrow adapter can map metadata before the seam.

## Candidate changes

### Skill method

- Build before behavioral verification when cherry-picking an existing patch.

### Reference rule

- A function reading optional domain metadata must accept a type that declares it.

### Exemplar

- Existing PR passes conceptual review but fails current-base compilation.

### Deterministic check

- `pnpm --filter portless build` plus focused proxy test and production-only revert.

### Behavior eval

- None

### Coverage gap

- Live external tunnel.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “Apply this open PR to current main and verify it.”
Expected invocation: current-base build before acceptance.
Observable pass signal: compile failure is reported and fixed or blocks completion.

### Negative or near-miss trigger

Prompt: “Review prose in a PR description only.”
Expected non-invocation: no claim that code compiles.
Observable pass signal: response limits itself to prose review.

### Method assertion

Scenario: patch reads a newly optional field.
Required behavior: inspect the parameter type and build declarations.
Observable pass signal: narrow-type mismatch is detected.

### Outcome assertion

Scenario: focused tests pass but package build fails.
Required artifact or evidence: outcome cannot exceed `patched` until build passes.
Observable pass signal: status is downgraded appropriately.

### Transfer holdout

Different repository or stack: Rust router using a reduced struct.
Changed incidental details: no TypeScript or Tailscale.
Expected transferable behavior: compile the package after adding metadata-dependent matching.
Observable pass signal: struct mismatch is caught before claiming tested.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add deterministic check. Build-current-base-before-test is the smallest evidence-backed change.

## Missing evidence

- Live Funnel request and review of the full alternative PR #352 diff.
