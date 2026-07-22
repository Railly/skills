# Case: A user-facing warning emitted by the daemon, then silenced by a one-shot latch the empty sync consumed

Status: observed
Validation: unvalidated
Human review: maintainer-reviewed (2026-07-22, two findings, not yet fixed)
Maintainer acceptance: changes-requested
Delivery: PR open (head `26953e8`)
Upstream status checked: 2026-07-22
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/367 (issue #364); head `26953e8` on `refs/heads/railly/issue-364-hosts-sync-warning`

> Agent-authored record. The two findings are the maintainer's (ctate, 2026-07-22); the blind-gate reproduction is this session's. Statuses pending human review.

## Observed condition or claim

PR #367 (issue #364) adds a warning when automatic `/etc/hosts` sync cannot write the file. The maintainer raised two findings, both about whether the warning ever reaches the user, neither about whether the write-failure is detected:

1. **Wrong emission channel.** The warning is emitted inside the detached proxy/daemon, whose stderr is redirected to `proxy.log`. The user is attached to the CLI process, a different process, and sees nothing — no warning, no recovery command.
2. **One-shot latch consumed by warm-up.** Starting with no routes still runs an initial hosts sync. That empty sync's failure flips the `hostsSyncWarned` latch. When the first real route is later registered and its sync fails, the latch is already spent, so no warning fires.

## Red signal

- Setup: unwritable `/etc/hosts`; start portless with no routes, then register a route.
- Check: does the warning reach the CLI stdio the user watches, and does the real (non-empty) sync failure still warn?
- Expected: the user running the CLI sees the warning and the recovery command on the first real failure.
- Actual: (1) the warning is written by the daemon to `proxy.log` only; (2) the initial empty sync consumes the latch, so the first real failure is silent.
- Why trustworthy: both are structural — the emitting process and the latch lifetime are readable from the code, independent of reviewer taste.

## Method used

1. Blind review-gate run (codex `gpt-5.6-sol`, hint-free, read-only) over the diff plus the harvested conventions and lens catalog. Independently reported both findings at `cli.ts:584` (daemon emission, proxy.log redirect at `cli.ts:3358`) and `cli.ts:666` (empty sync consumes `hostsSyncWarned`), ranked both High.
2. Cross-checked against the maintainer's two comments (2026-07-22): exact match on both.

## Outcome

Findings confirmed, not yet fixed on the branch (no commits since 07-21). Recorded as gate-misses closed by a new lens and subsystem invariant; the blind run validates that the encoded gate relocates them.

## Evidence

- Source: `packages/portless/src/cli.ts:584` (warning emission inside the detached proxy), `cli.ts:3358` (proxy stderr → `proxy.log`), `cli.ts:666` (initial empty sync path and `hostsSyncWarned`), head `26953e8`.
- Runtime: not run in-session (findings established by source read + blind-gate reproduction, not by driving an unwritable-hosts scenario).
- Tests: none added for the emission channel or latch lifetime; a regression test forcing warm-up-then-real-failure and asserting CLI-visible output is the missing teeth.
- Review: maintainer (ctate) comments 2026-07-22; blind review-gate run, reviewer model distinct from the PR author's.
- Artifact: not applicable.

## Transferable lesson

> A user-facing warning must be emitted on the process the user is attached to, not a background daemon whose output only reaches a log the user never opens; and a "warn once" latch must not be consumable by an internal warm-up call (an initial empty sync) before the user-triggered path runs. Force the warm-up-then-real sequence and assert the message reaches the attached stdio.

- Why it transfers: any CLI-plus-daemon architecture can emit correct diagnostics into the wrong channel, and any once-guarded action can be pre-consumed by an internal first call.
- Where it does not apply: single-process CLIs (no channel split) and warnings with no once-latch.

## Exceptions

- The write-failure detection itself is correct; only its delivery to the user is broken. A reviewer checking "is the failure detected" passes; the finding lives one layer out, at "does the user see it."

## Candidate changes

- Skill method: none.
- Reference rule: selected. **Emission channel and one-shot latch reachability** lens added to the catalog (trigger: user-facing warning/error, or a once-latch, in a CLI-plus-daemon system). Plus the daemon-emission subsystem invariant in `conventions.md`.
- Exemplar: none.
- Deterministic check: none (which process emits and when the latch flips are judgment, traced per diff).
- Eval: none.
- Coverage gap: none.
- No change: none.

## Confidentiality review

Public repository, public PR, public commit SHAs. Maintainer named by public GitHub handle on a public review. No employer-internal context, private review text, or local machine paths.
