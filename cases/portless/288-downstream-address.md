# Case: Probe the exact address used downstream

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/288 and https://github.com/vercel-labs/portless/pull/302
Issue or PR: https://github.com/vercel-labs/portless/issues/288 and https://github.com/vercel-labs/portless/pull/302
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said Portless could assign an app port already occupied on `127.0.0.1` because the free-port probe did not specify a host.

## Red signal

- Setup: branch test retained, `cli-utils.ts` restored from `main`, a server bound specifically to loopback.
- Command or action: `pnpm --filter portless exec vitest run src/cli-utils.test.ts -t 'occupied on 127.0.0.1' --maxWorkers=1`
- Expected: the occupied candidate is rejected.
- Actual: 1 focused failure after revert.
- Why this signal was trustworthy: it used the same address family and host consumed by the proxy upstream.
- Evidence handles: `packages/portless/src/cli-utils.test.ts:75`; `/tmp/288-red.log`.

## Method used

1. Action: cross-referenced issue #288 with PR #302. Reason: precise code seam. Evidence obtained: linked patch. Result: selected.
2. Action: cherry-picked and resolved a documentation conflict while preserving newer multi-TLD wording. Reason: apply independently to current base. Evidence obtained: commit `cbec06e`. Result: clean branch.
3. Action: ran 113 `cli-utils` tests. Reason: verify surrounding port allocation behavior. Evidence obtained: all passed. Result: green.
4. Action: reverted implementation and reran focused test. Reason: prove exact-address sensitivity. Evidence obtained: 1 failure. Result: red.

## Outcome

Tested. No full proxy process was used, but the socket-level condition was reproduced deterministically.

## Evidence

### Source

- `packages/portless/src/cli-utils.ts:667`: probe binds `127.0.0.1`.

### Runtime

- Socket fixture binds the candidate port on loopback.

### Tests

- `packages/portless/src/cli-utils.test.ts:75`: exact regression.

### History and review

- `cbec06e5f719e058229c39c67bc86e0078b441f5`: local head.
- https://github.com/vercel-labs/portless/pull/302: related implementation.

### Inferences

- The allocator and proxy should now agree in production because they share the address.

### Unknowns

- Behavior under dual-stack or unusual socket options.

## Transferable lesson

> When checking availability for a later bind or connection, probe the exact host and address family used by the consumer, because hostless probes can answer a different question.

- Why it transfers: socket availability is address-specific.
- Where it does not apply: services intentionally binding all interfaces.
- Known exceptions: dual-stack wildcard semantics vary by OS.

## Candidate changes

### Skill method

- Match probe configuration to the real consumer path.

### Reference rule

- None

### Exemplar

- Minimal socket mismatch case.

### Deterministic check

- Bind only the target loopback address and assert allocator rejection.

### Behavior eval

- None

### Coverage gap

- IPv6 and dual-stack matrices.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “Free-port check passes but the service cannot bind the selected port.”
Expected invocation: exact-address probe comparison.
Observable pass signal: agent compares host, family, and socket options.

### Negative or near-miss trigger

Prompt: “The selected port is blocked by a firewall.”
Expected non-invocation: availability probe is not treated as firewall proof.
Observable pass signal: agent distinguishes bind availability from reachability.

### Method assertion

Scenario: allocator and consumer use different bind addresses.
Required behavior: reproduce with a socket on only the consumer address.
Observable pass signal: old probe selects occupied port and fixed probe rejects it.

### Outcome assertion

Scenario: socket test only.
Required artifact or evidence: tested status with integration unknown.
Observable pass signal: no shipped claim.

### Transfer holdout

Different repository or stack: Go test server allocator.
Changed incidental details: IPv6 loopback.
Expected transferable behavior: probe `::1` when consumer uses `::1`.
Observable pass signal: occupied IPv6 port is rejected.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add reference rule. Exact-address probing is small, general, and directly proven.

## Missing evidence

- IPv6 and full proxy integration.
