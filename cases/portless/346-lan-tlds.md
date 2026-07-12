# Case: Preserve LAN TLDs without breaking mDNS

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/346 and https://github.com/vercel-labs/portless/pull/348
Issue or PR: https://github.com/vercel-labs/portless/issues/346 and https://github.com/vercel-labs/portless/pull/348
Date: 2026-07-11

> Unvalidated agent backfill. Claims and promotion recommendations require human review.

## Observed failure

The reporter said enabling `--lan` replaced the configured TLD list with only `.local`, so one service could not retain a primary `.com` URL while exposing `.local` for LAN discovery.

## Red signal

- Setup: local branch `railly/issue-346-lan-preserve-tlds`, with PR #348 tests retained and implementation files restored from `main`.
- Command or action: `pnpm --filter portless exec vitest run src/cli-utils.test.ts src/mdns.test.ts src/service.test.ts src/cli.test.ts -t 'LAN|TLD|mDNS|custom --tld' --maxWorkers=2`
- Expected: configured TLDs remain ordered and `.local` is added only for discovery.
- Actual: 5 focused failures after the implementation revert.
- Why this signal was trustworthy: tests crossed CLI configuration, service persistence, and mDNS hostname behavior. The red run changed implementation only, not assertions.
- Evidence handles: `packages/portless/src/cli-utils.test.ts:925`; `/tmp/346-red.log`; commit `e7c22088ad85db179c730382830ba0837aa06358`.

## Method used

1. Action: surveyed all 50 open issues and found PR #348. Reason: avoid duplicating an existing attempt. Evidence obtained: issue timeline cross-reference. Result: selected as a bounded bug.
2. Action: cherry-picked both PR commits onto an independent branch. Reason: inspect the proposed behavior in the current base. Evidence obtained: commits `e7c2208` and `1cb781e`. Result: patch applied cleanly.
3. Action: built Portless and ran focused tests. Reason: verify current behavior. Evidence obtained: 39 passing focused tests. Result: green.
4. Action: restored implementation files from `main` while keeping tests. Reason: prove test teeth. Evidence obtained: 5 failures. Result: deterministic red.

## Outcome

Tested. The local branch is patched and its tests were falsified. It was not pushed, merged, shipped, or verified with real LAN clients.

## Evidence

### Source

- `packages/portless/src/cli-utils.ts:471`: preserves requested TLDs and adds `.local`.
- `packages/portless/src/mdns.ts:144`: limits mDNS FQDN generation to valid local hosts.

### Runtime

- `pnpm --filter portless build`: built the branch successfully.

### Tests

- `packages/portless/src/cli-utils.test.ts:925`: primary regression claim.
- `/tmp/346-red.log`: 5 failures with implementation reverted.

### History and review

- `1cb781e9c05bbe9d08aa40ba0ff36d1b48f1f9cf`: local branch head.
- https://github.com/vercel-labs/portless/pull/348: related public implementation.

### Inferences

- The combined TLD order should preserve OAuth URL selection, but no OAuth flow was run.

### Unknowns

- Real mDNS visibility on phones and tablets.

## Transferable lesson

> When a mode adds a discovery namespace, append it to explicit user configuration instead of replacing configuration, because replacement silently breaks unrelated consumers.

- Why it transfers: additive mode composition applies to configuration systems generally.
- Where it does not apply: mutually exclusive modes with an explicit contract.
- Known exceptions: security policies may require rejecting incompatible combinations.

## Candidate changes

### Skill method

- Add a configuration-composition check before accepting mode-specific rewrites.

### Reference rule

- Preserve explicit ordering when the first value has semantic priority.

### Exemplar

- This case is a compact cross-layer example.

### Deterministic check

- Revert production configuration code while retaining CLI, persistence, and discovery tests.

### Behavior eval

- None

### Coverage gap

- Real LAN and mDNS integration.

### No change

- None

## Proposed evals

### Positive trigger

Prompt: “A mode replaces an explicit list but should add one fallback value.”
Expected invocation: configuration-composition method.
Observable pass signal: agent identifies ordering and tests both primary and appended values.

### Negative or near-miss trigger

Prompt: “Replace an obsolete config field with its documented successor.”
Expected non-invocation: do not insist on additive composition.
Observable pass signal: agent follows the explicit migration contract.

### Method assertion

Scenario: mode flag and explicit list coexist.
Required behavior: test serialization, runtime consumption, and secondary discovery separately.
Observable pass signal: red run fails at least one assertion per affected boundary.

### Outcome assertion

Scenario: local patch only.
Required artifact or evidence: branch SHA plus green and falsified test output.
Observable pass signal: outcome says `tested`, not `shipped`.

### Transfer holdout

Different repository or stack: Python service with primary endpoints plus discovery aliases.
Changed incidental details: no TLDs or mDNS.
Expected transferable behavior: append discovery aliases without replacing explicit endpoints.
Observable pass signal: primary endpoint remains first and both paths pass tests.

## Promotion recommendation

Provisional only. Do not promote before human review.

Add exemplar. The cross-layer falsification is useful, while evidence does not justify a new skill.

## Missing evidence

- Real device discovery and OAuth callback verification.
