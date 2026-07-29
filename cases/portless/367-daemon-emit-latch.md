# Case: A user-facing warning emitted by the daemon, then silenced by a one-shot latch the empty sync consumed

Status: observed
Validation: contributor-validated
Human review: maintainer-reviewed (rounds 3, 4 and 6; rounds 3 and 4 fixed and pushed, round 6 open)
Maintainer acceptance: pending
Delivery: PR pushed (head `c0862b9`)
Upstream status checked: 2026-07-28
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

Both findings fixed and pushed 2026-07-22 across two commits (`6e93549` then refinement `67572f9`, branch on main `e0c2af5`). Recorded as gate-misses closed by a new lens and subsystem invariant; the blind run validated that the encoded gate relocates them.

**Fix.** (1) Latch: `syncHostsWithWarning` returns early (`if (hostnames.length === 0) return alreadyWarned`) so an empty/warm-up sync failure neither warns nor spends the warn-once latch; a red test (`does not consume the warn-once latch when an empty-route sync fails`) confirmed it. (2) Emission channel: the daemon writes a one-shot marker file (`writeHostsSyncWarningMarker`) that a CLI-attached process consumes and prints — at `doProxyStart` (startup failures) and after every `addRoutes` in a user-attached flow. The refinement commit wired all four such call sites (`runApp`, `handleAlias`, `spawnProxiedApp`, `runWithTurbo`, each verified not to run inside the detached daemon) and replaced the original fixed `setTimeout(DEBOUNCE_MS+100)` single check with `pollForHostsSyncWarningMarker(dir, 50, 1500)` — bounded polling that returns as soon as the marker appears and never blocks the happy path (awaited only in the one-shot `alias` command). Tests red-then-green; build/typecheck/lint clean.

**Residual (issue candidate, out of scope).** The marker is a single one-shot file keyed on `stateDir`. In a multi-app run (`spawnProxiedApp`/`runWithTurbo`) two concurrent polls can race to consume the same marker, so a second app's own sync failure could be swallowed by the first app's poll. The one-shot marker design predates this change; the added coverage makes the race more likely. A per-app-attributable warning channel would close it.

## Round 4 (2026-07-24)

Gate re-run on head `67572f9`, with the artifact built and driven against a real unwritable `/etc/hosts` (unprivileged, isolated `PORTLESS_STATE_DIR`). Both original findings verified fixed empirically: the warning reached the CLI on 3/3 proxy restarts with a persisted route, and the empty warm-up sync no longer consumed the latch.

Maintainer (ctate) raised two findings on this round:

1. **The 1.5s marker-poll ceiling sits under the daemon's 3s watcher fallback** (`POLL_INTERVAL_MS`, `cli.ts:141`), so warnings are missed and later surface stale. The gate reported the stale-marker symptom but called its reachability an edge case instead of reading the producer's timing constants; the diff's own comment sized the ceiling against `DEBOUNCE_MS = 100`. Gate miss. Closed by `gate.sh timings`, the wait-ceiling lens clause, and the wait-ceiling subsystem invariant.
2. **A successful `alias` always waits the full timeout** (measured 1.62s with hosts sync disabled). Caught independently by the gate in the same round (1.596s / 1.613s), from the dogfood pass, not from reading the code.

Two further gate findings not raised externally: the warn-once latch is daemon-scoped while delivery is per-CLI-process, so a second attached app is silent under the same failure (driven: `app1` warns, `app2` prints nothing); and `portless hosts --help`'s bolded Auto-sync section stayed stale while every other surface gained the sentence.

Run report: `foundry/runs/review-gate/2026-07-24-portless-67572f9.json`.

## Round 5 (2026-07-25)

Gate re-run on head `6a2fb82`, which addressed both round-4 findings. Both verified fixed by driving the built CLI with an isolated `PORTLESS_STATE_DIR`: the ceiling is now derived as `DEBOUNCE_MS + POLL_INTERVAL_MS + 1000`, and the wait returns on publication rather than after a fixed delay, so the case ctate measured at 1.62s now costs 0.052s.

One new finding, self-caught, and it is a regression the round-4 fix introduced:

1. **With auto-sync on and no daemon running, `alias` waits the full 4.1s ceiling** (measured 4.202s; 4.2s again with a stale PID file, against 0.155s with the daemon alive). The daemon is the only process that publishes an outcome, so where it is absent the wait cannot end early and returns the same null it could have returned immediately. Registering an alias before starting the proxy is an ordinary flow. Sharpening the ceiling in round 4 made this strictly worse: the better-derived the ceiling, the longer the no-producer path hangs. Neither `gate.sh timings` nor the wait-ceilings invariant covers it, because both reason about how long to wait and the defect is whether to wait at all. Closed by the **a wait on a producer first establishes that the producer exists** invariant. Fixed in `c826d10`: 0.053s with no daemon, 0.060s with a stale PID file, 0.166s with the daemon alive and the warning still delivered.

A second finding lives outside this PR's diff and is recorded in the ledger rather than here: a separate branch widens what `syncHostsFile` returning `false` means, which falsifies the `Could not write ...` diagnosis this PR writes onto five surfaces. Disjoint files, clean merge, both suites green, so no automated check can see it.

Run report: `evals/runs/2026-07-25-portless-2470ad3.json` (the sibling branch's gate run, where the collision surfaced).

## Round 6 (2026-07-28)

Maintainer (ctate) raised two findings on head `c0862b9`, both gate misses, and harvesting them surfaced a third.

1. **`alias` pays the full 4.1s ceiling when the running proxy cannot publish an outcome** — an older proxy, or one started with `PORTLESS_SYNC_HOSTS=0`. Reproduced by ctate at 4.17s, which is exactly `DEBOUNCE_MS + POLL_INTERVAL_MS + 1000` (`cli.ts:127,130`). This is the third round on the same wait and the first where the previous round's invariant was *satisfied* and still missed. Round 5 answered "whether to wait at all" with `hasLiveHostsSyncPublisher`, and its invariant enumerates the liveness cells: not running yet, stopped, stale PID file, crashed mid-run. ctate's daemon passes all four — it is alive, its PID is valid, and it is mute. Two independent producers of muteness, and only the first is about waiting: a build that predates the publishing side (the routine state of every user at upgrade time, since the daemon already running when the fix lands is by construction the old one), and a daemon whose sync was disabled at spawn. The second is a different class entirely: `reportHostsSyncAfterRouteChange` calls `shouldAutoSyncHosts(process.env.PORTLESS_SYNC_HOSTS)` inside the **CLI** process to decide what the **daemon** will do, reading an environment the daemon never saw.
2. **`portless clean` leaves the new sync-status artifact behind, registered hostnames included.** `PORTLESS_STATE_FILES` (`clean-utils.ts:6`) is a hardcoded allowlist of 17 names with no coupling to the code that writes them; `proxy.hosts-sync-status` was never added. Nothing could have failed — the writer works, the remover is unaware, both suites stay green. `surfaces` and `siblings` were both built as documentation rules and could not see a code surface. The file stores the hostnames the user registered, so this is `clean` failing to remove user data after promising to.

Harvest-time finding, not raised externally: **the suite encodes finding 1 as expected behavior.** `cli-utils.test.ts` `"gives up at the ceiling when the daemon never publishes"` asserts precisely the hang ctate measured, green, with `ceilingMs: 100` injected. At 100ms "waits to the ceiling, returns null" reads as correct bounded behavior; at the shipped 4100ms it is a hang on a routine command. Round 4 already added *measure the happy path too*; the missing twin is measuring the no-answer path at the production constant.

Second unreported artifact, found while building the gate: `writeHostsSyncStatus` writes `${target}.${process.pid}.tmp` and unlinks it only on the failure path, so a crash between write and rename orphans a file whose name no static allowlist can ever express. Needs prefix removal, not an entry.

Closed by: the **liveness is not capability** clause on the producer-exists invariant; the **a process reads its own environment to describe only its own behavior** invariant; the **Artifact cleanup registration** deterministic gate (`gate.sh artifacts`), force-red at birth on `c0862b9` reporting exactly the two files and green on an unrelated branch in the same repo; a `cli-utils.ts :: clean-utils.ts` surface line; and two clauses on the cancellation-and-timeout lens (capability over liveness, and timing the no-answer path at the production constant).

Fixes not yet written at record time; the gates were harvested first so the agnostic pass could run against the encoded catalog rather than the answer key.

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
- Reference rule: selected. **Emission channel and one-shot latch reachability** lens added to the catalog (trigger: user-facing warning/error, or a once-latch, in a CLI-plus-daemon system). Plus the daemon-emission subsystem invariant in `conventions.md`. Round 6 adds two clauses to **cancellation and timeout hygiene** (a short-circuit guard establishes capability, not liveness; time the no-answer path at the production constant) and two subsystem invariants (liveness-is-not-capability on the producer-exists rule, and configuration is local to the process started with it).
- Exemplar: none.
- Deterministic check: selected at round 6. **Artifact cleanup registration** (`gate.sh artifacts <cleanup-source>`): every persistent filename the diff writes must appear in the source that removes them, and a written path with a runtime-assembled component is reported because no static allowlist can express it. Which process emits, when the latch flips, and whether a peer may be an older build all stay judgment.
- Eval: none.
- Coverage gap: none.
- No change: none.

## Confidentiality review

Public repository, public PR, public commit SHAs. Maintainer named by public GitHub handle on a public review. No employer-internal context, private review text, or local machine paths.
