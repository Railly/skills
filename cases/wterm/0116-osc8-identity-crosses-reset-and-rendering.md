# Case: OSC 8 identity crosses reset and rendering

Status: reviewed
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-08-12
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: PR #116, commits `19e62cb`, `efd556e`, and `4852dde`; Review Gate reports `2026-08-12-wterm-19e62cb`, `2026-08-12-wterm-efd556e`, and `2026-08-12-wterm-4852dde`

> The implementation and review are complete; upstream maintainer acceptance remains pending while PR #116 is open.

## Observed condition or claim

Native OSC 8 support crossed parser, cell storage, two WASM adapters, viewport and scrollback rendering, browser navigation, reset lifecycle, and mouse-event ownership.

## Red signal

Independent review found that RIS reused built-in link indices while scrollback and the JS cache retained old identities, malformed OSC 8 input kept a previous link active, tracked clicks could also navigate, and a failed Ghostty buffer growth could decode from address zero. After PR #115 merged, Vercel Agent Review found that the Ghostty scrollback cell encoder no longer set the hyperlink content bit even though the viewport encoder did. CI then showed that rebuilding virtualized rows during resize destroyed the browser scroll geometry and clamped the anchored offset to zero.

## Method used

Model hyperlink identity as host-lifetime state, clear active links on every invalid OSC 8 path, resolve Ghostty metadata through the owning page, make `linkKey` an opaque render boundary, restrict navigation to absolute HTTP(S), and give SGR mouse tracking ownership of plain clicks. For resize, capture the logical scroll offset before renderer setup destroys the DOM, preserve the first value through coalesced resizes, and restore it after the rebuilt spacers exist.

## Outcome

PR #116 exposes optional resolved link metadata through `CellData` and renders native anchors across viewport and bounded scrollback DOM windows. The built-in and Ghostty cores preserve semantic identity across wide cells, styles, overwrite, erase, alternate screen, RIS, scrollback, and reflow. Commit `efd556e` merges PR #115 and restores the Ghostty scrollback hyperlink bit. Commit `4852dde` preserves the anchored history row across renderer rebuilds and coalesced resizes.

## Evidence

- Source: commits `19e62cb`, `efd556e`, and `4852dde`; PR #116; Vercel Agent Review discussion `r3770128887`; CI run `31639767747`
- Runtime: Zig 0.16 for the built-in core; Ghostty WASM built with Zig 0.15.2 in Docker
- Tests: Zig 37; core 69; DOM 134; Ghostty 48; browser E2E 14/14 serial; isolated resize E2E 5/5
- Review: Claude Fable independent pass produced four confirmed findings before `19e62cb`; Vercel Agent Review produced one confirmed scrollback encoder finding after PR #115 merged
- Artifact: rebuilding the defective Ghostty source made the linked-scrollback regression fail with `undefined`; restoring the content bit and rebuilding made it pass. Removing resize preservation made the regression receive scroll offset 0 instead of 600; restoring it passed including coalesced resizes. The integrated browser artifact rendered two anchors inside virtualized scrollback while mounting 20 of 180 history rows.

## Transferable lesson

An opaque numeric identity is safe only when its lifetime matches every consumer that retains it. Source and committed WASM are also one contract: rebuild before testing, or an older correct artifact can hide a broken source tree. DOM geometry is likewise state: preserve the logical value before teardown because the browser may rewrite the physical value synchronously.

## Exceptions

The Ghostty metadata cache is not pruned with scrollback rollover.

## Candidate changes

- Reference rule: record host-lifetime identity, invalid-input fail-closed behavior, click ownership, zero-pointer scratch-buffer guards, source-to-WASM rebuild ordering, and logical scroll preservation across destructive DOM rebuilds as wterm subsystem invariants.

## Confidentiality review

Public repository, public PR, public commit, and sanitized technical evidence only. No private paths, internal chat, credentials, or employer-only context are included.
