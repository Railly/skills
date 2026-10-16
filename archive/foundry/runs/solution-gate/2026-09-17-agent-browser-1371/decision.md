# agent-browser #1371: partial reproduction, Solution Gate Reshape

Date: 2026-09-17. Base: `aff6125c023b810ea3f2e5deec5379e9a4270bdc` (v0.38.1). Gate is complete as a **Reshape** decision, not a Pass to detail. No production patch, commit, push, PR, issue comment, or global browser cleanup was performed.

## What reproduced

`bun repro-1371.ts` ran against an unchanged source-built v0.38.1 binary on Darwin 25.6.0 arm64, Apple M5 Pro, Chrome 152 as reported by its user agent. Five isolated browser sessions used dedicated state and temporary directories. The test launches a foreground native daemon, installs its matching config fingerprint, and invokes normal CLI commands against it. It is not an OpenClaw/Codex integration or a days-long soak.

| Cell | Observed result | CPU after event | Profile |
|---|---|---|---|
| Normal close | No owned processes at 2, 4, 6 seconds | 0% | Removed |
| Daemon SIGTERM | No owned processes at 2, 4, 6 seconds | 0% | Removed |
| Daemon SIGKILL, blank document | Chrome plus 11 group members survive; Chrome PPID becomes 1 | 0.4%, 0.4%, 0.5% | Retained |
| Daemon SIGKILL, deliberate animation | Same 12-process orphan group | 9.1%, 8.7%, 9.7% | Retained |
| Explicit 3000 ms idle timeout | Alive at 2 seconds, no owned processes at 4/6 seconds | 0% after cleanup | Removed |

The confirmed defect is the Unix daemon-death cleanup gap. The issue's unexplained blank-page/omnibox multi-core CPU spin was **not reproduced**. Startup CPU spikes are not evidence of sustained spin. The blank-document cells had a detached canvas WebGL renderer query before sampling; they were not a pristine never-scripted Chrome.

The actual WebGL renderer was `ANGLE (Apple, ANGLE Metal Renderer: Apple M5 Pro, Unspecified Version)` despite `--enable-unsafe-swiftshader` in argv. The flag alone does not establish that this browser uses software rendering. No evidence here justifies removing GPU or background-throttling flags.

All five cells preserved marker 1371, title, URL, and `lifecycle.reused=true` through successive CLI commands. All test-owned leaked groups were revalidated and cleaned afterward, with `cleanupRemaining=[]`. Persistent sessions surviving ordinary CLI exit are intended and must not be treated as this defect.

## Current mechanism and shipped mitigation

Actual launch caller: `cli/src/native/browser.rs:511-515` delegates Chrome launch through Tokio `spawn_blocking`. `cli/src/native/cdp/chrome.rs:846-865` creates a separate Unix process group. `ChromeProcess::kill` / `Drop` at lines 61-130 kill the group and remove its owned temporary profile, but both execute inside the daemon. SIGKILL cannot run that cleanup. The OS reparents the surviving Chrome to PID 1, observed in both kill cells.

Normal close and signal/idle branches run cleanup (`daemon.rs:299-352`, `browser.rs:1306-1336`). Attached browsers have no owned local child and are only disconnected. Windows uses Job Objects for process lifetime, not an automatic filesystem cleanup guarantee.

A default one-hour timeout already shipped through [PR #1605](https://github.com/vercel-labs/agent-browser/pull/1605), merged 2026-07-24 as `3cc7022271235694b5b5ce8aaea8bbfaa66e8cd5`. Its default/opt-out tests passed. A dead daemon cannot execute that timeout. Do not duplicate or shorten it as a substitute for fixing the death path.

## Gate provenance

- Frozen packet: [frozen-input.md](frozen-input.md).
- High-risk, greenfield mode. Existing candidate patches not inspected.
- Canonical solution-gate revision: `a006c7a52acfdb112e7a4882063d0a3dbbe757d7`; canonical checkout HEAD `77fdde3e8d7e13b7c27c7660f7c15619839e38af`, skill directory clean.
- Native subagent A selected `anthropic/claude-opus-5`; B selected `openai/gpt-5.6-sol`. Both calls succeeded. Exact runtime model IDs were not self-exposed, so selection metadata is the identity evidence, not an independent provider attestation.
- Independent source-only directories: `agent-browser-1371-shape-a` and `agent-browser-1371-shape-b` under `~/Programming/vercel/`. Same archive, no candidate or sibling outputs supplied during blind reconstruction.
- Source archive SHA-256: `ab09242d72627ab5fd6f7d15441815a3b3277ae4ce2d4677193fd9b44c198d84`.
- Original proposals: [A](shaping-a.md), [B](shaping-b.md). Evidence returned through [probe-feedback.md](probe-feedback.md). Revised native Shaping artifacts: [A updated](shaping-a-updated.md), [B updated](shaping-b-updated.md).
- One reviewer reported printing an authentication token to its private tool transcript while inspecting runtime identity. No token was supplied to the parent or intentionally copied into these artifacts. User notified; rotation recommended, not performed. Subsequent review prohibited environment/credential inspection.

## Reconciled requirements and current fit

The two reviewers initially overestimated proof from available primitives. Their updated artifacts retract the optimistic passes. This reconciled table controls scope; model agreement is not proof. `❌` includes an unresolved mechanism, not only a demonstrated impossibility.

A = post-launch sentinel (A's original B, B's original A). B = pre-launch per-browser guardian (A's revised G, B's B). C = session-wide supervisor (B's C). D = durable registry/future sweep.

| ID | Requirement | Status and provenance | A | B | C | D |
|---|---|---|---|---|---|---|
| R0 | Locally launched Chrome must not remain indefinitely after confirmed daemon hard death | Settled core goal | ❌ | ❌ | ❌ | ❌ |
| R1 | Ordinary CLI exits preserve live named-session PID, target, page and application state | Settled must-have, baseline observed | ✅ | ❌ | ❌ | ✅ |
| R2 | Cleanup must preserve attached browsers, other sessions and user-owned profile data while still terminating locally owned Chrome using a user profile | Settled must-have, process/path distinction reconciled | ❌ | ❌ | ❌ | ❌ |
| R3 | Preserve graceful close, SIGTERM, restore, one-hour default idle and explicit-zero behavior | Settled must-have; restore and one-hour live soak untested | ✅ | ❌ | ❌ | ✅ |
| R4 | Lifetime follows the daemon process rather than the temporary Tokio launch thread | Settled must-have | ✅ | ❌ | ❌ | ✅ |
| R5 | No claim to fix pathological CPU and no GPU/backgrounding changes without separate evidence | Settled must-have | ✅ | ✅ | ✅ | ✅ |
| R6 | Cleanup authority is established before Chrome can exist unowned | Derived from R0 and forced post-launch schedule | ❌ | ❌ | ❌ | ❌ |
| R7 | Retain safe authority over remaining group members after leader-first exit, without killing a reused PGID | Derived from R2; live proof missing | ❌ | ❌ | ❌ | ❌ |
| R8 | Preserve daemon readiness, config and CDP contracts and the existing Windows process guarantee | Derived continuity constraint; no platform rewrite authorized | ✅ | ❌ | ❌ | ❌ |
| R9 | Owned temporary profiles are safely deleted or marked without relying only on a name prefix | Settled outcome, delete/mark policy undecided | ❌ | ❌ | ❌ | ❌ |
| R10 | Autonomous cleanup has a finite observed bound without another CLI invocation | Derived from R0; production latency undecided | ❌ | ❌ | ❌ | ❌ |
| R11 | Any new cleanup agent's death boundary is explicit rather than advertised as universally contained | Derived; guardian-death scope undecided | ❌ | ❌ | ❌ | ❌ |

Failure notes: A has a demonstrated spawn-to-registration hole. B and C have plausible ordering but unresolved production inheritance, whole-tree safety, profile/attached isolation and helper-death containment. D cannot guarantee cleanup if the user never runs another command and cannot identify historical orphans that never wrote its records.

Scope disagreement retained: reviewer A proposed requiring new Windows filesystem cleanup in this patch. That is **not adopted** as a settled requirement. Preserve Windows behavior and separately note its filesystem limitation; adding cross-platform functionality requires its own evidence and scope decision. No new idle omission/clear semantics are selected. Guardian-first hard death, simultaneous hard death, live-but-wedged daemons and historical orphan cleanup remain explicit boundaries, not silently solved features.

## Adversarial spike results

`python3 spike-lifetime.py` exited 0 after correcting the fixture for Python 3.9 and fixing its clock comparison. It uses owned `/bin/sleep` stand-ins, not production guardian code.

| Probe | Observation | Disposition |
|---|---|---|
| Owner killed after child spawn, before registration | Child survives | Refutes post-launch sentinel as complete solution |
| Guardian created before child, owner retains sole pipe writer | Caller exit and owner SIGSTOP preserve child; owner SIGKILL triggers EOF, kill/reap | Supports lease primitive on macOS only |
| Guardian killed first, then owner killed | Child survives | Refutes unconditional lifetime-owner guarantee |
| Parent-clock cleanup observation | 16.809375 ms in one fixture run | Valid single run, not a product latency contract or benchmark |

Initial Python failure had exit 1 before a test child was launched. An earlier functional run emitted negative latency from cross-process monotonic clocks; its timing is discarded and retained separately. The final fixture report is authoritative. Revised reviewers had not yet seen the corrected 16.8 ms sample, so their “no valid latency” statements apply to production and the earlier packet; this narrow fixture measurement does not clear any production fit-check failure.

## Forward effects and harmful branches

**Per-browser guardian direction (argument, not observed implementation):**

1. Guardian launches Chrome only after holding the lease endpoint (inferred mechanism) → daemon death yields EOF (observed fixture) → guardian kills/reaps its retained child (observed fixture). Harmful branch: inherited writer in another process delays EOF (unverified production FD closure).
2. Guardian retains child/group ownership (inferred) → normal CDP close can flush profile state first (inferred from existing caller) → guardian exits only after group cleanup (unverified). Harmful branch: leader-first exit plus PID reuse makes a naive liveness guard leak helpers or signal an unrelated group (unverified).
3. Process ownership and profile-path ownership are separate (observed existing source) → explicit-profile Chrome still gets death cleanup (proposed) → user profile data survives (unverified live isolation). Harmful branch: treating a path prefix as authority deletes user data (risk to design out).
4. Guardian hard death removes the cleanup executor (observed fixture) → daemon death then leaves the stand-in alive (observed) → generic “cannot orphan” claim is false (observed scope counterexample).

**Session-supervisor alternative:** supervisor starts daemon and Chrome (inferred) → one component retains all child ownership (inferred) → daemon death can reap multiple browsers (unverified). Harmful branch: wider IPC/sidecar/PID changes break session reuse or grant cross-session kill authority (unverified); supervisor death has the same residual executor-loss class (inferred from fixture, not directly tested with a session supervisor). No evidence warrants this wider change over a per-browser probe.

## Failure catalog: promising guardian direction, not approved

| Case | Score / disposition |
|---|---|
| S1 Over-reach | Hit if adding registry migration, CPU flags, new Windows filesystem policy or changing idle defaults. Exclude those expansions. |
| S2 Under-reach | Hit for post-launch registration, leader-only cleanup and guardian death. Registration refuted; others remain blocking boundaries. |
| S3 Direction inheritance | Check daemon-first, Chrome-leader-first, guardian-first and graceful-first orderings; only some fixture directions exercised. |
| S4 Proxy property | PID alive is not identity; browser leader gone is not whole tree gone. Retained authority remains unproved. |
| S5 Unregistered peer | A new guardian/record needs explicit discovery and cleanup integration. Prefer no durable registry unless justified. |
| S6 Peer-version blindness | Same-executable guardian could avoid mixed-version protocol, but upgrade/startup compatibility is untested. |
| S7 Wrong layer | Cleanup failures cannot disappear into detached stderr. Caller-visible diagnostics and next-session handling need design. |
| S8 Guard-derived cells | Matrix must derive from lifecycle orderings, not only happy EOF. Launch, leader-first and isolation cells required. |
| S9 Test pins wrong thing | Current probes demonstrate an unfixed bug. Stand-in success is not production integration proof; mutation checks belong after a candidate exists. |
| S10 Claim from prose | Rejected SwiftShader inference and optimistic helper guarantees. Only actual command evidence supports observed claims. |
| S11 Asymmetric consumers | Guardian IPC must not grant stronger path/PGID authority than the launcher validated. No protocol exists yet. |
| S12 Primitive-contract mismatch | EOF from daemon is not universal owner-death containment. Guardian-first counterexample blocks that promise. |
| S13 Invocation-state collapse | Keep session and idle-configuration semantics unchanged; ordinary same-session state was measured. No flag omission reinterpretation authorized. |

## Decision and next bounded step

**Reshape.** The frame is sound; no high-risk shape has cleared its flags. Per-browser pre-launch guardian is the narrowest direction worth another spike, not an approved implementation. Do not breadboard, slice, or start a product patch on this receipt.

Before Pass to detail: production-equivalent lease inheritance and death-at-launch-phase matrix; leader-first whole-tree cleanup and PGID reuse safety; two-session/attached-browser/user-profile isolation; graceful-close vs EOF coordination; Linux Tokio-thread regression and Windows non-regression; explicit guardian-death and temp-profile policy. Investigate the unexplained high-CPU symptom separately using a captured Chrome CPU profile and exact Chrome/version/workload from a reporter.

Review Gate receives R0-R11 and all unverified boundaries if a future shape passes. No implementation correctness verdict is issued now.

## Related work and duplication guard

`xref 1371 --repo vercel-labs/agent-browser --depth 2 --no-snapshot` completed with exit 0. Read-only graph, depth limited, not a complete backlog audit. Relevant competing direction: [#1152](https://github.com/vercel-labs/agent-browser/pull/1152), @shtefcs, sentinel process, OPEN/CONFLICTING at `2b34a3b19fed0bb5c2ef854d15160e7f54bfe498`. Audit and credit that candidate before proposing a replacement. No patch was read in this blind gate.

[#1585](https://github.com/vercel-labs/agent-browser/pull/1585), @jadenfix, OPEN/CONFLICTING, latest targeted head `567572edb61882323ecc3086021b80faa052774b` supersedes the graph's earlier observed head. Its idle-timeout intent overlaps merged #1605; state/counts do not prove code redundancy. The graph also reports file overlap (9 files) with open `lawrencecchen/agent-browser#1`; inspect before duplicating or closing either.

All open graph nodes named for follow-up, not actioned: vercel-labs/agent-browser #1371, #1397, #1401, #1536, #1607, #1710, #1152, #1263, #1334, #1428, #1506, #1585, #1713, #1791, #1854, #885, #896; ChromeDevTools/chrome-devtools-mcp#2621; Kingminghuang/OpportunityRadar#4; lawrencecchen/agent-browser#1. External links were not followed. No issue/PR was closed or modified.

## Verification commands and artifacts

Working directory: `/Users/raillyhugo/Programming/vercel/agent-browser-1371-repro`.

- `cargo build --locked --manifest-path cli/Cargo.toml`: PASS, exit 0, v0.38.1 debug build.
- `bun repro-1371.ts`: PASS as reproduction collection, exit 0, five lifecycle cells; two confirm unfixed leaks.
- `cargo test --locked --manifest-path cli/Cargo.toml idle_timeout -- --test-threads=1`: PASS, exit 0, 17 passed, 0 failed.
- `python3 spike-lifetime.py`: PASS on corrected fixture, exit 0, supports EOF primitive and reproduces both failure schedules.
- `python3 verify-evidence.py`: final PASS, exit 0; 474 archived source files unchanged, all evidence assertions passed, zero remaining test-owned processes/profiles. First verification detected one profile from the failed initial harness attempt; its exact path and creation time were checked, no browser referenced it, and only that directory was removed before rerunning. The earlier wrapper's final exit 0 masked the Python assertion failure, so that wrapper is not counted as a pass. Exact final result: `verification.json`.

Representation: separate observed-result tables and proposed-mechanism chains, rather than a diagram that could blur evidence with design.

Source, scripts, build and browser artifacts stay under `~/Programming/vercel/`. Canonical raw receipts: `browser-results.json`, `lifetime-spike-results.json`. No original checkout user changes were overwritten.
