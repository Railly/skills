# Case: Terminal mouse support is a browser interaction contract

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-09
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/107, merge commit `5c1282d35d6ffbe03aad35cfcf2645e493da7406`

## Observed condition or claim

PR #107 added SGR mouse and focus input for modes 1000, 1002, 1004, and 1006. Parser support and correct escape encoding were necessary but insufficient because the browser owns focus, native selection, pointer topology, layout geometry, auxiliary buttons, and document boundaries.

## Red signal

Successive reviews found failures outside the initial encoding matrix:

- release outside the terminal could be lost, or a drag entering from outside could be emitted
- scrollback, padding, and spare fixed-column width could shift coordinates
- iframe-owned terminals listened on the wrong window
- multi-button capture stopped after the first release
- invalid geometry could arm an orphan release
- Shift tracking removed native text selection
- focus reporting arrived after the mouse gesture
- browser navigation buttons fell through as left clicks
- repeated style reads remained on the drag path

Each implementation looked correct when judged only as terminal protocol encoding. The failures appeared when the browser's native contracts were added to the input domain.

## Method used

1. Traced mode state through both committed WASM cores and the shared `TerminalCore` interface.
2. Built a browser-event matrix across press, drag, release, vertical and horizontal wheel, supported and unsupported buttons, modifiers, blur/refocus, owner window, multi-button chords, invalid geometry, and outside bounds.
3. Measured coordinates from rendered active cells instead of scaling across the root or history-containing grid.
4. Armed capture only after a valid emitted press and retained it until the supported pressed-button set reached zero.
5. Focused the hidden textarea before delivering the first mouse report after blur.
6. Preserved Shift as the browser-native text-selection escape hatch.
7. Used cached measured cell geometry on the hot drag path.
8. Rebuilt both first-party WASM artifacts and integrated current `main`, including #105 and #106, before the final exact-head gate.

## Outcome

PR #107 merged on August 9, 2026.

- Built-in and Ghostty cores expose compatible mouse/focus state.
- SGR press, drag, release, and both wheel axes are encoded.
- Capture survives leaving the terminal and respects the element's browsing context.
- Multi-button chords retain capture until all supported buttons are released.
- Native Shift selection remains available.
- Focus reports precede the first mouse press after blur.
- Unsupported navigation buttons fail closed.
- Coordinates remain tied to active rendered cells across padding, scrollback, and spare host width.
- The measured drag path avoids repeated style reads.
- The combined #105, #106, and #107 tree passed the full repository gate.

## Evidence

- Source: PR #107 at final head `9170742fa0c03184323d15e0a38ce18f1cb6efc9`; merged as `5c1282d35d6ffbe03aad35cfcf2645e493da7406`.
- Runtime: built package and committed WASM event drives covered both cores, active-grid geometry, outside release, outside-start rejection, owner window, button chords, unsupported buttons, native Shift selection, and focus ordering.
- Tests: `input-mouse.test.ts` contains 16 focused event-pipeline cases. The final combined run passed core 62, DOM 112, Ghostty 27, React 14, Vue 24, and Chromium E2E 12 of 12.
- Review: ctate approved the feature branch; after the signed integration commit, CI, Vercel Agent Review, Vercel deployment, and Socket checks passed.
- Artifact: built-in ReleaseSmall WASM matched the committed binary; Ghostty's committed WASM exposes the new mode accessors; the exact-head Review Gate is `foundry/runs/review-gate/2026-08-09-wterm-9170742.md`.

## Transferable lesson

For a browser-hosted protocol feature, regenerate the test domain from both owners of the behavior. Terminal semantics define which bytes to emit; browser semantics define when an event is valid, which default behavior must survive, where coordinates originate, which document owns capture, and what happens across focus and button lifecycles. Testing only the protocol half repeatedly ships browser regressions with correct escape sequences.

## Exceptions

Modes 1003, 1005, 1015, and 1016 remain outside this PR's declared subset. The repository's current browser E2E suite does not yet assert DEC mouse reports in a real engine; the interaction matrix is covered at the DOM-event and committed-WASM layers.

## Candidate changes

- Behavior eval: add a real-browser DEC mouse/focus fixture covering native Shift selection, owner-document capture, focus-before-press ordering, fixed-column spare width, and unsupported auxiliary buttons.

## Confidentiality review

All retrieval handles are public GitHub commits, checks, tests, and pull-request state. No private chat, local path, customer data, or internal environment identifier is included.
