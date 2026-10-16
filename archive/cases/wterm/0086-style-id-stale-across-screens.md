# Case: Read the dependency's contract for the field, not just its type

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-28
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/96, issues #86, #83, #78

> Contributor-validated: before and after measured against two builds of the same wasm module, with regression tests that fail against the previous binary. No independent session reproduced it.

## Observed condition or claim

Three separate reports, filed by three different people over two months, all against `@wterm/ghostty`:

- #86: after running an alt-screen TUI such as `btop` and quitting, cells on the restored primary screen picked up SGR attributes from the alt buffer. Previously plain shell output came back bold and colored.
- #83: highlighting text in vim's visual mode and quitting left grey blocks on the primary screen.
- #78: a dense run of 256-color and truecolor SGR sequences left renderer residue that survived `clear` and resize. Only a full page reload recovered.

Each read as its own rendering bug. #86's reporter had already located the mechanism and named the upstream docstring.

## Red signal

The reporter's claim was checkable against a pinned dependency rather than by reasoning about the symptom. `get_viewport()` in `zig/src/wasm_api.zig` read `style_cells[x]` for every cell and fed it to the foreground color, background color, and flag packing. Upstream ghostty v1.3.1 documents that field as undefined unless the cell carries a non-default `style_id`:

```zig
/// The style data for the cell. This is undefined unless
/// the style_id is non-default on raw.
style: Style,
```

The second half mattered more than the first. `RenderState.update` copies `.raw` unconditionally, then skips the style copy entirely for rows without managed memory, and inside the loop only refreshes `cells_style[x]` when `page_cell.style_id > 0`. An adjacent comment states the cell array is deliberately not reallocated between passes, for performance. So the data was not undefined in the sense of garbage. It was the previous render pass's style, including a pass against a different screen. That distinction is what predicts three specific symptoms instead of one vague one.

## Method used

1. Read the cited upstream source at the pinned version rather than trusting the report or memory. The dependency is pinned by hash in `build.zig.zon`, so the exact file was retrievable.
2. Traced the second mechanism, buffer reuse across passes, which the report referenced but did not quote. This is what turns "undefined" into "stale from the other screen" and makes the three symptoms predictable.
3. Grouped the three issues by mechanism before writing code, and wrote #78 down as a strong hypothesis rather than a confirmed member, since its symptom (residue after `clear`) is one inferential step further than the two alt-screen cases.
4. Rebuilt the committed wasm binary from unmodified sources first. The rebuild was byte-identical to the committed artifact. Only then was a later binary diff attributable to the change.
5. Wrote one headless repro per issue driving the real core, then ran all three against both binaries, counting cells reporting any style after the screen switch.
6. Converted the repros into regression tests that load the real committed wasm rather than a mock, since the defect is in the compiled Zig and a mocked core cannot observe it. Verified they fail against the previous binary.
7. Rendered the before and after grids with inverse resolved the way a terminal paints it, after a first pass under-represented the bug: a leaked style on a blank cell is invisible unless the reverse flag swaps foreground and background into a solid block.

## Outcome

- One gate on `raw.style_id` in `get_viewport`, replacing an unconditional read with a default `Style{}` when the cell carries no style.
- Cells reporting style after the screen switch, same sequences, only the wasm differing: #86 went from 147 of 320 to 3 of 320, #83 from 64 to 0, #78 from 240 to 0.
- The residual 3 in #86 are the cells actually written in red. The gate does not erase legitimate styling.
- #78, recorded as a hypothesis rather than a member, was confirmed by the same fix. Its resistance to `clear` is explained by the mechanism: `clear` produces cells with `style_id == 0`, which are exactly the cells the upstream optimization never refreshes.
- The package had no test setup before this work, so the regression tests required wiring the same test runner the sibling packages use.

## Evidence

- Source: PR #96, one commit. `zig/src/wasm_api.zig` at the cell loop in `get_viewport`. Upstream ghostty v1.3.1 `src/terminal/render.zig`, the `RenderState.Cell.style` docstring and the `RenderState.update` copy loop, read at the version pinned in `build.zig.zon`.
- Runtime: three headless repros driving the real core through the package's public API, each run against the previously committed wasm and the rebuilt one, reporting a styled-cell count per scenario.
- Tests: three regression tests loading the real committed wasm. Against the previous binary they fail with the measured counts (147 against an expected 3, and two nonzero counts against an expected 0). Against the rebuilt binary they pass. Full workspace test, format, lint, and type-check pass.
- Review: none yet. PR open, CI green.
- Artifact: the wasm was rebuilt from unmodified sources first and matched the committed binary byte for byte, establishing that the toolchain reproduces the artifact before any change was attributed to the diff.

## Transferable lesson

> When a field's documented contract is conditional ("undefined unless X"), read what happens to the buffer that holds it. If that buffer is reused across passes rather than reallocated, the value is not garbage, it is the previous pass's value. Stale-across-contexts and undefined predict different symptoms: undefined predicts noise, stale predicts one specific wrong thing appearing where a different context used to be, which is why three reports that looked unrelated were one defect.

Secondary: when the artifact under test is a committed binary, rebuild it unchanged and compare against the committed one before touching anything. Without that baseline a binary diff proves only that two builds differ, not that your change caused the difference. It also silently verifies the toolchain, which mattered here because CI has no drift check for this artifact.

Third: a visualization built to show a defect must be able to show it. The first before-and-after rendered leaked styles onto blank cells, where a foreground color on a space is invisible, so the buggy panel looked correct. Emulating the reverse-video swap the way a terminal does is what made the reported grey blocks appear.

## Exceptions

The fix targets the mechanism, not each reporter's environment. #86 and #83 were reproduced as their reporters described them, through the alt screen. #78's reporter hit it through a live PTY with a specific terminal multiplexer over a tunnel; the repro here reproduces the SGR density and the `clear`, not that transport. The regression tests also cover the mechanism rather than any reporter's exact setup.

## Candidate changes

- Skill method: no change
- Reference rule: when reading a field from a dependency whose docstring makes it conditional, check the lifetime of the buffer that backs it, not just the condition
- Exemplar: no change
- Deterministic check: the repository validates one committed wasm against its sources in CI and not the other. The unguarded artifact is the one this case changed
- Eval: no change
- Coverage gap: the package shipped a compiled core with no test wiring, so nothing in CI could have caught this class
- No change: not selected

## Confidentiality review

Public repository, public issues, public pull request, public upstream dependency at a pinned version. No local paths, no private review text, no third-party identities beyond public authorship of the referenced issues.
