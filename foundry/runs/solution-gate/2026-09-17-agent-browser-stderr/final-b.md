# Final B: Candidate reveal shaping

## Verdict

**Return to contract; do not Pass to detail under frozen R0–R10.** Simon Ellefsen (`simonellefsen`) deserves credit for correctly identifying and fixing the ordinary primary-readiness post-ready unread-pipe path in PR #1527. At exact head `f89be85…`, macOS evidence shows `--v=1` and `--v=2` open/marker/snapshot/read/close success with one process group and no relaunch. That supports the contributor’s narrower claim.

Frozen R0 explicitly also covers output **before readiness**. The candidate hook runs only after readiness and the 1.2 MB preburst still hangs. Accepting this as a narrow post-readiness patch would require an explicit contract split or scope decision. It cannot be silently scored as satisfying broad R0, nor should the contributor automatically be charged with every pre-existing startup defect.

## Updated requirements

| R | Requirement | Updated status |
|---|---|---|
| R0 | Log-output volume must not backpressure a managed Chrome launch before readiness or prevent commands after readiness | Settled; post-ready half evidenced, pre-ready half fails |
| R1 | Preserve DevToolsActivePort primary and existing stderr readiness fallback semantics | Settled; source-preserved, stderr-only E2E still unmeasured |
| R2 | Failed startup preserves status and useful bounded diagnostics | Settled; useful noisy failure preserved, bounded fallback retention still absent |
| R3 | Same-session commands retain PID, target, URL and state; omission adds no restart/clear | Settled; evidenced pass |
| R4 | Finite byte/storage/thread/descriptor costs; inherited writer cannot block lifecycle completion | Settled; detached-thread ownership fails design fit |
| R5 | Clean stdout/JSON; no unlimited default forwarding/global storage | Settled; candidate passes by sinking output |
| R6 | Preserve ownership, group/Job/profile cleanup, retry and idle policy | Settled; existing process policy unchanged, new thread is not lifecycle-owned |
| R7 | Chrome output/readiness only; no CPU/other engines/providers/general timeout/reaper expansion | Settled; candidate passes |
| R8 | Chunks, long/no-newline output and invalid bytes remain consumed and bounded | Derived; copy-to-sink passes post-ready bytes, existing fallback remains deficient |
| R9 | New output wait/cleanup respects the attempt deadline; no indefinite line/EOF wait | Derived; unchanged startup fallback can overrun; detached no-join copy does not block callers |
| R10 | Output handling follows browser/attempt lifetime and does not mix retries/sessions | Derived; candidate thread follows pipe EOF, not `ChromeProcess` ownership |

## Candidate shape D: Detached post-ready sink

| Part | Mechanism | Flag |
|---|---|:---:|
| D1 | After readiness selection, `take()` remaining `child.stderr`. Fallback has already taken it, so D applies only to primary readiness. | |
| D2 | Spawn named `chrome-stderr-drain` standard thread and `io::copy` raw bytes to `sink()` until EOF. | |
| D3 | Discard thread handle, copy result, and spawn result; add no stop/join/cancellation ownership to `ChromeProcess`. | |
| D4 | Retain no post-ready bytes and add no public configuration or global log. | |
| D5 | Windows uses existing `Option<File>` interface, but runtime/lifecycle behavior has no Windows evidence. | ⚠️ |

Reusable match to blind A: D1 is A1’s immediate continuous consumption, but only after readiness; D2 validates byte-oriented consumption from A2’s direction. D omits A3 bounded useful diagnostics, A4 concurrent startup coverage, A5 browser ownership, and A6 cancellable teardown.

## Full fit check

| Req | Requirement | Status | Blind A | Candidate D |
|---|---|---|:---:|:---:|
| R0 | Log-output volume must not backpressure a managed Chrome launch before readiness or prevent commands after readiness | Core | ✅ | ❌ |
| R1 | Preserve DevToolsActivePort as primary readiness and the existing DevTools listening on stderr detection/fallback semantics; do not silently remove either | Must | ✅ | ✅ |
| R2 | Failed startup preserves process status and useful bounded Chrome diagnostics; exact unlimited output is not promised | Must | ✅ | ❌ |
| R3 | Ordinary same-session commands retain PID, target, URL and application state; no new restart/clear semantics from omitted flags | Must | ✅ | ✅ |
| R4 | Logging handling has finite byte/storage and per-launch thread/descriptor costs; does not block lifecycle completion on an inherited writer staying open | Must | ❌ | ❌ |
| R5 | stdout/JSON schema remains clean; no default forwarding of unlimited browser logs to terminal or durable global storage | Must | ✅ | ✅ |
| R6 | Preserve owned-vs-attached distinction, group/Job Object and profile cleanup, existing retry and idle policy | Must | ❌ | ❌ |
| R7 | Scope is Chrome output/readiness, not original CPU spin, ffmpeg, Lightpanda, providers, general CDP timeout redesign or a new reaper | Must | ✅ | ✅ |
| R8 | Arbitrary chunks, long/no-newline diagnostics and invalid bytes do not cause the consumer to stop servicing output or grow without bound | Derived | ✅ | ❌ |
| R9 | Any new output wait/cleanup path respects the existing attempt deadline without waiting indefinitely for a line or EOF | Derived | ❌ | ❌ |
| R10 | Output handling follows browser/attempt lifetime, not a temporary Tokio launch worker, and does not mix retries or sessions | Derived | ✅ | ❌ |

Blind A retains its earlier status and flagged Windows proof. D fails R2/R8/R9 because frozen requirements include unchanged startup fallback. With no join, its EOF wait cannot block callers; the concern is resource retention under R4/R10, not a new deadline regression.

## Failure catalog S1–S13

| S | Disposition |
|---|---|
| S1 Over-reach | **No hit.** Change is narrowly post-primary-readiness; fallback and ownership rules are not rewritten. |
| S2 Under-reach | **Hit against frozen R0.** Post-ready saturation closes, but finite pre-readiness burst still hangs. Against the narrower contributor claim this is a scope mismatch requiring Return to contract. |
| S3 Direction inheritance | **No separate hit.** Evidence shows stage under-reach, not an opposite causal direction beyond S2. |
| S4 Proxy property | **N/A.** No guard substitutes an adjacent property for actual pipe consumption. |
| S5 Unregistered peer | **Hit.** New thread/reader is absent from `ChromeProcess`, retry cleanup, stop, and accounting; an inherited writer may retain it. |
| S6 Peer-version blindness | **N/A.** No cross-version protocol. |
| S7 Wrong layer | **No hit.** The daemon consumes the actual managed-Chrome stderr; post-ready sinking does not replace startup diagnostics. |
| S8 Guard-derived cells | **No hit.** Frozen cells include preburst, post-ready, failure, and quiet-writer cases, not candidate-derived branches. |
| S9 Test pins the wrong thing | **No false-green test; proof missing.** Candidate adds no tests or regression protection. |
| S10 Claim from prose | **Risk only.** Hours/recurrence and EPIPE-tolerance prose exceed sealed execution; verdict relies on measured v1/v2 continuity. |
| S11 Asymmetric validation | **N/A.** No shared input validation changes. |
| S12 Primitive-contract mismatch | **Hit.** `io::copy` drains correctly but lives until EOF, while R4/R10 require browser/attempt resource ownership. No join means no caller block or new deadline regression. |
| S13 Invocation-state collapse | **No hit/evidenced.** Corrected runs omit later options while retaining launch/group, state, marker, and normal close. |

## Classification

**New candidate risks, not measured regressions:** successful primary launch creates an unowned detached thread; spawn/copy results are ignored; a post-ready inherited writer could retain that thread/descriptor beyond browser lifetime. No join means it does not itself block callers. No candidate tests cover these branches.

**Unchanged base defects/scope gaps:** pre-readiness backpressure, quiet-writer startup deadline overrun, line/UTF-8 fallback behavior, unlimited fallback diagnostics, and missing stderr-only E2E measurement. These are not candidate regressions.

**Remaining implementation proof:** Windows runtime behavior; post-ready inherited-writer resource retention; repeated close/relaunch thread/descriptor counts; spawn-failure behavior; and longer sustained post-ready output. The POSIX polled-consumer spike proves a bounded cancellable direction is viable, not that candidate D supplies it.
