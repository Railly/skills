# Case: PR #374 follow-up: explicit protocol state beats timing and string proxies

Status: evaluated
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-08-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/374; `foundry/runs/solution-gate/2026-08-11-portless-366-374-60394ae-10dc32d.md`; `foundry/runs/review-gate/2026-08-11-portless-374-ad974fc.md`

> The validated implementation exists as an uncommitted working-tree diff on top of local commit `ad974fc694b2ee55a9fdb40a60b4d48a1ffbb1f6`. PR #374 still points to `10dc32d5777f45e5d97c15a2be718f866d2074cf`, where the required Linux and Windows checks are failing.

## Observed condition or claim

Four failures remained in the hosts-sync warning path:

- synchronous CLI tests paid the compatibility ceiling because an in-process mock producer could not respond while `spawnSync` blocked its event loop
- a `.local` suffix was treated as proof of active LAN mDNS, suppressing custom `.local` warnings
- the internal sync route accepted authorities beginning with `127.`, intercepting a legitimate app hostname such as `127.evil.test`
- hosts-file exactness inspected only one hostname per line, missing stale aliases on valid multi-name lines

## Red signal

Each failure inferred semantic state from a weaker proxy:

- elapsed time stood in for producer capability
- a hostname suffix stood in for active resolution mode
- a string prefix stood in for canonical request authority
- the first hostname token stood in for the complete hosts mapping

Those proxies collapse states that require different behavior.

## Method used

The solution gate reproduced all four defects. Its decisive probe showed that adding an acknowledgement handler to the existing in-process test did not help: the parent event loop was blocked. Moving the producer across a process boundary completed the request in 58 ms, refuting the proposal to shorten production compatibility timing for a test-harness problem.

The selected shape made the protocol states explicit:

- `acted`: a current daemon performed the sync
- `disabled`: a current daemon will not perform it
- `absent`: no producer exists
- `mute`: preserve the bounded watcher opportunity for an older daemon

Only `mute` pays the compatibility window. The same change:

- derives LAN mode from the persisted LAN marker rather than the `.local` suffix
- separates peer-address loopback from exact canonical request authority
- parses every hostname alias before an inline hosts-file comment

The review gate traced LAN state through single-app, alias, startup, Turbo, and direct paths, then mutated six mechanisms independently.

## Outcome

The local implementation distinguishes producer states and applies exact domain predicates. The review gate reported:

- build passed
- 246 module tests passed
- the custom `.local` CLI integration passed in about 0.5 seconds
- lint, typecheck, and diff checks passed
- six independent test-strength mutations failed for the intended reason and passed after restoration

Delivery remains local. The public PR still carries its earlier failing CI result and does not contain the validated follow-up.

## Evidence

- Source: PR #374 at public head `10dc32d`; local base commit `ad974fc`; solution-gate decision record; review-gate report and structured run record.
- Runtime: separate-process timing probe, custom `.local` CLI integration, internal-route probes, and hosts-file mapping probes are recorded in the gate artifacts.
- Tests: 246 module tests plus six mechanism-specific mutations in the review-gate record.
- Review: solution gate rejected shortening production timing; review gate completed with no remaining blocking findings.
- Artifact: one local commit plus an uncommitted working-tree implementation; public PR remains unchanged.

## Transferable lesson

When behavior depends on protocol or parser state, represent that state directly. Timing, suffixes, prefixes, and first-token shortcuts are useful observations, but they are not substitutes for producer capability, active mode, canonical authority, or the complete mapping.

## Exceptions

- An older mute daemon intentionally retains a bounded wait because it cannot acknowledge the new trigger.
- The public PR's failing Linux and Windows checks predate the local follow-up.
- The exact validated diff has no commit SHA and cannot yet be exercised by PR CI.

## Candidate changes

- Reference rule: enumerate protocol states explicitly and let each state select its wait, warning, and fallback behavior; never infer the state from a timeout or surface string when the producer or parser can state it directly.

## Confidentiality review

Public repository and public PR metadata only. Private review wording, identities, local paths, and employer-internal context are omitted.
