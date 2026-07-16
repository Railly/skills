# Case: Trace a "still broken" bug to a same-day silent revert before writing a new fix

Status: candidate
Validation: independently-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1552
Upstream status checked: 2026-07-16

> Independently validated: a second, blind agent session reproduced both the original failure and the fix from a self-contained prompt, without access to this session's reasoning.

## Observed failure

`find role heading/list/banner ... [--name ...]` failed on every call against implicit ARIA roles (`<h1>`-`<h6>` for heading, `<ul>`/`<ol>` for list, `<header>` for banner), with the generic `Element not found` message, even though `snapshot` showed the accessibility tree saw the element. A changelog entry for #1145 claimed this was already fixed by querying the CDP accessibility tree, but the shipped `handle_getbyrole` still used a CSS-selector fallback (`[role="{role}"], {role}`) that only matches an explicit `role=` attribute or a tag name equal to the role string.

## Red signal

Built the exact commit a third-party bug report cited (`dcbe3522`, v0.31.2) in an isolated git worktree and ran its literal minimal repro before writing any code: `find role heading hover` and `find role heading click --name Skills` failed; `find role button` and `find text` (both unaffected by the CSS-selector gap) worked; `snapshot` showed the heading. This confirmed the report against a real binary, not just a source read.

## Method used

1. Verify the report's four claimed root causes against the source at the exact commit cited, then reproduce the minimal repro against a real build of that commit before writing any fix.
2. Run the reference graph of the nearest related PR (#1145) instead of assuming the fix never landed. Found: #1145 merged at 14:10 UTC on 2026-04-05 rewriting `handle_getbyrole` onto the CDP accessibility tree; #1153, an unrelated timeout fix, merged the same day at 19:15 UTC from a branch cut before #1145 landed, and its diff on the same file silently reintroduced the CSS-selector version as a side effect. #1325 caught the regression a month later; #1331 (open since 2026-05-07, unreviewed) fixes it correctly but never merged.
3. Build #1331's branch and run the same repro to establish exactly what it fixes (implicit roles, name source) and what it does not (case-insensitive matching, error detail, help-text drift), so the new work extends rather than duplicates it.
4. Recreate and extend #1331's approach on a fresh branch off current main, crediting the original author, rather than merging the stale external branch directly.
5. Run an adversarial pass against the new diff: enumerate what each hunk introduces, then validate each item against a real build rather than reasoning about it. Built a clean baseline worktree for true A/B comparison (large page, iframe, shadow DOM, native `<select>`) and confirmed several suspected regressions were pre-existing on the unmodified baseline too, not introduced by this diff.
6. Ran three follow-up review passes on the recreated fix, each catching something the prior pass missed: role comparison was still case-sensitive; a role match with no name match collapsed to the same generic message as no match at all; an enrichment message's element count used a deduplicated name list instead of the real element count; every doc example used `<button>`, which matched even under the old broken code (its tag name equals its role) and demonstrated nothing about the fix.
7. Ran the exact minimal repro plus the extra checks (list, banner, link vs. stylesheet-link, case-insensitivity, exact-match) against the final branch, then handed a self-contained repro prompt to a separate agent session with no access to this session's reasoning; it reproduced the same "fixed" result independently.

## Outcome

- Root cause identified as a same-day silent revert, not an unfixed bug: #1145 (fix) -> #1153 (unrelated same-day merge, stale branch, silent revert) -> #1325 (regression report) -> #1331 (correct fix, unmerged 2.5 months).
- Patch: `find_ax_node_by_role` queries `Accessibility.getFullAXTree` and matches role and name case-insensitively (non-exact) against the browser's computed values; a role match with no name match reports the names actually seen; the missing-live-DOM-node fallback no longer names internal CDP fields.
- `cargo test`: 961 passed, 0 failed, 84 ignored; `clippy` and `fmt` clean.
- Two residuals inherited from #1331's design (an AX node matching role and name but exposing no live DOM node, and lookup continuing past such a node) remain unit-tested only. Five real HTML constructs plausibly hitting that path (closed `<select>`/`<option>`, `<datalist>`, image-map `<area>`, a customizable `<select>`) were tried against real Chrome; none reached it.

## Evidence

- Source: PR #1552, five commits on `fix/getbyrole-ax-tree-case-insensitive`. `cli/src/native/actions.rs` `find_ax_node_by_role` (new) and `handle_getbyrole` (rewritten). Root-cause chain: PRs #1145, #1153, #1325, #1331, with merge timestamps and diffs read directly via the GitHub API, not inferred from titles.
- Runtime: CLI repro against a release build of the exact cited commit (fails, as reported); against #1331's branch alone (partially fixed); against the final branch (fixed, including the extra list/banner/link/case-insensitivity checks run live).
- Tests: new unit tests for implicit-role matching, case-insensitive role and name matching, exact-match case sensitivity, the names-seen enrichment (including a regression test for the element-count-vs-unique-names bug), and the missing-live-DOM-node fallback.
- Review: three informal review passes, each with a concrete finding applied (case sensitivity, message enrichment, a counting bug, doc examples that demonstrated nothing); no maintainer review yet.
- Artifact: clean release build on every commit; live CLI verification against an isolated daemon session to avoid cross-worktree state contamination.

## Transferable lesson

> Before writing a new fix for a bug reported as "still broken in main," check whether a changelog or nearby PR claims it was already fixed. A same-day merge on the same file with an unrelated declared scope is a cheap, checkable signature of a silent revert, and it changes the task from "write a fix" to "find out what happened to the one that already existed."

Secondary: an example meant to demonstrate a capability must actually require that capability. `find role button` matched under both the broken and fixed code, because a `<button>` tag name equals its role; it proved nothing about implicit-role support no matter how many comments were attached to it.

## Exceptions

- Applies when the bug has a plausible prior fix (a changelog claim, a closed issue, an existing PR) to trace. A genuinely new, first-reported bug has no revert history to find.
- The "harmless example" secondary lesson does not apply when no coincidental-match case exists to confuse; then any correct example works.

## Candidate changes

- Reference rule (issue triage or unfold Triage): before treating a "regressed" report as a fresh diagnosis, run the reference graph on the nearest related PR; a same-day merge on the same file with a declared scope that does not mention the affected function is a checkable revert signature.
- Reference rule (doc or example review): an example must fail under the pre-fix code to prove it demonstrates the fix; if it succeeds either way, it is decoration, not documentation.
- Eval: given a bug report that references a prior fix by issue or PR number, does the agent check that PR's actual merge history for a same-day sibling touching the same file, before assuming the fix never landed?
- Coverage gap: no current check flags a PR whose declared scope does not mention a function it happens to modify in a shared file, which is exactly the shape of the silent revert this case found.

## Confidentiality review

Public. vercel-labs/agent-browser is a public repository; PR #1552 and the full #1145/#1153/#1325/#1331 chain are public, with timestamps and diffs read from the public GitHub API. Internal team chat coordinated the assignment of this work but is not quoted or referenced by channel; only the fact that it was assigned is stated. No local machine paths appear in this record.
