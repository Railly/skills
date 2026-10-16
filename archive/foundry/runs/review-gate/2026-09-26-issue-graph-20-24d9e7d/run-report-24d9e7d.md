# Review Gate: vercel-labs/issue-graph

Date: 2026-09-26
Repository: vercel-labs/issue-graph
Base: `55714fa1d45642d00451bc0170aae54de87a966a`
Head: `24d9e7d2b211e6eb6bf9bc1ec54f6792bd3bb475`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: native_subagent
- Runtime receipt: correctness-review.md
- Degraded from: fx_worker
- Schema failures: 2
- Independence gap: FX credential status did not satisfy wrapper contract. Native reviewers are separate contexts in the same model family as root; contributor model is unknown.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-26-issue-graph-20-24d9e7d/contract.md
- Spec status: not_provided
- Acceptance reviewed: exact identity, Jira source fidelity, bounded crawl, TWG compatibility and cleanup, output and package contracts

## Stage receipts

- Test Strength: unavailable. Required Test Strength receipt is absent for Jira normalization, TWG decoding, and shared traversal changes.
- Resilience Audit: unavailable. Required Resilience Audit receipt is absent for subprocess timeout, output-file cleanup, failure partitions, and retry.
- Security Review: incomplete

## Verified properties

- P1: PARTIALLY VERIFIED: Minimum-depth traversal, cap evidence and error exits preserve bounded graph behavior. tests.log: 636 pass. built-smoke.json: cap returns exit1 with PROJ-2 capped; denied node stays explicit. correctness-review.md found no introduced traversal regression. Full behavioral falsification remains pending in Test Strength.
- P2: REFUTED: A remote Jira link identifies the work item at its referenced site. built-smoke.json site-link: beta/PROJ-2 causes alpha/PROJ-2 read and complete output. F1.
- P3: REFUTED: Selected issue normalization attributes only that issue’s relationships. batch-normalization.json: unrelated item contributes PROJ-99 and PROJ-88 to PROJ-1. F2.
- P4: UNVERIFIED: TWG raw and summary variants are compatible and temporary outputs are removed immediately. package-smoke-native.log: 48 commands, synthetic stats fallback and cleanup succeed. security-review.json and missing resilience receipt retain error-path limitations.
- P5: UNVERIFIED: The command performs read-only requests and renders untrusted content within documented safety boundaries. built-smoke.json shows only jira workitem get --full invocations. Security receipt owns classification and producer gaps.
- P6: Published-style package exports, CLI dispatch and documentation build work on tested environment. package-smoke-native.log: 48 package commands pass on Node24, isolated PATH/network guard and exports. docs-check.log and docs-build.log pass. After pinned pnpm10.34.5 install applies committed Next patch, production docs rebuild and90 HTTP route checks pass (docs-pinned-checks.json).

## Deterministic checks

- `identity`: pass. identity.json pins full base/head, clean target, source revision and package digest; doctor linked source clean.
- `covered initial`: acknowledged. No previous exact-head report existed. This run supplies coverage with an incomplete verdict, not a pass.
- `style`: acknowledged. style.log flags em dash in Jira output at src/jira.ts:465. Minor house-style note; no source change made.
- `surfaces`: pass. No mapped required surface omitted.
- `siblings Jira`: pass. Every Jira doc match touched and checked.
- `callers crawl`: acknowledged. Two calls in scripts/verify-transports.ts are read-only comparisons with unchanged FetchNode signature; no prior state mutation or added recovery obligation.
- `flagsweep --site versus --depth`: acknowledged. agents.mdx and graph.mdx demonstrate GitHub modes; index.mdx is a terse routing table linking dedicated Jira guide; src/cli.ts routes jira --help. --site is Jira-only, absent surfaces are not full Jira contracts.
- `timings`: pass. Helper reports no named wait ceiling; transport inline default timeout 30000ms inspected manually and covered by resilience gap.
- `execdeps`: acknowledged. No first-party installer/bootstrap dependency map exists. TWG is explicitly user-provided and never installed automatically.
- `artifact cleanup registration`: acknowledged. No new app-owned persistent state file; TWG owns summary file production, cleanup paths reviewed and specialist gap retained.
- `stale, producers, rawinput, shellmeta`: acknowledged. No retired duplicated flag/value, narrowed existing classifier, deepened existing resolver, or shell-metacharacter detector in diff.
- `force-red`: acknowledged. Required Test Strength receipt absent; Review Gate did not manufacture mutation evidence.
- `PR staleness and silent-revert signature`: acknowledged. PR base equals current main in captured metadata; not a revival or claim of a silently reverted existing fix.
- `configuration example compatibility`: acknowledged. New CLI/library examples, no multi-option config validator changes; package smoke exercises published usage.
- `radius impact`: pass. impact-map.json generated; attention guidance only.
- `git diff --check`: pass. diff-check.log empty, exit0.
- `lint, types, build`: pass. lint.log, typecheck.log, build.log pass.
- `core tests`: pass. 636 tests across32 files pass, tests.log.
- `docs checks and build`: pass. 96 tests across10 files plus docs lint/types and production build pass, docs-check.log/docs-build.log.
- `package smoke`: pass. 48 commands and14 fixture calls pass via repository-native pnpm10.34.5/Node24. Full retained log package-smoke-pinned.log; prior bun/direct node entrypoint mismatch was invocation friction.
- `built dogfood`: pass. Reviewer-owned scenarios inspect CLI output and child argv; findings F1/F2 demonstrate that green suite is insufficient. Packed CLI confirmation retained in packed-batch-cli.json.
- `docs HTTP routes`: pass. 90 production routes pass after frozen pnpm10.34.5 install restores existing Next Vary-header patch. Earlier unpatched Bun install failures were environment-only. docs-http-pinned.log.
- `callers components`: acknowledged. Caller sites in html.ts/render.ts read-only rendering of unchanged node maps. Generic type extraction preserves algorithm and result shape; callers-components.log.

## Judgment lenses

- Inverse regression surface: skipped. Existing GitHub reference parser/data source not replaced; traversal changes covered separately.
- New-domain matrix: run. Jira key, output, relationship/site and payload ownership domains reviewed; real-producer matrix remains unavailable.
- Resolution-rule consistency across consumers: run. Normalized key drops remote site and whole-envelope auxiliary scans cross item ownership; F1/F2.
- Shell re-parse append domain: skipped. Production transport uses execFile argv, no shell command rewriting.
- Emission channel and one-shot latch reachability: skipped. No background daemon or one-shot latch in the changed command.
- Shim hermeticity: run. Package verifier isolated tool PATH, forbids network, and validates fake child argv; 48 commands pass.
- Deliberate-default check: run. Existing GitHub tests and base crawl reviewed. New depth ordering follows prior documented shallow-node precedence; no confirmed default regression.
- Fresh-seam scan: skipped. No framework/runtime patch or forwarded event seam.
- Substrate differential corpus: run. Triggered by TWG summary decoder and URL interpretation; inspected fixtures, but real TWG corpus unavailable and required Test Strength receipt missing.
- Reference-implementation oracle: run. TWG customer producer unavailable; cannot establish normative compatibility from contributor fixture alone.
- New-failure-outcome propagation: run. crawl caller sweep resolved: verify-transports readers do not mutate state before call. CLI errors and rejected reads exercised.
- Flag-propagation dispatch sweep: run. Jira dispatch forwards site/limits; captured child argv confirms site. Wrong remote-site resolution remains F1.
- Error-path forcing: run. Built invalid args, denied reads and caps exercised; full lifecycle forcing/retry belongs to missing Resilience receipt.
- Non-destructive recovery: skipped. No heuristic-driven recovery action.
- Cancellation and timeout hygiene: run. Transport has execFile timeout and output cap; true timeout/cancellation/cleanup partitions are unverified without Resilience receipt.
- Boundary pipeline trace: run. Trace normalization through crawl to TWG and report. Site boundary breaks at normalization, F1; batch ownership breaks before traversal, F2.
- Substrate verification: run. Child argv, installed exports, serialized report and actual package cleanup checked with owned fixtures; actual TWG unavailable.
- Dogfood the built artifact: run. Built CLI ran before authored tests, then installed package verifier passed. Evidence built-smoke.json and package-smoke-native.log.
- Newly-asserted invariant ownership: run. Immediate output-file removal depends on external TWG plus rm outcomes; keep claim gap. Bounded completion does not prove site or attribution correctness.
- Docs-behavior parity: run. Read Jira docs, usage, schema, README and skill changes against output. Wrong-site and ownership claims fail; terse GitHub surfaces exempted.
- Demonstrative example: run. Jira examples require new command. Library/transport exports and Jira package example exercised; live credentials omitted.
- Choice audit: skipped. No author decision trail was supplied.
- Complexity budget: run. Pending scan costs O(D*V+E) under CLI depth<=10; Jira renderer scans nodes per edge O(E*V); normalization queue shifts can be quadratic. No measured regression claimed.
- Security Review: run. Static specialist receipt; no active vulnerability reproduction.

## Findings

- F1: confirmed, open. Preserve site identity before following remote Jira links. Evidence: A beta.atlassian.net/browse/PROJ-2 link from alpha triggers get PROJ-2 --site alpha, returns an unrelated alpha node and coverageComplete true. built-smoke.json site-link and correctness-review.md.
- F2: confirmed, open. Scope comment and remote-link collection to the selected batch item. Evidence: PROJ-1 with no own links acquires PROJ-99 and PROJ-88 from OTHER-1 in the same batch. Confirmed through built public export in batch-normalization.json. packed-batch-cli.json independently confirms extra fetched nodes through installed CLI.

## Gaps

- Required Test Strength receipt is absent for Jira normalization, TWG decoding, and shared traversal changes.
- Required Resilience Audit receipt is absent for subprocess timeout, output-file cleanup, failure partitions, and retry.
- Customer TWG is unavailable; real envelopes, --full completeness, raw/stats compatibility and failure-file behavior were not verified.
- Security Review retains real-producer/rendered-consumer verification gaps; static review confirms no attacker boundary crossing.
- FX wrapper rejected its prescribed auth status. Native review is a separate context but same family as root, and contributor model is unknown; qualifying high-risk independent challenge is not established.
- Node 20/22 and Linux/Windows package behavior were not exercised. Local checks use Node 24 on macOS.
- Live GitHub rollup has a Vercel authorization failure; no successful preview or full source-CI run is established by the available rollup.
- No formal issue contract/design gate or upstream specialist receipts were supplied; review contract recorded from PR and user request.

## Limits and provenance

- Author model: unknown external contributor
- Reviewer model: gpt-6-astra native separate context
- Same family: no
- Independent challenge: not satisfied. Separate native correctness review plus security review completed. Same parent model family and unknown contributor author model do not establish cross-family or normative producer independence.
