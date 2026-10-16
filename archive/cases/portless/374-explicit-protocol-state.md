# Case: PR #374: explicit authenticated protocol state beats timing and string proxies

Status: promoted
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-29
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/374; commit `d3615ddc9cdff14a69428f8eacb815f16cd0764c`; merge commit `1ad573bb95810daf6cd50c1718707015450f3f09`; `foundry/runs/review-gate/2026-08-29-portless-374-ea90fc6.md`; `foundry/runs/review-gate/evidence/2026-08-29-portless-374-ea90fc6-independent-challenge.md`

## Observed condition or claim

The hosts-sync path originally inferred behavior from weak proxies:

- synchronous CLI tests paid the compatibility ceiling because an in-process mock producer could not respond while `spawnSync` blocked its event loop
- a `.local` suffix was treated as proof of active LAN mDNS, suppressing custom `.local` warnings
- the internal sync route accepted authorities beginning with `127.`, intercepting a legitimate app hostname such as `127.evil.test`
- hosts-file exactness inspected only one hostname per line, missing stale aliases on valid multi-name lines
- an unauthenticated browser-shaped loopback POST could reach the internal callback

## Red signal

Elapsed time, hostname suffixes, string prefixes, first-token parsing, and loopback origin were being used as substitutes for producer capability, active mode, canonical authority, complete hosts mappings, and authenticated protocol participation.

## Method used

The solution gate reproduced the defects and rejected shortening production compatibility timing. Moving the mock producer across a process boundary completed the request promptly, showing that the delay belonged to the test harness rather than the protocol.

The implementation made producer outcomes explicit:

- `acted`: a current daemon performed the sync
- `disabled`: a current daemon will not perform it
- `absent`: no producer exists
- `mute`: preserve the bounded watcher opportunity for an older daemon

Only an older mute daemon retains the bounded compatibility wait. The same change derives LAN state from the persisted marker, requires exact canonical authority, and parses every hostname alias.

The security successor added a fresh challenge-bound HMAC before the client discloses the bearer token. The daemon requires that bearer and rejects browser provenance before invoking the callback. Token publication and cleanup remain daemon-owned. The regression tests use only stub callbacks, temporary state, and ephemeral loopback servers.

## Outcome

The simplified final tree `ea90fc6a1b3f6e47475e07beea5e9c49cfd4f592` was committed as `d3615ddc9cdff14a69428f8eacb815f16cd0764c`, independently challenged, approved, and merged as `1ad573bb95810daf6cd50c1718707015450f3f09`.

The Review Gate reported no blocking findings. CI, Windows CI, security, Socket, and Vercel checks passed. The neutral local suite passed 933 tests with 1 skipped across 22 test files.

## Evidence

- Source: PR #374, final contributor commit `d3615ddc9cdff14a69428f8eacb815f16cd0764c`, reviewed tree `ea90fc6a1b3f6e47475e07beea5e9c49cfd4f592`, and merge commit `1ad573bb95810daf6cd50c1718707015450f3f09`.
- Runtime: mixed-version, malformed-proof, duplicate-proof, delayed-response, publication-failure, cleanup, HTTP, HTTPS, peer, authority, and browser-provenance paths were exercised against ephemeral loopback servers.
- Tests: 933 passed and 1 skipped. Force-red mutations rejected callback authorization bypass, destructive token replacement, HMAC proof-validation removal, and browser-provenance rejection removal.
- Review: the Review Gate passed; an isolated Claude Sonnet 4.5 review of the frozen contract and exported diff passed after its concerns were converted into executable probes; the PR received approval.
- Artifact: the before/after record shows the same browser-shaped request changing from one stub callback invocation to a fail-closed 401 with zero invocations. No privileged system file was accessed.

## Transferable lesson

When behavior depends on protocol or parser state, represent and authenticate that state directly. Timing, suffixes, prefixes, first-token shortcuts, and loopback location are observations, not proof of producer capability, active mode, canonical authority, complete mapping, or trusted participation.

## Exceptions

- An older mute daemon intentionally retains a bounded wait because it cannot acknowledge the new trigger.
- Processes running as the same operating-system user remain inside the explicit trust boundary.
- The before/after proof covers rejection before a stub callback on loopback HTTP. It does not claim isolation from same-user processes.

## Candidate changes

- Reference rule: enumerate protocol states explicitly, authenticate privileged transitions before disclosing capabilities, and let each verified state select its wait, warning, fallback, and callback behavior.

## Confidentiality review

Public repository, public PR metadata, public commit identifiers, and sanitized local evidence only. Private review wording, local paths, secrets, neighboring-project identity, and employer-internal context are omitted.
