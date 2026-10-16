# Independent shaping B, feedback revision

**Date:** 2026-09-17  
**Base:** `aff6125c023b810ea3f2e5deec5379e9a4270bdc`  
**Launch metadata:** parent-selected model `openai/gpt-5.6-sol`; self-reported exact model ID unavailable  
**Inputs:** frozen packet, isolated source, and `probe-feedback.md` only. The initial `shaping-b.md` is preserved unchanged.

## Evidence update

The browser matrix confirms the current defect on macOS: SIGKILL leaves twelve owned Chrome-group processes and the temporary profile through six seconds, while close, SIGTERM, and explicit three-second idle cleanup succeed. Ordinary commands preserve JS/title/URL continuity. Blank-page CPU stayed low; animation raised expected workload CPU. This supports lifecycle scope, not a CPU fix.

The stand-in spike proves two narrower facts: post-launch registration has a real ordering hole, and a guardian that owns a child before readiness can preserve it while the daemon lives and kill it after daemon EOF on the tested macOS fixture. It does not establish production FD inheritance, whole-tree behavior after leader exit, profile authority, Linux/Windows behavior, valid latency, or guardian-first containment. Therefore no shape currently earns high-risk Pass.

## Revised requirements (R)

| ID | Requirement | Status |
|---|---|---|
| R0 | A locally launched Chrome tree must not remain indefinitely after confirmed daemon death, including uncatchable termination. | Core goal |
| R1 | CLI exit and disconnect must preserve named-session process, target, page, and JS state while the daemon lives. | Must-have, baseline evidenced |
| R2 | Kill authority covers locally launched Chrome even with an explicit user profile, but must exclude attached browsers, other sessions, and deletion of user profile paths. Named-profile copies remain owned temporary data. | Must-have, revised |
| R3 | Preserve close, SIGTERM, restore, one-hour default idle, and explicit-zero behavior. | Must-have, baseline partially evidenced |
| R4 | Ownership must follow process lifetime, never temporary Tokio worker lifetime. | Must-have |
| R5 | Make no CPU, GPU, blank-page, or omnibox fix claim. Do not change GPU/backgrounding flags. | Must-have |
| R6 | Cleanup authority must exist before local Chrome spawn; no spawn-to-registration gap. | Must-have, ordering hole evidenced |
| R7 | Retain authority over the exact launched tree after leader-first exit without authorizing a reused PGID. | Must-have, unprobed |
| R8 | Cover macOS and Linux without weakening Windows process cleanup; Windows profile deletion needs separate handling from Job Object process death. | Must-have, unprobed |
| R9 | Live-but-wedged daemon cleanup and pre-registry historical orphans remain out. | Out |
| R10 | Cleanup must have a finite measured bound independent of future CLI invocation. | Undecided, no valid latency yet |
| R11 | Delete or durably mark only agent-created temporary profiles after hard death. | Undecided, unprobed |
| R12 | Authority must derive from retained handles/channels, not PID existence or stale registry text. | Must-have |
| R13 | Whether guardian death, or simultaneous guardian/daemon hard death, requires automatic containment is unresolved and must be selected explicitly. | Undecided, observed residual gap |

## Revised shapes and flags

### A: Post-launch lease reaper

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Daemon launches Chrome, then registers PGID/profile with an EOF watcher. | ⚠️ |
| A2 | Watcher kills the group and cleans owned temporary data on EOF. | ⚠️ |

A1 is experimentally refuted: daemon death before registration leaves the child alive. A2 lacks leader-first identity proof.

### B: Per-browser launch guardian

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Guardian establishes daemon EOF channel before it launches local Chrome. | ⚠️ |
| B2 | Guardian retains child/group authority through leader-first exit and readiness handoff. | ⚠️ |
| B3 | Guardian kills local Chrome for explicit-user-profile launches but deletes only guardian-created temp or named-profile-copy paths; attached browsers bypass it. | ⚠️ |
| B4 | Existing graceful close, restore, and idle paths coordinate with guardian without later PGID reuse kills. | ⚠️ |
| B5 | Platform paths cover macOS/Linux and preserve Windows process plus profile cleanup. | ⚠️ |
| B6 | Guardian-first or simultaneous hard death follows an explicitly selected containment contract. | ⚠️ |

The macOS stand-in supports B1’s primitive, but not its production protocol. Every listed ownership mechanism remains flagged.

### C: Session supervisor owns daemon and local browsers

| Part | Mechanism | Flag |
|---|---|:---:|
| C1 | Supervisor starts daemon and launches every local Chrome before registration handoff. | ⚠️ |
| C2 | Supervisor retains per-tree handles, profile provenance, and session isolation. | ⚠️ |
| C3 | Daemon exit triggers bounded cleanup; supervisor exit has selected containment. | ⚠️ |

C avoids post-launch registration in concept but none of its expanded daemon/IPC authority is probed.

### D: Persistent orphan registry and future sweep

| Part | Mechanism | Flag |
|---|---|:---:|
| D1 | Persist daemon, tree, and profile identities. | ⚠️ |
| D2 | A later invocation validates and cleans records. | ⚠️ |

D cannot identify historical non-recorded orphans and has no autonomous bound.

## Binary fit check

| Req | Requirement | Status | A | B | C | D |
|---|---|---|:---:|:---:|:---:|:---:|
| R0 | Local Chrome tree cannot indefinitely survive daemon hard death. | Core goal | ❌ | ❌ | ❌ | ❌ |
| R1 | Preserve live-daemon multi-command continuity. | Must-have | ✅ | ❌ | ❌ | ✅ |
| R2 | Kill owned process, preserve external processes and user profile data. | Must-have | ❌ | ❌ | ❌ | ❌ |
| R3 | Preserve close, SIGTERM, restore, and idle semantics. | Must-have | ✅ | ❌ | ❌ | ✅ |
| R4 | Follow process, not Tokio worker, lifetime. | Must-have | ✅ | ❌ | ❌ | ✅ |
| R5 | No CPU/GPU/backgrounding claim or flag change. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R6 | Establish authority before spawn. | Must-have | ❌ | ❌ | ❌ | ❌ |
| R7 | Handle leader-first exit without PGID reuse risk. | Must-have | ❌ | ❌ | ❌ | ❌ |
| R8 | Cover macOS/Linux and preserve Windows process and file cleanup. | Must-have | ❌ | ❌ | ❌ | ❌ |
| R9 | Exclude live wedge and historical orphan expansion. | Out | ✅ | ✅ | ✅ | ❌ |
| R10 | Finite measured autonomous cleanup bound. | Undecided | ❌ | ❌ | ❌ | ❌ |
| R11 | Clean only agent-created temporary profiles. | Undecided | ❌ | ❌ | ❌ | ❌ |
| R12 | Use retained authority, not stale PID records. | Must-have | ❌ | ❌ | ❌ | ❌ |
| R13 | Explicit guardian-death containment contract. | Undecided | ❌ | ❌ | ❌ | ❌ |

Any flag forces failure. B and C no longer receive optimistic passes.

## Eight adversarial dispositions

1. **Post-launch sentinel:** refuted; A fails R0/R6.
2. **Leader-first death:** unresolved; B2/C2 flagged until retained whole-tree authority and reuse safety are demonstrated.
3. **User profiles:** requirement corrected. Kill locally owned Chrome; preserve explicit profile path. Delete named-profile copies only as agent-created temp data.
4. **Registry:** rejected as primary and excluded for historical orphans; future sweeps lack a bound.
5. **Windows:** Job Objects establish process death only. Profile cleanup remains unproved and flagged.
6. **Guardian death:** residual leak observed. R13 added; no generalized owner-death claim.
7. **Missing validation:** attached isolation, profile sentinel, leader-first exit, production launch phases, Linux, and Windows are mandatory before Pass.
8. **Flags and idle:** no GPU/backgrounding changes and no replacement or shortening of shipped idle policy.

## Verdict: Reshape

B remains the narrowest direction to investigate, not a recommendation to detail or implement. Required spikes are: production-equivalent pre-spawn FD/handle inheritance; daemon-death launch-phase matrix; leader-first whole-tree cleanup with reuse safety; attached, explicit-profile, and named-profile-copy isolation; graceful-close race; valid same-clock latency; guardian-first contract selection and containment probe; macOS/Linux execution plus Windows process and filesystem validation. Until those resolve B1-B6 without flags, no shape passes.