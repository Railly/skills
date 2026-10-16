# Review Gate: vercel-labs/json-render

Date: 2026-09-08
Repository: vercel-labs/json-render
Base: `ea3326046f57138671a238f7b1110ce5de015778`
Head: `8ada1493956ab69a9cede7c80964c9bafedcff0f`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: sequential_isolated
- Runtime receipt: none
- Degraded from: native_subagent
- Schema failures: 0
- Independence gap: Two native reviewer attempts returned generic acknowledgements with no current review. Final source pass is by the orchestrator, not independent model review. Reference-runtime oracles remain valid independent behavioral evidence.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-08-json-render-334-8ada149/scope.md
- Spec status: not_provided
- Acceptance reviewed: A1, A2, A3, A4, A5

## Stage receipts

- Test Strength: unavailable. Required Test Strength receipt is unavailable for the new router/parser and rendering adapter. Authored tests and review reproductions do not replace that method.
- Resilience Audit: unavailable. Required Resilience receipt is unavailable for asynchronous loader failures, pending route transitions and retry ownership.
- Security Review: pass

## Verified properties

- P1: Documented static/dynamic/splat matcher ranking agrees with TanStack Router. oracle.log preserves existing specificity. percent.json and double-percent.json show actual browser decoding to 100% and %25. 41 authored tests include staticParams percent round-trips.
- P2: Loader state is rendered and updated after invalidation; navigation preserves query/hash and pending fallback works. Prior transition/revalidation evidence at bfab0c4 remains relevant: page-renderer/provider are unchanged. Current 41-test run passes all transition/provider tests; current retry is proven separately.
- P3: Default Try again recovers from a transient route loader failure. retry-before.json -> retry-after.json: clicking the real Try again button advances attempts from 1 to 2 and renders Recovered.
- P4: Route-specific metadata reaches SSR HTML for encoded static paths. ssr-unicode.json: /caf%C3%A9 renders <title>Cafe page</title> and Cafe body through documented hooks.
- P5: All declared Open Graph images reach the rendered head. [OPEN FOLLOW-UP] ssr.json confirms F3.
- P6: Server helper exports do not import React or the router at runtime. server.ts, server exports, loader implementations and bundler configuration unchanged from prior reviewed head; current package rebuild succeeded.
- P7: Trailing-slash route keys remain reachable through emitted static paths. independent-oracles.log: /about/ and /blog/$slug/ route keys match slash and non-slash pathnames, in parity with TanStack.

## Deterministic checks

- `exact head and clean tree`: pass. Checkout at 8ada149; identity.log empty; GitHub head revalidated.
- `build`: pass. bun run --cwd packages/tanstack-start build; build.log.
- `tests`: pass. 41 tests across 8 files pass; tests.log.
- `typecheck`: pass. Package tsc --noEmit passes; typecheck.log.
- `diff-check/style/timings/version`: pass. Applicable deterministic checks pass on the corrective diff; logs retained.
- `siblings/surfaces`: acknowledged. Dedicated README, API reference and agent skill describe new retry and pathname behavior. Untouched root README/renderer guide are broad package listings; navigation/titles/docs-chat/package/lock files are registrations or dependency data; provider string is a context error; schema tests are unchanged schema coverage. No unchanged surface asserts the old behavior.
- `radius`: pass. Impact guidance saved in radius.log.
- `security-sensitive boundary`: acknowledged. Corrective code normalizes pathname text and invalidates Router state. No new secret source, HTML sink, privilege or auth check; security receipt refreshed to exact state.
- `covered`: acknowledged. Prior report only covers bfab0c4. New exact-head report authored here; old pass was not reused.

## Judgment lenses

- Inverse regression surface: skipped. New additive package does not replace an existing matcher data source.
- New-domain matrix: skipped. No existing guard or accepted domain is widened; new adapter behavioral matrix belongs to missing Test Strength receipt.
- Resolution-rule consistency across consumers: run. Focused delta review: F2 fix removes decoded/encoded pathname split between loader and head. F4: pattern and pathname normalization now agree. F4: pattern and pathname normalization now agree.
- Shell re-parse append domain: skipped. No production shell argument composition added.
- Emission channel and one-shot latch reachability: skipped. No daemon or one-shot warning channel.
- Shim hermeticity: skipped. Tests do not replace external executables through PATH.
- Deliberate-default check: skipped. No existing renderer default is changed.
- Fresh-seam scan: skipped. No framework patch or new low-level signal channel is added.
- Substrate differential corpus: skipped. No browser accessibility/OS semantic lookup translation; router oracle run is focused separately.
- Reference-implementation oracle: run. Focused delta review: oracle.mjs compared specificity with pinned TanStack Router; suspected empty-splat bug refuted.
- New-failure-outcome propagation: skipped. No existing function gains a new failure outcome; new loader failure covered by error forcing.
- Flag-propagation dispatch sweep: skipped. No new CLI flag or dispatch envelope.
- Error-path forcing: run. Focused delta review: F1 now fixed after forcing real loader failure, button retry, then successful router invalidation. Missing formal Resilience receipt remains explicit.
- Non-destructive recovery: skipped. Retry is explicit rather than a heuristic recovery detector.
- Cancellation and timeout hygiene: run. Focused delta review: Reviewed async spec factories/loaders and pending ownership; no supplied receipt verifies cancellation partitions, so review remains incomplete.
- Boundary pipeline trace: run. Focused delta review: Traced spec to loader/PageRenderer and metadata to HeadContent; F2 and F3 are consumer-boundary mismatches.
- Substrate verification: run. Focused delta review: Observed actual Chrome DOM, loader attempts, URL and serialized SSR HTML.
- Dogfood the built artifact: run. Focused delta review: Compiled core/react-state/react/tanstack-start and drove dist artifacts in browser and Node SSR before trusting authored tests.
- Newly-asserted invariant ownership: run. Focused delta review: Reviewed server-safe import graph, decoded parameter claims and rendering metadata; actual import graph supports limited module claim.
- Docs-behavior parity: run. Focused delta review: README route wiring reproduced; F2. API metadata arrays reproduced; F3.
- Demonstrative example: run. Focused delta review: Used the documented splat loader/head/provider pattern in executable SSR and browser fixtures.
- Choice audit: skipped. No author decision trail was supplied.
- Complexity budget: run. Focused delta review: matchRoute recompiles and sorts routes per call: O(R log R) plus input length; not quadratic element processing and no advertised scale/SLA warrants a confirmed performance finding.

## Findings

- F1: confirmed, fixed. Retry loader failures through the router before clearing the error boundary. Evidence: retry-before.json; retry-after.json; tests.log (new error-boundary regression test).
- F4: confirmed, fixed. Normalize trailing slashes on route keys as well as incoming pathnames. Evidence: independent-oracles.log; tests.log including emitted static path round-trips.
- F2: confirmed, fixed. Normalize the head pathname consistently with the loader pathname. Evidence: ssr-unicode.json; router normalization; tests.log.
- R1: refuted, not_applicable. Empty splat incorrectly outranks exact route. Evidence: oracle.log shows same winner in actual TanStack Router.
- R2: refuted, not_applicable. Same-path invalidation never updates rendered initial state. Evidence: revalidation.json shows value 2 and react-state syncs changed initialState.

## Gaps

- Required Test Strength and Resilience receipts remain unavailable; this is a focused verification of the three requested fixes, not a full formal gate pass.
- Original whole-package review did not exercise the full TanStack Start deployment/hydration/prerender pipeline.
- Open Graph image arrays remain a documented review follow-up outside the three requested changes.
- Focused re-review uses the three requested changes from the user review as acceptance; no separate upstream Spec receipt supplied.

## Limits and provenance

- Author model: unknown (GitHub author ctate)
- Reviewer model: Orchestrator source review; native attempts produced no substantive current review.
- Same family: no
- Independent challenge: satisfied. Current built artifacts driven against actual TanStack Router and React SSR/Chrome independently define expected behavior. No independent model review is credited; source-review.md records the limited sequential pass.
