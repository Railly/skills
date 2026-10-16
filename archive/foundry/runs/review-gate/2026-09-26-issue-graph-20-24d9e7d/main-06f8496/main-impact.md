# Main compatibility addendum

Observed: 2026-09-26T21:11:25.809476+00:00

PR head: `24d9e7d2b211e6eb6bf9bc1ec54f6792bd3bb475`. New main: `06f8496ad26b4dbd2d8bca754a125fcc23846dae`. Local integration tree: `37c52a80b71934fb840ccd594103174be9736edf`.

The two P2 findings and incomplete verdict remain. Added merge-resolution obligation. Combined tree passes645 core tests,96 docs tests,lint,typecheck,build and targeted built smoke; not a new full gate or published merge.

The primary checkout pull fetched `labs/main` but safely aborted because of existing local edits in five files. Those edits remain untouched. The isolated worktree is `/Users/raillyhugo/Programming/vercel/issue-graph-review-pr20-main` and has an uncommitted merge.

The sole textual conflict is the `src/cli.ts` usage list. Keeping both `jira` and `dashboard` resolves it locally. Main changed no Jira normalizer, TWG transport, Jira command, graph crawler or graph types. Both confirmed findings reproduce in the combined built artifact.

The original report remains the exact PR-head review. This addendum records compatibility with newer main and does not promote the combined tree to a gate pass.

Evidence: `main-impact.json`, `identity.json`, `checks.json`, `built-smoke.json`, `batch-normalization.json` and `integration.patch`.
