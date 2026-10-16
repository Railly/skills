# Solution Gate: wterm Kitty keyboard protocol

- Date: 2026-08-13
- Target: `vercel-labs/wterm@4a73024d9f9003972f9efa6fe1a9086d1c90417b`
- Mode: greenfield fix
- Trigger: the feature changes state ownership and the contract between terminal cores and DOM input.
- Proposers: Claude Fable 5 and Gemini 3.1 Pro, blind to each other.
- Synthesizer and future implementer: Codex root runtime, which proposed neither shape.
- Proposals: `2026-08-13-wterm-kitty-keyboard-4a73024-proposals.md`
- Drawing: `2026-08-13-wterm-kitty-keyboard-4a73024.html`

## 0. Trigger

Fires. More than one solution shape was plausible: core-owned versus DOM-owned state, shared versus per-core encoding, and query response in Zig versus a TypeScript polyfill.

## 1. Defect contract

### Property

After terminal output negotiates Kitty keyboard enhancements, browser key events must be encoded from the active Kitty state of the selected core, consistently across the built-in and Ghostty cores.

### Observable

A cross-core contract suite drives query, push, set, OR, NOT, pop, soft reset, RIS, alternate-screen switching, press, repeat, and release, then observes:

1. active flags;
2. exact query responses;
3. exact `onData` bytes.

### Must not change

- Flags zero or an unsupported third-party core preserves all legacy bytes, including cursor application mode, Ctrl, Alt prefix, Shift+Tab, and Shift+Enter.
- Copy, paste, macOS Command shortcuts, focus, mouse, and IME behavior stay intact.
- Plain `CSI u` remains cursor restore.
- Non-Kitty reset and alternate-screen behavior stays intact.
- Kitty and `modifyOtherKeys` remain separate slices.

## 2. Independent proposals

Both proposals converge on:

- real state in each core;
- DOM-owned shared encoding;
- a core method exposing current flags;
- built-in support for query, push, set, OR, NOT, and pop;
- unchanged legacy fallback.

The discriminating disagreement is Ghostty query ownership:

- Fable reads Ghostty's existing active-screen state inside Zig `ResponseHandler.vt`.
- Gemini proposes TypeScript interception and shadow state in `ghostty-core.ts`.

Fable also makes `kittyKeyboardFlags?()` optional, preserving third-party compatibility. Gemini describes it as mandatory despite the must-not-change constraint.

## 3. Forward chains

### Proposal A: real core state plus shared DOM encoder

1. Terminal output is parsed by the selected core (`observed`: both cores already own VT parsing).
2. Kitty mutations update that core's active-screen stack (`observed` for Ghostty, `inferred` for the built-in implementation).
3. The core exposes the active five-bit value synchronously (`inferred`).
4. DOM reads the value for each browser key event and uses one pure encoder (`inferred`).
5. Both cores emit identical bytes for identical supported browser events because they share the encoder (`inferred`).

Branches:

- Query interception reads the same Ghostty state that mutation updates (`observed` by temporary real-WASM probe), so no duplicate state can drift.
- If a browser does not expose base-layout or a release event, the encoder omits the field or emits nothing (`inferred`), preserving honesty but reducing native-protocol completeness.
- A crashed application can leave flags active (`inferred`), changing subsequent shell input until RIS or a compensating pop.

### Proposal B: TypeScript Ghostty query polyfill and wrapper state

1. Ghostty receives Kitty mutations in its readonly Zig handler (`observed`).
2. The wrapper separately tracks or reconstructs the same state to answer queries (`inferred` from the proposed polyfill).
3. Query responses use wrapper state while screen switching and RIS use native Ghostty state (`inferred`).
4. Any missed mutation, stack wrap, screen switch, or reset makes the two states diverge (`inferred`, directly supported by the native per-screen probe).
5. DOM then encodes from one state while applications negotiate against another (`guessed harmful endpoint`).

Branches:

- A complete second parser could avoid missed mutations, but duplicates Ghostty's VT and stack semantics (`inferred`) and creates a permanent synchronization obligation.
- Making the method mandatory breaks third-party cores at type-check time (`inferred` from the current optional advanced-mode pattern).
- The shared DOM encoder still provides byte parity if the wrapper state happens to remain correct (`inferred`).

## 4. Probe log

| Probe | Command or measurement | Observed result |
|---|---|---|
| Baseline built-in parser | Real committed WASM, write `CSI ? u`, `CSI > 5 u`, `CSI = 3;1 u`, `CSI < u` | No query response. `>` is unhandled. `=` and `<` do not produce a usable Kitty action. |
| Baseline Ghostty | Real committed WASM, same sequence set | Mutations are not externally visible, and query returns no response. |
| Baseline suites | `pnpm --filter @wterm/dom test`, `pnpm --filter @wterm/ghostty test`, `zig build test` | DOM 145/145, Ghostty 49/49, Zig green. |
| Real Ghostty state | Temporary Zig export in an isolated worktree, rebuilt in Docker, then driven through real WASM | `0 → push 5 → OR 2 = 7 → NOT 1 = 6`; native state exists and mutates correctly. |
| Alternate-screen isolation | Primary flags 6, enter 1049, inspect, set alternate 9, leave | Alternate starts at 0, becomes 9, primary returns as 6. State is per screen. |
| DECSTR and RIS | In real Ghostty WASM, inspect after `CSI ! p` and `ESC c` | DECSTR preserves flags. RIS returns to primary and clears flags to 0. |
| Exact query seam | Add only `.kitty_keyboard_query` handling to temporary Zig `ResponseHandler`, reading `screens.active.kitty_keyboard.current().int()` | Responses were exactly `CSI ?0u`, `?5u`, `?7u`, `?6u`, alternate `?0u`/`?9u`, primary `?6u`, RIS `?0u`. No TS state was needed. |
| Ghostty reference format | `src/termio/stream_handler.zig:964-965` | Native Ghostty formats the response as `\x1b[?{}u` from the active-screen stack. |
| Browser event substrate | Headless Chromium event probe | `key`, `code`, `location`, `repeat`, modifiers, `isComposing`, keydown, and keyup were observable for representative keys. A constructed repeated keydown exposed `repeat: true`. |
| Browser information limits | DOM `KeyboardEvent` contract and Ghostty encoder inputs | No synchronous base-layout mapping is available. Associated text can use event text at press time only. Releases never delivered by the browser cannot be synthesized honestly. |
| Contract compatibility | Search for `TerminalCore` consumers and optional mode methods | 19 references/consumers. Advanced state methods are already optional, supporting `kittyKeyboardFlags?()`. |

The temporary export and query handler existed only in an isolated probe worktree. They are not product implementation.

## 5. Prediction disposition

### Fable

| Prediction | Result |
|---|---|
| Query can return `CSI ?5u` from real core state after push 5 | Survived on temporary real Ghostty WASM. Built-in remains an implementation target. |
| Flags-disabled legacy tests stay byte-identical | Survived as a design constraint and green baseline; final proof requires implementation. |
| Stack wrap and oversized pop match Ghostty | Survived against pinned Ghostty source and its real state export. Built-in parity remains an implementation target. |
| DECSTR preserves flags and RIS clears them | Survived on real Ghostty WASM. |
| Shared DOM encoder yields exact cross-core key bytes | Unprobeable before the encoder exists. It remains a required implementation contract. |

### Gemini

| Prediction or load-bearing claim | Result |
|---|---|
| Built-in `=` currently fails to set Kitty state | Survived. |
| Built-in `=` necessarily appears as a recorded unhandled `u` | Refuted by the committed-WASM probe: it produced no usable action and did not establish the predicted observable. |
| Ghostty currently drops `CSI ? u` | Survived. |
| A TypeScript query polyfill needs wrapper shadow state | Refuted. The Zig response seam read native active-screen state and produced exact responses. |
| Mandatory `kittyKeyboardFlags()` preserves third-party cores | Refuted by contract inspection. The method must be optional. |
| Flags-disabled Shift+Enter remains unchanged | Unprobeable until implementation, and retained as a must-not-change test. |

## 6. Failure-shape scoring

| Shape | Fable | Gemini |
|---|---|---|
| S1 over-reach | Low. New behavior is gated by nonzero flags; legacy tests must remain unchanged. | Hit if the method is mandatory or query interception rewrites wrapper input flow. Design out with an optional method and Zig-only query seam. |
| S2 under-reach | Low if all six mutations, per-screen state, resets, repeat, and release are covered. | Hit. The proposal covers the visible query but leaves screen/reset/stack drift reachable through shadow state. |
| S3 direction inheritance | Covers inbound negotiation and outbound encoding. | Partial hit. It handles query output but duplicates only one direction of state ownership. |
| S4 proxy property | No hit. Encoder reads the active core state directly. | Hit. Wrapper state is a proxy for Ghostty's real active-screen state. |
| S5 unregistered peer | No persistent state outside core lifecycle. | Hit conceptually: a new shadow-state peer is not coupled to Ghostty's native resets and screen lifecycle. |
| S6 peer-version blindness | Low. Ghostty-version coupling is explicit and backed by vectors. | Hit. A wrapper parser assumes Ghostty semantics remain identical without a shared contract. |
| S7 wrong layer | Correct: core parses state, DOM maps browser events. | Hit for query: TypeScript answers a protocol query whose authoritative state is in Zig. |
| S8 guard-derived cells | Risk designed down by cross-core vectors spanning all flags, resets, screens, and event classes. | Hit. Tests centered on the query polyfill could miss native state transitions it does not mirror. |
| S9 test pins wrong thing | Required mutation tests for parser, stack, query, and encoder, plus mechanism-deletion checks. | Hit risk: query tests can pass from synthetic wrapper state while native state is wrong. |
| S10 claim from prose | Core semantics and query format were executed against real pinned Ghostty WASM. Browser limits remain explicit. | Hit. The need for a shadow-state polyfill was asserted without probing the existing Zig response seam. |
| S11 asymmetric validation | No hit if both cores mask flags to five bits and share encoder validation. | Hit risk: wrapper parsing and native Ghostty parsing can accept different inputs. |
| S12 primitive-contract mismatch | Low. One browser encoder explicitly defines unsupported information. | Hit. A response polyfill promises authoritative terminal state while using a duplicated approximation. |

## 7. Synthesis

**Kind: one proposal whole.**

Take Fable's shape:

- per-screen state in each core;
- Ghostty's existing stack remains the authority;
- built-in stack matches Ghostty depth and mutation semantics;
- optional `kittyKeyboardFlags?(): number`;
- one pure DOM Kitty encoder;
- Ghostty query handled in Zig `ResponseHandler.vt` from real active-screen state;
- exact cross-core contract tests using real cores and one encoder;
- explicit browser limitations;
- legacy fallback unchanged when flags are zero or the method is absent.

Gemini's useful contribution is its cost warning: the TypeScript encoder is the largest maintenance surface and must be isolated from `input.ts`, vector-tested against Ghostty, and rechecked on Ghostty upgrades. Its proposed shadow-state query polyfill is rejected because the probe showed it is unnecessary and repeats S2, S4, S7, S9, S10, and S12.

## 8. Carried assumptions and implementation targets

1. Implement the built-in stack as two eight-entry screen-local stacks matching Ghostty wrap, pop, set, OR, and NOT semantics.
2. Route marked Kitty `u` sequences before the existing `>` unhandled branch, while plain `CSI u` stays cursor restore.
3. DECSTR preserves Kitty state. RIS clears both screens and returns to primary.
4. Ghostty query response reads native active-screen state inside Zig. No TypeScript parser or state copy.
5. `kittyKeyboardFlags?()` remains optional.
6. Keep the Kitty encoder in a pure module, not inline in `input.ts`.
7. Add keyup only for Kitty report-events behavior. Preserve current composition and shortcut gates.
8. Model press, repeat, and release distinctly. `KeyboardEvent.repeat` maps to event type 2.
9. Do not invent base-layout alternate codes or releases the browser did not deliver.
10. Pin exact bytes for printable, control, navigation, function, modifier-only, Enter/Tab/Backspace, repeat, release, alternate fields, and associated text.
11. Existing DOM legacy tests must pass without expectation changes.
12. Rebuild and commit both WASM artifacts.
13. Mutation testing targets: removing parser marker support, stack mutation, active-screen selection, query interception, optional fallback, repeat mapping, or release listener must each fail a distinct test.
14. Run Review Gate after implementation. The must-not-change list becomes its driven checklist.

## 9. Verdict

**Accepted for implementation.**

Implement Fable's shape in a new clean worktree from `origin/main@4a73024`. Keep PR #119 and the dirty original checkout untouched. Kitty is the next slice; `modifyOtherKeys` remains separate.
