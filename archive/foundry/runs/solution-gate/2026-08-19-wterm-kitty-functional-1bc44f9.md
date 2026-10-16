# Solution Gate: wterm Kitty functional encoding

Date: 2026-08-19
Mode: fix after Review Gate findings
Target: `vercel-labs/wterm#120` at `1bc44f9`
Implementer: Codex GPT-5
Proposers: Cursor Grok 4.6 xhigh and Claude Opus 5 Thinking High

## Contract

Property: Kitty enhancement flags alter a functional key only when the requested flag adds protocol payload, while press, repeat, release, keypad identity, and cursor application mode retain the official encoding rules.

Observable: exact bytes for Escape, F1-F4, Shift+Tab, NumpadEnter/navigation, and ArrowUp across flags 1, 2, 4, 8, actions, modifiers, and DECCKM match official `key_encoding.c` through `InputHandler` and built Chromium.

Must not change: flags-zero `keyToSequence`, printable and modified ASCII, report-all keypad identity, Meta and physical-modifier lifecycle, associated text, composition, and browser-owned shortcut behavior.

## Proposals

### Grok 4.6 xhigh

Keep flags-zero lookup tables private to `InputHandler` and Kitty identity in `kitty-keys.ts`. Pass `cursorKeysApp` explicitly from the bridge snapshot. Normalize keypad identity unless disambiguation or report-all is active. Apply official functional legacy windows and omit the action field on CSI-letter press.

Predictions: flags 4 uses SS3 for F1-F4 and DECCKM cursor keys; flags 2 keeps CSI F1 and normal cursor keys; flags 2/4 normalize keypad; press omits `:1`; repeat/release retain actions.

Cost: one encoder parameter, functional predicates, keypad normalization, and a flags × key-class matrix. It preserves duplicate flags-zero and Kitty lookup ownership.

What it makes worse: two deliberately distinct legacy predicates remain and must not drift. Keypad identity disappears without disambiguation/report-all, as required.

Rejected alternatives: calling `keyToSequence` for negotiated flags, always preserving keypad identity, folding flags zero into Kitty, or importing the C encoder.

### Claude Opus 5 Thinking High

Move all legacy and Kitty mappings into one descriptor table in `@wterm/core`, then route both flags-zero and negotiated input through one contextual encoder.

Predictions: one payload predicate fixes both findings broadly; table review localizes reference mismatches; DECCKM becomes explicit context.

Cost: new shared table and rewrite of the existing legacy path. A table error affects all terminal input.

What it makes worse: flags-zero users inherit Kitty-driven refactoring, debugging gains indirection, and one flag mistake spreads across every key class.

Rejected alternatives: separate Kitty mappings, inline branching, generated C tables, and ambient DECCKM state.

## Forward chains

Grok:

1. Keep flags-zero dispatch unchanged → existing non-Kitty bytes remain outside the fix (`observed`, source inspection).
2. Normalize keypad before Kitty dispatch → flags 2/4 recover normal identity while flags 1/8 retain keypad IDs (`inferred`, official C).
3. Thread DECCKM from the same bridge snapshot → legacy-mode cursor bytes follow current core state (`inferred`).
4. Harmful branch: negotiated and flags-zero mappings can drift because ownership remains split (`inferred`).

Claude:

1. Replace both dispatchers with one table → mapping literals converge (`inferred`).
2. Shared rows affect flags-zero input → a Kitty correction can alter working legacy bytes (`inferred`).
3. Core owns browser key descriptors → DOM-specific event knowledge crosses the current dependency boundary (`observed`, package graph).
4. Harmful branch: the fix for two negotiated-flag defects creates a broad non-Kitty regression surface (`inferred`).

## Probes

- P1: official `encode_function_key` defines `legacy_mode = !report_events && !disambiguate && !report_all`; alternate reporting alone does not disable it.
- P2: official `convert_kp_key_to_normal_key` normalizes keypad unless disambiguate/report-all is active.
- P3: compiled official `serialize()` emitted `CSI A`, `CSI 1;1:2 A`, `CSI 1;1:3 A`. This refuted Grok's proposed `;:2`/`;:3` detail while preserving its shape.
- P4: `@wterm/dom` already owns `KeyboardEvent` translation and depends on core; core does not own DOM events. This weakens Claude's module placement.
- P5: fix-absent focused tests at `1bc44f9` reproduced Escape `CSI 27u` and ArrowUp `CSI 1;1:1 A`.
- P6: the chosen implementation passed 181 DOM tests, type-check, and the rebuilt real-Chromium matrix.

## Failure-shape score

| Shape | Grok | Claude |
|---|---|---|
| S1 over-reach | Low: flags zero remains untouched | High: rewrites flags-zero dispatch |
| S2 under-reach | Designed out with class × flag × action matrix | Medium: broad predicate, but exact legacy windows still required |
| S3 direction inheritance | Press/repeat/release and DECCKM on/off covered | Same target, larger surface |
| S4 proxy property | Explicit payload windows follow the reference | Generic payload predicate risks hiding key-class exceptions |
| S5 unregistered peer | Not applicable | Not applicable |
| S6 peer-version blindness | Not applicable | Not applicable |
| S7 wrong layer | DOM encoder remains the delivery owner | Hit: browser key ownership moved toward core |
| S8 guard-derived cells | Matrix derives from official input domain | Table rows could become the matrix source |
| S9 wrong test | Four mechanisms force-red independently | Would require many flags-zero mutations |
| S10 prose claim | Official C executed and Chromium driven | Same oracle available |
| S11 asymmetric consumers | Both encoder call sites updated | Shared table increases consumer count |
| S12 primitive mismatch | Grok serializer detail was corrected by P3 | Generic payload primitive needs functional exceptions |

## Synthesis

Kind: one proposal whole with a corrected serializer detail.

Take Grok's ownership boundary and data flow. Keep flags zero on `keyToSequence`, keep Kitty identity in `kitty-keys.ts`, normalize keypad under the official predicate, pass `cursorKeysApp` explicitly on keydown and keyup, implement functional legacy windows, and omit action only on press. Correct Grok's repeat/release prediction to `;1:2` and `;1:3` using P3.

Claude's genuinely better property is one mapping source. It is not taken because achieving it here rewrites already-working flags-zero behavior and moves DOM keyboard knowledge toward `@wterm/core`, repeating S1 for a review-finding fix.

Carried assumptions: browser `code` and `key` identify the normalized keypad equivalent; the bridge state can change between events and must be read per event; functional repeat/release must preserve modifier parameter `1` when an action is present.

## Audit visual

Observed evidence:

```text
flags 2 Escape ──P5──> CSI 27u (wrong)
flags 2 ArrowUp press ──P5──> CSI 1;1:1 A (wrong)
official serializer ──P3──> CSI A / CSI 1;1:2 A / CSI 1;1:3 A
rebuilt Chromium ──P6──> expected functional and lifecycle bytes
```

Chosen shape:

```text
flags 0 → InputHandler.keyToSequence [observed]

flags > 0 → bridge snapshot
  ├─ kitty flags [observed]
  └─ cursorKeysApp [inferred data flow]
      → normalize keypad when !disambiguate && !report-all [observed P2]
      → official functional legacy windows [observed P1]
      → CSI serializer: press no action, repeat/release action [observed P3]
```

Format: separate text trees are sufficient because the disputed relationship is ownership and serialization order.

## Handoff

Implementation verification targets: isolated flags, report-all identity, DECCKM toggling, press/repeat/release, printable and Meta tripwires, and built Chromium. Review Gate must use a fresh exact-head independent reviewer and must not inherit the superseded `1bc44f9` pass.
