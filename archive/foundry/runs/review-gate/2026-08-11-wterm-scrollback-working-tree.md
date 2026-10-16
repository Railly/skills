# Review Gate: wterm scrollback working tree

Status: incomplete only because exact-head coverage requires a final commit SHA. No commit, push, or PR was authorized.

Base: `a360d2138b09e58830e69e50619f2aad54e5b01f`

Working-tree diff SHA-256: `e50647c96135c231bd06ef96434537976186e9df80a707a5e580e0c5a3081e1e`

## Outcome

No unresolved code finding remains in the working tree. Review findings fixed in this pass:

1. Playwright could reuse an unrelated server on port 4173 and could test stale `@wterm/dom/dist`. The web server now builds the package and never reuses an existing process.
2. Public DOM claims did not scope browser find and accessibility to mounted rows after virtualization. Root and DOM docs now state the mounted-window boundary and selection exception.
3. Third-party cores without optional `getScrollbackDiscardedCount()` could retain stale visible rows when their full ring rolled over at a constant count. The fallback now re-reads the window, with force-red coverage.
4. The Ghostty patch verifier required the increment but not reset or rollback of `discarded_rows`. All three transitions are now required and the patch is idempotent.

## Contract exercised

- Output already at bottom follows the exact bottom.
- Reading history disables auto-follow.
- Terminal input returns to the bottom.
- Resize preserves the first visible history row.
- Built-in and Ghostty rollover expose cumulative discarded rows.
- Visible DOM stays bounded under 1,200 lines of output.
- Native selection keeps its selected range mounted.
- Third-party cores without the optional rollover signal refresh visible rows correctly.

## Verification

- Package tests: 14/14 tasks.
- Core: 63 tests.
- DOM: 125 tests.
- Ghostty: 42 tests.
- Build: 15/15 tasks.
- Type-check: 22/22 tasks.
- Lint: 11/11 tasks, with one pre-existing docs warning.
- Format: pass.
- Playwright: 14/14.
- Built-in WASM SHA-256: `4ec1e7785e84cbfc59bfbbd9f6dab43944fd586cb267dee000e75b9d48a0b0c4`.
- Ghostty WASM SHA-256: `f49c469033365723ca0bb880870c55afd65a4a97d24a95eff025cdc76f4ac6ae`.
- Ghostty patch idempotence: pass.

## Force-red evidence

- Virtualization unit mutation: 1,000 rows mounted instead of 30.
- Rollover unit mutation: visible row stayed `AA` instead of refreshing to `BB`.
- Anchoring unit mutation: `scrollTop` stayed 340 instead of moving to 289.
- Optional-core fallback mutation: row stayed `AA` instead of refreshing to `BB`.
- Browser virtualization mutation: 1,000 mounted rows violated `<100`.
- Browser input mutation: terminal remained 2,755 px away from the bottom.

All mutations were restored and the green checks reran.

## Deterministic gate

- Callers: pass. Every `getScrollbackDiscardedCount` caller is in the diff.
- Style: exempted. Em dashes are established README punctuation in wterm.
- Surfaces: exempted. Existing docs pages changed, but navigation and page titles are unaffected because no route was added or renamed.
- Doc siblings: acknowledged. Changelog and versions remain release-only; code/test hits do not carry competing public behavior. Root, package, API, Ghostty, and vanilla docs were read and aligned.
- Covered: pending. HEAD is still the base commit and the implementation is uncommitted.

## Radius

The map reports 17 changed and 78 impacted symbols with 31 convergence items, but zero resolved edges and 3,362 unresolved calls. It materially under-covers the graph, so it was used only for orientation. Full suites and direct subsystem inspection supplied the verification.

## Exemptions claimed

- No changelog or version edit: releases are manual and maintainer-controlled.
- No docs navigation or page-title edit: no page was added or renamed.
- Em dashes: existing wterm README house style.

## Issue candidates

- None outside the working-tree scope.

## Remaining gate

After an authorized commit, rerun Review Gate against that exact SHA. Any code change, rebase, or force-push retires this working-tree report.
