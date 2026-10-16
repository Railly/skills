# Case: Generalized trigger verified against the bug's inputs, not the new domain

> Contribution-side ledger for PR #366 (the fix's delivery). The review-side ledger for the same PR — the gate run, its guard-derived-matrix miss, and the external bot round — is [366-guard-derived-matrix](366-guard-derived-matrix.md).

Status: observed
Validation: contributor-validated
Human review: reviewed (Hunter directed base, scope, commit split, and the miss analysis)
Maintainer acceptance: pending
Delivery: PR open (ready for review since 2026-07-17)
Upstream status checked: 2026-07-18
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/366 (fixes #285; base #303; related #150, #146, #238, #284)
Issue or PR: https://github.com/vercel-labs/portless/pull/366
Date: 2026-07-16 (updated 2026-07-18)

> No maintainer review as of 2026-07-18 (only `vercel[bot]` review/comment; CI green on head `a9c7726`). Technical validation is my own: E2E matrix against real package-manager binaries, full suites, double revert-proof, and a second full review-gate pass on 2026-07-17.

## Observed failure

Issue #285: zero-arg mode runs the dev script via `<pm> run dev`, so the framework command lives inside package.json where `injectFrameworkFlags` cannot see it (it only inspects argv). Vite ignores `PORT`, binds 5173, the assigned route targets 4xxx, and the URL returns 502.

## Red signal

E2E reproduction matrix against main (74c9868), isolated Vite scaffolds per package manager:

- 7/9 invocations broken on main (zero-arg bun/npm/pnpm, explicit `run <pm> run dev` x3, `bun --bun vite dev`): inject=NO, Vite on 5173, HTTP 502.
- 2/9 green controls (`bunx vite dev`, `npx vite dev`): inject=YES, HTTP 200.
- Trustworthy because the CLI's `Running:` line shows the final post-injection command, plus a curl per row.
- Final branch: 8/9 green; the remaining 502 (`bun --bun vite dev`) is #238's scope, excluded on purpose.

## Method used

1. gh-graph of #285 (depth 2), full read of #285/#303/#238/#150. Result: #303 (@EfeDurmaz16) selected as base.
2. Reproduced on main BEFORE reading #303's diff (9-invocation matrix).
3. Evaluated #303: rebased clean, fixes zero-arg (3/9 → 6 green) but not explicit delegation — scriptContext only wired from the two zero-arg paths.
4. Own branch based on #303, generalizing the trigger: derive context from the command SHAPE (`<pm> run <script>` + process.cwd()) instead of caller-passed context. Commit `99748dd`, `Co-Authored-By: EfeDurmaz16`.
5. Adversarial gate found 3 holes I verified by revert-proof and fixed in `a4f0628`: `vite build` received server flags and aborted; compound scripts (`&&`) got flags appended to the last shell command; `--port=5000` not recognized by `includes("--port")` → duplicate injection.
6. Second full review-gate pass (2026-07-17): force-red (revert with tests kept → 7/15 unit + 2/4 integration red; restored → 19/19), boundary probes against real binaries (npm 11 eats flags without `--`; pnpm/bun forward directly), forced error paths (malformed/missing package.json → no crash), empirical refutation of a suspected CWD mismatch (all three runApp callers operate in process.cwd()). Verdict: no blockers; 2 MINOR doc findings.
7. Closed the MINORs in `a9c7726`: compound-script scope clause on all three contract surfaces (README, skills/portless/SKILL.md, cli.ts `--help`) plus a conservative-scope paragraph in the PR body.

## Why the first pass missed the gate findings

Root: I verified against the BUG's inputs, not the new TRIGGER's domain. The 9-invocation matrix came from the reports — all single-command dev scripts running `vite dev`. The change widened the firing surface to "any `<pm> run <script>` whose script resolves to a framework": build scripts, compound scripts, `--flag=value`. I never asked "what ELSE does this fire on now?". Aggravators: (1) an inherited helper (`includes("--port")`) gains new reach and its previously-benign holes become new bugs — and I had written a suppression test with the spaced form only, which gave false confidence; (2) I analyzed interactions with other PRs (#238 double-injection) but not with other SCRIPT SHAPES, the actual input variation axis. The E2E scaffolds all shared one script, cloned from the issue repro: wide on package managers (the bug's axis), depth 1 on script shapes (the change's axis).

## Outcome

reproduced + evaluated + based-on-best + extended + hardened post-gate + re-gated (no blockers) + docs-hardened + ready for review with green CI. Live Vite bind and disappearance of the 502 observed directly in the E2E matrix (route port == listening port, HTTP 200) — resolves the unknown left by [285](285-package-script-flags.md).

## Evidence

### Source

- https://github.com/vercel-labs/portless/pull/366 — 3 commits: `99748dd`, `a4f0628`, `a9c7726`.
- https://github.com/vercel-labs/portless/pull/303 — base, compared and rebased.

### Runtime

- E2E matrix results recorded 2026-07-16 (main 7/9 broken; #303 6/9; final 8/9). Equivalent coverage lives in the PR's tests.
- Revert-proof twice: guards off → exactly the 3 new tests fail; restored → 134/134. Force-red of the whole fix → 7/15 + 2/4 red; restored → 19/19.

### Tests

- cli-utils 134 passed; full suite 733/735 (2 pre-existing environmental failures, equal on main baseline); CI green on `a9c7726` including ci-windows (checked 2026-07-18).

### Unknowns

- yarn forwarding never observed against a real binary (not installed locally; the PR's E2E covered bun/npm/pnpm). The "yarn forwards trailing arguments directly" claim rests on shape-level unit tests. Suggested pre-merge probe: `corepack enable` + 30s check with yarn 1 and berry.
- Runner-wrapped build scripts (`"dev": "bunx vite build"`) bypass the build guard, which inspects only `rawScript[1]` while `findFrameworkBasename` skips runner wrappers — confirmed by the external bot round and repro (see [366-guard-derived-matrix](366-guard-derived-matrix.md)); unfixed at head `a9c7726`.
- Multi-app workspace mode never calls the injector (cli.ts:3725/3595) — pre-existing gap, acknowledged in PR body prose only; issue not yet opened. Warning for whoever extends it: there the CWD mismatch is real (default packageDir ≠ pkg.dir).

## Transferable lesson

> When you generalize a fix's trigger (from "the reported case" to "a class of inputs"), regenerate the verification matrix from the new trigger's domain: enumerate the input shapes the new code now reaches (here: build scripts, compound scripts, `--flag=value`) and exercise one of each. Inheriting the bug report's matrix verifies the old fix, not the new code.

- Why it transfers: any fix that widens a firing condition (matcher, parser, hook, route) turns previously-unreachable states reachable; reused helpers bring holes that were benign only because unreachable.
- Where it does not apply: fixes that narrow or preserve the firing surface; the report's matrix stays representative.
- Known exceptions: open input domains (arbitrary shell scripts) are not enumerated exhaustively — enumerate the STRUCTURAL classes (single/compound, dev/build, flag spacing) and leave conservative guards for the rest.

## Candidate changes

### Reference rule

- Already landed in [conventions.md](conventions.md) verification norms: widened trigger → regenerate the matrix from the new input domain; an inherited helper that gains reach inherits its holes.

### Exemplar

- Pair of [363's competing-PRs case]: that one protects when choosing the base; this one protects when extending it.

### Coverage gap

- yarn real-binary forwarding; multi-app workspace injection (issue candidate with evidence ready).

## Promotion recommendation

Add reference rule (done — see conventions.md) and keep this case as the exemplar for the base-and-extend step.

## Missing evidence

- Maintainer review and acceptance.
- yarn real-binary probe.
- Issue for the multi-app workspace gap (evidence ready, not opened).
