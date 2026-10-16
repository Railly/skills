# Scoped final A — narrow post-readiness scope (2026-09-18)

Continuation of my own shaping line: `contract-a.md` → `shapes-a.md` → `final-a.md`, all retained unchanged and still valid under the broad frozen contract. This document evaluates the **explicitly narrowed** N0–N6 scope from `scoped-input.md` only. Read: `scoped-input.md`, my `final-a.md`, `decision.md` (canonical S1–S13 names). Not read: `final-b.md`, `shapes-b.md`, `contract-b.md`, network, env, credentials. No source edits, no tests written or run, no GitHub action.

## Shapes under narrow scope

**K** = Simon's diff as-is (f89be85): after readiness, `child.stderr.take()` into a detached named thread running `io::copy(_, sink())` to EOF; handle and results discarded.

**K′** = the shape I recommend building in the separate coauthored PR: K's mechanism unchanged, plus the delivery parts the narrow contract itself demands.

| Part | Mechanism | Flag |
|---|---|:--:|
| **K1** | Take remaining `child.stderr` after readiness selection, before `ChromeProcess` construction (aff6125 insertion point `chrome.rs:904–906`) — Simon's, kept verbatim | |
| **K2** | `io::copy` to `sink()`: O(1) memory, byte-level, indifferent to invalid UTF-8 and newline-free chunks — Simon's, kept verbatim | |
| **K3′** | Spawn failure becomes visible instead of silent: on `Builder::spawn` `Err`, one line through the existing `writeln!(std::io::stderr(), …)` convention already used at `chrome.rs:774,1053`. No retry, no supervisor, no framework | |
| **K4** | Fallback-readiness sessions keep today's closed read end; the "Chrome tolerates EPIPE" line stays **reported**, not restated as verified | ⚠️ |
| **K5** | Windows uses the existing `Child.stderr: Option<File>` (`windows_process.rs:50`), `Read`-compatible by construction; runtime pass is a delivery obligation | ⚠️ |
| **K6** | Deterministic regression at the real launch boundary that fails on unchanged base | |
| **K7** | Repetition check for reader resources across ordinary relaunches | |
| **K8** | PR text names the excluded defects and the third-party-writer limitation explicitly | |

Deliberately **not** included: bounded retention (A1), readiness decoupled from the diagnostic tail (A3), and any cancellation/stop-signal mechanism (A5). A5 is excluded by human decision, not by my analysis; my broad-scope artifacts keep it on record.

## Fit check (N × K, K′)

| Req | Requirement | Status | K | K′ |
|---|---|---|---|---|
| N0 | Once primary DevToolsActivePort readiness is observed, arbitrary-volume stderr must not prevent ordinary commands from progressing | Core | ✅ | ✅ |
| N1 | Preserve existing readiness selection and startup error/status diagnostics, without claiming to fix pre-readiness or fallback limitations | Must | ✅ | ✅ |
| N2 | Ordinary commands omitting launch flags retain the same browser/session/page state; no restart workaround | Must | ✅ | ✅ |
| N3 | Post-ready handling retains no unbounded diagnostic buffer or file, accepts arbitrary bytes and newline-free chunks, and keeps CLI stdout/JSON clean | Must | ✅ | ✅ |
| N4 | Ordinary managed browser close/relaunch releases its output reader resources after owned writers exit, without adding a caller wait for EOF. Verify repetition rather than inferring cleanup from a single exit code | Must | ❌ | ✅ |
| N5 | Preserve attached-browser ownership, process-group/Job Object cleanup, profile, retry and idle behavior; do not introduce global daemon state | Must | ✅ | ✅ |
| N6 | Tests exercise the real launch boundary and fail on unchanged base; user-visible continuity must be demonstrated with a real browser | Must | ❌ | ✅ |

**Notes.** N0 for K is measured, not inferred: base `open` no response in 12 s (returncode -15) versus 2.76 s / 1.13 s / 1.35 s with five commands at exit 0. N4 for K is ❌ only on the requirement's own verification clause — the *design* is now in scope (detached reader, EOF after owned writers exit, no caller wait), but repetition was never measured, and the requirement forbids inferring cleanup from one exit code. K′ N4 ✅ is design fit whose falsifier is VT2: if ordinary Chrome relaunches leak readers, K′ fails N4 and must change, per `scoped-input.md`. N6 for K is ❌ because the PR adds no tests. N3 needs no bounded-buffer work because the sink lane is bounded by construction — this is exactly the part of my A2 that survives, and `line-limit-probe` (1 MiB before any post-read cap) is why I do not reintroduce `read_until` here.

## Design unknowns vs implementation proof owed

Design unknowns (cannot be closed by writing code): K4 EPIPE tolerance on the fallback path, and whether any real Chrome configuration keeps a writer alive past group/Job teardown. Both stay documented limitations, not deliverables.

Implementation proof owed (VT = verification target, all inside the separate PR):

- **VT1 / K6** — regression at the launch boundary via the existing custom-executable seam: fixture publishes a valid readiness artifact, then floods stderr well past pipe capacity; a subsequent ordinary command must succeed. Must be shown red on unchanged aff6125 and green with the patch (S9).
- **VT2 / K7** — repetition: ≥5 ordinary open/close cycles in one daemon, sampling daemon thread count and open descriptors before, between and after. Pass = flat, no monotonic growth. This is the N4 falsifier; it is not a general cancellation requirement.
- **VT3 / K3′** — assert the degraded path is visible when thread spawn fails. Minimal handling only. I considered dropping the handle instead (closing the read end, mirroring the fallback state) and reject it as default: it relies on the unverified EPIPE claim (S10).
- **VT4 / K8** — PR text names the exclusions verbatim: pre-readiness bursts, fallback indefinite line/EOF read, bounded startup diagnostics, #1371 sustained CPU; states no universal cancellation is claimed.
- **VT5 / K5** — Windows stated as design-covered, platform verification pending; no macOS run is presented as a Windows pass.
- **VT6 (cheap, optional)** — record group CPU during a `--v=1` post-ready hold so the always-consume forward effect stays honest without implying a #1371 fix.

## S1–S13 dispositions under narrow scope

S1 Over-reach: respected — K′ adds five delivery parts, no logging system, no reaper, no flags. S2 Under-reach: preburst is now explicitly out of scope and must be named, not silently absorbed. S3 Direction inheritance: primary and fallback dispositions stay separate; K′ claims the primary lane only. S4 Proxy property: VT1 asserts post-ready command progress, not port-file existence; no line read is treated as a bound. S5 Unregistered peer: the reader still has no registration in `ChromeProcess`; under N4 that is acceptable by design but must be proven by VT2, not asserted. S6 Peer-version blindness: no external protocol; Windows remains a delivery gate. S7 Wrong layer: status-42 diagnostics continue to reach CLI JSON, unchanged. S8 Guard-derived cells: the narrow matrix is derived from readiness ordering and byte volume, not one verbose flag. S9 Wrong test: the blocking gap — VT1 must convert the external probe into a maintainable in-tree regression. S10 Claim from prose: the author's hours-long block, beachball and EPIPE statements stay credited as reported; the PR comment should be trimmed to what this run executed. S11 Asymmetric consumers: sink interprets nothing and gains no authority; preserve if the lane ever grows retention. S12 Primitive mismatch: post-ready consumption is not whole-startup coverage; the PR text must not blur that. S13 Invocation-state collapse: VT1's continuity check passes launch flags only on `open` and asserts PID/target/marker continuity with no relaunch.

## Verdict

**Pass to detail — yes, under the explicit narrow N0–N6 scope, for K′ only.** K as-is is ✅ on N0, N1, N2, N3, N5 and ❌ on N4 and N6; both gaps are verification deliverables, not mechanism changes, so the shape needs no redesign. Simon Ellefsen is credited as the source of the mechanism (K1, K2) and belongs as human coauthor on the separate PR; #1527 stays untouched — no modify, close, comment, merge or release.

Blocking conditions carried into detail: VT1 and VT2 must pass before any Review Gate; if VT2 shows normal relaunch leakage, K′ fails N4 and returns to shaping. Not blocking, and not to be quietly upgraded to green: Windows runtime (VT5), the K4 fallback lane, and every defect listed in the exclusions.
