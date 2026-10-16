# Solution Gate: agent-browser PR #1683 BrowserContext isolation

- Date: 2026-09-09
- Repository: `vercel-labs/agent-browser`
- Mode: candidate audit
- Trigger: security finding, multiple material lifecycle and authority shapes, and an existing candidate implementation
- Candidate PR: `#1683`
- Candidate base: `219c47a9dab1776f320d11e66ce934fd239b2cb7`
- Candidate head: `5b2b1cc6b0b03b584799fe89d0a61f46df5d1355`
- Base snapshot: `/tmp/agent-browser-pr-1683-base.Rm7iTX`
- Candidate snapshot: `/tmp/agent-browser-pr-1683.UWq3tK`
- Frozen evidence packet: `/tmp/solution-gate-agent-browser-1683-evidence.md`
- Reconciled contract: `/tmp/solution-gate-agent-browser-1683-contract-v1.md`
- Contract SHA-256: `d3448fa670767a5eff29c2c2d80e94b865c3e6047323192600ca766f6c9639d9`
- Solution Gate skill revision: `77fdde3e8d7e13b7c27c7660f7c15619839e38af`
- Execution mode: `native_subagent`
- Degraded from: `null`
- Schema failures: `1` initial invalid multi-agent argument shape; corrected without retrying the invalid schema
- Blind reviewer families: `gpt-6-astra`, `gpt-5.6-sol`
- Verdict: **Reshape; candidate disposition: Amend toward Shape A′**

## 0. Candidate seal

The two blind reviewers received only the base snapshot and the evidence-only packet. They did not receive the candidate diff, candidate commit, candidate tests, PR body, or review discussion before reconstructing the contract and generating shapes. The candidate was opened only after both blind shaping artifacts existed.

No repository source files were modified. The report and temporary evidence packets are review artifacts outside the target repository.

## 1. Frozen contract

An isolated browser session must constrain authentication and network authority to targets in its owned BrowserContext. The reported failure is that credentials configured by an isolated session reached a target in another BrowserContext.

The settled requirements are:

| ID | Requirement | Status |
|---|---|---|
| R0 | BrowserContext ownership bounds every isolated authentication and network-control action. | Core goal |
| R1 | Configured credentials succeed on an owned target's authentication challenge. | Must-have |
| R2 | Foreign targets receive no isolated credentials, routing, filtering, or header changes, including targets created before isolation and navigated later. | Must-have |
| R3 | Foreign and unknown targets do not remain blocked by debugger waits or Fetch interception introduced by the isolated session. | Must-have |
| R4 | Ownership semantics remain consistent across discovery, command processing, browser and recursive attachment, control installation, and Fetch event handling. | Must-have |
| R5 | Owned pages, popups, workers, service workers, shared workers, and out-of-process iframes retain their required existing behavior. | Must-have |
| R6 | Duplicate discovery or attachment does not duplicate effective control setup; recording remains a distinct attachment with its existing lifecycle. | Must-have |
| R7 | Detachment, destruction, reattachment, and reconnect cannot reuse stale authority to control a foreign target. | Must-have |
| R8 | Missing, malformed, or unusable ownership evidence does not authorize isolated credentials or controls. | Must-have |
| R9 | Ordinary commands and supported recovery preserve logical-session continuity and state according to existing binding, update, clear, and restore semantics. | Must-have |
| R10 | Non-isolated behavior, isolated storage and visibility, and explicit close/restart cleanup retain their existing contracts. | Must-have |

The must-not-change set includes existing non-isolated navigation, tabs, filters, routes, origin headers, proxy authentication, workers, iframes, HAR, recording, session commands, isolated storage and visibility, foreign-target progress, and explicit isolated-context cleanup.

The temporal contract keeps omission distinct from explicit clear and requires multi-command continuity checks across credentials, filters, routes, origin headers, ownership mappings, recording state, and persisted bindings.

## 2. Blind shaping

Both independent passes converged on a shared ownership-admission boundary.

### Shape A: shared ownership registry at the action boundary

Maintain one authoritative relation between target IDs, CDP attachment session IDs, connection generation, attachment role, and `Owned | Foreign | Unknown` authority. Use it in discovery, browser-level and recursive attachment, command-path setup, Fetch authentication, Fetch request resolution, recording exclusions, detachment, destruction, and reconnect.

Unknown ownership fails closed for isolated control authority. Any progress operation must be scoped to the interception or debugger wait introduced by this session, with the exact Fetch completion semantics proven by a protocol probe.

### Shape B: selective attachment after ownership discovery

Avoid broad browser-level auto-attach in isolated mode. Discover and classify targets before attaching, then recursively attach only from admitted owned sessions.

Both passes kept B as an alternative but flagged first-request coverage for popups, workers, service workers, shared workers, and OOPIFs. Discovery timing and metadata availability were not established.

### Rejected inline-guard shape

Independent `owns_target` checks in each existing handler were rejected as a stable design because command setup, background Fetch handling, recursive auto-attach, and cleanup can diverge. A local predicate is insufficient if an effect-producing consumer never calls it.

No blind shape passed the complete fit check before spikes. Shape A was the provisional survivor for investigation.

## 3. Candidate mechanism

The candidate adds a BrowserManager-level context set and a direct predicate:

- `browser.rs:1481-1487` defines `owns_target`. In isolated mode, a target is owned only when its optional `browser_context_id` is present in the owned-context set.
- `actions.rs:1543-1593` filters `Target.targetCreated` and `Target.targetInfoChanged` through `owns_target`.
- `actions.rs:1622-1666` classifies foreign `Target.attachedToTarget` sessions as other sessions, and `actions.rs:1345-1349` resumes those sessions in the command-path drain.
- `browser.rs:706-738` creates or restores the isolated BrowserContext and registers its ID.
- `tab_binding.rs` and `actions.rs:3169-3178, 3324-3349` persist and restore the context ID alongside the target binding.
- `recording.rs:76-99` remains a separate capture attachment, and the candidate's recording E2E preserves that lifecycle.

The candidate's effect-producing background handler remains global:

- `actions.rs:813-871` handles every `Fetch.authRequired` event and supplies the shared proxy credentials, or cancels the challenge, based only on the event session ID.
- `actions.rs:873-948` handles every `Target.attachedToTarget` event. When controls are active, it can prepare the session, install worker/page network controls, recursively call `Target.setAutoAttach`, and then resume the target. It has no ownership check.
- `actions.rs:950-990` handles every `Fetch.requestPaused` event and calls `resolve_fetch_paused` using the shared filters, routes, and origin headers. It has no ownership check.
- `actions.rs:3638-3658` recursively enables auto-attach with `waitForDebuggerOnStart` from the background path.

The candidate therefore implements ownership in the target-discovery and command-drain plane but leaves the Fetch and background-attachment plane outside that boundary.

## 4. Probe log

| ID | Claim under test | Command or source | Observed result | Disposition |
|---|---|---|---|---|
| P1 | Direct context membership is fail-closed for foreign and missing metadata. | `cargo test --manifest-path cli/Cargo.toml test_isolated_target_membership_uses_owned_contexts -- --nocapture` | 1 test passed. `owns_target` accepts owned IDs, rejects a foreign ID, and rejects missing metadata while an isolated primary ID exists. | Narrow predicate survives. It does not cover event routing. |
| P2 | Isolation preserves storage, target visibility, foreign progress, restart binding, and close. | `cargo test --manifest-path cli/Cargo.toml e2e_isolated_contexts_separate_storage_targets_restart_and_close -- --ignored --test-threads=1` | Passed in 3.58s. Foreign target list exclusion and host-side `Runtime.evaluate` progress passed. The test configures no proxy credentials and no `Fetch.authRequired` challenge. | R10 subcases survive. R0-R4 remain untested. |
| P3 | Recording and primary-context cleanup remain compatible. | `cargo test --manifest-path cli/Cargo.toml e2e_isolated_recording_preserves_context_and_close_disposes_primary -- --ignored --test-threads=1` | Passed in 1.44s. | R6/R10 recording subcase survives. Duplicate setup remains untested. |
| P4 | Chrome restart recreates the context and restores state. | `cargo test --manifest-path cli/Cargo.toml e2e_isolated_context_recreates_after_chrome_restart_and_restores_state -- --ignored --test-threads=1` | Passed in 2.47s. | R7/R9 recovery subcase survives. Stale event and network-control transitions remain untested. |
| P5 | Every effect-producing Fetch/background path consults ownership. | `awk`/`rg` over candidate `actions.rs:813-997` for `owns_target` or `browser_context_id`; direct source read at `actions.rs:834-990`. | No ownership guard found. `Fetch.authRequired` always uses shared credentials; `Fetch.requestPaused` always resolves shared policy; `Target.attachedToTarget` can install controls before command-drain classification. | Refutes candidate R0, R2, R3, R4, and R8. This is the confirmed security regression. |
| P6 | Existing isolated regression tests exercise the disputed credential path. | `awk`/`rg` over candidate `e2e_tests.rs:10223-10522` for credentials, proxy, `authRequired`, or Fetch. | No credential, proxy, `Fetch.authRequired`, or Fetch coverage found. | S8/S9 hit. Tests prove adjacent ownership mechanics, not the finding. |
| P7 | Clearing the primary context cannot leave a live isolated handler in permissive shared mode. | Source trace: `browser.rs:1481-1498,1519-1529`. | `owns_target` treats `primary_browser_context_id == None` as shared-mode ownership; disposing the primary context clears that ID. Reachability while handlers remain active is unverified. | Carry as X7 lifecycle seam, not a separate confirmed exploit. |
| P8 | Formatting and the reviewed candidate compile cleanly. | `cargo fmt --manifest-path cli/Cargo.toml -- --check` | Passed. | Mechanical health survives. |

## 5. Forward chain

### Candidate ownership path

1. `owns_target` classifies a `TargetInfo` from BrowserContext metadata. **Observed.**
2. The command drain filters `Target.targetCreated`, `Target.targetInfoChanged`, and `Target.attachedToTarget` using that predicate. **Observed.**
3. Foreign targets are later resumed by `attached_other_sessions`. **Observed.**
4. The background subscription receives the same process-wide attachment and Fetch events independently. **Observed.**
5. That subscription does not consult `owns_target`. **Observed.**
6. With proxy credentials, a foreign `Fetch.authRequired` event receives `ProvideCredentials`. With routes, headers, or filters, a foreign `Fetch.requestPaused` event receives shared policy resolution. A foreign attachment can receive network setup, recursive auto-attach, and a debugger resume before the command drain makes its ownership decision. **Observed from source; runtime impact reported and structurally implied.**

Harmful branches:

- Foreign target has no credential challenge but still receives routing, headers, filtering, or Fetch pause handling.
- Foreign target is attached while `waitForDebuggerOnStart` is active and background setup fails, leaving it paused because only the success branch resumes it.
- Duplicate attachment events can trigger multiple background setup attempts while command-path deduplication remains separate.
- A target with missing context metadata is rejected by the command predicate but remains eligible to the global Fetch handler because Fetch classification has no metadata relation.
- A later reconnect can rebuild context identity correctly while stale background session mappings are still absent, so the same global problem persists across recovery.

## 6. Adversarial comparison

| Dimension | Blind survivor A | Candidate | Delta |
|---|---|---|---|
| Contract observable | One authority decision controls every effect-producing path. | Target discovery and command drain are scoped; Fetch/background paths are global. | Material security gap. |
| Primitive semantics | `target/session/generation -> Owned/Foreign/Unknown` registry. | `TargetInfo -> bool` predicate only. | No Fetch session ownership relation. |
| Authority boundary | Admission before controls, Fetch, recursion, and cleanup. | Admission only in selected command-path consumers. | Asymmetric validation. |
| Foreign progress | Resume only after proving what this session paused and how Fetch completion is safe. | Foreign command-path sessions resume, but background path may pause/control first. | Progress is not proven under disputed path. |
| Worker/iframe/recording | Same registry with target-role exceptions. | Existing workers/iframes/recording are preserved only in paths already using the predicate. | Fetch and duplicate setup remain open. |
| Recovery | Rebuild and invalidate ephemeral mappings by connection generation. | Context binding and recreation persist, but no shared attachment registry exists. | Stale-event handling open. |
| Compatibility | Preserve current context lifecycle while centralizing authority. | Strong context/storage/recording work is reusable. | Amendment is bounded if Fetch completion is solved. |

## 7. Failure-shape scoring

| Shape | Candidate | Selected amendment A′ |
|---|---|---|
| S1 Over-reach | Risk. Context filtering must preserve non-isolated and owned workflows; current positive tests cover only a subset. | Design out with shared/isolated mode distinction and owned/foreign/unknown matrix for every target kind. |
| S2 Under-reach | **Hit.** The candidate closes target discovery and command-drain leakage but leaves Fetch auth, paused-request resolution, and background auto-attach uncontrolled. | Design out with one admission gate consumed by every effect-producing path. This receives extra weight because the candidate fixes a prior security finding. |
| S3 Direction inheritance | **Hit risk.** The candidate handles target-to-command ownership but not the reverse direction from Fetch events to target/session ownership, and does not prove delayed detach/reconnect invalidation. | Require bidirectional target/session mapping and generation invalidation. |
| S4 Proxy property | **Hit.** `owns_target` proves a target-level predicate, while the security property depends on every session-scoped effect consulting that predicate. | Use one registry and test the actual effect-producing commands. |
| S5 Unregistered peer | **Risk.** A new per-session authority registry would need detach, target destruction, recording, reconnect, and cleanup coupling. | Register mappings with explicit lifecycle owners and purge them on every invalidation path. |
| S6 Peer-version blindness | Not confirmed. Persisted context binding is already versioned/rejected in candidate tests; no new cross-process protocol is selected here. | Keep recovery compatible with missing/old binding data and fail closed. |
| S7 Wrong layer | **Hit.** Ownership is decided in the command drain, but the background Fetch handler is the layer that supplies credentials and resolves pauses. | Put authority checks directly before those side effects or behind one shared admission helper. |
| S8 Guard-derived cells | **Hit.** Tests are derived from the target membership helper and storage/visibility paths; they omit `Fetch.authRequired` and `Fetch.requestPaused`. | Derive tests from every consumer: attachment, auth, paused requests, workers, iframes, recording, reconnect. |
| S9 Test pins wrong thing | **Hit.** Existing tests pass while the cross-context credential path remains untested. | Add a force-red auth regression and mutations that remove the shared Fetch gate separately. |
| S10 Claim from prose | Not confirmed for the candidate. The amendment must runtime-probe CDP completion semantics instead of asserting them from API names. | Keep X2 as a required protocol spike. |
| S11 Asymmetric validation | **Hit.** Command-path target events validate ownership; the higher-authority credential and Fetch consumers do not. | Require the same classification strength for all consumers of credentials and policies. |
| S12 Primitive-contract mismatch | Not yet confirmed. The candidate's BrowserContext primitive is appropriate, but the session-scoped Fetch authority relation is missing. | Verify target/session mapping and excluded Fetch completion before selection. |
| S13 Invocation-state collapse | Risk only. Context and restart tests pass, but credential/filter/route/header omission, repeat, change, and explicit clear transitions remain untested. | Add multi-command temporal tests and preserve existing command semantics. |

## 8. Verdict

**Reshape; candidate disposition: Amend toward Shape A′.**

The candidate's BrowserContext creation, persistence, storage/visibility filtering, recording lifecycle, explicit close, and Chrome-restart recovery work is reusable and passed the corresponding probes. The candidate is not acceptable as submitted because its ownership decision does not reach the global Fetch and background attachment handler, which directly controls credentials and paused requests.

The amendment must be a new named shape A′, not a collection of unrelated line guards:

1. Maintain one authoritative `target_id/session_id/connection_generation -> Owned | Foreign | Unknown` registry, with recording role kept separate from page-control authority.
2. Populate and invalidate it before any network-control installation, recursive auto-attach, Fetch authentication, or paused-request resolution.
3. Make the background handler consult the same registry as command-path setup.
4. Fail closed for isolated unknown metadata. Resume or complete only the interception introduced by this session, using protocol behavior established by X2.
5. Deduplicate setup claims and reject stale asynchronous work after detach, destruction, reconnect, or context recreation.
6. Preserve the candidate's context persistence and recovery behavior, but keep unresolved isolation distinct from shared mode.

This is an amendment because the candidate's context ownership strategy and lifecycle work are compatible with Shape A. If X2 or X7 shows that the current Fetch/client boundary cannot safely identify and complete foreign or unknown events, absorb the reusable context work and recreate the network-control shape instead.

## 9. Required spikes before detail or implementation

### X1: authoritative ownership evidence

For pages, popups, workers, service workers, shared workers, and OOPIFs, establish which event or query supplies authoritative BrowserContext identity, when it is available, and what missing metadata means.

### X2: excluded Fetch completion

Using a real local authenticated proxy and dummy credentials, determine how an already-paused foreign or unknown `Fetch.authRequired` and `Fetch.requestPaused` event can be completed without supplying isolated credentials, cancelling another owner's valid flow, or leaving the target paused. Record CDP commands and server observations.

### X3: attachment lifecycle and ordering

Trace duplicate and delayed target create/attach/change/detach/destroy events, recursive attachments, recording's pending attachment, Fetch events, and reconnect. Define generation invalidation and exactly-once setup.

### X4: logical binding and recovery

Separate daemon reconnect from Chrome restart. Verify context identity, target identity or permitted replacement, storage/application state, authentication, recording, and foreign navigability.

### X5: configuration transitions

For credentials, domain filters, routes, origin headers, and proxy auth, test absent, omitted, same, changed, and explicit clear states across two or more commands in one live session.

### X7: primary-context removal

Exercise the interval around primary context disposal or unregistration while the background handler and queued events remain active. Confirm whether shared-mode fallback is reachable and whether it can authorize foreign effects.

## 10. Required regression tests

The minimum regression suite must include:

- Owned authentication: isolated session launches with a local authenticated proxy and dummy credentials; an owned page or worker receives the challenge and succeeds.
- Foreign authentication: create a default-context target before isolated attachment, navigate it after isolated credentials and Fetch controls are active, and assert the proxy/server never observes the isolated username/password.
- Foreign progress: assert the foreign target reaches a known document state and can be controlled by its owner without timeout.
- Control variants: repeat foreign/owned assertions for domain filter, route, origin-scoped headers, and proxy auth independently so one branch cannot hide another.
- Target kinds: owned and foreign page, popup, worker, service worker, shared worker, and OOPIF cases where supported.
- Recording: recording attachment is not mistaken for a second page-control attachment, and detach/stop clears only recording state.
- Duplicate/lifecycle: duplicate attach, delayed detach, destruction, target ID reuse, daemon reconnect, and Chrome restart.
- Missing metadata: synthetic or runtime event with absent `browser_context_id` fails closed for isolated authority and still releases any debugger wait introduced by this session.
- Temporal: configure, omit, repeat, change, explicitly clear, then issue a second command; verify target/context identity, URL, application state, auth, and recording continuity.

Tests must be force-red: deleting the shared Fetch admission gate must fail the foreign credential test; deleting the owned path must fail owned auth; deleting the progress completion must fail foreign navigation; deleting lifecycle invalidation must fail delayed/stale-event tests.

## 11. Smallest auditable visual

### Observed candidate behavior

```text
Target.* event
  -> command drain checks owns_target
  -> foreign session queued for resume

same Target.* / Fetch.* event stream
  -> background handler does not check ownership
  -> installs controls / recursive auto-attach
  -> supplies credentials or resolves paused request
  -> foreign target can be affected before command drain resumes it
```

### Proposed A′ behavior

```text
Target.attachedToTarget / Target.* / reconnect
  -> shared authority registry
  -> Owned: setup + controls + recursion + Fetch handling
  -> Foreign: no isolated controls; release only this session's wait/interception
  -> Unknown: fail closed; resolve progress through proven neutral/owned completion
  -> detach/destroy/reconnect: invalidate generation and purge mappings

Fetch.authRequired / Fetch.requestPaused
  -> same registry lookup
  -> only Owned reaches credentials/routes/headers/filter logic
```

The observed visual is supported by P5 and the source references above. The proposed visual is a mechanism under test, not observed behavior.

## 12. Handoff

Do not implement until X2 and X3 are resolved and the A′ fit check is updated to all ✅. After **Pass to detail**, hand the settled requirements and must-not-change set to Shaping/Review Gate with the carried assumptions and force-red tests above.

Credit to the candidate is preserved for BrowserContext creation, context persistence, storage/visibility isolation, recording lifecycle, explicit close, and Chrome-restart recovery.
