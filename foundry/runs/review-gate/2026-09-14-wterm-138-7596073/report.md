# Review Gate: vercel-labs/wterm

Date: 2026-09-14
Repository: vercel-labs/wterm
Base: `0065c68c9d90ed831608d3b17eced9a14bcde609`
Head: `75960737e5a8e21934c94ffa7ee5acc93d460bf3`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: findings

## Execution

- Mode: native_subagent
- Runtime receipt: independent-review.json
- Degraded from: fx_worker
- Schema failures: 1
- Independence gap: Separate reviewer context exists, but different-family provenance or another qualifying high-risk independent challenge was not established.

## Contract

- Path: https://github.com/vercel-labs/wterm/pull/138
- Spec status: incomplete
- Acceptance reviewed: P1, P2, P3

## Stage receipts

- Test Strength: unavailable. No current Test Strength receipt: changed shell adapter/state transition requires behavioral falsification coverage beyond selected probes.
- Resilience Audit: unavailable. No current Resilience Audit receipt: command side effects and post-execution output/state failures need ownership and retry evidence.
- Security Review: pass

## Verified properties

- P1: A submitted append executes once dogfood.log:172-175,207-214: base once twice, head once once.
- P2: Final actual working directory survives into prompt and subsequent command F1; dogfood.log:6-84. Ordinary nonzero passes, explicit exit fails both versions.
- P3: Existing initial-directory semantics remain usable F2/F3; dogfood.log:140-205.

## Deterministic checks

- `skill identity`: pass. skills-doctor --json exit 0; canonical, revision and installed digest match.
- `git diff --check 0065c68c9d90ed831608d3b17eced9a14bcde609 HEAD`: pass. exit 0
- `gate.sh style 0065c68c9d90ed831608d3b17eced9a14bcde609`: pass. exit 0
- `gate.sh covered`: acknowledged. Initial exit 0 was false coverage: grep matched reviewer-prompt.txt containing SHA, not a report. Discarded, no pass inferred.
- `gate.sh surfaces`: acknowledged. exit 1: old convention expects apps/docs/src/app/**/page.mdx, now content/docs/just-bash.mdx and updated; core README only requires package inventory links, unchanged.
- `gate.sh siblings BashShell`: acknowledged. exit 1: package/docs API examples, constructor/getter tables and new feature descriptions read. Unchanged examples do not need duplicating once-only prose. False blanket final-cwd claim is retained in F1 and IC1.
- `gate.sh callers handleInput`: acknowledged. Scoped sweep exit 1. Real consumers: hero, Next, Vite, Vue, Svelte delegate input to BashShell with populated files; Svelte programmatic command includes CR. ChatShell, StreamingShell and DOM InputHandler are unrelated same-name definitions/callers. No signature/return contract change.
- `radius impact --base 0065c68c9d90ed831608d3b17eced9a14bcde609`: pass. exit 0; impact-map.json; 137 files, 497 symbols, 5118 unresolved calls: guidance only.
- `pnpm --filter @wterm/just-bash build`: pass. tsc exit 0; built artifact dogfood performed before authored tests.
- `node /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-wterm-138-7596073/dogfood.mjs /tmp/wterm-pr138-review.XmFrHh`: acknowledged. FAIL, exit 1: five failing cases covering three introduced root causes, tracked as open F1/F2/F3; append-once proof passes.
- `pnpm --filter @wterm/just-bash test`: pass. exit 0, 42 tests in 2 files.
- `pnpm --filter @wterm/just-bash type-check`: pass. exit 0
- `pnpm exec prettier --check packages/@wterm/just-bash/src/index.ts packages/@wterm/just-bash/src/__tests__/bash-shell.test.ts packages/@wterm/just-bash/src/__tests__/bash-shell.integration.test.ts`: pass. exit 0; repository-native formatter on changed TypeScript only.
- `Force-red`: acknowledged. Baseline in-memory append proves original double effect while built head is green for once-only property. Complete authored-test mutation coverage not claimed; Test Strength receipt missing.
- `GitHub exact-head checks`: pass. github-exact-head-checks.json: all six check runs success on exact SHA; Vercel status also success. PR still OPEN, REVIEW_REQUIRED, BLOCKED.

## Judgment lenses

- Inverse regression surface: run. Compared mutable/absent/scoped PWD against actual pwd output and subsequent execution; F1.
- New-domain matrix: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Resolution-rule consistency across consumers: run. Followed cwd through getter, prompt, next exec and completion; F1/F2.
- Shell re-parse append domain: run. Old command prepend/replay removed; reproduced append once and retained shell-special path tests.
- Emission channel and one-shot latch reachability: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Shim hermeticity: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Deliberate-default check: run. Compared parent behavior with current defaults; duplicate side effects accidental, cwd normalization/validation were lost.
- Fresh-seam scan: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Substrate differential corpus: run. Bounded real just-bash old/new corpus exercised assignment, unset, function-local PWD, nonzero, exit, relative and missing cwd. Not exhaustive Test Strength.
- Reference-implementation oracle: run. Used real just-bash pwd and filesystem effects rather than env.PWD proxy; not a full native Bash conformance audit.
- New-failure-outcome propagation: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Flag-propagation dispatch sweep: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Error-path forcing: run. Nonzero and explicit exit driven; missing cwd repeated failure confirmed; exception coverage from authored tests only, missing resilience receipt remains.
- Non-destructive recovery: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Cancellation and timeout hygiene: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Boundary pipeline trace: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Substrate verification: run. Read actual virtual file content for effect-once; observed actual next command and completion output for cwd.
- Dogfood the built artifact: run. Built dist with tsc and ran dogfood.mjs before relying on authored test run.
- Newly-asserted invariant ownership: run. Shell commands can assign/unset/scope PWD; adapter does not own all its writers, F1.
- Docs-behavior parity: run. New final-directory guarantee refuted by F1 and explicit exit; sibling API/options examples otherwise unchanged.
- Demonstrative example: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Choice audit: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.
- Complexity budget: skipped. No corresponding trigger: no new flag, cross-boundary dispatch, heuristic recovery, timer, warning latch, external binary shim, decision trail, example rewrite, or per-element algorithm.

## Findings

- F1: confirmed, open. Do not use mutable env.PWD as authoritative final cwd. Evidence: dogfood.log:6-84,215-217. PWD=/tmp; pwd prints /home/user then changes next execution to /tmp. cd /tmp; unset PWD; pwd and local-PWD function lose the actual cd. Base preserves actual directory for all three. Obtain authoritative execution cwd without replaying user input.
- F2: confirmed, open. Normalize relative initial cwd before passing it to exec and completion. Evidence: dogfood.log:140-149,177-185,218. cwd='home/user', files={'/home/user/homefile':'HOME'}: after pwd, base cwd=/home/user and cat home<Tab> appends file. Head cwd=home/user and Tab appends nothing; directory is resolved relative to itself.
- F3: confirmed, open. Keep the default shell out of a nonexistent working directory. Evidence: dogfood.log:151-169,187-205,219. new BashShell(); pwd; ls; ls: base reports missing /home/user then recovers to / and both ls succeed. Head claims /home/user and both ls fail. files={} suppresses dependency default layout, and ExecOptions.cwd does not create or validate that directory.

## Gaps

- No current Test Strength receipt: changed shell adapter/state transition requires behavioral falsification coverage beyond selected probes.
- No current Resilience Audit receipt: command side effects and post-execution output/state failures need ownership and retry evidence.
- Separate reviewer context exists, but different-family provenance or another qualifying high-risk independent challenge was not established.
- Browser terminal input/render integration was not driven; built public BashShell API was driven under Node 24.18.0.
- No pre-existing Issue Contract, Solution or Spec receipt was supplied; claims were reconstructed from the exact PR and documentation.
- No pre-existing Issue Contract, Solution or Spec receipt was supplied; claims were reconstructed from the exact PR and documentation.

## Limits and provenance

- Author model: unknown
- Reviewer model: native inherited runtime, exact model not exposed
- Same family: no
- Independent challenge: not satisfied. Separate reviewer context exists, but different-family provenance or another qualifying high-risk independent challenge was not established.
