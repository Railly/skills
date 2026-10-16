# Final A — post-reveal update (contract-a.md and shapes-a.md retained unchanged)

Read: `candidate-feedback.md`, the permitted sealed diff, `blind-probes.md` (S1–S13 live only there and the feedback names it). Not read: `contract-b.md`, `shapes-b.md`, candidate branch tree, PR page, network, env, credentials. No code edits, no tests, no GitHub action.

## Candidate as shape K

19 added lines in `cli/src/native/cdp/chrome.rs`. After readiness resolves and before `ChromeProcess` is built, `child.stderr.take()` feeds a named, **detached** `std::thread` running `io::copy(stderr, sink())` until EOF; the `JoinHandle` and both `Result`s are discarded. Comment notes the fallback already took stderr, so `None` there is expected.

Placement check against my isolated base: the hunk header says `@@ -420` but in aff6125 the matching context (`};` then `#[cfg(unix)] let pgid`) is at `chrome.rs:904–906`. The patch was generated on an older tree and applied with offset — a provenance note, not a defect.

K is a strict subset of my **A2** with **A1 (bounded retention), A3 (readiness off the diagnostic tail) and A5 (owned, cancellable release) omitted**, and scoped to post-readiness only.

| Part | Mechanism | Flag |
|---|---|:--:|
| **K1** | Take remaining `child.stderr` after readiness; copy to `sink()` until EOF | |
| **K2** | Discard bytes: O(1) memory, byte-level, immune to invalid UTF-8 and long/unterminated lines | |
| **K3** | Detached thread, no owner, no stop signal, no join; spawn failure silently ignored (`let _ =`) | ⚠️ |
| **K4** | Fallback-readiness sessions keep today's closed read end; "Chrome tolerates EPIPE" asserted in a comment only | ⚠️ |
| **K5** | Not cfg-gated; Windows `Child.stderr: Option<File>` (`windows_process.rs:50`) satisfies `Read` by construction, runtime unverified | ⚠️ |

## Updated fit check (R × A, K)

| Req | Requirement | Status | A | K |
|---|---|---|---|---|
| R0 | Log-output volume must not backpressure a managed Chrome launch before readiness or prevent commands after readiness | Core goal | ✅ | ❌ |
| R1 | Preserve DevToolsActivePort as primary readiness and the existing DevTools listening on stderr detection/fallback semantics; do not silently remove either | Must-have | ✅ | ✅ |
| R2 | Failed startup preserves process status and useful bounded Chrome diagnostics; exact unlimited output is not promised | Must-have | ✅ | ✅ |
| R3 | Ordinary same-session commands retain PID, target, URL and application state; no new restart/clear semantics from omitted flags | Must-have | ✅ | ✅ |
| R4 | Logging handling has finite byte/storage and per-launch thread/descriptor costs; does not block lifecycle completion on an inherited writer staying open | Must-have | ❌ | ❌ |
| R5 | stdout/JSON schema remains clean; no default forwarding of unlimited browser logs to terminal or durable global storage | Must-have | ✅ | ✅ |
| R6 | Preserve owned-vs-attached distinction, group/Job Object and profile cleanup, existing retry and idle policy | Must-have | ✅ | ✅ |
| R7 | Scope is Chrome output/readiness, not original CPU spin, ffmpeg, Lightpanda, providers, general CDP timeout redesign or a new reaper | Must-have | ✅ | ✅ |
| R8 | Arbitrary chunks, long/no-newline diagnostics and invalid bytes do not cause the consumer to stop servicing output or grow without bound | Derived | ✅ | ❌ |
| R9 | Any new output wait/cleanup path respects the existing attempt deadline without waiting indefinitely for a line or EOF | Derived | ✅ | ❌ |
| R10 | Output handling follows browser/attempt lifetime, not a temporary Tokio launch worker, and does not mix retries or sessions | Derived | ✅ | ❌ |

**Notes.** K R0 ❌ is the pre-readiness half only (preburst identical both sides). K R4 ❌: memory is O(1), but K3 gives the thread no owner or cancellation, so a write end held past browser exit strands one thread per relaunch; flatness unmeasured. K R8 ❌ is inherited, not caused: K2 fully satisfies R8 for the post-readiness lane, while the launch lane keeps `lines()`, the unbounded `Vec` and the invalid-UTF-8 abort (`chrome.rs:958–983`). K R9/R10 ❌ are new: `io::copy` waits for EOF with no bound and no lifetime owner. My A's R4 ❌ (flagged A5) is unchanged; `line-limit-probe` additionally refutes my A2 `read_until`-then-cap idea and pushes A1 toward chunk-bounded reads — K2 is the bounded-by-construction discard lane I should reuse.

## Three-way classification

**1. Candidate regressions (new in K, none measured).** K3 unowned detached thread and unbounded EOF wait (R9/R10, D7); silent ignore of spawn failure, which degrades to today's blocking behaviour with no signal. These are structural reads of the diff; no returned cell measured a thread/descriptor leak, so they are unproven risk, not observed breakage. **No measured regression exists in the returned table**: error diagnostics, continuity, group count, launch hash and relaunch behaviour are identical to base.

**2. Pre-existing scope gaps (must not be charged to this PR).** Pre-readiness backpressure (preburst 12 s failure on both sides); quiet-writer non-response at 35.0 s beyond the 30 s attempt deadline, explicitly base behaviour; fallback-lane unbounded `Vec`, `lines()` and invalid-byte abort; absence of a close deadline (already deferred by contract §24).

**3. Remaining implementation proof.** Windows runtime pass (K5, contract §25); resource flatness over repeated relaunches (my P5); CPU cost of continuous consumption at high verbosity (my forward effect 1 — not in the returned cells); the K4 EPIPE claim under a full fallback-readiness session; in-tree tests (none added).

## S1–S13 dispositions

S1 upheld: no CDP/reaper/GPU/engine change. S2 measured true: later-only consumption cannot satisfy frozen R0 (preburst-v1 unchanged). S3 partially unmet: primary path fixed, fallback path still EPIPE-only. S4 upheld and strengthened: port-file success no longer implies a frozen browser; read_until is confirmed not a bound. S5 failed: new capture state has no per-attempt owner or cleanup (no durable artifact, so the second half holds). S6 upheld: same-binary internals, delivery verification still owed. S7 upheld and measured: status 42 and ERROR marker preserved. S8 upheld: `--v=1`, `--v=2` and a 15 s hold exercised; byte/lifecycle orderings still untested in-tree. S9 not satisfied: no candidate tests; evidence is orchestrator-run against failing base cells. S10 directly triggered: the diff comment states hours-long `write(2)` block, beachball and 1–2 day recurrence, and "Chrome tolerates EPIPE", as fact; none is execution evidence here, and it must not be read as fixing the unreproduced high-CPU incident (R7). S11 upheld: sink parses nothing and grants no authority. S12 not applicable to K (no file sink, no pipe resize); my B/D dispositions stand. S13 satisfied: corrected normal runs pass launch flags on open only, one owned group, same launch hash, no relaunch.

## Verdict

**Contributor credit (Simon Ellefsen, PR #1527, head f89be85):** correct root cause, correct insertion point, minimal surface, and the right observation that the fallback already consumed stderr. The measured swing is real and decisive — base `open` never returns within 12 s (returncode -15) while candidate returns in 2.76 s / 1.13 s / 1.35 s with five commands at exit 0 and intact continuity. This independently validates the consumption direction I shaped as A2, at a fraction of A's size.

**Verdict: request changes — not yet Pass to detail** against the frozen contract. Blockers are narrow and additive, not a redesign: give the drain an owner with a cancellable, non-EOF-dependent stop (R9/R10/K3), demonstrate resource flatness across relaunches (R4), state Windows as a design-covered delivery gate (K5), soften the comment's unverified causal claims (S10), and add at least one in-tree seam test (S9). None requires bounded retention, new public configuration, or a CDP timeout change.

**Return to contract — do not resolve silently.** K targets post-readiness; frozen R0 covers both sides. Options, presented neutrally: (i) keep R0 whole, so K stays ❌ on R0 until pre-readiness consumption exists; (ii) split into R0a post-readiness (K ✅) and R0b pre-readiness, filed as a separate base defect with the preburst cell as its oracle; (iii) keep R0 whole but record a documented partial-satisfaction exception for this PR. I am not selecting one; the choice changes the verdict's R0 cell only, not any other cell above.
