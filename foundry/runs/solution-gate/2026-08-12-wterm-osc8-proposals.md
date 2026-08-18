# Wterm OSC 8 Solution Gate proposals

Date: 2026-08-12
Repository state shown to both proposers: `vercel-labs/wterm` at `a360d2138b09e58830e69e50619f2aad54e5b01f`

Both proposers worked read-only in separate detached worktrees. Neither saw the other proposal.

## Neutral brief

Property violated: Application-supplied OSC 8 hyperlink identity does not survive the terminal-core boundary to the rendered cell range.

Observable that must change: After writing an OSC 8 open sequence, linked text, and an OSC 8 close sequence, exactly the covered terminal cells in the active viewport and after entering scrollback expose the emitted URI and render as a safe clickable link, with no URI on neighboring cells. This must hold for both the built-in core and `GhosttyCore`, including BEL and ST termination and optional `id=` parameters.

Must not change:

- Ordinary output remains non-clickable by default. Regex URL detection is a separate opt-in feature and is not part of this shape.
- Existing `TerminalCore` implementations remain source-compatible.
- SGR styling, full grapheme strings, wide/continuation cells, block glyphs, cursor placement, dirty-row behavior, scrollback virtualization, selection, resize/reflow, alternate-screen isolation, erase, overwrite, and scrollback rollover retain their existing behavior.
- Hyperlink coverage follows cell mutation semantics, with no leakage after overwrite or erase.
- Rendering must not introduce unsafe HTML or allow executable schemes such as `javascript:`.
- No release-version or changelog work is part of this feature shape.

## Proposer A: Fable

### Shape

**Where identity is captured (per core, in existing parse paths):**

- **Built-in Zig core (`src/`)**: OSC 8 already reaches `Terminal.handleOsc` (`src/terminal.zig:1099`) via the existing `osc_dispatch` action; the parser already terminates OSC on both BEL and ST (`src/parser.zig:51-55, 292-296`), so no parser state changes. `handleOsc` gains an `8;params;uri` branch that sets a new `current_link: u16` on `Terminal` (0 = none; empty URI closes). URIs and optional `id=` params are interned in a new fixed-capacity link table (a static module like `scrollback.zig`, referenced by pointer the way `scrollback: ?*Scrollback` is), deduplicated on `(uri, id)` so OSC 8 id semantics collapse to numeric equality inside this core. If the parser buffer truncated the OSC payload (`MAX_OSC` = 512) or the table is full, the link is **dropped**, never truncated — fail-safe toward non-clickable.
- **Where per-cell state lives (built-in core)**: `Cell` (`src/cell.zig`) replaces its two pad bytes with `link: u16` at offset 10. `BYTE_SIZE` stays 12, so `getGridPtr` stride, scrollback line layout, and the JS in-place readers are untouched. `printChar` and `continuationCell` stamp `current_link`; `blankCell` (BCE/erase) carries none. Every mutation path — `setCell`, `scrollUp/Down`, scrollback `push`/`pop`, `setRowFromScrollback`, alt-screen swap — already copies whole `Cell` structs, so coverage, overwrite, erase, reflow, and rollover semantics are inherited rather than reimplemented.
- **GhosttyCore**: Ghostty 1.3.1 already applies `.start_hyperlink`/`.end_hyperlink` through the readonly handler (`stream_readonly.zig:154-155`) and stores per-cell `hyperlink` bits plus per-page `hyperlink_map`/`hyperlink_set` (`page.zig:140-145`). The gap is purely the export layer: `packages/@wterm/ghostty/zig/src/wasm_api.zig` sets content_flags bit 1 (byte 13, currently only bit 0 = grapheme) from `raw.hyperlink` in both `encodeCell` and the inline `get_viewport` copy, and adds `get_viewport_hyperlink` / `get_scrollback_hyperlink` exports mirroring the existing grapheme readback pair (RenderState row pins for the viewport; the same `pin.up()` walk `get_scrollback_line` uses for scrollback; `page.lookupHyperlink` + `hyperlink_set.get`). Returned bytes encode `uri \0 explicit-id`. The committed `wasm/ghostty-vt.wasm` is rebuilt via the existing `rebuild-wasm` script.

**Cross-component contract (`packages/@wterm/core/src/terminal-core.ts`)**: `CellData` gains two **optional** fields — `linkUri?: string` and `linkId?: string`. No new methods, no required members: existing third-party `TerminalCore` implementations compile and behave exactly as before (undefined = no link). `WasmBridge.getCell`/`getScrollbackCell` read the u16 at offset 10 and resolve through a JS `Map<number, string>` cache; `GhosttyCore` mirrors its `_readGrapheme` pattern with `_readHyperlink` plus string interning so equal links share string instances.

**Who owns which decision:** cores own *identity capture and per-cell delivery* (verbatim URI, no policy). The renderer (`packages/@wterm/dom/src/renderer.ts`) owns *clickability and safety*: in `_buildRowContent`, the link key (`linkUri\0linkId`) becomes part of the run key exactly like style; a link change breaks the run, and all output for same-link cells (text runs, wide-cell spans, block-glyph spans, cursor splits) is emitted between one `<a class="term-link" rel="noopener noreferrer" target="_blank">` open/close. The `href` is emitted only when `new URL(uri)` parses and the protocol is allowlisted (`http:`, `https:`, `mailto:`, `ftp:`); otherwise the cells render as today's plain spans (URI still exposed on `CellData`, absent from the DOM). Attribute and text both go through the existing `escapeHTML` (which escapes `"`). Scrollback rows reuse `_buildRowContent`, so scrollback linking is free. Nothing auto-links unlinked text — regex detection stays a separate feature. Mouse-tracking apps already `preventDefault()` clicks (`input.ts:360`), so anchors are inert under mouse mode, and normal clicks keep the existing focus behavior (`wterm.ts:75-79`).

### Predictions

1. **Active viewport, exact coverage, both cores.** A parity test writes `"\x1b]8;;https://example.com\x1b\\click\x1b]8;;\x1b\\ here"` and asserts `getCell(0, c).linkUri === "https://example.com"` for c = 0..4 and `undefined` for c >= 5, on both `WasmBridge` and `GhosttyCore`. Run: `pnpm --filter @wterm/ghostty test`.
2. **Scrollback.** Same write followed by enough linefeeds to enter history; `getScrollbackCell(offset, c).linkUri` exposes the URI on exactly c = 0..4 for both cores. Run: `pnpm --filter @wterm/ghostty test`.
3. **BEL vs ST and `id=`.** BEL and ST twins produce identical coverage, and `id=k1` yields `linkId === "k1"` on covered cells only. Run: `pnpm --filter @wterm/core test` and the Ghostty parity tests.
4. **Overwrite/erase, no leakage.** Overwrite without an active OSC 8 and erase leave `linkUri === undefined` on previously covered cells. Run: `pnpm test`.
5. **Third-party source compatibility.** Existing structural core mocks that never set link fields compile and pass unmodified. Run: `pnpm --filter @wterm/dom type-check && pnpm --filter @wterm/dom test`.
6. **DOM safety.** `javascript:alert(1)` produces no anchor; an HTTPS URI containing quotes and markup remains one escaped anchor with no injected element. Plain output produces zero anchors. Run: `pnpm --filter @wterm/dom test`.
7. **No rendering regressions.** Wide-clip, wide-cursor, upper-block-alignment, synchronized-output, and Playwright suites remain green. Run: `pnpm test && pnpm test:e2e`.

### Cost

- About ten source files plus the two regenerated WASM artifacts.
- The built-in `Cell` remains 12 bytes by consuming the existing two padding bytes. Ghostty's packed cell remains 16 bytes by using a reserved content flag.
- A bounded built-in URI table, small JS interning maps, one scalar/flag read per cell, and a string decode only on first encounter.
- Future maintenance must keep viewport and scrollback encoders aligned, keep the renderer scheme policy explicit, and test capacity/truncation behavior.

### What it makes worse

- A bounded built-in table creates a capacity cliff unless reclamation is later added.
- `MAX_OSC = 512` creates a long-URI boundary that must fail closed.
- The DOM changes from only spans to anchors wrapping spans, which can affect consumer CSS and selection details.
- Ghostty URI lookup can amplify WASM calls on link-heavy rows unless row decode and interning are designed carefully.
- Link clicks remain intentionally subordinate to terminal mouse tracking.
- Both committed WASM binaries change.

### Rejected alternatives

1. **Regex detection** cannot recover a hidden URI from display text.
2. **Widen every built-in cell** wastes memory and changes the direct WASM stride despite two free padding bytes.
3. **Side-channel ranges** must mirror every mutation path and are prone to drift from the cell store.
4. **Ghostty `RenderState.linkCells`** answers a hover query, allocates a set, and does not provide a per-cell URI stream.
5. **A required numeric resolver on `TerminalCore`** conflicts with Ghostty's page-local hyperlink IDs and breaks third-party source compatibility.
6. **Dataset plus JS navigation** duplicates scheme policy while losing native anchor semantics.
7. **An unbounded allocator-backed table** changes the built-in core's fixed-memory design.
8. **JS interception of OSC 8** would reimplement cursor, wrap, width, and mutation semantics outside the emulator.

## Proposer B: Gemini

### Shape

The state requires tracking a URI and an optional `id` parameter associated with each cell, governed by cell mutation semantics. Since passing full URIs directly in `CellData` across the WASM/TS boundary would incur massive memory and allocation overhead per cell, the state should live in a string internment table or URI pool owned by each `TerminalCore` implementation.

1. **State Ownership**:
    - **WasmBridge / Built-in Core**: The Zig core maintains an active hyperlink ID (uint16) updated by OSC 8 parses. It owns an internal array of URIs. Each `Cell` gets a `link_id: u16` field.
    - **GhosttyCore**: libghostty already maintains hyperlink state. The WASM bindings must export this so `ghostty-vt` packs a link ID into `WasmCellData`, and `GhosttyCore` maintains a cache fetching strings from WASM via a new `get_link_uri(id)` function.
    - **Renderer (`@wterm/dom`)**: Owns the translation from `link_id` to DOM `<a>` wrappers. It holds a cache or queries the core for the URI text when it encounters a non-zero link ID, and generates safe hrefs.

2. **Cross-Component Contract (`TerminalCore`)**:
    - `CellData` gains a `linkId?: number` property. A value > 0 means the cell has a hyperlink.
    - `TerminalCore` gains a new method `getLinkUri(linkId: number): string | undefined`. The renderer calls this only when encountering a link ID it hasn't seen (or does so lazily) to retrieve the URI.
    - This satisfies source compatibility: third-party cores that don't supply `linkId` or implement `getLinkUri` just yield no links.

3. **Renderer Strategy**:
    - During dirty-row construction, when iterating over columns, if `cell.linkId` is truthy, the renderer calls `core.getLinkUri(linkId)`.
    - It sanitizes the scheme (blocking `javascript:`, `data:`, etc., allowing `http:`, `https:`, `ftp:`, `mailto:`).
    - It wraps identical contiguous `linkId` spans in an `<a>` tag with `href` and `target="_blank"`.
    - The ID handles explicit OSC 8 `id=...` parameters natively; if the ID matches across cells, they belong to the same logical link even if line-wrapped.

### Predictions

1. **Prediction 1**: If an OSC 8 `javascript:alert(1)` sequence is emitted, the rendered `<a>` tag will lack an `href` (or point to a safe fallback like `#`), proving DOM safety. This can be verified by running `echo -e "\x1b]8;;javascript:alert(1)\x1b\\test\x1b]8;;\x1b\\"` and inspecting the generated DOM.
2. **Prediction 2**: If an OSC 8 hyperlink is written, then overwritten by spaces without an active OSC 8 sequence, the overwritten cells will have `linkId: 0` and will not render as clickable. This can be verified by writing `echo -e "\x1b]8;;http://a.com\x1b\\LINK\x1b]8;;\x1b\\"` followed by `echo -e "\r    "`, which will result in no `<a>` tags in the DOM.

### Cost

- **Memory**: The Zig core requires an additional 2 bytes per cell (16-bit link ID) in the grid and scrollback, plus the memory for the URI internment pool. `GhosttyCore` requires expanding `WasmCellData` parsing.
- **Lookup/copy cost**: Low per-cell cost (just checking a `u16`). Only unique link IDs trigger a string fetch/copy across the WASM boundary.
- **Migration**: Minor `CellData` interface update. Existing implementations remain compatible.
- **Future maintenance obligations**: Reclaiming abandoned URIs in the internment pool to prevent memory leaks in long-running sessions, and keeping the scheme sanitization list updated.

### What it makes worse

- **Memory consumption**: Increases baseline memory usage for the grid and scrollback due to the new `u16` field in `Cell` structures.
- **Renderer complexity**: The DOM renderer must now manage nested HTML tags (`<a>` inside or wrapping spans) instead of purely flat `<span>` chunks, slightly complicating the `buildRowContent` logic and string concatenation.
- **WASM binary size**: The Zig core must include an internment pool implementation, increasing the compiled WASM size.

### Rejected alternatives

- **Store full URI string in every Cell / `CellData`**: Rejected because reading a string pointer/length for every single cell during every dirty row render would devastate performance and thrash JS garbage collection.
- **Embed URL parsing in the renderer (`@wterm/dom`)**: Rejected because OSC 8 requires parsing the escape sequences at the core level to assign explicit text that doesn't match the URI. The observable fact that OSC 8 allows `[click here](hidden-url)` kills pure regex-based DOM URL detection for this feature.
- **Global Link Table without IDs**: Rejected because OSC 8 supports explicit `id=xyz` parameters to stitch together wrapped links or split links. Without exposing an ID, the renderer cannot accurately reconstruct hover states or focus states across terminal lines.
- **Putting HTML directly into `CellData.chars`**: Rejected because the DOM renderer relies on exact column widths to maintain alignment. HTML string injection into the grapheme layer breaks the `CellData` contract and width calculations.
