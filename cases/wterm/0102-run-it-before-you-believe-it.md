# Case: Every load-bearing claim in this batch was wrong until something was run

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: approved
Delivery: released
Upstream status checked: 2026-08-03
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/98, https://github.com/vercel-labs/wterm/pull/99, https://github.com/vercel-labs/wterm/pull/102, https://github.com/vercel-labs/wterm/pull/100 (all merged); issues #54, #71, #82, #91, #101 closed by them; https://github.com/vercel-labs/wterm/issues/103 (follow-up, open); https://github.com/vercel-labs/wterm/pull/104 (open, unmerged); released as @wterm/core 0.3.2

> Contributor-validated: every claim below was checked by running a command whose output is quoted. No independent session reproduced the batch. Maintainer acceptance covers the merges, not the method.

## Observed condition or claim

Four PRs shipped in one release cycle across `@wterm/ghostty` and `@wterm/core`. Each began from a written claim by a competent author: an issue reporter, a PR author, a design proposer, or me. In every case the claim was specific, plausible, and load-bearing for the fix that followed.

Seven of them were false or unsupported, and none of the seven was caught by reading.

## Red signal

A claim about behavior stated in prose, by anyone, with no command attached. The tell is not low confidence. All seven were written confidently, four of them by people who had the failing system in front of them.

## Method used

Each claim was turned into the cheapest command that could refute it, and the command was run before the claim was used.

The seven, with what refuted each:

1. **Issue #82: "This works in Next.js (which the examples use)."** The Next example never exercises the default. `examples/local/package.json` copies the binary in a `predev` hook and `page.tsx` passes an explicit `wasmPath`. Only the Vite example uses the default, and it works. I repeated the claim into a design brief before checking it.

2. **Design proposer B: raw East Asian Width ranges "include unassigned U+3040", so generation must intersect with assigned scalars.** Fetched `EastAsianWidth.txt`. No W/F range contains U+3040, and the documented default-W blocks are CJK Ext A, CJK Unified, CJK Compat, and planes 2 and 3 only. The proposed intersection was unnecessary and would have made unassigned codepoints inside `U+4E00..U+9FFF` narrow, which they are not.

3. **Design proposer A: placing a wide glyph in the last two columns with DECAWM off "is xterm's behavior".** Read xterm's `dotext` in `charproc.c`. With `WRAPAROUND` clear it substitutes in place (`buf[chars_chomped + offset - 1] = buf[len - 1]`); grepping the whole path found no column rewind. Alacritty drops the glyph with an explicit comment; ghostty drops it, measured.

4. **My own review-gate finding: "a malformed wide pair is persisted into scrollback."** The stored row was intact at the width it was written (`61:1 62:1 63:1 754c:2 0:0 20:1`, len 6). I had read four cells of a six-cell row. Two separate defects were conflated: one real storage split reachable only through a combined vertical and horizontal resize, and one renderer clip. Both were fixed, but the recorded mechanism was wrong.

5. **PR #81's premise: a percentage gradient stop is "rounded inconsistently from cell to cell".** Measured device pixels in Chrome at `devicePixelRatio` 2 over 1140 sampled columns: top edge y=314 and bottom y=317 for every column, before and after. Also identical with a fractional container offset and at a 17.5px row height. A vertical-axis gradient cannot vary per cell when every cell shares y and height.

6. **My metric for #87: row width as a proxy for column alignment.** `lastX` measured the right edge of the row's last span, which the fix does make uniform. The reported symptom is where the closing border glyph lands. Measured with a `Range` over the glyph instead, the jitter was 66.22px with the fix applied.

7. **My test input for #87.** `"⣿⣾⣽⣻⢿⡿⣟⣯⣷".repeat(6).slice(0, 58)` yields 54 characters, so the rows under comparison had different lengths and part of the measured misalignment was the harness.

## Outcome

Three merged PRs and a release. `v0.3.2` is on npm, closing #54, #71, #82, #91 and #101.

The refutations changed the work, they did not merely annotate it:

- Refuting (1) and (5) kept a working default and a working renderer path from being replaced. The Vite example loads the wasm with no configuration on dev and on build, verified in a browser; replacing the default would have regressed it to fix Bun.
- Refuting (2) kept a correctness bug out of the generated Unicode table.
- Refuting (3) left one design decision open rather than settled by the better-argued proposal.
- Finding (4) produced two fixes instead of one, each with its own regression test.
- Finding (6) and (7) stopped #87 from being committed on evidence that did not support it. That work is unshipped.

The review gate on #102 found five defects introduced by #102 itself. Two blocked the merge because they made previously-correct output worse: a hand-written width table classified 1209 assigned characters as wide that Unicode calls narrow, and a resize path split wide pairs into scrollback. Three did not and became #103.

## Evidence

- Source: `vercel-labs/wterm` at `3e436fa`. PRs #98 (merged 2026-08-01), #99 (merged 2026-08-01), #102 (merged 2026-08-02), #100 (merged 2026-08-02). Issue #103 open. PR #104 open and unmerged.
- Runtime: `bun` probes against the committed wasm for every core-level claim; Playwright against Chromium and `screencapture` against the user's own Chrome at `devicePixelRatio` 2 for every rendering claim; `curl` for `EastAsianWidth.txt`; source reads of xterm `charproc.c` and alacritty `term/mod.rs`.
- Tests: 29/29 turbo tasks at each merge. New coverage: 8 scrollback cases, 5 wasm-loading cases, 3 cell-width cases, plus renderer cases for the wide cursor and the clip boundary. Each new suite was run against the unfixed source and went red; the wasm-dependent ones were run against the previous committed binary.
- Review: Vercel Agent Review found a detached `DataView` on the scrollback cache-hit path in #98 and a doubled cursor on a wide continuation in #102. Both reproduced, both fixed, both with a regression test verified red. ctate approved #98, #99 and #102.
- Artifact: `packages/@wterm/core/wasm/wterm.wasm` rebuilt and diff-checked by CI at each merge. `ghostty-vt.wasm` rebuilt in a Linux container and confirmed byte-identical to a host build, which is also how the committed binary was proven to match its Zig sources.

## Transferable lesson

A claim's confidence, and its author's proximity to the failure, predict nothing about whether it is true. Four of these seven came from people who had the broken system in front of them, and two came from me in the same session where I was scoring others for the identical fault.

The operational form: when a claim is load-bearing, write down the single cheapest command that would refute it, and run that command before the claim is used. Not a spike, not an implementation. Usually one of: read the installed tool's own source, fetch the data file, measure the artifact in the environment that renders it, or run the reporter's repro verbatim.

Two shapes recur inside this and are worth naming separately:

- **A metric that moves with the fix is not the metric the report describes.** Row width moved and glyph position did not. The check to apply is to state the property the report names in one sentence, then the property the measurement returns, and read them side by side.
- **A refutation is only as good as the harness.** Before trusting a measurement that contradicts a competent author, verify the inputs. A 54-character string where 58 was intended produced a confident wrong number.

## Exceptions

This does not say the seven authors were careless. PR #81's author observed a real symptom in a real browser and proposed a mechanism that does not survive measurement here; the symptom may still be real on hardware I do not have, and that PR is open rather than closed for exactly that reason.

The batch covers a mechanism family, not one environment. Bun's dev server failure was reproduced directly; Vite dev and build were driven in a browser; esbuild, Rollup standalone, Parcel and webpack standalone were not tested and are documented as untested rather than implied to work.

## Candidate changes

- Deterministic check: before a design proposal is scored or a report is acted on, enumerate its load-bearing claims and attach one refuting command to each. A claim with no attached command stays an assumption and is carried into the record rather than used.

## Confidentiality review

All sources are public: the `vercel-labs/wterm` repository, its issues and PRs, public GitHub handles of contributors, and public upstream sources (`unicode.org`, xterm and alacritty repositories). Screen captures used for verification were of a local test page and were deleted; none are referenced here. No local paths, internal chat, private review text, or neighboring-project identity appear in this record.
