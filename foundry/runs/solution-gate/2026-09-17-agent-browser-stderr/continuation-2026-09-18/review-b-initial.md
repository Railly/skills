# Review B initial: narrow post-reveal fit

## Status

**Final verdict withheld pending the parent’s production-path regression and repeated lifecycle evidence.** This is a post-reveal update, not a new blind shape. Under the continuation contract, the relevant candidate is the narrow post-primary-readiness drain, while pre-readiness and fallback defects remain separate and must not be credited or charged to it as new behavior.

## Narrow shape D

| Part | Mechanism | Flag |
|---|---|:---:|
| D1 | After primary `DevToolsActivePort` readiness, `child.stderr.take()` transfers the pipe reader out of `Child`. | |
| D2 | A named standard thread performs byte-oriented `io::copy` to `io::sink()` until every writer closes. | |
| D3 | No bytes, terminal output, durable log, public API, or new runtime abstraction are added. | |
| D4 | Existing `ChromeProcess::kill` kills the child and Unix process group; Windows `Child::kill` terminates its Job. Normal close waits five seconds, then uses that kill path. | |
| D5 | The spawn result, copy result, and `JoinHandle` are discarded; there is no explicit cancellation or lifecycle accounting. Writers outside the owned group/Job can retain the thread and read descriptor until their own exit. | ⚠️ |

## Pipe and EOF mechanics

The earlier phrase “unowned unread pipe” is inaccurate after this patch:

- If thread creation succeeds, the reader is actively owned by the closure and drained.
- If thread creation fails, the closure containing `stderr` is dropped with the failed spawn attempt. That drops the read end. It does **not** put an unread reader back into `Child`; subsequent writes fail as a broken pipe rather than block on pipe capacity. Ignoring the spawn result hides this degraded mode and Chrome’s reaction is unverified, but it is not the original full-pipe mechanism.
- Ignoring `io::copy`’s result similarly suppresses the reason the reader stopped; it does not by itself stop a healthy copy.
- On successful spawn, completion follows pipe EOF, not `ChromeProcess` ownership directly. EOF requires all inherited/duplicated write ends to close.

For an ordinary owned Unix tree, `setpgid(0,0)` puts Chrome in its own group and `kill(-pgid, SIGKILL)` should close writers held by members of that group. A quiet in-group descendant is therefore the correct discriminator, not evidence of a leak merely because the handle is detached. On Windows, the stderr writer is allowlisted into the launched child and the process is atomically assigned to the kill-on-close Job; terminating that Job should close writers in the owned tree. Runtime proof is still unavailable here.

The boundary is real: a Unix descendant can escape the group with `setsid`/`setpgid` while retaining stderr; an out-of-bound process could also receive a duplicated writer. Then `ChromeProcess` drop cannot create EOF and D5 retains one OS thread plus the read descriptor indefinitely. Windows Job containment is stronger, but externally duplicated handles or any valid escape must not be generalized away without runtime evidence. This does not justify replacing 19 lines with a general collector now, but it prevents calling resource lifetime bounded without either explicit scope acceptance or a bounded teardown mechanism.

## Full narrow R × D fit check

This table scores current design/source fit. Empirical delivery gates remain listed below.

| Req | Requirement | Status | D |
|---|---|---|:---:|
| R0a | After primary readiness succeeds, browser stderr volume must not block later commands, including long unterminated output and invalid bytes. | Core | ✅ |
| R0b | Pre-readiness output and existing stderr fallback redesign are separate follow-up work. Do not improve, worsen, or claim them fixed here. | Must | ✅ |
| R1 | Preserve primary readiness and fallback detection/status/diagnostics. No new bounded-diagnostic promise for the untouched fallback. | Must | ✅ |
| R2 | Preserve existing owned-vs-attached process/group/Job/profile cleanup, retries, idle policy and platform interfaces. | Must | ✅ |
| R3 | Omitted launch flags preserve PID/target/URL/application state. Explicit close/relaunch resets browser state according to existing semantics. | Must | ✅ |
| R4 | Post-ready output consumption retains bounded bytes and no default durable logs or stdout pollution. | Must | ✅ |
| R5 | Measure worker/fd release during repeated launch/kill/drop, including a quiet writer in the owned boundary; disclose retention outside it rather than silently accepting it. | Must | ❌ |
| R6 | Windows runtime and Linux runtime cannot be claimed from macOS. No Unix-only production implementation hidden behind a common API. | Must | ✅ |
| R7 | A maintainable regression exercises the production launch path and fails if consumption is removed, without a test-only runtime abstraction. | Must | ❌ |

**Notes:**
- R5 fails current completion, not because detached syntax proves a leak, but because no repeated accounting evidence exists and escaped-writer lifetime is unbounded by design.
- R7 fails the current candidate because it adds no regression. The parent’s isolated-copy work may change this score.
- R6 is a scope/claim pass only. It is not Windows or Linux runtime verification.

## Critical discriminator tests for parent evidence

1. **Production launch path, removal-sensitive:** use `LaunchOptions.executable_path` with a fixture that writes a valid `DevToolsActivePort`, then emits substantially more than pipe capacity after readiness as raw chunks containing no newline and invalid UTF-8. Exercise `BrowserManager::launch` or the same daemon production path, prove a later command/close progresses, and prove removing D1–D2 makes the test fail or time out. A helper-only `io::copy` unit test is insufficient.
2. **Repeated graceful close:** run enough launch/close cycles to expose accumulation. Record daemon thread and fd/handle baselines, peaks, and post-cycle settling. Require the `chrome-stderr-drain` count and pipe readers to return to baseline, not merely successful command exit.
3. **Repeated forced drop/kill:** make the main fixture and a quiet descendant retain stderr inside the owned process group/Job. Drop or kill without relying on graceful browser exit. Require child/tree death and reader-thread/fd release every cycle. This directly tests D4 rather than detached-thread aesthetics.
4. **Escaped/inherited writer:** on Unix, create a bounded-lived `setsid` descendant retaining stderr. After dropping `ChromeProcess`, verify the drain remains while that writer lives and exits after it closes. This should be disclosed as the current boundary. If it remains indefinitely for an unbounded writer, R5 cannot be called bounded; deciding to accept that boundary or add cancellation is a contract decision, not a silent green result.
5. **Branch separation:** retain a control showing fallback already takes stderr and does not start a second drain. Do not turn this continuation into pre-readiness, fallback buffering, or diagnostic redesign.
6. **Platform claims:** macOS evidence may establish Unix mechanism behavior only on macOS. Windows Job/pipe and Linux process-group runtime results remain separate delivery evidence.

No broader collector, ring buffer, reaper, or public seam is warranted before these narrow tests report. Conversely, a green owned-tree plateau must not be presented as proof that escaped writers are bounded.
