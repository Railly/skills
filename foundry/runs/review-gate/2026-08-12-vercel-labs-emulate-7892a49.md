# Review gate: vercel-labs/emulate #191

- Base: `e200442672df6d9010c565e6fe1e81003429d83c`
- Head: `7892a49793d034092f992698b2bf32dea372af50`
- Status: complete
- Verdict: approve

## Outcome

No blocking finding was confirmed in PR #191.

The branch includes current `main` and PR #198 without merge conflicts. GitHub CI, Socket, and Vercel checks are green. GitHub reports the PR as blocked only because a review is required.

## Verification

- Full monorepo build: 26 of 26 tasks passed.
- Full monorepo tests: 33 of 33 tasks passed.
- GitHub package: 80 of 80 tests passed.
- Core, GitHub, and emulate type checks passed.
- Focused lint passed with warnings only.
- Prettier and `git diff --check` passed.
- Surface and documentation-sibling gates passed.
- Built CLI help includes the new GitHub API coverage.

The running server was driven through:

- repository creation;
- contents and raw-content reads;
- file creation through blob, tree, commit, and branch-ref advancement;
- commit retrieval;
- ref comparison;
- a stale SHA write returning 409;
- commit comment and check routes remaining reachable ahead of catch-all commit routes.

Force-red verification changed the Git commit response field from `tree` to `commit_tree`. Eight tests failed, including the exact issue #190 regression test. Restoring `tree` returned the focused package to 80 of 80 passing tests.

## Subsystem model

- Repository access derives from visibility, user or organization membership, collaborators, or installation-token scope.
- Content writes create Git objects before advancing the target branch ref.
- Contents, commits, branches, comparisons, and path history consume shared repository, ref, tree, and commit resolution rules.
- Narrow commit comment and check routes must register before catch-all commit routes.
- GitHub App JWT verification sits before the installation-token route and is a separate authentication boundary.

## Impact map

Radius reported 139 changed and 179 impacted symbols, but zero edges and 20,329 unresolved calls. The map materially under-covers this diff. It was not treated as evidence of safety.

## Exemptions claimed

- The generic style gate flagged em dashes. The repository instructions explicitly prefer em dashes, so this is exempt.
- The valid GitHub App JWT failure does not block #191. It reproduces the pre-existing issue #96 and is outside the contents and commit API implementation.

## Issue candidates

- Fix issue #96, GitHub App RS256 JWT verification. A valid JWT returns 401 because verification uses the PKCS#8 private key. The installation-token tests in #191 inject synthetic `authApp` state, so they do not exercise this middleware path.

## Recommendation

Approve #191. Track #96 as the follow-up needed to make the real installation-token CLI flow usable end to end.
