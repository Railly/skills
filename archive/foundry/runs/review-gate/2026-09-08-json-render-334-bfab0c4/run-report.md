# Review Gate: vercel-labs/json-render

Date: 2026-09-08
Repository: vercel-labs/json-render
Base: `ea3326046f57138671a238f7b1110ce5de015778`
Head: `bfab0c4a6ce4d1a5a56ad2979577d28993dc1736`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: native_subagent
- Runtime receipt: none
- Degraded from: fx_worker
- Schema failures: 2
- Independence gap: Original author model is unknown. Native reviewer is the same family as the orchestrator; reference-runtime oracles supply the independent behavioral challenge.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-08-json-render-334-bfab0c4/scope.md
- Spec status: not_provided
- Acceptance reviewed: A1, A2, A3, A4, A5

## Stage receipts

- Test Strength: unavailable. Required Test Strength receipt is unavailable for the new router/parser and rendering adapter. Authored tests and review reproductions do not replace that method.
- Resilience Audit: unavailable. Required Resilience receipt is unavailable for asynchronous loader failures, pending route transitions and retry ownership.
- Security Review: pass

## Verified properties

- P1: Documented static/dynamic/splat matcher ranking agrees with TanStack Router. oracle.mjs/log; encoded-browser.json; authored tests.log. A guessed splat specificity bug was refuted.
- P2: Loader state is rendered and updated after invalidation; navigation preserves query/hash and pending fallback works. revalidation.json shows value 2; browser fixture query action produced /ok?sort=name#section; pending-completed.json; tests.log includes layout and transition cases.
- P3: Default Try again recovers from a transient route loader failure. [REFUTED] retry-before.json and retry-after-invalidate.json confirm F1.
- P4: Route-specific metadata reaches SSR HTML for encoded static paths. [REFUTED] ssr-unicode.json confirms F2.
- P5: All declared Open Graph images reach the rendered head. [REFUTED] ssr.json confirms F3.
- P6: Server helper exports do not import React or the router at runtime. server-import-check.json; ssr.json. Full Start createServerFn compiler path remains outside exercised scope.
- P7: Trailing-slash route keys remain reachable through emitted static paths. [REFUTED] F4 confirmed by a reference-runtime differential; emitted paths can be unreachable.

## Deterministic checks

- `covered`: acknowledged. No exact-head report pre-existed. Script falsely reports pass because run directory name contains head. This report supplies actual coverage; no prior pass inferred.
- `style`: acknowledged. Two added documentation em dashes match neighboring existing prose. Retained as nonblocking editorial observations; user requested review, not source edits.
- `surfaces`: acknowledged. Stored conventions use legacy -> syntax, so script is not sufficient proof. Manually verified new package README, root README, API doc, renderer guide, skills, navigation, titles and docs-chat registration.
- `siblings`: pass. All tanstack-start keyword surfaces are in the diff.
- `timings`: pass. No new wait ceiling.
- `execdeps`: pass. No production external executable invocation.
- `version:check`: pass. All public package versions match 0.20.0.
- `build`: pass. Bun package scripts built core, react-state, react and tanstack-start including declaration outputs.
- `package tests`: pass. All 34 tests across seven files pass; tests.log.
- `package typecheck`: pass. bun run --cwd packages/tanstack-start check-types exits 0.
- `repository CI`: acknowledged. GitHub checks green at exact head. Local turbo delegated to pnpm and failed private-registry 401; used direct Bun package builds/types. No full local monorepo pass claimed.
- `stale/callers/producers/shellmeta/artifacts/rawinput/flagsweep`: acknowledged. No retired values, pre-existing consumers of new public functions, narrowed error predicates, shell detectors, persistent-file writers, prior resolution consumers or CLI flags. New intra-package resolver consumers were traced manually; F2 retained.
- `radius`: pass. Impact Map saved as impact.json; guidance only.
- `diff-check`: pass. git diff --check passes; diff-check.log.

## Judgment lenses

- Inverse regression surface: skipped. New additive package does not replace an existing matcher data source.
- New-domain matrix: skipped. No existing guard or accepted domain is widened; new adapter behavioral matrix belongs to missing Test Strength receipt.
- Resolution-rule consistency across consumers: run. F2 identifies decoded/encoded pathname split between loader and head. F4: trailing-slash keys are compiled with a slash which incoming normalization always removes. F4: trailing-slash keys are compiled with a slash which incoming normalization always removes.
- Shell re-parse append domain: skipped. No production shell argument composition added.
- Emission channel and one-shot latch reachability: skipped. No daemon or one-shot warning channel.
- Shim hermeticity: skipped. Tests do not replace external executables through PATH.
- Deliberate-default check: skipped. No existing renderer default is changed.
- Fresh-seam scan: skipped. No framework patch or new low-level signal channel is added.
- Substrate differential corpus: skipped. No browser accessibility/OS semantic lookup translation; router oracle run is focused separately.
- Reference-implementation oracle: run. oracle.mjs compared specificity with pinned TanStack Router; suspected empty-splat bug refuted.
- New-failure-outcome propagation: skipped. No existing function gains a new failure outcome; new loader failure covered by error forcing.
- Flag-propagation dispatch sweep: skipped. No new CLI flag or dispatch envelope.
- Error-path forcing: run. F1 forced real loader failure, button retry, then successful router invalidation. Missing formal Resilience receipt remains explicit.
- Non-destructive recovery: skipped. Retry is explicit rather than a heuristic recovery detector.
- Cancellation and timeout hygiene: run. Reviewed async spec factories/loaders and pending ownership; no supplied receipt verifies cancellation partitions, so review remains incomplete.
- Boundary pipeline trace: run. Traced spec to loader/PageRenderer and metadata to HeadContent; F2 and F3 are consumer-boundary mismatches.
- Substrate verification: run. Observed actual Chrome DOM, loader attempts, URL and serialized SSR HTML.
- Dogfood the built artifact: run. Compiled core/react-state/react/tanstack-start and drove dist artifacts in browser and Node SSR before trusting authored tests.
- Newly-asserted invariant ownership: run. Reviewed server-safe import graph, decoded parameter claims and rendering metadata; actual import graph supports limited module claim.
- Docs-behavior parity: run. README route wiring reproduced; F2. API metadata arrays reproduced; F3.
- Demonstrative example: run. Used the documented splat loader/head/provider pattern in executable SSR and browser fixtures.
- Choice audit: skipped. No author decision trail was supplied.
- Complexity budget: run. matchRoute recompiles and sorts routes per call: O(R log R) plus input length; not quadratic element processing and no advertised scale/SLA warrants a confirmed performance finding.

## Findings

- F1: confirmed, open. Retry loader failures through the router before clearing the error boundary. Evidence: retry-before.json; retry-after-invalidate.json; browser/main.tsx; TanStack CatchBoundary/Match source
- F4: confirmed, open. Normalize trailing slashes on route keys as well as incoming pathnames. Evidence: independent-oracles.mjs; independent-oracles.log; native-review.md
- F2: confirmed, open. Normalize the head pathname consistently with the loader pathname. Evidence: ssr-unicode.mjs; ssr-unicode.json; documented head hook in packages/tanstack-start/README.md:124
- F3: confirmed, open. Account for HeadContent deduplication before advertising multiple Open Graph images. Evidence: ssr.mjs; ssr.json; @tanstack/react-router/src/headContentUtils.tsx:35-70
- R1: refuted, not_applicable. Empty splat incorrectly outranks exact route. Evidence: oracle.log shows same winner in actual TanStack Router.
- R2: refuted, not_applicable. Same-path invalidation never updates rendered initial state. Evidence: revalidation.json shows value 2 and react-state syncs changed initialState.

## Gaps

- Required Test Strength receipt is unavailable for the new router/parser and rendering adapter. Authored tests and review reproductions do not replace that method.
- Required Resilience receipt is unavailable for asynchronous loader failures, pending route transitions and retry ownership.
- No accepted Issue Contract or separate design/spec receipt accompanied this standalone review; acceptance claims were derived from the PR and package documentation.
- Full TanStack Start deployment, hydration and prerender pipeline were not exercised. Built package browser routing and React SSR were exercised.
- No accepted Issue Contract or separate design/spec receipt accompanied this standalone review; acceptance claims were derived from the PR and package documentation.

## Limits and provenance

- Author model: unknown (GitHub author ctate)
- Reviewer model: Native GPT-6 separate review context plus root review
- Same family: no
- Independent challenge: satisfied. Pinned TanStack implementation defines routing semantics independently; independent-oracles.log compares actual route matching and renders real HeadContent. Native-review.md is an additional separate-context review with same model family, not cross-family evidence.
