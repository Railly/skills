# Solution gate: three wterm parity changes at 5c1282d

Date: 2026-08-09
Target: `vercel-labs/wterm`, base `5c1282d` (merge of #105, #106, #107)
Runtimes: proposers `openai/gpt-5.6-sol` (xhigh) and `fable-5`, blind to each other, in
separate detached worktrees `/tmp/wgate-sol` and `/tmp/wgate-fable`. Synthesis and
implementation: `claude-opus-5`. Record the three so a later reader can tell a method result
from a model result.

## 0. Trigger

Fires on clause 1 for all three: each defect admits more than one solution shape, and the
shapes differ in where state lives and what the contract promises. Gate 3 also fires clause 2:
DA1 changes what the terminal promises about itself to every program that negotiates.

Note on the pairing: Hunter asked for the gate to run on `gpt-5.6-sol` at xhigh. Running a
single family would collapse the method to two samples from one sampler, so `fable-5` was kept
as the second proposer. Deviation recorded, not silently taken.

Operational note that cost one run: the first `sol` run on brief 1 ended inside its reasoning
without emitting a final message. Rerun with an explicit "your final message must contain the
five sections and nothing else" instruction succeeded. `codex exec` was launched with stdin
redirected from `/dev/null` per the skill's note.

## 1. Briefs

Three briefs at `/tmp/wgate-briefs/brief-{1,2,3}-*.md`, each stating a violated property with
no symptom, an observable measured by the existing harness, and a must-not-change list. Every
factual claim carries a `file:line` that was read before the brief was sent.

1. **Ghostty answers no terminal query.** Property: a core that accepts a query is required to
   produce its response; this one produces nothing, so the host cannot distinguish declining
   from never receiving.
2. **Viewport content lost across vertical shrink then grow.** Property: scrollback is a
   lossless record of rows leaving the viewport and the viewport is a window onto it; resize
   moves rows between them in a way that is not a window operation.
3. **The core answers no capability or identity query.** Property: a terminal that implements a
   capability but cannot report it is, to a negotiating program, a terminal without it.

## 2. Proposals

Six proposals collected verbatim at `/tmp/wgate-briefs/out-sol-{1b,2,3}.md` and in the
conversation transcript for the `fable-5` runs. Convergence summary:

| Gate | Converged on | Disagreed on |
|---|---|---|
| 1 Ghostty | Two defects, not one: response loss in the stream handler, grapheme loss in the cell export. Both need a bounded FIFO mirroring the built-in core's drop-when-full ordering. | Whether to ship as one PR with two commits (`sol`) or two changes (`fable`). Whether synchronized output rides along (both: no). |
| 2 Resize | Push the **top** rows to scrollback on shrink, repopulate the viewport **from** scrollback on grow, cursor translates with its rows. Zig required, wasm rebuilt. | Nothing material. Independent convergence across families. |
| 3 Queries | One change, not two. DECRQM must read the same fields the set/reset path writes, no second table. Both use the existing `enqueueResponse`. | What DA1 claims: `sol` says `ESC[?1;0c` (underclaim on purpose, option 2 has no audited contract), `fable` says `ESC[?1;2c` (parity with the control, weakest fully-true claim). |

## 3. Probes

| # | Prediction under test | Command | Result |
|---|---|---|---|
| A | Gate 3 needs no parser change because `$` (0x24) is already collected as a CSI intermediate | read `src/parser.zig:242-245` | **Survives.** `if (byte >= 0x20 and byte <= 0x2F) collectIntermediate(byte)`. DECRQM reaches dispatch today. |
| B | Gate 2 needs a new consume operation because `Scrollback` is push-only | `grep "pub fn" src/scrollback.zig` | **Survives.** Only `reset`, `push`, `getLine`. Both proposals correctly priced a new pop. |
| C | Gate 1's grapheme defect is at the export, separate from the response stub | read `packages/@wterm/ghostty/zig/src/wasm_api.zig:158-160` and `:229-231` | **Survives.** Both encode paths switch on `content_tag` matching `.codepoint_grapheme` and then take `raw.content.codepoint` only. The cluster tag is visible and discarded. Two defects confirmed. |
| D | Gate 1's stated risk: the shim may have to reimplement `ReadonlyStream`'s full delegation surface, making the handler large and every method a fidelity liability | read upstream `stream_readonly.zig` and `stream.zig` in `~/.cache/zig/p/ghostty-1.3.1-.../` | **REFUTED.** `stream_readonly.zig:20` is `pub const Stream = stream.Stream(Handler)` — upstream already parameterizes. The `Handler` at `:28` is public with a public `init(*Terminal)`, and declares **8** functions total (`init`, `deinit`, `vt`, `setMode`, `horizontalTab`, `horizontalTabBack`, `colorOperation`, `kittyColorOperation`). Dispatch is one generic `vt(comptime action, value)`, not 125 callbacks. |
| E | Query suppression is deliberate upstream, not incidental | read `stream_readonly.zig:627-640` | **Survives.** `test "ignores query actions"` asserts `ESC[c`, `ESC[5n`, `ESC[6n` are ignored without error. |

Probe D is the one that changed a design. Both proposers assumed a fork-or-reimplement shape
and priced the upgrade-drift liability accordingly. The shim can instead embed upstream's
`Handler`, forward eight methods, and intercept response-producing actions inside `vt`. That is
composition, not duplication, and the drift surface shrinks to eight signatures.

## 4. Scoring against recorded failure shapes

- **Gate 1, S1 over-reach**: `sol` initially bundled synchronized output; both then excluded it.
  Accepted out loud: Ghostty's 26 synchronized renders stay open and are not this change.
- **Gate 2, S2 under-reach**: the alternative "push top rows but leave grow blank" is a
  textbook under-reach, killed by both proposers against the measured observable.
- **Gate 3, S1**: claiming a DA1 capability without a handler is over-reach by construction.
  Both proposals designed it out, by opposite means. Unresolved, see below.
- **Gate 2**: hit on "changes a property nobody was watching" — scrollback stops being
  append-only, so `getLine` offsets shift under a grow. Accepted, with the consequence stated:
  any host holding an offset-based scroll anchor must invalidate on resize.

## 5. Synthesis

- **Gate 1: graft.** Take `fable`'s two-defect split and its `has_grapheme` flag in a reserved
  cell byte with an on-demand `get_cell_grapheme` call, because it keeps the hot path a flat
  memcpy. Take `sol`'s chunked writes so responses can drain between chunks. Replace both
  proposers' handler shape with the composition that probe D exposed: embed
  `stream_readonly.Handler`, forward its eight methods, intercept queries in `vt`. Seam to check
  during implementation: forwarding must be total, or a silently unforwarded action becomes a
  rendering regression that the response tests would not catch.
- **Gate 2: one proposal whole**, `fable`'s, on the strength of independent convergence with
  `sol` and a sharper cursor rule (trim blank bottom rows before pushing, which is what the
  control and Ghostty do). `sol` had the better cost accounting — it named the O(rows × cols)
  memmove and the scroll-position shift — and both are carried into the record.
- **Gate 3: graft, after one escalated decision.** The shapes are identical except for what DA1
  claims, and no probe can settle it because it is a policy question, not a fact. Escalated to
  Hunter, who chose `fable`'s `ESC[?1;2c` on 2026-08-09: parity with the control the whole
  project measures against, and the `2` (advanced video option) is a capability the core
  actually has. `sol`'s underclaim argument is recorded and partly accepted — it applies to the
  higher VT220/sixel codes, not to option 2. The residual risk `sol` named is real and unfixed
  by the choice: nothing ties the claim to the handlers, so a future code added without its
  handler goes uncaught. Mitigation taken: the constant carries the invariant as a comment.
  A test that enforces it does not exist and is an issue candidate.

## 6. Carried assumptions, to verify during implementation

1. Embedding `stream_readonly.Handler` and forwarding its eight methods preserves parsing
   fidelity end to end. Probe D shows the shape is available; it does not show the forwarding is
   total. Verify by running the resize trace (must stay 0 visible differences) and the SGR mouse
   benchmark (must stay 6) against the new handler.
2. Ghostty's grapheme storage is reachable from the export path at the pin the encoder already
   holds. Unprobed; both proposers assert it, neither demonstrated it.
3. Popping from a full 1000-line scrollback ring moves `write_pos` backwards modulo the
   capacity without data movement. Unprobed, and it is the one subtle line in gate 2.
4. Two new response producers raise queue-fill rate roughly threefold under adversarial input.
   Asserted by `fable`, unmeasured.

## 7. Handoff

- The must-not-change lists from the three briefs go to Review Gate step 5, driven rather than
  reasoned about: CPR 2, synchronized renders 1, SGR mouse 6, final grid mismatches 0, resize
  trace 0 visible differences for Ghostty.
- Sequencing constraint, from the briefs and confirmed by both proposers: gates 2 and 3 both
  rewrite `packages/@wterm/core/wasm/wterm.wasm`, a committed binary. They cannot merge in
  parallel. Gate 1 rewrites `ghostty-vt.wasm` instead and is independent of both.
- Issue candidate found outside scope: the lab's OSC 8 probe cannot detect a rendered link
  because it reads `lane.hyperlinks`, populated only by `linkHandler` hover and activate. It
  reports FAIL for xterm.js, which renders the link correctly.
