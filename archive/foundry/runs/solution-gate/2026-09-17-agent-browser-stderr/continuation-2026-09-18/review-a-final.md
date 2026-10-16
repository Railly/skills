# Review A — final (narrowed contract, post-evidence)

Supersedes `review-a-initial.md`. No merge or production authorization. Read: `resources.md`, `resources.json`, `post-ready-regression.patch`, `post-ready/cli/src/native/cdp/chrome.rs` (production `906–923`, test `1766–1821`), `post-ready-results/`. Not read: siblings, env, credentials, network. No commands, no edits. Production in `post-ready` is the same 19 lines as candidate; the addition is **test-only, +57 lines**.

## Fit check (R × K)

| Req | Requirement | Status | K |
|---|---|---|---|
| R0a | After primary readiness succeeds, browser stderr volume must not block later commands, including long unterminated output and invalid bytes | Core goal | ✅ |
| R0b | Pre-readiness output and existing stderr fallback redesign are separate follow-up work. Do not improve, worsen, or claim them fixed here | Out (fence) | ✅ |
| R1 | Preserve primary readiness and fallback detection/status/diagnostics. No new bounded-diagnostic promise for the untouched fallback | Must-have | ✅ |
| R2 | Preserve existing owned-vs-attached process/group/Job/profile cleanup, retries, idle policy and platform interfaces | Must-have | ✅ |
| R3 | Omitted launch flags preserve PID/target/URL/application state. Explicit close/relaunch resets browser state according to existing semantics | Must-have | ✅ |
| R4 | Post-ready output consumption retains bounded bytes and no default durable logs or stdout pollution | Must-have | ✅ |
| R5 | Measure worker/fd release during repeated launch/kill/drop, including a quiet writer in the owned process group. Do not infer a leak from detached-thread syntax alone, or confuse an unjoined worker with a blocked caller. Any retention by writers outside that ownership boundary must be disclosed, not silently scoped out or accepted by implication | Must-have | ✅ |
| R6 | Windows runtime and Linux runtime cannot be claimed from macOS. No Unix-only production implementation hidden behind a common API | Must-have | ✅ |
| R7 | A maintainable regression must exercise the production launch path and fail if the consumption mechanism is removed. No new runtime abstraction merely to make tests possible | Must-have | ✅ |

**R5 ❌→✅, on the measure-and-disclose clauses only.** Owned boundary, 12 cycles (6 quiet / 6 × 8 MiB; 6 kill-then-Drop / 6 Drop-only): live `3 threads / 1 reader / 5 fds`, every post-action sample back to baseline `2/0/4`, zero cumulative increase, recovery inside 5.46–7.79 ms bounds. All 24 helpers shared their mock's PGID and died by SIGKILL, covering the quiet-writer-in-owned-group case R5 names. Outside boundary, 12 further cycles: exactly +1 thread and +1 fd each, `14/12/16` after the twelfth Drop and a 1 s hold, back to `2/0/4` within 7.897 ms once writers closed. **No blocked Drop** — unjoined worker vs blocked caller is now empirical, not syntactic.

**R7 ❌→✅.** The test calls the real private `try_launch_chrome` (no trait, no injection point, no `pub` test API), uses the default temp-profile path, and its oracle is writer progress (`drained-$round`), not launch success — the trap I flagged. Payload is `\377` plus 2 MiB of unterminated NULs, twice: invalid bytes and a no-newline burst ≫ pipe capacity, round 2 proving continuous consumption. It also asserts exact `ws_url`, `!has_exited()` and temp-profile removal on Drop. Negative control is decisive: the same test on pristine base exits 101 at `chrome.rs:1794`, `stderr burst 1 blocked after readiness`.

R0a is now evidence-backed rather than mechanical. R6 holds as a boundary rule only: one non-`cfg`-gated implementation, no runtime claim from macOS, and the `#[cfg(unix)]` regression leaves a Windows equivalent owed at delivery.

## Release proof vs shape gate

**Release proof (done, bounded):** on macOS with a synthetic mock, reader lifetime tracks writer lifetime; nothing accumulates while ownership holds; every retained unit is recovered when the writer closes. Linear and reversible, not runaway.

**Shape gate (open):** the product would acquire a new permanent property — per-browser reader lifetime as a function of writers it does not own. That is a contract term, not a measurement. The spike disclaims join guarantees, bounded lifetime under open external writers, Linux/Windows, real Chrome helper inheritance, and escape probability.

## Does external-writer retention need explicit human acceptance before Pass?

**Yes.** (1) R5 forbids the alternative in its own words: such retention must be disclosed, "not silently scoped out or **accepted by implication**" — passing on a green table is acceptance by implication. (2) The cost changed category: an unproven risk is now a measured, reproducible property (1 thread + 1 fd per escaped browser, daemon-lifetime, no cap, no counter, no warning). A now-measured cost must be re-offered to the decider, not inherited. (3) `continue` consented to validation, not to owning a lifetime cost that did not yet exist as evidence.

What acceptance decides, neutrally: (a) accept as a disclosed domain-limited guarantee, with the boundary condition written into the code comment, which today states only EPIPE tolerance and is silent on out-of-boundary retention; (b) require engineered cancellation (self-pipe/`O_NONBLOCK` on Unix, `CancelIoEx`/overlapped on Windows) — overreach as a *merge blocker* in my view, legitimate as a separate shape; (c) accept plus a cheap counter or warning. Also human-owned: the `decision.md` §118 scope fork, and whether a synthetic escape justifies action absent evidence that real Chrome helpers leave their group.

## Correction carried forward

My blind-phase claim that ignored spawn failure "degrades to today's blocking behaviour" was **wrong**, and reading it as "retains an unread pipe" is equally wrong. `Builder::spawn`'s `Err` carries only `io::Error`, so the closure and its captured `ChildStderr` drop inside the call: the read end closes, Chrome's next write fails fast with EPIPE, **zero** retention. The probe's counting rule (`child.stderr` is `None` after `take()`) is consistent. The residual issue is silence, not retention.

## S1–S13

S1 upheld, no redesign added. S2 measured, fenced to R0b. S3 upheld, fallback untouched and not claimed fixed. S4 upheld, writer progress is the oracle. S5 resolved to a disclosed limit: peer still unregistered, lifetime now measured both ways. S6 upheld, Unix-only test, no Linux/Windows claim. S7 upheld, status-42 diagnostics unchanged. S8 upheld, cells frozen pre-reveal. S9 satisfied, in-tree regression plus negative control. S10 open, EPIPE tolerance and the 1–2 day incident remain contributor prose. S11 upheld, sink parses nothing. S12 upheld, post-ready coverage not relabelled full coverage. S13 upheld, continuity preserved, `has_exited()` asserts no relaunch.

## Verdict

All nine narrow cells ✅. **Pass to detail recommended, conditional on:** explicit human acceptance of the external-writer lifetime property, and the pending receipt. At read time `post-ready-results/verification.json` holds only the negative control (exit 101 = expected 101) and **no `status: PASS`**; the 55-test suite was still running, so no suite-clean claim is made. The confounded run (shared Cargo cache reusing the control binary) is correctly excluded and separate build targets are now used; the probe's runtime-preservation incident was disclosed and hash-restored, which does not erase the side effect. No merge, no production implementation, no cross-platform claim authorized here.
