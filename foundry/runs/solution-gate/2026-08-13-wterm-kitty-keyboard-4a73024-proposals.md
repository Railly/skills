# Blind proposals: wterm Kitty keyboard protocol

- Date: 2026-08-13
- Target: `vercel-labs/wterm@4a73024`
- Brief: `/tmp/wterm-kitty-solution-gate-brief.md`
- Proposers: Claude Fable 5 and Gemini 3.1 Pro
- Isolation: separate detached worktrees at the target commit

## Proposal A: Claude Fable 5

### Shape

Kitty keyboard state lives in each core, never in the DOM layer, because negotiation arrives interleaved in the output byte stream that only the cores parse. Each core owns a per-screen (primary and alternate) eight-deep flag stack with the semantics ghostty already ships: push wraps and evicts the oldest entry, pop of at least the depth clears everything, set/or/not edit the top (`key.zig:5-124` in the pinned ghostty). The built-in core grows this stack in `src/terminal.zig`, with `src/parser.zig:240` extended to represent the `<` and `=` markers it currently cannot hold; the Ghostty core already mutates this state through the readonly handler (`stream_readonly.zig:139-143`) and only needs the dropped `kitty_keyboard_query` intercepted in the existing `ResponseHandler.vt` seam (`packages/@wterm/ghostty/zig/src/wasm_api.zig:124-235`), which already answers DA1, DSR, DECRPM, and color queries through the same response queue. Reset ownership follows ghostty's observable behavior: RIS clears both stacks, DECSTR leaves them alone (pinned ghostty never dispatches a soft-reset action, its `CSI p` dispatch at `stream.zig:1544` only handles the two-intermediate DECRQM form), and plain unmarked `CSI u` remains cursor restore in the built-in core.

The encoding decision lives in one place: `@wterm/dom`. The cross-layer contract gains a single optional method, `kittyKeyboardFlags?(): number` (a five-bit value, 0 meaning disabled), following the established optional-method pattern of `mouseTracking?`/`synchronizedOutput?` in `terminal-core.ts:74-78`. `input.ts` reads it per key event, exactly as it already reads `cursorKeysApp()`, and branches to a new pure TS Kitty encoder module when nonzero; a new `keyup` listener emits only when the report-events bit is set. Third-party cores without the method get legacy bytes by construction. Query replies travel through each core's existing `getResponse()` queue as `CSI ? flags u`. Cross-core byte identity is by construction (one encoder, two state providers), and the contract suite lives where cross-core parity suites already live, the ghostty test folder, which already instantiates both `WasmBridge` and `GhosttyCore` (`scrollback.test.ts:81-97`), driving a real `InputHandler` under jsdom against both real cores. Browser gaps are named, not invented: the base-layout alternate-key sub-field is omitted (no synchronous layout-map API), releases the browser never delivers (macOS Meta-held keyup, blur, composition) produce no bytes, and associated text is limited to what `e.key` carries at press time.

### Predictions

1. After implementation, writing `\x1b[>5u\x1b[?u` to either core and draining responses yields exactly `["\x1b[?5u"]`, and `kittyKeyboardFlags()` returns 5 on both, measured by `pnpm --filter @wterm/ghostty test` running the new contract suite's query case against both `WasmBridge` and `GhosttyCore`. If the built-in parser's marker handling or the ghostty query interception is wrong, the two drained arrays differ and this fails.
2. With no negotiation performed, every existing pinned byte in `packages/@wterm/dom/src/__tests__/input.test.ts`, including Shift+Enter as `\x1b[13;2u` and Ctrl+A as `\x01`, passes with zero edits to that file, measured by `pnpm --filter @wterm/dom test`. If the Kitty branch leaks into the flags-disabled path, this fails.
3. Nine consecutive `\x1b[>1u` pushes followed by `\x1b[<10u` then `\x1b[?u` yields `\x1b[?0u` on both cores (stack wrap on push, full clear on oversized pop), measured by the contract suite's stack-depth case. If the built-in stack mirrors a naive bounded stack instead of ghostty's wrap-and-clear semantics (`key.zig:39-62`), the built-in answers `\x1b[?1u` and this fails.
4. `\x1b[>1u\x1b[!p\x1b[?u` yields `\x1b[?1u` on both cores (soft reset does not clear Kitty flags), while `\x1b[>1u\x1bc\x1b[?u` yields `\x1b[?0u` on both, measured by the same suite. If the built-in `softReset` is wired to clear the stack, the cores diverge from ghostty and this fails.

### Cost

Files touched: `src/parser.zig` (two marker bytes), `src/terminal.zig` (flag stack, `u`-final routing, reset wiring, query reply), `src/wasm_api.zig` plus `packages/@wterm/core/src/wasm-bridge.ts` and `terminal-core.ts` (one export, one optional method), `packages/@wterm/ghostty/zig/src/wasm_api.zig` plus `wasm-bindings.ts` and `ghostty-core.ts` (query interception, one export), a new `packages/@wterm/dom/src/kitty-keys.ts` encoder, edits to `packages/@wterm/dom/src/input.ts` (flags read, Kitty branch, keyup listener), and a new cross-core contract suite. Both committed WASM binaries must be rebuilt. The TS encoder must track the Kitty specification with Ghostty's `key_encode.zig` as the reference for test vectors. Ghostty version bumps oblige a vector re-check. `modifyOtherKeys` remains a separate slice touching the same `keyToSequence` seam.

### What it makes worse

Typing bytes now depend on core-side state that a misbehaving or killed application can leave dirty: an app that pushes flags and crashes without popping leaves keystrokes encoded as `CSI u` sequences the shell cannot read until reset. Every keydown also performs an extra core-state read, which is a JS-to-WASM call for Ghostty, and DOM permanently carries two encoding paths.

### Rejected alternatives

- **Per-core key encoding:** Ghostty's encoder consumes a full native `KeyEvent` that browser events cannot fully populate, while the built-in core has no encoder. Byte identity would depend on two encoders remaining synchronized.
- **Kitty state in DOM:** state is per-screen and reset-coupled. Only the cores see the terminal output stream, RIS, and alternate-screen switching. DOM would need a second VT parser.
- **Shared WASM encoder in DOM:** `@wterm/dom` ships no WASM today, encoding must be synchronous, and every built-in user would become coupled to a Ghostty-versioned binary.
- **No parser change:** built-in `<` and `=` markers are structurally unrepresentable today, while plain `CSI u` is already cursor restore.
- **Clear flags on DECSTR:** pinned Ghostty does not dispatch DECSTR and preserves the active Kitty flags, so doing otherwise would break cross-core parity.

## Proposal B: Gemini 3.1 Pro

### Shape

- **State Location**: The Kitty keyboard flag stack lives inside each `TerminalCore` (`src/terminal.zig` for built-in, and tracked via `ghostty-core.ts` for Ghostty). DOM `input.ts` remains entirely stateless regarding terminal modes.
- **Cross-Layer Contract**: `TerminalCore` gains a new method, e.g., `kittyKeyboardFlags(): number`.
- **Parsing/Dispatch**: `src/parser.zig` expands accepted CSI private markers to include `<` and `=`. `src/terminal.zig` handles push/pop/set/reset state mutations, and generates query responses (`CSI ? flags u`) exposed via `getResponse()`.
- **Encoding Ownership**: `packages/@wterm/dom/src/input.ts` retains total encoding ownership. It branches on `core.kittyKeyboardFlags()`. If `0`, it executes the untouched legacy path. If `> 0`, it executes the Kitty byte encoder.
- **Ghostty Polyfill**: Because Ghostty's readonly handler consumes and drops Kitty queries (`?`), `ghostty-core.ts` must intercept `\x1b[?u` and artificially synthesize the query response string to maintain observable parity with the built-in core.

### Predictions

1. **Parser rejection of Set operations**:
   - *Prediction*: Sending `CSI = 1 u` to the built-in core currently logs an unhandled sequence because `=` is rejected by the parser.
   - *Measurement*: Execute `core.writeString('\x1b[=1u');`. Inspecting `core.getUnhandledSequences()` will reveal a discarded `u` sequence rather than a successful mode switch.
2. **Ghostty query omission**:
   - *Prediction*: Sending `CSI ? u` to the Ghostty core yields no response string.
   - *Measurement*: Execute `ghosttyCore.writeString('\x1b[?u');`. Calling `ghosttyCore.getResponse()` will return `null` instead of the expected `\x1b[?flags u`.
3. **Legacy pin retention**:
   - *Prediction*: Pressing `Shift+Enter` when Kitty flags are disabled continues to bypass pure Kitty encoding.
   - *Measurement*: Dispatching a `Shift` + `Enter` `KeyboardEvent` to `input.ts` while `core.kittyKeyboardFlags() === 0` emits exactly `\x1b[13;2u` as currently pinned in tests, unaffected by the new encoding logic.

### Cost

- **Files**: Modifies `packages/@wterm/core/src/terminal-core.ts` (API), `packages/@wterm/dom/src/input.ts` (encoder branch), `src/parser.zig` (markers), `src/terminal.zig` (Kitty stack and dispatch), and `packages/@wterm/ghostty/src/ghostty-core.ts` (state bridge and query polyfill).
- **Fields**: A flag bitmask (`u5`) and a push/pop stack array inside `src/terminal.zig`.
- **Maintenance Coupling**: Every future alternative `TerminalCore` backend is now obligated to implement `kittyKeyboardFlags()`. `input.ts` is permanently coupled to the Kitty keyboard protocol, requiring updates whenever the spec clarifies browser-specific anomalies (e.g. `KeyboardEvent.code` vs `key`).

### What it makes worse

- **DOM Encoder Complexity**: `input.ts` balloons in size by housing two completely divergent encoding paradigms. Browser-specific keyboard anomalies (macOS `Command` vs `Option`, dead keys, IME) must now be mapped meticulously into functional Kitty bitmasks without accidentally spilling over into the legacy fallback path.
- **Divergent Core Mechanics**: To achieve the identical "query" observable across cores, `ghostty-core.ts` relies on a fragile hack. Because Ghostty intentionally drops queries internally, the wrapper layer must manually intercept or polyfill responses based on its own shadow state, increasing divergence risk.

### Rejected alternatives

- **Storing Kitty state in DOM `input.ts`**:
  - *Rejecting fact*: The state mutations (`CSI > flags u`) arrive from the host application through the PTY into the terminal parser (`src/terminal.zig`). The DOM layer only processes outbound browser events and has no visibility into the inbound output stream.
- **Delegating encoding directly to Ghostty's WASM (`key_encode.zig`)**:
  - *Rejecting fact*: The brief mandates that "browser key events must be encoded [...] consistently for the built-in core and Ghostty core", and DOM input currently owns encoding. Utilizing Ghostty's internal encoder breaks this separation of concerns and leaves the built-in core without a capable encoder.
- **Grouping Kitty logic into `modifyOtherKeys` routines**:
  - *Rejecting fact*: The brief explicitly dictates that "Kitty and `modifyOtherKeys` remain separate implementation slices."
