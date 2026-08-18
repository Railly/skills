# Solution gate: wterm PR #116 resilience fixes

- Date: 2026-08-12.
- Target: `vercel-labs/wterm` at `4852dde5481439883eecf7f61f32f6091be5b468`.
- Origin: resilience audit findings RA-116-1, RA-116-2, and RA-116-3.
- Proposers: `anthropic/claude-opus-5` and `google/gemini-3.1-pro-preview`, blind to each other.
- Synthesizer and future implementer: Codex root runtime.
- Proposals: `2026-08-12-wterm-116-resilience-4852dde-proposals.md`.
- Drawing: `2026-08-12-wterm-116-resilience-4852dde.html`.

## 0. Trigger

Fires. These are fixes for findings from a previous review round. The alternatives differ in scroll ownership, cross-layer resource observability, and cache lifetime.

## 1. Neutral contracts

### D1. One effective scroll-anchor owner

Property: one discarded history row causes exactly one logical viewport movement.

Observable: from `scrollTop 6000`, forty discarded 17-pixel rows end at `5320` with `history 0354` first visible for batched and frame-separated delivery.

Must not change: follow-bottom, resize recovery, interrupt/resume stability, selection-preserving row keys, and bounded virtualization.

Verified facts:

- WTerm explicitly subtracts `discardedDelta * rowHeight`: `packages/@wterm/dom/src/wterm.ts:342-363`.
- `.wterm` becomes the scrolling element through `overflow-y: auto`: `packages/@wterm/dom/src/terminal.css:109-111`.
- Chromium produced `4640` during frame-separated rollover and `5320` with injected `overflow-anchor: none`: `resilience-audit/2026-08-12-pr-116/report.md:19-37`.

### D2. Bounded built-in identity lifetime is observable

Property: a bounded allocator does not silently lose hyperlink semantics when it rejects capacity.

Observable: after 1024 accepted identities, later rejection leaves existing mappings intact and exposes resource saturation to the host.

Must not change: invalid input fails closed, explicit identity reuse, stable mappings across RIS, and exact cell URI/ID/key semantics.

Verified facts:

- `MAX_LINKS = 1024`; saturation returns zero: `src/hyperlink.zig:3-16,39-47`.
- Index zero decodes as no hyperlink: `packages/@wterm/core/src/wasm-bridge.ts:283-291`.
- Existing saturation test protects prior entries: `src/hyperlink.zig:55-68`.
- `TerminalCore` has no resource-state observable: `packages/@wterm/core/src/terminal-core.ts:69-80`.

### D3. Ghostty adapter retention is bounded

Property: derived JavaScript metadata does not grow with every identity ever read when terminal history is bounded.

Observable: unique-link pressure stops producing linear retained JavaScript state while all retained cells resolve identical hyperlink values.

Must not change: explicit grouping, distinct implicit opens, scrollback resolution, and primary/alternate isolation.

Verified facts:

- `_hyperlinkCache` is an unbounded map: `packages/@wterm/ghostty/src/ghostty-core.ts:114-119`.
- WASM read and decode occur before the cache lookup: `packages/@wterm/ghostty/src/ghostty-core.ts:396-444`.
- Renderer groups by strings, not returned object identity: `packages/@wterm/dom/src/renderer.ts:121-124,377-500`.
- Measured size matched identities through 1600: `resilience-audit/2026-08-12-pr-116/report.md:60-74`.

## 2. Independence and isolation

Detached clean worktrees:

- `/tmp/wterm-sg116-anthropic`
- `/tmp/wterm-sg116-google`

Both resolved to `4852dde5481439883eecf7f61f32f6091be5b468`. Neither contained candidate changes. The first `claude-fable-5` CLI attempt hung without output and did not count. Anthropic Opus and Google Gemini then produced independent proposals through Vercel AI Gateway.

## 3. Forward chains

### Round-1 Anthropic

- Logical anchor rewrite → removes incremental JavaScript movement (`observed`, proposal) → Chromium remains allowed to anchor the same scroller (`inferred`) → viewport can still receive two movements (`inferred`, probe-supported harmful branch).
- Capacity counter → WASM exports it (`observed`, proposal) → optional `TerminalCore` exposes it (`inferred`) → hosts can observe saturation without changing cells (`inferred`, beneficial branch).
- Bounded LRU → evicts decoded values (`observed`, proposal) → future reads still call WASM and decode before lookup (`observed`, source) → eviction policy adds bookkeeping without avoiding authoritative work (`inferred`, harmful branch).

### Round-1 Google

- Move compensation to renderer → renderer writes explicit position (`observed`, proposal) → Chromium still anchors (`inferred`) → double movement remains reachable (`inferred`, harmful branch).
- Rejected-cell sentinel → adds cell identity outside allocator table (`observed`, proposal) → renderer gains a proxy resource signal (`inferred`) → third-party cores and hot cell loops inherit a niche state (`inferred`, harmful branch).
- Bounded LRU → caps retained entries (`observed`, proposal) → decodes still precede lookup (`observed`) → allocation and eviction complexity remains without demonstrated benefit (`inferred`, harmful branch).

### Round-2 Anthropic

- CSS plus inline disable anchoring → Chromium stops co-owning position (`observed`, prior injected-style probe) → explicit delta is sole owner (`inferred`) → inline property overrides consumer intent even when canonical CSS is imported (`inferred`, harmful branch).
- Delete cache → no identity-indexed JS retention (`inferred`) → every linked read creates a fresh value (`inferred`) → short-lived allocation increases but authoritative work is unchanged (`inferred`, harmful branch).

### Round-2 Google

- Canonical CSS disables anchoring → Chromium stops co-owning position (`observed`, prior injected-style probe) → existing arithmetic produces exact delta (`observed`) → unrelated browser anchoring inside the terminal is unavailable (`inferred`, harmful branch).
- Delete cache → retained JS state is constant (`inferred`) → value equality reconstructs grouping (`observed`, renderer source) → transient allocation replaces permanent retention (`inferred`, harmful branch).

## 4. Probe log

| Probe | Command or observation | Result |
|---|---|---|
| P1: existing arithmetic | Chromium audit with injected `overflow-anchor: none` | Survived exactly: `scrollTop 5320`, `history 0354`. Refutes JavaScript arithmetic as the cause. |
| P2: round-1 D1 ownership | Compare both proposals with P1 | Refuted both. Relocating or rewriting explicit compensation leaves Chromium as a second owner. |
| P3: cache work avoided | Read `_readHyperlink` at `ghostty-core.ts:396-444` | Refuted both LRU rationales. WASM lookup, copy, and decode happen before the map lookup. |
| P4: object identity consumers | `rg -n "linkKey|linkUri|linkId" packages apps examples e2e` | Survived cache deletion. Product consumers compare values; no object-reference consumer found. |
| P5: CSS distribution | Search documented imports and package exports | Canonical CSS reaches documented DOM, React, and Vue integrations. |
| P6: inline necessity | Read package READMEs/docs and import map | Refuted as required. CSS import is part of documented setup; inline enforcement would over-reach the finding. |
| P7: optional core capability | `pnpm --filter @wterm/core type-check && pnpm --filter @wterm/ghostty type-check && pnpm --filter @wterm/dom type-check` | Current typechecks pass; an optional method preserves third-party/core compatibility by construction. |
| P8: cross-browser claim | Playwright browser availability check | Chromium, Firefox, and WebKit are available for implementation verification. No pre-fix Firefox/WebKit result is promoted to fact. |

Unverified implementation assumptions:

1. Cache deletion changes hyperlink-heavy render time by no material amount. Verify with before/after measurement.
2. The optional resource-state name and fields remain sufficient without a second public callback.
3. Canonical CSS alone controls the actual scroller in DOM, React, and Vue browser fixtures.

## 5. Failure-shape scoring

| Shape | Round-2 Anthropic | Round-2 Google / selected material |
|---|---|---|
| S1 over-reach | **Hit:** inline style extends past documented CSS integrations and blocks consumer styling. Designed out by rejecting inline enforcement. | No hit after limiting D1 to canonical CSS. |
| S2 under-reach | No hit if browser regression spans frames and packages. | No hit if DOM, React/Vue CSS path, and cross-browser cells execute. |
| S3 direction inheritance | No hit. Browser and explicit-owner directions were considered. | No hit. |
| S4 proxy property | D2 cell-level rejected sentinel from round 1 was a hit; rejected. | Optional core resource state measures allocator state directly. |
| S5 unregistered peer | No persistent state added. | No persistent state added. |
| S6 peer-version blindness | Optional method avoids requiring all cores to upgrade. | No hit. |
| S7 wrong layer | Inline constructor property works but is the wrong delivery layer for documented styling. | CSS is delivered through the packages that own terminal layout. |
| S8 guard-derived cells | Risk: only repeat the original Chromium cell. | Designed out: batched/frame-separated, Firefox/WebKit, resize, interrupt, and cache pressure matrix. |
| S9 test pins wrong thing | Risk if tests only assert a CSS string or private map absence. | Designed out: assert logical row, exact delta, resource counters, values after eviction/removal, and performance. |
| S10 claim from prose | Anthropic asserted browser support details without execution. Not carried. | No browser-support claim carried without running it. |
| S11 asymmetric validation | Not applicable. | Not applicable. |

S1 and S2 received highest weight because this is a fix for a review finding.

## 6. Synthesis

**Kind: graft after one refuted round.**

### D1

Take Google's second-round shape: add `overflow-anchor: none` to the canonical `.wterm` rule only. Keep WTerm's existing discarded-row arithmetic and renderer absolute row keys unchanged.

Anthropic's genuinely better contribution was recognizing that stylesheet omission could reintroduce browser ownership. It is still not taken because the package documents CSS import as part of integration, the finding was reproduced on that supported surface, and inline mutation would over-reach into consumer styling. Missing required CSS is a separate integration failure, not a reason to make every style invariant imperative.

### D2

Take Anthropic's first-round shape, narrowed:

- Add a saturating capacity-rejection count to the built-in table.
- Expose capacity, used count, and rejected count through WASM.
- Add optional `TerminalCore.getResourceState()` returning built-in hyperlink state.
- Keep `CellData`, rejection behavior, and identity lifetime unchanged.
- Do not add invalid-input counters in this slice. The finding concerns silent capacity exhaustion, and expanding diagnostics further would be S1.

### D3

Take Google's second-round shape: remove `_hyperlinkCache` entirely. Do not replace it with an LRU or one-slot memo unless before/after performance proves a material regression. The cache currently retains every identity but avoids none of the WASM/decode work.

### Seam check

The graft keeps three ownership boundaries independent:

- DOM CSS decides whether the browser participates in scroll anchoring.
- The built-in core reports its own allocator state without changing cell rendering.
- Ghostty page metadata remains authoritative; removing JS memoization cannot affect built-in resource state.

No shared field or lifecycle couples the three fixes.

## 7. Accepted verification targets

1. Chromium frame-separated rollover ends at `5320` with `history 0354`.
2. Batched rollover, resize recovery, interrupt/resume, selection identity, and DOM bounds remain unchanged.
3. Firefox and WebKit execute the same rollover oracle; results are recorded, not assumed.
4. Built-in saturation reports `capacity=1024`, `used=1024`, `rejected=1`, `saturated=true`.
5. RIS preserves used/rejected state and existing identity mappings; a new `init` clears them.
6. Ghostty values remain identical after cache deletion and retained JS state no longer scales with identity count.
7. Before/after Ghostty hyperlink-heavy timing stays within the declared performance tolerance or the gate is reopened.

## 8. Gate verdict

**Accepted.** Implementation may start with a decision trail. The round-1 proposals are retained because their refutation materially changed D1 and D3.
