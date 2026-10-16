# Case: Extend framework allowlists for shared hosts

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/310 and https://github.com/vercel-labs/portless/pull/350
Issue or PR: https://github.com/vercel-labs/portless/issues/310 and https://github.com/vercel-labs/portless/pull/350
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said Vite's host allowlist did not include the Tailscale `.ts.net` hostname when sharing was enabled.

## Red signal

- Setup: PR #350 test retained while `cli.ts` was restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/cli.test.ts -t 'tailscale wildcard host' --maxWorkers=1`
- Expected: generated Vite allowed hosts include local TLDs and the Tailscale hostname.
- Actual: 1 focused failure after revert.
- Why this signal was trustworthy: the test drove the built CLI and asserted the child environment.
- Evidence handles: `packages/portless/src/cli.test.ts:1235`; `/tmp/310-red.log`.

## Method used

1. Action: selected issue after backlog and PR cross-reference. Reason: deterministic CLI seam. Evidence obtained: PR #350. Result: accepted for local verification.
2. Action: cherry-picked the existing patch. Reason: preserve author credit and inspect current-base behavior. Evidence obtained: commit `3555a71`. Result: branch created.
3. Action: built and ran the focused test. Reason: isolate issue behavior after unrelated full-suite failures. Evidence obtained: 1 pass. Result: green.
4. Action: reverted `cli.ts` only and reran. Reason: falsify coverage. Evidence obtained: 1 failure. Result: red.

## Outcome

Tested locally. No live Vite server or Tailscale request was verified.

## Evidence

### Source

- `packages/portless/src/cli.ts:482`: constructs allowed hosts.
- `packages/portless/src/cli.ts:490`: adds `.ts.net` and resolved host values.

### Runtime

- `pnpm --filter portless build`: passed.

### Tests

- `packages/portless/src/cli.test.ts:1235`: CLI regression.

### History and review

- `3555a71aa00584dec7fdc553b8b3c1a0425220a2`: local branch head.
- https://github.com/vercel-labs/portless/pull/350: related patch.

### Inferences

- Vite should accept the shared hostname because its environment receives it.

### Unknowns

- Vite version compatibility and live Tailscale traffic.

## Transferable lesson

> When a wrapper introduces an alternate public hostname, propagate that hostname into downstream origin or host validation, because routing alone does not bypass application-level allowlists.

- Why it transfers: proxies and frameworks commonly validate hosts independently.
- Where it does not apply: downstream servers that accept every host.
- Known exceptions: wildcard allowances may be intentionally forbidden.

## Candidate changes

### Skill method

- Trace alternate-host support through both proxy routing and downstream validation.

### Reference rule

- None

### Exemplar

- None

### Deterministic check

- Assert the exact downstream allowlist emitted by the built CLI.

### Behavior eval

- Alternate hostname propagation.

### Coverage gap

- Live framework integration.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “The tunnel reaches the proxy but the dev server rejects the hostname.”
Expected invocation: downstream validation tracing.
Observable pass signal: agent checks generated allowlists, not only routes.

### Negative or near-miss trigger

Prompt: “The hostname does not resolve in DNS.”
Expected non-invocation: do not start with framework allowlists.
Observable pass signal: agent diagnoses DNS first.

### Method assertion

Scenario: proxy and framework have separate host policies.
Required behavior: produce one assertion for each boundary.
Observable pass signal: both route and allowlist are inspected.

### Outcome assertion

Scenario: only emitted environment is tested.
Required artifact or evidence: status remains `tested`, not artifact verified.
Observable pass signal: live framework claim is withheld.

### Transfer holdout

Different repository or stack: Django behind a sharing proxy.
Changed incidental details: `ALLOWED_HOSTS` instead of Vite.
Expected transferable behavior: propagate the public hostname downstream.
Observable pass signal: generated Django config contains the host.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add eval. Alternate-host propagation is general and has observable boundaries.

## Missing evidence

- Live Vite and Tailscale validation.
