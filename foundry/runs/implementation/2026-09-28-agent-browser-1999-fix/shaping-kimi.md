# Blind Shaping — Auth-Login Fill: Usable-Control Resolution + Destination-Guaranteed Insertion

Posture: base source only (d01253d, interaction::fill as provided). No candidate PR or sibling branch inspected. Every proposed browser primitive is unverified until probed. Verdicts are binary; uncertainty is flagged, not averaged.

---

## 1. R Table

| # | Requirement | Type | Source | Verification signal |
|---|---|---|---|---|
| R1 | Login completes when an unusable duplicate of username/password/submit precedes the usable visible control in DOM order | Functional | Observed blocker | E2E login, no timeout; values land in visible twins |
| R2 | Each credential enters only its resolved field; no other field's value changes | Functional | Explicit | DOM values of all candidate fields |
| R3 | Stale / nonfocusable / focus-redirected target → error, with zero characters entered into any other field | Functional | Explicit | DOM values + error returned |
| R4 | Rejected fill → no submission (no click, no submit, no navigation) | Functional | Explicit | Navigation/network absence after forced fill failure |
| R5 | Explicit CSS selector contract retained for usable targets | Contract | Explicit | Existing selector tests green |
| R6 | No-navigate same-origin binding and iframe/session routing retained | Contract | Explicit | Same-origin + iframe fill tests |
| R7 | Delayed SPA forms still work | Contract | Explicit | Delayed-render fixture |
| R8 | Ordinary (non-login) fill contract retained | Contract | Explicit | Existing fill test suite |
| R9 | Native inputs and controlled-framework forms (React/Vue/Angular-class) update framework state and pass validation | Contract | Explicit | Probe 1 harness |
| R10 | Bounded retries; every remote handle released on all paths | Constraint | Explicit | Error-path handle audit |
| R11 | No broad framework changes; no backend policy | Constraint | Explicit | Diff scope review |
| R12 | Stale chosen field → error before credential insertion (allowed outcome); retry policy unsettled | Policy | Explicit | Error ordering test |
| R13 | PR recreates external PR with human coauthor credit (Co-authored-by trailer); shaping stays blind | Process | User request | PR metadata (outside shape fit) |

---

## 2. Assumptions Register (flagged uncertainties)

- A1 ⚠ No element-targeted trusted text-insertion primitive exists in stable CDP on Chrome 152; Input.insertText is page/focus-scoped. → Probe 2
- A2 ⚠ Base sends Input.insertText on the parent session_id (not effective_session_id) — intentional frame-focus routing or latent iframe bug. → Probe 7
- A3 🔎 callFunctionOn results are not checked for exceptionDetails in the pasted code; silent JS exceptions are possible today. Verify in full base source at implementation time.
- A4 🔎 The login caller aborts on fill Err (so R4 reduces to "fill must return Err"). Verify caller during implementation.
- A5 ⚠ Usability predicate draft: isConnected && boxes>0 && !disabled && !readOnly && checkVisibility()-pass && !aria-hidden && !inert. Definition frozen only after Probe 4.
- A6 ⚠ Native-setter + input event compatibility with controlled React is established practice but unverified on Chrome 152 / current React. → Probe 1

---

## 3. Shapes

S1 — Atomic element-targeted fill. Resolution picks first usable match; fill is a single Runtime.callFunctionOn on the element handle that synchronously: preflights (isConnected, usability recheck) → focus() → aborts if document.activeElement !== this → clears via native setter + beforeinput/input → re-checks isConnected → sets value via native setter + beforeinput/input → readbacks this.value. No page-level insertion. Destination is this; the ambient-focus hazard class is eliminated, not detected. Cost: events are untrusted (R9 risk).

S2 — Guarded trusted insertion. Keep Input.insertText; add activeElement/identity verification before and after; abort on mismatch. Fatal: the verify→insert gap is two CDP calls; page JS (timers, async re-render) can redirect focus between them. Detection happens only after characters land in a decoy — R2/R3 cannot be made deterministic.

S3 — Trusted-first, atomic fallback. Try S2 with pre-verification; on failure fall back to S1. Inherits S2's race in its trusted phase (→ R3 FAIL strictly); with the trusted phase skipped, it converges to S1 with extra round trips. Doubled test matrix for no guarantee gain.

S4 — Re-verified per-character dispatchKeyEvent. Same ambient-focus dependency per keystroke, slower, IME/composition risk. Rejected.

### Discriminator matrix (binary)

| Shape | R1 | R2 | R3 | R4 | R9 | R10 |
|---|---|---|---|---|---|---|
| S1 | PASS | PASS | PASS | PASS | PASS ⚠⚠ (Probes 1, 6) | PASS |
| S2 | PASS | FAIL (verify→insert race) | FAIL (leak precedes detection) | PASS | PASS | PASS |
| S3 | PASS | FAIL (trusted phase race) | FAIL | PASS | PASS | PASS |
| S4 | PASS | FAIL | FAIL | PASS | PASS | FAIL (per-char overhead/handles) |

Recommended: S1, folding S2's post-fill value readback in as an assertion step.

---

## 4. Parts (S1 decomposition)

P1 — Usable-first resolution (shared). Predicate per A5 applied at resolution. Two modes: FirstUsable (internal login selectors, snapshot refs — skips unusable twins, DOM-order among usable) and Exact (explicit user CSS selectors — matched-but-unusable → typed error, preserving explicit-means-exact semantics). Contract: in selector_or_ref + ref_map + sessions; out (object_id, session) or ElementNotUsable. No polling added here — delayed-SPA waiting stays in the existing wait layer.

P2 — Atomic fill primitive. One callFunctionOn, ordering: preflight → focus → activeElement assert → clear+events → isConnected re-check → set+events → value readback → final isConnected check. exceptionDetails → Err (A3). Every post-dispatch re-check guards against synchronous framework re-render replacing the node mid-call; a post-clear/pre-set staleness abort returns error before credential insertion (R12). Post-insert detachment → honest FillVerificationFailed (nothing leaked; caller decides).

P3 — Error taxonomy + gate wiring. ElementNotUsable | ElementStale | FocusRedirected | FillVerificationFailed. Any Err aborts login before submit (depends on A4 🔎).

P4 — Submit control path. P1 predicate reused for submit resolution; click on stale/hidden submit → typed error. No-navigate same-origin binding untouched.

P5 — Handle lifecycle + retry scaffolding. RAII release guard (Runtime.releaseObject) covering resolve-then-error paths; retry budget knob with default deferred to D1. Iframe session map unchanged.

P6 — Verification hooks + fixtures. Post-fill DOM value readback exposed for E2E assertions (discriminator = real input-event targets and field values, not CLI exit code). Fixtures: duplicate hidden+visible login, SPA node-replacement, focus-trap redirect, delayed render, React-controlled form.

---

## 5. Fit Check — S1 (binary; ⚠ pending probe, 🔎 verify-in-source, ❓ open decision)

| R | Verdict | Flag |
|---|---|---|
| R1 | PASS | ⚠ Probe 4 (predicate edge cases) |
| R2 | PASS | ⚠ Probe 2 confirms no handler-mediated cross-write by our primitive |
| R3 | PASS | ⚠ Probes 2, 3 (redirect detection, detached-handle behavior) |
| R4 | PASS | 🔎 A4 caller-abort check |
| R5 | PASS | Note: selector matching only unusable elements now errors typed instead of failing silently — intentional contract hardening, ❓ D3 |
| R6 | PASS | ⚠ Probe 7 (iframe fill after parent-session insertText removal, A2) |
| R7 | PASS | ⚠ Probe 4 delayed-form fixture (wait layer untouched) |
| R8 | PASS | ⚠ Probe 1 across vanilla + frameworks (mechanism changes for all fills) |
| R9 | PASS | ⚠⚠ load-bearing: synthetic events, Probes 1 + 6; failure triggers S3-contingency revisit |
| R10 | PASS | ⚠ Probe 5 (releaseObject on detached handles) |
| R11 | PASS | Diff confined to resolution, fill, sequencing |
| R12 | PASS | ❓ D1 retry default unsettled |
| R13 | PASS | Packaging step, outside shape |

Overall: conditional GO — blocked only on Probes 1, 2, 3, 6 (load-bearing); 4, 5, 7 are confirmatory.

---

## 6. Open Decisions (surfaced, not decided)

- D1 — Stale-retry policy (packet: unsettled): (a) zero retries, return error immediately; (b) bounded retry with full re-resolve, budget 1–2 attempts.
- D2 — Predicate strictness for opacity:0, offscreen, overlay-covered controls: strict-unusable vs lenient; Probe 4 data informs.
- D3 — Explicit-selector + only-unusable matches: typed error vs skip-to-next-match.

---

## 7. Recommended Probes

| # | Question (unknown) | Method | Pass signal |
|---|---|---|---|
| 1 | Does atomic native-setter + beforeinput/input update controlled-framework state and pass login validation? (A6, R9) | Minimal vanilla/React/Vue/Angular-class harness pages, Chrome 152, via CDP | State updates, submit enables, event order beforeinput→input, final values correct — all rows |
| 2 | Destination guarantee under adversarial focus (A1, R2/R3) | Page with focus-redirect-to-decoy handler + setTimeout(0) re-render; run atomic primitive and old insertText path side by side | Atomic: FocusRedirected/Err, decoy untouched; old path leak documented as PR evidence |
| 3 | Detached remote-handle semantics (U2) | Resolve node, replace it (key change / innerHTML swap), then callFunctionOn on stale handle | Deterministic stale-detection method chosen (isConnected vs backendNodeId compare) with recorded behavior |
| 4 | Usability predicate definition (A5, R1, D2) | Matrix: display:none, visibility:hidden, opacity:0, offscreen, zero-size, disabled, readonly, aria-hidden, inert, overlay-covered, password-manager decoys | Intended usable twin chosen every row; predicate frozen; latency measured |
| 5 | Exceptions + cleanup (U3, R10) | Force throws per phase; audit release paths; releaseObject on detached handles | All throws typed Err; no handle accumulation on any path |
| 6 | Trusted-event gating prevalence (R9 contingency trigger) | Synthetic fill against representative real IdP login pages/staging | Fill accepted; if failures common → reopen S3-contingency decision |
| 7 | Iframe/session routing (A2, R6) | Fill in same-origin iframe and OOPIF without parent-session insertText | Element-scoped ops on effective_session_id suffice; no regression |

---

## 8. Packaging Note (R13)

PR recreates the external auth-login PR with the human credited via Co-authored-by trailer. This shaping was performed blind; the implementer receives this artifact as a clean-room spec. Probe outputs, not the examined implementation, are the evidence base.