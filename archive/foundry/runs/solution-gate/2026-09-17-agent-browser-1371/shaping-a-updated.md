# Shaping A — revision after probe feedback (agent-browser #1371)

**Reviewer model:** `anthropic/claude-opus-5`, selected by parent launch metadata; self-reported exact id unavailable.
**Inputs:** `frozen-input.md`, `probe-feedback.md`, and isolated source at base `aff6125c023b810ea3f2e5deec5379e9a4270bdc` only. No sibling artifacts, no candidate diff, no new execution.
**History:** `shaping-a.md` preserved unchanged. This supersedes its fit check.

**Verdict: Reshape.** No shape is fully evidenced. My prior B/F passes on R0 were not earned.

---

## 1. What the feedback changed in my model

| # | Prior position | Corrected position |
|---|---|---|
| C1 | Sentinel (B1) registers ownership at launch; primitives already in repo, so no flag | **Refuted.** The spike forced the spawn-to-registration schedule and the stand-in survived. Post-launch registration is a structural hole, not a timing risk. |
| C2 | Leader identity guard + `killpg` = whole-tree cleanup | **Unproven.** A helper that exits when only the leader exits leaves group children. Retain-and-reap and leader-first death are untested. |
| C3 | Explicit `--profile` launches write no ownership record (so no cleanup) | **Wrong direction.** The process is still owned and must die; only the *profile path* is excluded from deletion. Named-profile copies (`agent-browser-profile-<uuid>`) are agent-created temp dirs and remain deletable. |
| C4 | Registry sweep (C) cleans pre-existing orphans | **Refuted.** A registry added today cannot identify orphans that never wrote it, and it adds persistent-state cost. |
| C5 | Windows job object already satisfies R10 | **Wrong.** Kill-on-close covers processes, not temp-profile deletion. Windows CURRENT also fails file cleanup. |
| C6 | Guardian shifts agency outside the daemon → owner-death guarantee | **Bounded only.** Guardian-dies-first leaves the stand-in alive. No blanket guarantee. |
| C7 | EOF-on-owner-death is a sound primitive | **Supported, narrowly.** Confirmed on macOS in fixture only: not production FD inheritance, not Linux. SIGSTOP correctly did not fire (matches my P8 prediction). |
| C8 | CPU claims separate | **Reinforced.** Blank cells carried a WebGL renderer-query canvas; animated cell 9.1% is workload. `--enable-unsafe-swiftshader` does not imply software rendering (ANGLE Metal, M5 Pro). No unexplained blank-page spin observed. |

Unchanged and now probe-confirmed: `close` and SIGTERM clean fully; explicit idle 3000 ms cleans at 4 s; SIGKILL leaves twelve group processes reparented to PID 1 with a retained profile; multi-command continuity held (`reused=true`, `restartedBackground=false`) in all five cells.

---

## 2. Requirements (revised)

| ID | Requirement | Status |
|---|---|---|
| R0 | Owned Chrome tree must not remain indefinitely after confirmed daemon death, including uncatchable termination | Core goal |
| R1 | Multi-command sessions retain state across CLI exits while the daemon lives | Must-have (probe-confirmed for CURRENT) |
| R2a | Never terminate an attached/external browser or another session's browser | Must-have |
| R2b | Never delete a user-supplied persistent profile path; **still terminate the owned process** for such launches | Must-have (restated per feedback 3) |
| R3 | Keep close/SIGTERM cleanup and restore behavior; do not shorten, replace, or lean on the shipped idle policy to solve daemon death | Must-have (feedback 8) |
| R4 | Respect process lifetime, not Tokio worker-thread lifetime | Must-have |
| R5 | Lifecycle and CPU claims stay separate | Must-have |
| R6 | Cleanup agency must exist outside the daemon image or in the kernel | Must-have |
| R7 | Kills gated by owner identity surviving pid/pgid reuse | Must-have |
| R8 | Do not perturb daemon readiness/reuse contract or session discovery | Must-have |
| R9 | Preserve the Windows job-object **process** guarantee; no thread-scoped Linux lifetime | Must-have |
| R10 | Dispose of agent-owned temp profiles after hard death, on **all** platforms, as a mechanism distinct from process kill | Must-have (new scope) |
| R11 | Preserve CDP surface: WS reuse, stream/inspect, extensions, discovery, attach | Must-have |
| R12 | `close --all` / `kill_stale_daemon` forced kills must stop orphaning | Must-have |
| **R13** | Cleanup must terminate the **whole owned group**, not just the Chrome leader; leader-first exit must not strand children | Must-have (new, feedback 2) |
| **R14** | Ownership/lease must be established **before Chrome exists**, so no window exists between spawn and registration | Must-have (new, feedback 1) |
| **R15** | Any cleanup agent's own death scope must be explicit and documented, not generalized from daemon death | Must-have (new, feedback 6) |
| U1 | Bounded cleanup latency target | Undecided (no valid latency receipt; first measurement discarded) |
| U2 | Wedged-but-alive daemon coverage | Undecided (SIGSTOP deliberately does not fire) |
| U3 | Delete vs. durably mark temp profile after hard death | Undecided |
| U4 | Cross-invocation idle-override semantics | Undecided; 17 idle tests cover parser mechanics only |
| **U5** | Whether simultaneous guardian+daemon hard kill needs automatic containment | Undecided (feedback 6) |
| Out | Instant kill on CLI exit; CPU root cause; GPU/backgrounding flag changes | Out |

---

## 3. Shapes and flags (revised)

**A — kernel lifeline fd (`--remote-debugging-pipe`):** unprobed. Dual-transport acceptance and Chrome-side shutdown-on-EOF remain ⚠️. Delivers no file cleanup (R10).

**B — post-launch sentinel (my original):** ⚠️ B1 registration gap (refuted by fixture), ⚠️ B3/B4 leader-first and whole-tree reap, ⚠️ B2 profile-vs-process exclusion was wrong. Withdrawn as specified.

**C — registry + sweep:** no flags, but no bounded autonomous guarantee and no retroactive reach; persistent-state cost. Backstop at best.

**F — B+C composition:** inherits every B flag. Withdrawn.

**G — pre-established guardian lease (reshaped candidate):**

| Part | Mechanism | Flag |
|---|---|---|
| G1 | Guardian process created **before** Chrome spawn; holds the lease read end; daemon holds the only write end. No post-hoc registration | ⚠️ production FD inheritance (setsid daemon, piped stderr, CLOEXEC) untested |
| G2 | Guardian retains group ownership and reaps the **whole** group; explicitly does not exit on leader-only exit | ⚠️ leader-first group exit untested |
| G3 | Identity guard: recorded pgid + leader start-time token, refuses to signal on mismatch | ⚠️ live pid/pgid-reuse refusal untested |
| G4 | Kill the owned group for every owned launch, including `--profile`; delete only recorded agent temp dirs (`agent-browser-chrome-*`, `agent-browser-profile-*`) | ⚠️ live user-profile and attached-browser isolation untested |
| G5 | File cleanup as a separate step on all platforms, including Windows | |
| G6 | Guardian-death scope documented as a stated residual (U5), not silently covered | ⚠️ residual observed in fixture |

**D (browser-side watchdog)** and **E (supervisor inversion)** remain rejected: D has no reliable self-termination and violates R2a/R11; E fails R8 and reproduces the defect one hop out.

---

## 4. Fit check (binary; flagged = ❌)

| Req | Requirement | CURRENT | A | B | C | F | G |
|---|---|---|---|---|---|---|---|
| R0 | No indefinite survival after daemon death | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| R1 | Session state across CLI exits | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| R2a | Never kill attached/external browser | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| R2b | Never delete user profile; still kill owned process | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| R3 | Keep close/SIGTERM/idle policy untouched | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| R4 | Process lifetime, not worker-thread lifetime | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| R5 | Lifecycle and CPU claims separate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| R6 | Agency outside the daemon image | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| R7 | Identity-guarded kills | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| R8 | Readiness/reuse contract intact | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| R9 | Windows process guarantee; no Linux thread lifetime | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| R10 | Temp-profile disposal on all platforms | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| R11 | CDP surface preserved | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| R12 | Forced-kill paths stop orphaning | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| R13 | Whole-group cleanup, not leader-only | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| R14 | Lease established before Chrome exists | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| R15 | Cleanup agent's own death scope explicit | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Notes.** CURRENT fails R2b because hard death deletes nothing while the process survives, and fails R10 on Windows too (C5). A fails R9/R11/R13 by flag: unprobed transport change, unknown helper-process behaviour. B fails R14 outright (fixture-proven), and its R2a/R7/R13 rest on untested mechanisms. C fails R0/R12 (no bounded autonomous guarantee, no retroactive reach). G is the strongest direction but every ✅ it would need for R0/R2a/R2b/R7/R13 depends on a ⚠️ part, so it cannot be scored as a pass; R14 is ❌ because pre-spawn lease inheritance is designed, not demonstrated, in production.

---

## 5. Disposition of the eight adversarial questions

| # | Question | Disposition |
|---|---|---|
| 1 | Spawn-to-registration gap | **Accepted as failure.** B/F withdrawn. New R14. G1 is a pre-spawn lease, still ⚠️ until production FD inheritance is shown. |
| 2 | Leader-exit helper strands children | **Accepted.** New R13. G2 changed to retain-and-reap whole group; scored ❌ pending leader-first test. |
| 3 | `--profile` process still owned | **Accepted, prior position corrected.** R2b restated: exclude the path from deletion, not the process from death. Named-profile copies are deletable agent temp dirs. |
| 4 | Registry cannot reach pre-existing orphans | **Accepted.** My F2 rationale is withdrawn; C is a bounded convenience with persistent-state cost, not a backstop. |
| 5 | Job objects ≠ file cleanup | **Accepted.** R10 widened to all platforms; my Windows-parity claim retracted. |
| 6 | Guardian death scope | **Accepted.** New R15 and U5; G6 states the residual instead of generalizing. |
| 7 | No live attached/user-profile/leader-first/launch-phase/Linux/Windows validation | **Accepted.** These are why R2a, R2b, R7, R8, R9, R13 are ❌ for G; source inspection is not evidence of behaviour. |
| 8 | Do not touch GPU/backgrounding flags or idle policy | **Accepted.** No shape changes them. R3 strengthened; R5 reinforced by the WebGL/ANGLE finding. |

---

## 6. Recommendation

**Reshape**, direction G (pre-established guardian lease with whole-group retain-and-reap and platform-independent file cleanup). Do not pass to detail.

Required spikes before any Pass, each disposable and non-production:

1. **S-LEASE:** production-shaped FD inheritance — daemon spawned `setsid` with piped stderr, lease write end `CLOEXEC`, guardian created before Chrome spawn; owner SIGKILL at the pre-spawn, mid-spawn, and post-ready phases (launch-phase matrix). Must show no surviving group in any phase.
2. **S-TREE:** leader-first death — kill the Chrome leader only, confirm the guardian still reaps remaining group members and then exits.
3. **S-IDENT:** recycled pgid refusal, executed live, plus a second concurrent session that must remain untouched.
4. **S-ISO:** attached `--cdp` browser and explicit `--profile` launch under owner SIGKILL: external browser survives; owned `--profile` process dies; user profile directory intact.
5. **S-FILE:** temp-profile disposal after hard death on macOS, plus the Windows path where kill-on-close provides no deletion; decides U3.
6. **S-PLAT:** Linux (thread-lifetime regression, #1157 class) and Windows (job-object preservation) validation.
7. **S-LAT:** re-measure cleanup latency entirely in one clock to settle U1; the earlier value stays discarded.

U2 and U5 remain open and must be answered by decision, not by mechanism drift. No implementation, tests, or browser execution performed in this revision.
