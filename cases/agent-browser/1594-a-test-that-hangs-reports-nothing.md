# Case: agent-browser #1594: a regression test for a wedging defect reports nothing unless the deadline lives outside it

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-26
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: PR #1594, branch `feat/stream-input-priority-latest-frame`, head `866f312`; the guard is `test_repeated_config_messages_keep_the_connection_live` in `cli/src/native/stream/mod.rs`

> Contributor-validated only. The behavior below was reproduced by mutating the fix and observing the runner, but no human or maintainer has reviewed either the finding or the change that followed from it.

## Observed condition or claim

A defect in the stream server held a `watch` channel read guard across a `send_replace` on the same channel, from the same task, because the guard was taken directly in the scrutinee of an `if let` and therefore lived for the whole body. The result was a self-deadlock on a synchronous lock inside an async task.

A regression test was written for it: send several `config` messages, then assert a frame still arrives. The test passed with the fix in place, and the suite was green. The claim under test was that the guard would catch the defect if it ever came back.

## Red signal

Reintroducing the defect did not turn the test red. It produced **no verdict at all**. `cargo test` filtered to that single test ran for 27 minutes without printing a result, while no compiler process was active, so the time was spent inside the test rather than building.

The test's own protection was a five second `tokio::time::timeout` around the frame read, and it never fired. `#[tokio::test]` defaults to a single-threaded runtime, so the task that blocks on the lock is also the thread that drives the timer. A test whose only deadline is a timer inside the runtime cannot detect a defect that stops the runtime.

Raising the worker count made this visible in stages rather than fixing it:

- 1 worker (the default): no verdict.
- 2 workers: still no verdict. The reader task blocks one worker and the writer task blocks the other, so nothing is left to drive the timer.
- 4 workers: the test **does** panic, in 5.21 seconds, with `timed out waiting for frame`. But `cargo test` still never printed a result, because the panic unwinds into a runtime drop that waits on the wedged task, so the process cannot exit and the harness never reports the failure it already has.

## Method used

Separate building from running, and put the deadline outside the process under test:

```
cargo test --manifest-path cli/Cargo.toml --no-run          # 8 seconds
perl -e 'alarm 60; exec @ARGV' <test-binary> <test-name> --test-threads=1
```

With an external alarm the verdict is visible immediately: the panic message, or a hang classified as its own outcome rather than as silence. The force-red harness for this change was rewritten around that shape after the first version, which drove `cargo test` per mutation, spent 27 minutes producing nothing and then had to be killed.

Two further habits came out of the same failure. Piping the harness through `tail` withheld all per-case output until the end, which removed the only signal that a case was stuck. And a mutation harness must restore the source on kill, not only on clean exit: the interrupted run left a mutation in the working tree, which was caught by reading the diff rather than by trusting the trap.

The change that shipped moves the socket-driven tests to a multi-thread runtime, which is what turns silence into a printed panic. It does not make `cargo test` report that panic, and the case should not be read as claiming otherwise.

## Outcome

Seven mutations were run one at a time against the new regression tests. Six turned red as intended. One survived, and investigating it surfaced a reachable defect where a client could permanently wedge its own stream, which is recorded separately.

The deadlock guard now fails loudly at 5.21 seconds instead of hanging without output, but obtaining that verdict still requires an external deadline on the test binary.

## Evidence

- Source: PR #1594 head `866f312`, open with zero reviews at the 2026-07-26 check. The guard and the multi-thread change are in `cli/src/native/stream/mod.rs`.
- Runtime: `cargo test` on the mutated tree ran 27 minutes with no result and no active compiler process; a separate `--no-run` build of the same tree took 8 seconds, locating the time inside the test. At 4 workers the same mutation panicked in 5.21 seconds when the binary was run directly under an external alarm.
- Tests: 1048 unit tests pass on the unmutated tree. Each new regression test was forced red against the specific defect it guards; the pass and fail transitions are attributable per mutation because mutations were applied one at a time and the source restored between them.
- Review: pre-human. The finding came from the author's own force-red pass, not from a reviewer.
- Artifact: unknown. The project's CI runs `cargo test`, so a future recurrence of a wedging defect would present there as a job that never finishes rather than as a failure. That behavior was not reproduced on CI.

## Transferable lesson

A regression test that guards a blocking, deadlocking, or starving defect has to be able to report while that defect is active. Two independent requirements, and satisfying only the first is a common half-fix:

1. The test's runtime must survive the defect. On a single-threaded async runtime the blocked task also stops the clock, so any in-runtime timeout is dead exactly when it is needed. Give the runtime more threads than the defect can block.
2. The deadline must live outside the process. Even once the test panics, a runtime holding a wedged task can prevent the process from exiting, so the runner never prints the verdict it already computed. An external alarm on the test binary converts that into an immediate, attributable result.

The general form: when forcing a regression test red, treat "no output" as a distinct outcome from "passed" and from "failed". A harness that only distinguishes red from green will read a wedged run as green, or as nothing, and the test will be trusted on the strength of a run that never happened.

## Exceptions

The thread-count reasoning is specific to runtimes that drive timers on worker threads. The empirical part is what generalizes: at 1 and 2 workers there was no verdict, at 4 there was, so the number that suffices depends on how many tasks the defect can block and is not a constant to memorize.

An external alarm reports the outcome but does not clean up. The wedged process still has to be killed, and any shared resource it held stays held, which for tests that bind sockets or spawn browsers means the next run can inherit a dirty environment.

Whether the project's CI exhibits the same silence is unknown and untested here.

## Candidate changes

- Reference rule: in the force-red step of the review gate, require that a regression test for a blocking or deadlocking defect is run from the test binary under an external deadline, and that the harness classifies three outcomes rather than two, with no-output reported as its own result.

## Confidentiality review

Public repository, public pull request, author's own contribution and own tooling output. Excluded: private discussion, quoted review text, participant names, schedule commitments, filesystem paths, and any neighboring project. All commands cited are reproducible against the public branch.
