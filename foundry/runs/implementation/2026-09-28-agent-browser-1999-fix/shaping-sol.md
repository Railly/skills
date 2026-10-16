# Independent Shaping — Auth Login Target Integrity

## Boundary

Recreate the external auth-login change without inspecting the candidate PR or sibling branches, while independently fixing the verified blocker in `interaction::fill`.

**In scope**

- Selection of visible, usable duplicate login controls.
- Destination-safe credential filling.
- Rejection of stale, detached, nonfocusable, or focus-redirected targets.
- Submission gating after fill failure.
- Compatibility with existing fill and login contracts.
- Bounded retry and CDP/DOM cleanup.
- Human coauthor credit.

**Out of scope**

- Broad interaction-framework rewrites.
- Backend authentication or policy changes.
- Silent retargeting after a field has been chosen.
- Using CLI-reported login success as proof of correct behavior.

---

## R — Requirements Table

| ID | Requirement | Acceptance evidence |
|---|---|---|
| R0 | Recreate the behavior independently from base `d01253d9db28d75080e36da3c1c31ef89454731e`. | No candidate PR or sibling branch is consulted. |
| R1 | Login discovery must bypass preceding unusable username, password, or submit controls and choose visible usable controls. | A hidden/disabled/nonfocusable duplicate preceding a usable control remains untouched; the usable control receives the credential or click. |
| R2 | Username and password must each go only to the exact field selected for that credential. | Real DOM event targets and final field values identify the selected username/password elements. |
| R3 | A selected field that becomes detached, stale, nonfocusable, or focus-redirected must fail rather than sending text to another field. | Replacement-on-focus and focus-redirection fixtures return an error; decoys and the other credential field remain unchanged. |
| R4 | Clearing or input-event callbacks must not allow later page-level insertion to use a changed focus target. | Replacement during the clear `input` event produces an error before credential insertion. |
| R5 | Rejected username or password fill must prevent form submission. | Submit click and submit event counts remain zero after either fill rejects. |
| R6 | Hidden or unusable controls must remain untouched. | Their values and input/change event counts remain unchanged. |
| R7 | Explicit CSS selector behavior must remain supported and must not silently switch to a different matching element after resolution. | Existing selector tests pass; a resolved explicit target is either filled or rejected as that identity. |
| R8 | Existing no-navigation same-origin binding must remain supported. | Existing same-origin binding scenarios retain their session/frame behavior. |
| R9 | Delayed SPA forms must retain their existing discovery/wait contract. | A delayed form can be discovered and filled without extending destination retries into silent retargeting. |
| R10 | Ordinary fill must retain useful native input and controlled-form behavior. | Expected native input events occur and representative controlled inputs observe the new value. |
| R11 | The implementation must support bounded retries and cleanup. | No unbounded loop; temporary listeners/state and remote object handles are released on success, rejection, CDP error, and navigation. |
| R12 | Correctness must be determined from actual event targets and values, not only the CLI success result. | Tests record `beforeinput`/`input` targets, selected-object identity, connection state, and all relevant values. |
| R13 | No broad framework or backend-policy changes. | Diff remains local to login candidate selection, fill targeting, submission gating, tests, and necessary CDP parameter/result types. |
| R14 | The resulting contribution must include human coauthor credit. | Final commit contains a valid `Co-authored-by: Name <email>` trailer supplied by the human contributor. |
| R15 | Retry policy must never select another field after credential insertion has started. | Once a target identity is chosen, stale/rejected fill terminates without credential-level retargeting. Pre-insertion discovery retry remains bounded and separately defined. |

---

# Shapes

## Shape A — Guarded Native CDP Insertion

Preserve `Input.insertText` for native browser behavior, but arm a destination guard before invoking the page-level insertion.

### Parts

#### A1. Candidate selection

For inferred auth controls:

1. Enumerate matching username, password, and submit candidates.
2. Reject candidates that are detached, hidden, disabled, readonly where applicable, or not focusable.
3. Select a usable candidate and preserve its exact DOM identity.
4. Do not apply this enumeration as a global reinterpretation of explicit CSS selector semantics.

#### A2. Atomic preflight, focus, clear, and guard installation

Use one synchronous `Runtime.callFunctionOn` against the selected object to:

1. Capture the selected object identity.
2. Verify attachment and usability.
3. Focus it.
4. Verify that focus remained on that exact object.
5. Clear it and dispatch the existing compatible input notification.
6. Revalidate attachment, usability, and focus after synchronous clear callbacks.
7. Install a temporary capturing `beforeinput` guard bound to the exact object.
8. Record event target, cancellation state, and insertion outcome in temporary state.

If focus or the clear event replaces/redirects the field, return an error before inserting the credential.

#### A3. Native insertion

Call `Input.insertText` only after the guard is armed.

The guard:

- Allows insertion only when the event’s real target is the selected object.
- Cancels an event targeting any other element.
- Records whether a qualifying event occurred.

Whether Chrome 152 emits a cancelable `beforeinput` for this CDP primitive is **unverified**.

#### A4. Postcondition and cleanup

After insertion:

1. Read guard results.
2. Verify the input event targeted the selected object.
3. Verify the object is still attached and its value is the requested value.
4. Remove the guard and temporary state.
5. Release the remote object in a finally-style path.

Any missing event, wrong target, disconnection, or value mismatch is a fill failure.

#### A5. Submission gate

Submit only after both credential fills return verified success. A rejected or uncertain fill must not reach the submit action.

### Strengths

- Retains native CDP text insertion if the Chrome guard contract holds.
- Directly addresses focus changes occurring between clear and insertion.
- Provides evidence from actual event targets.
- Keeps login selection separate from generic fill targeting.

### Main risk

The shape depends on unverified Chrome behavior: `Input.insertText` must emit a synchronously cancelable event before mutation, and cancellation must prevent insertion into a redirected target.

---

## Shape B — Synchronous Native-Setter Transaction

Move focus, clear, insertion, event dispatch, and validation into one synchronous function called on the selected object.

### Parts

1. Capture and validate the selected object.
2. Focus and verify exact focus.
3. Clear using the appropriate native prototype value setter.
4. Dispatch the compatible input event.
5. Revalidate after clear callbacks.
6. Set the credential using the native prototype setter on the captured object, never through `activeElement`.
7. Dispatch the input event.
8. Verify connection, identity, and value.
9. Return structured success or failure.
10. Release the remote object on all paths.

Separate prototype setters would be needed for `HTMLInputElement` and `HTMLTextAreaElement`. Unsupported editable targets would retain an explicitly defined legacy or rejection path rather than being accidentally treated as inputs.

### Strengths

- Destination is structurally the captured object rather than whichever element owns focus later.
- Focus and clear callbacks cannot redirect the subsequent setter to another field.
- No temporary document-wide listener is required.

### Main risks

- Controlled-form compatibility is unverified.
- It may differ from real browser editing in `beforeinput`, selection, input type, validation, and framework observation.
- A handler can replace the element during the credential `input` event. Postvalidation can reject submission, but the credential was already written to the now-detached selected object.
- Extending this mechanism to all ordinary editable targets could become an unwanted generic framework change.

---

## Shape C — Synchronous `execCommand("insertText")` Transaction

Perform focus, validation, selection/clear, and `document.execCommand("insertText", false, value)` synchronously from `Runtime.callFunctionOn`.

### Parts

1. Capture the selected element.
2. Focus and verify exact focus.
3. Clear and revalidate after callbacks.
4. Arm an event-target observer or guard.
5. Execute `insertText` synchronously.
6. Verify event target, connection, and resulting value.
7. Clean up temporary state and handles.
8. Gate submission on verified success.

### Strengths

- Removes the CDP round trip between focus validation and text insertion.
- Potentially preserves browser editing behavior better than direct property assignment.

### Main risks

- `execCommand` is deprecated and its exact Chrome 152 behavior is unverified.
- Event ordering, cancelability, controlled-input compatibility, and target guarantees require probes.
- It may not support all existing ordinary-fill targets consistently.

---

# Binary Fit Check

`1` means the shape contains a credible mechanism for the requirement. `0` means it does not. A flagged `U` means the binary fit is conditional on an unverified browser primitive or missing delivery fact.

| Requirement | Shape A | Shape B | Shape C | Flag |
|---|---:|---:|---:|---|
| R0 Independent recreation | 1 | 1 | 1 | — |
| R1 Usable duplicate selection | 1 | 1 | 1 | Shared selection part required |
| R2 Exact credential destination | 1 | 1 | 1 | A: U1, C: U3 |
| R3 Reject stale/focus-redirected target | 1 | 1 | 1 | A: U1; C: U3 |
| R4 Clear callback cannot redirect insertion | 1 | 1 | 1 | A: U1 |
| R5 No submit after rejected fill | 1 | 1 | 1 | — |
| R6 Unusable controls untouched | 1 | 1 | 1 | Selection tests required |
| R7 Explicit CSS selectors retained | 1 | 1 | 1 | Must keep selection change login-specific |
| R8 Same-origin binding retained | 1 | 1 | 1 | U4: frame/session probes required |
| R9 Delayed SPA forms retained | 1 | 1 | 1 | Retry boundary must remain outside insertion |
| R10 Native/controlled compatibility | 1 | 1 | 1 | A: U2; B: U5; C: U3 |
| R11 Bounded retry and cleanup | 1 | 1 | 1 | A/C require listener cleanup probes |
| R12 Real event/value evidence | 1 | 1 | 1 | — |
| R13 Narrow scope | 1 | 1 | 1 | B risks expansion if generalized |
| R14 Human coauthor credit | 1 | 1 | 1 | U6: identity absent from packet |
| R15 No post-selection retargeting | 1 | 1 | 1 | Exact pre-insertion retry count unsettled |

## Uncertainty Register

- **U1 — Guard contract:** Does Chrome 152 emit a cancelable `beforeinput` for `Input.insertText`, and does cancellation reliably prevent wrong-target mutation?
- **U2 — Native event contract:** Does guarded `Input.insertText` preserve expected native and controlled-form behavior across inputs, textareas, and supported ordinary-fill targets?
- **U3 — `execCommand` contract:** Targeting, event ordering, controlled-input compatibility, and continued Chrome support are unverified.
- **U4 — Frame/session behavior:** The guard must observe events in the effective target document while insertion retains the existing parent-session contract.
- **U5 — Native setter compatibility:** Prototype setter plus synthetic input may work for common controlled inputs but is not established by the packet.
- **U6 — Coauthor identity:** The required human name and email are not present. The trailer cannot be finalized without them.
- **U7 — Retry policy:** Exact no-retry behavior is unsettled. The safe shaped boundary is no retargeting after exact target selection; delayed discovery may retain a small bounded retry budget.

---

# Recommended Shape

Proceed with **Shape A only if probes P1–P4 establish the guard contract**. It best preserves native insertion while preventing page-level insertion from following redirected focus.

If cancellation or target observation is unreliable, do not ship Shape A based on CLI success. Evaluate Shape B against the controlled-form compatibility probes. Shape C remains an exploratory fallback, not an assumed solution.

The baseline retry policy should be:

- Existing bounded waiting may continue before selecting a login field.
- Once an exact field object is selected, do not choose a replacement for that credential.
- A stale or redirected chosen object returns an error.
- No submission follows the error.

---

# Recommended Probes

## P1 — `Input.insertText` event contract

For a normal input, record:

- `beforeinput` target, `inputType`, data, and cancelability.
- `input` target and value.
- Value before and after insertion.

Repeat with a capturing `beforeinput` listener that calls `preventDefault()`.

**Required result for Shape A:** cancellation prevents value mutation.

## P2 — Focus redirection

Fixture: focusing the chosen password input synchronously focuses the username field or a decoy.

Verify:

- Preflight rejects.
- No credential-bearing `beforeinput` or `input` occurs.
- Username, password, and decoy values remain unchanged.
- Submit does not occur.

## P3 — Replacement during clear

Fixture: clearing and dispatching the clear `input` event replaces the selected field and focuses another field.

Verify:

- The post-clear identity/attachment check rejects.
- Credential insertion is never invoked.
- Replacement and decoy values remain empty.
- Submit does not occur.

## P4 — Redirect between arming and insertion

After the guard is installed, synchronously or at the earliest available task boundary redirect focus to another input before `Input.insertText`.

Verify:

- The other input receives no text.
- Guard evidence identifies the wrong target or absence of the intended target.
- Fill returns an error.

## P5 — Replacement during credential input

Replace the selected field from its credential `input` handler.

Verify:

- Event target is the originally selected field.
- No other field receives the credential.
- Postcondition notices disconnection/replacement and rejects submission.

## P6 — Controlled and native inputs

Run ordinary and login fill against:

- Plain `<input>`.
- `<textarea>`.
- Native setter interception.
- A representative controlled-input fixture that rerenders on input.
- Inputs with `beforeinput` and `input` handlers.
- Any currently supported non-input editable target.

Record event order, targets, input type, values, rerender result, and selection behavior.

## P7 — Duplicate controls

For username, password, and submit independently, place before the usable control:

- Hidden duplicate.
- `display:none` duplicate.
- Disabled duplicate.
- Readonly credential duplicate.
- Detached candidate.
- Focus-redirecting candidate.
- Zero-sized or otherwise non-interactable candidate.

Verify only the chosen usable controls receive values/events and only the chosen submit control activates.

## P8 — Explicit selectors

Exercise explicit selectors with:

- One match.
- Multiple matches.
- A stale resolved first match.
- A focus-redirected match.

Verify there is no silent switch to another match after object resolution.

## P9 — SPA and same-origin frame regression

Repeat successful and stale-target cases for:

- Delayed form creation.
- Form replacement during initialization.
- Existing no-navigation same-origin binding.
- A same-origin iframe using the established effective-session/parent-session behavior.

## P10 — Cleanup and bounded failure

Force failures at each CDP step:

- Resolution.
- Preflight.
- Clear.
- Guard installation.
- Insertion.
- Postcondition read.
- Navigation/session loss.

Verify temporary listeners/state are removed where the context survives, remote handles are released, retries terminate, and no submission occurs.

## P11 — Correctness oracle

Every blocker regression must assert:

1. Selected element identity.
2. `beforeinput` and `input` event targets.
3. Username, password, decoy, hidden, and replacement values.
4. Attachment state.
5. Submit event count.

A CLI “login succeeded” result alone must never satisfy the test.

## P12 — Coauthor metadata

Before finalizing the recreated contribution, obtain the human contributor’s exact name and email and add:

```text
Co-authored-by: Human Name <human@example.com>
```

The frozen packet does not contain enough information to produce the real trailer.