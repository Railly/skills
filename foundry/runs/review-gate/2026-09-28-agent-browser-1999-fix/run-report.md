# Review Gate: vercel-labs/agent-browser

Date: 2026-09-28
Repository: vercel-labs/agent-browser
Base: `d01253d9db28d75080e36da3c1c31ef89454731e`
Head: `fad34d20403e67619cde5340731575745e2762e6`
Profile: high-risk
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-sha256:02dbea86720f75b4d8bd513340bc5a2590b915ced95790a7d6729e6da7d2d80d`
Verdict: pass

## Execution

- Mode: native_subagent
- Runtime receipt: none
- Degraded from: fx_worker
- Schema failures: 0
- Independence gap: The native reviewer was independent in context but same-family; high-risk independence is satisfied by the independently defined Chrome/Lightpanda substrate corpus, not by a cross-family model claim.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/contract.md
- Spec status: pass
- Acceptance reviewed: R1, R2, R3, R4, R5, C3

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-sha256:152b1f2073db38ee43657fc15a138424cb231f05c5b4d643d4228ac306efb833`. Real-browser matrices and four fix-absent mutations reject the wrong implementations at the user-visible boundary.
- Resilience Audit: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-sha256:91035714a452a14fb4efacb5afd24e37fa5f34a6a25faa606aec925916a786f3`. All bounded failure regions reject without submission, release observed handles while transport is usable, and permit immediate caller retry.
- Security Review: pass

## Verified properties

- P1: Auth login selects a visible, enabled, editable username/password control and a visible enabled submit control, including explicit CSS selectors. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/auth-exact.log and browser matrix artifacts under /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence.
- P2: Each credential is inserted only into the exact selected backend node; replacement or focus redirection rejects before submission and never writes to the decoy. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/final-fix-race.log and /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/final-lightpanda-race.log.
- P3: The bounded editing and cleanup lifecycle preserves Chrome trusted input, Lightpanda compatibility, controlled React state, textarea/contenteditable behavior, immediate retry, and observed remote-object release. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/final-react-cli-probe.mjs.log, /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/final-react-lightpanda-probe.mjs.log, /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/lifecycle-final.log, and compatibility-results.json.

## Deterministic checks

- `style`: pass. gate.sh style passed on the exact commit.
- `surfaces`: pass. gate.sh surfaces passed using agent-browser conventions.
- `doc siblings`: acknowledged. Every generated sibling finding was read and dispositioned in siblings-disposition.md.
- `callers wait_for_any_selector`: pass. Every call site is in the diff and was reviewed for the new failure outcome.
- `timings`: pass. The diff adds no new wait ceiling.
- `force-red and mutation strength`: pass. Original PR and three production mutants fail intended assertions; restored exact head passes.
- `git diff --check`: pass. No whitespace errors.
- `cargo fmt --check`: pass. Exact-head formatting check passed.
- `cargo clippy -- -D warnings`: pass. Exact-head strict Clippy passed.
- `full cargo test`: pass. 1,393 passed, 146 ignored; dashboard and doctor integration suites add six passes.
- `serial auth E2E`: pass. All nine ignored auth browser tests passed with --ignored --test-threads=1.
- `exact signed commit identity`: pass. HEAD fad34d20403e67619cde5340731575745e2762e6 is clean, signed, and matches the validated ten-file tree.
- `independent review`: pass. Native isolated review found no blocker; same-family limitation is recorded and substrate-corpus independence closes the high-risk requirement.
- `head coverage`: pass. This report is authored for the exact current HEAD and is checked by gate.sh covered after rendering.

## Judgment lenses

- Inverse regression surface: run. Ordinary fill, textarea, contenteditable, and existing auth modes were exercised to detect behavior erased by the new exact-node path.
- New-domain matrix: run. Usability states, selectors, engines, editors, framework control, lifecycle phases, and native-edit outcomes were enumerated and exercised.
- Resolution-rule consistency across consumers: skipped. No config or resolution rule changed.
- Shell re-parse append domain: skipped. No shell command construction changed.
- Emission channel and one-shot latch reachability: run. Input events and one submit action were observed directly; rejection paths prove submit is unreachable after fill failure.
- Shim hermeticity: skipped. No shim or test-only production override was added.
- Deliberate-default check: run. Built-in selector candidates retain order while filtering unusable controls; explicit CSS selectors use the same usability rule.
- Fresh-seam scan: run. Remote-object acquisition/release and engine fallback are the new seams and received direct unit and browser pressure.
- Substrate differential corpus: run. The same replacement, compatibility, React, and lifecycle scenarios ran on Chrome and actual Lightpanda.
- Reference-implementation oracle: skipped. No normative browser reference implementation exists for this auth helper; the contract-defined DOM oracle is direct.
- New-failure-outcome propagation: run. Callers return the auth fill error and stop before submit; MCP delegates the same parser/action path.
- Flag-propagation dispatch sweep: skipped. No public flag was added or changed.
- Error-path forcing: run. Detach, redirection, readonly, exceptions, false/throw edits, origin change, and missing active page were forced.
- Non-destructive recovery: run. Each forced lifecycle failure was followed by an immediate successful caller retry after restoring the form.
- Cancellation and timeout hygiene: run. Bounded selector polling remains unchanged; cleanup after cancellation or destroyed transport is explicitly outside the claim.
- Boundary pipeline trace: run. Credential provider/CLI input, selector resolution, exact remote object, native edit, event, and submit ordering were traced end to end.
- Substrate verification: run. Both supported browser engines were exercised directly.
- Dogfood the built artifact: run. Before/after, replacement races, React, compatibility, and lifecycle probes used built binaries.
- Newly-asserted invariant ownership: run. The auth-specific fill helper owns exact-node validation and remote-handle cleanup; ordinary fill remains unchanged.
- Docs-behavior parity: run. README, docs, skill references, output context, and MCP delegation match the bounded behavior.
- Demonstrative example: run. The preserved before/after artifact shows credential misdelivery and corrected rejection on the same replacement scenarios.
- Choice audit: run. Synchronous native editing avoids focus retargeting; absent-capability fallback is limited to Lightpanda and does not run after false or throw.
- Complexity budget: run. One auth-specific fill helper was added; interaction::fill, polling budgets, storage, and dependencies remain unchanged.

## Findings

- F1: confirmed, fixed. The original PR can deliver credentials to a previously focused field after the selected node is replaced and can submit the wrong form state. Evidence: Chrome and Lightpanda before/after race artifacts reproduce decoy delivery and submission on the original implementation.

## Gaps

None.

## Limits and provenance

- Author model: GPT-6
- Reviewer model: GPT-6 native isolated reviewer plus independently defined browser substrate corpus
- Same family: yes
- Independent challenge: satisfied. A contract-defined oracle drove the built CLI through Chrome and actual Lightpanda before trusting authored tests; original and fixed artifacts separate at DOM and submit boundaries.
