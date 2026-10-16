# Shapes A — owned Chrome stderr liveness (blind)

Inputs: reconciled `contract.md`, frozen packet, isolated base aff6125. No candidate/sibling/network/env access. No implementation or breadboard. Retention budgets are internal constants, **not** new flags, env vars or schema fields (R5). No `Browser.close` or CDP deadline change (R7).

## CURRENT

Spawn pipes fd 2 (`chrome.rs:825–831`). Only the primary-error branch takes `child.stderr` (`882–904`), so after primary readiness the pipe is retained and read by nobody → Chrome blocks in `write`; after fallback readiness the reader is dropped → read end closed. The fallback uses `lines()`, tests the deadline only after a line arrives (`958–983`), accumulates an unbounded `Vec` (`963,976`) and fails on invalid UTF-8 (`972`).

## A: Bounded stderr drain owned by the browser lifetime

| Part | Mechanism | Flag |
|---|---|:--:|
| **A1** | Byte-capped shared ring buffer created before spawn; records dropped-byte/line count. Precedent shape: `lightpanda.rs:93–99` `push_bounded` | |
| **A2** | Consumer loop over the child's stderr, `read_until(b'\n')` with a cap on an unterminated segment, lossy UTF-8 conversion, pushing into A1; never stops on a malformed chunk (R8) | |
| **A3** | Readiness fallback no longer owns a reader: on primary error it waits for the marker signalled by A2 with a timed wait against the **existing** 30 s attempt deadline (R9, R1) | |
| **A4** | Failure text renders an A1 snapshot: existing keyword filter, last-5 fallback, sandbox hint (`985–1041`), plus an explicit truncation line (R2) | |
| **A5** | Consumer is owned per attempt by `ChromeProcess`: kill/Drop kills the group first, then releases the consumer without blocking on a write end held elsewhere (D7) | ⚠️ |
| **A6** | Windows reads the existing `Child.stderr: Option<File>` (`windows_process.rs:50,171`); spawn wiring, handle allowlist and Job Object untouched | ⚠️ |

## B: Per-attempt owned file sink

| Part | Mechanism | Flag |
|---|---|:--:|
| **B1** | fd 2 points at a per-attempt file inside the existing owned temp dir; no pipe, so no backpressure by construction | |
| **B2** | Fallback readiness tails that file from a byte offset for the marker under the existing deadline | |
| **B3** | Failure diagnostics read a bounded tail, cut at a line boundary (precedent `recording.rs:92–94`) | |
| **B4** | File removed alongside the temp profile on Drop (`chrome.rs:107–130`) | |
| **B5** | Chrome's writes are never rate-limited, so on-disk growth over a long session has no in-process cap | ⚠️ |
| **B6** | Windows must pass an inheritable **file** handle as `hStdError` inside the existing allowlist (`windows_process.rs:119–136`), changing spawn wiring | ⚠️ |

## C: Consume until readiness, then release the pipe

| Part | Mechanism | Flag |
|---|---|:--:|
| **C1** | A1/A2-style consumption, scoped to the launch attempt only | |
| **C2** | At readiness both paths close the read end, generalising today's fallback behaviour (P2) | |
| **C3** | No post-readiness capture; failure rendering unchanged | |
| **C4** | Chrome's behaviour with a closed stderr for a whole session under `--v=1` is unmeasured: write errors may be ignored, may spam, or may abort | ⚠️ |

## D: Enlarge pipe capacity (foil)

| Part | Mechanism | Flag |
|---|---|:--:|
| **D1** | Request a larger kernel pipe buffer; no consumer added | ⚠️ |

## Fit check (R × S)

| Req | Requirement | Status | A | B | C | D |
|---|---|---|---|---|---|---|
| R0 | Log-output volume must not backpressure a managed Chrome launch before readiness or prevent commands after readiness | Core goal | ✅ | ✅ | ❌ | ❌ |
| R1 | Preserve DevToolsActivePort as primary readiness and the existing DevTools listening on stderr detection/fallback semantics; do not silently remove either | Must-have | ✅ | ✅ | ✅ | ✅ |
| R2 | Failed startup preserves process status and useful bounded Chrome diagnostics; exact unlimited output is not promised | Must-have | ✅ | ✅ | ✅ | ✅ |
| R3 | Ordinary same-session commands retain PID, target, URL and application state; no new restart/clear semantics from omitted flags | Must-have | ✅ | ✅ | ❌ | ❌ |
| R4 | Logging handling has finite byte/storage and per-launch thread/descriptor costs; does not block lifecycle completion on an inherited writer staying open | Must-have | ❌ | ❌ | ✅ | ❌ |
| R5 | stdout/JSON schema remains clean; no default forwarding of unlimited browser logs to terminal or durable global storage | Must-have | ✅ | ✅ | ✅ | ✅ |
| R6 | Preserve owned-vs-attached distinction, group/Job Object and profile cleanup, existing retry and idle policy | Must-have | ✅ | ❌ | ✅ | ❌ |
| R7 | Scope is Chrome output/readiness, not original CPU spin, ffmpeg, Lightpanda, providers, general CDP timeout redesign or a new reaper | Must-have | ✅ | ✅ | ✅ | ✅ |
| R8 | Arbitrary chunks, long/no-newline diagnostics and invalid bytes do not cause the consumer to stop servicing output or grow without bound | Derived | ✅ | ✅ | ❌ | ❌ |
| R9 | Any new output wait/cleanup path respects the existing attempt deadline without waiting indefinitely for a line or EOF | Derived | ✅ | ✅ | ✅ | ✅ |
| R10 | Output handling follows browser/attempt lifetime, not a temporary Tokio launch worker, and does not mix retries or sessions | Derived | ✅ | ✅ | ✅ | ✅ |

**Notes**

- A fails R4 only via flagged A5: the release policy when a duplicated write end outlives the owned browser is not concretely known. Every other A part is a known mechanism.
- B fails R4 (B5: unbounded on-disk growth, no in-process cap) and R6 (B6: changes Windows spawn/handle wiring).
- C fails R0/R3/R8 after readiness: C4 is decisive and unverified; today's fallback proves only that a closed pipe survives seconds after launch, not a session under `--v=1`.
- D fails R0 (delays the stall), R4, R6, R8; contrast only.

**Design fit vs empirical validation:** all ✅ are design fit. D1, D2, D3, D6, D7 stay empirically open for A; no Windows runtime claim (contract §25).

## Recommendation

Pursue **A**, gated on resolving A5 before its fit check can turn green; A6 stays a delivery gate, not a runtime claim. A beats B because A's unknowns are local (release policy, Windows read path) while B's R4 failure is structural: nothing in-process caps what Chrome writes to a file. C is cheapest but its one flag sits on the core goal, so it stays demoted unless C4 is measured first. A's retention budget must be named, tested and surfaced when truncation occurs.

## Forward effects (mechanism-linked)

1. **A2 always consumes browser output.** Forward: log volume stops being self-limiting; Chrome logs at full speed all session. Harmful branch: at high `--v` rates the consumer's per-line work adds steady CPU for a browser nobody reads, creating a new cost story beside the unreproduced high-CPU incident (R7 boundary).
2. **A1 keeps a bounded tail.** Forward: failure text stays finite and predictable. Harmful branch: the diagnostic first line (sandbox/namespace) is evicted by later noise, dropping R2 quality below today's unbounded Vec; the obvious mitigation, preferring keyword hits, reintroduces an unbounded class unless capped too.
3. **A5 ties consumer exit to the write end closing.** Forward: ordered cleanup, kill group then release. Harmful branch: a duplicated write end means EOF never arrives, so Drop blocks the daemon or a consumer leaks per relaunch — the exact D7/R4 failure this shape must avoid.

## Cheapest discriminator probes

| Probe | Cell | Cost | Falsifies |
|---|---|---|---|
| **P1** Fake exe spawning a grandchild that holds the write end, then exits | D7, A5 | Lowest; existing wrapper seam (§26), no Chrome | A5 release policy: join vs detach, before any real-browser run |
| **P2** Fake exe emitting a multi-MiB unterminated line, invalid bytes, then a marker split across writes | D5, D6, R8 | Low, no Chrome | A2/A3 parser and bound; B2 tail parser equally |
| **P3** Fake exe writing noise then exiting non-zero | D4 | Low | R2: status retained, keyword line kept, truncation stated |
| **P4** One real Chrome trial with the frozen args: open, marker, snapshot, marker, close; assert ≫64 KiB consumed, same PID/target, exit 0 | D1, D2, D3 | One trial | R0 end-to-end for A; re-run against C settles C4 |
| **P5** Five relaunches in one session; sample daemon thread/descriptor counts and group CPU against the file baseline | D8, R4, effect 1 | One session | Resource flatness and the new CPU-cost branch |

P1–P3 need no browser and should run first; only P4/P5 need a live Chrome.
