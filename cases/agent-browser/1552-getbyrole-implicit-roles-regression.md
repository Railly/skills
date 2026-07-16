# Case: Trace a "still broken" bug to a same-day silent revert before writing a new fix

Status: candidate
Validation: independently-validated
Human review: received 2026-07-16 (maintainer; two findings, both confirmed real and fixed locally)
Maintainer acceptance: pending
Delivery: PR open (review-response commits pushed 2026-07-16)
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
8. A maintainer review pass (2026-07-16) found two defects all seven prior steps missed: the AX rewrite broke `find role none` and `find role presentation` (both worked under the old CSS path via their explicit attributes), and the `--exact` reword only covered markdown surfaces, leaving the binary's own `--help` and the MCP tool schema on the old "Require exact text match" wording.
9. Confirmed the regression with a live A/B (old build matched `role="none"`/`role="presentation"` elements; the new build returned the generic miss), then probed `Accessibility.getFullAXTree` raw over CDP: Chrome prunes presentational divs, lists, and imgs from the tree entirely and keeps only table-like cases as ignored nodes, so no amount of ignored-node matching can answer these queries. Routed the two roles to a syntactic DOM-attribute match (literal per synonym, like the old path and Playwright), added a forced e2e regression test, and rewrote the `--exact` description on both runtime surfaces.

## Outcome

- Root cause identified as a same-day silent revert, not an unfixed bug: #1145 (fix) -> #1153 (unrelated same-day merge, stale branch, silent revert) -> #1325 (regression report) -> #1331 (correct fix, unmerged 2.5 months).
- Patch: `find_ax_node_by_role` queries `Accessibility.getFullAXTree` and matches role and name case-insensitively (non-exact) against the browser's computed values; a role match with no name match reports the names actually seen; the missing-live-DOM-node fallback no longer names internal CDP fields.
- `cargo test`: 961 passed, 0 failed, 84 ignored; `clippy` and `fmt` clean.
- Two residuals inherited from #1331's design (an AX node matching role and name but exposing no live DOM node, and lookup continuing past such a node) remain unit-tested only. Five real HTML constructs plausibly hitting that path (closed `<select>`/`<option>`, `<datalist>`, image-map `<area>`, a customizable `<select>`) were tried against real Chrome; none reached it.
- Post-review (2026-07-16): both maintainer findings fixed on the branch after merging main (v0.32.1) -- presentational roles resolve through a DOM-attribute fallback (live-verified: `none` -> alpha, `presentation` -> beta, `heading` still via AX), and `--help` plus the MCP schema now state the real `--exact` contract. 964 unit tests pass plus a new `#[ignore]`d real-Chrome e2e; clippy and fmt clean. One cross-PR interaction: until #1553's error-flattening fix lands, `to_ai_friendly_error` still rewrites this fallback's specific miss message into the generic one.
- Why the misses happened: the verification matrix (heading, list, banner, link, case, exact) only contained roles whose point is to exist in the AX tree, so no check could catch the roles whose point is absence from it; and the docs pass equated "docs" with markdown, so the two runtime doc surfaces (binary help, MCP schema) never entered the sweep -- the same night the sibling PR #1553 was fixing exactly that class of drift on the same two files.

## Evidence

- Source: PR #1552, five commits on `fix/getbyrole-ax-tree-case-insensitive`. `cli/src/native/actions.rs` `find_ax_node_by_role` (new) and `handle_getbyrole` (rewritten). Root-cause chain: PRs #1145, #1153, #1325, #1331, with merge timestamps and diffs read directly via the GitHub API, not inferred from titles.
- Runtime: CLI repro against a release build of the exact cited commit (fails, as reported); against #1331's branch alone (partially fixed); against the final branch (fixed, including the extra list/banner/link/case-insensitivity checks run live).
- Tests: new unit tests for implicit-role matching, case-insensitive role and name matching, exact-match case sensitivity, the names-seen enrichment (including a regression test for the element-count-vs-unique-names bug), and the missing-live-DOM-node fallback.
- Review: three informal review passes, each with a concrete finding applied (case sensitivity, message enrichment, a counting bug, doc examples that demonstrated nothing); no maintainer review yet.
- Artifact: clean release build on every commit; live CLI verification against an isolated daemon session to avoid cross-worktree state contamination.

## Transferable lesson

> Before writing a new fix for a bug reported as "still broken in main," check whether a changelog or nearby PR claims it was already fixed. A same-day merge on the same file with an unrelated declared scope is a cheap, checkable signature of a silent revert, and it changes the task from "write a fix" to "find out what happened to the one that already existed."

Secondary: an example meant to demonstrate a capability must actually require that capability. `find role button` matched under both the broken and fixed code, because a `<button>` tag name equals its role; it proved nothing about implicit-role support no matter how many comments were attached to it.

Third (from maintainer review): replacing a syntactic matcher with a semantic one has two regression surfaces, not one. Every adversarial pass here asked "what does the new matcher see that the old one missed?" (implicit roles); none asked the inverse -- "what did the old matcher accept that the new data source erases?" Presentational roles are precisely the values whose meaning is absence from the new source, so they were structurally invisible to a test matrix built from the first question alone.

## Exceptions

- Applies when the bug has a plausible prior fix (a changelog claim, a closed issue, an existing PR) to trace. A genuinely new, first-reported bug has no revert history to find.
- The "harmless example" secondary lesson does not apply when no coincidental-match case exists to confuse; then any correct example works.

## Candidate changes

- Reference rule (issue triage or unfold Triage): before treating a "regressed" report as a fresh diagnosis, run the reference graph on the nearest related PR; a same-day merge on the same file with a declared scope that does not mention the affected function is a checkable revert signature.
- Reference rule (doc or example review): an example must fail under the pre-fix code to prove it demonstrates the fix; if it succeeds either way, it is decoration, not documentation.
- Eval: given a bug report that references a prior fix by issue or PR number, does the agent check that PR's actual merge history for a same-day sibling touching the same file, before assuming the fix never landed?
- Coverage gap: no current check flags a PR whose declared scope does not mention a function it happens to modify in a shared file, which is exactly the shape of the silent revert this case found.
- Reference rule (matcher/data-source replacement, from maintainer review): when a diff swaps the data source a query resolves against, build the test matrix from both directions -- what the new source newly answers AND what the old source answered that the new one cannot represent. Values whose semantics is absence from the new source (presentational roles, ignored nodes, tombstones) are the canonical blind spot.
- Reference rule (doc sweeps, from maintainer review): "docs" includes every surface that describes the contract to a consumer -- in-binary `--help` strings and MCP/tool schemas as much as markdown. Derive the sweep's file list from a repo-wide search for the stale wording, not from the file types one associates with documentation.
- Coverage gap (process): two sibling PRs were developed the same night in separate worktrees, and the lesson one of them was built on (help/MCP text drifts from behavior) did not transfer to the other, which introduced fresh drift on the same two files. Nothing in the method makes a sibling branch's lesson a checklist item for its twin.

## Confidentiality review

Public. vercel-labs/agent-browser is a public repository; PR #1552 and the full #1145/#1153/#1325/#1331 chain are public, with timestamps and diffs read from the public GitHub API. Internal team chat coordinated the assignment of this work but is not quoted or referenced by channel; only the fact that it was assigned is stated. No local machine paths appear in this record.
