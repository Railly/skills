# Review Gate: vercel-labs/agent-browser

Date: 2026-09-28
Repository: vercel-labs/agent-browser
Base: `d01253d9db28d75080e36da3c1c31ef89454731e`
Head: `1b4cacd0f1a7f9ee5cdf365882fc3ea01e763d51`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: sequential_isolated
- Runtime receipt: none
- Degraded from: native_subagent
- Schema failures: 4
- Independence gap: FX authentication-mode verification failed; native reviewer failed before returning evidence (Service Unavailable, then web search not supported). The primary runtime performed the sequential pass in the same conversation with separate frozen input/output artifacts. This is not blind review or cross-family independence.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-28-agent-browser-1999-1b4cacd/contract.md
- Spec status: not_required
- Acceptance reviewed: A1, A2, A3, A4, A5

## Stage receipts

- Test Strength: fail at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Three contributor regressions fail for selector timeouts on parent production code and pass on PR head. All eight auth E2E tests pass, but none guards detached-node credential delivery. The independent race oracle fails on head.
- Resilience Audit: fail at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Missing password and submit produce bounded errors and permit immediate retry after the fixture restores the missing control. Replacement of selected username/password instead silently corrupts input and returns loggedIn:true, reproduced twice for each control on head; the parent remains correct.
- Security Review: pass

## Verified properties

- P1: VERIFIED: Hidden-first username/password/submit controls do not prevent filling and submitting visible controls. /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/before-after-results.json; force-red.log; auth-e2e.log
- P2: VERIFIED: Automatic selection skips disabled/readonly duplicates; explicit CSS overrides work for hidden duplicates. /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/matrix-results.json
- P3: REFUTED: Selected auth node remains the actual input destination, and stale selections fail safely. /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/race-results-first.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/race-results.json
- P4: VERIFIED: Existing auth origin checks, no-navigation state, provider login and delayed forms remain functional. auth-e2e.log: 8 passed; matrix-results.json: normal and explicit CSS pass
- P5: UNVERIFIED: Transient descriptor failures repoll and remote object cleanup remains safe under failure/cancellation. actions.rs:12286-12316 has intended normal/error cleanup ordering; no forced-failure receipt.

## Deterministic checks

- `covered (initial)`: acknowledged. No exact-head report existed. This run materializes one; no prior pass was reused.
- `skill identity`: pass. skills-doctor: exact-copy review-gate 77fdde3e8d7e source=clean; skill-identities.json records content hashes.
- `exact head and live base`: pass. Local HEAD and remote PR remain 1b4cacd0; live main equals d01253d9 parent; target working tree clean.
- `style`: pass. style.log
- `surfaces`: acknowledged. Existing docs describe form waiting and CSS selectors without promising first-match semantics. No new flag, schema, or intentional public contract was added. PR's stronger stale-safety sentence is reviewed as F1.
- `callers wait_for_any_selector`: pass. All callers are in changed auth handler.
- `callers resolve_element_object_id/center`: acknowledged. All existing constructors retain allow_role_fallback:true; new false refs are local to auth and never enter state.ref_map. Read interaction fill/click and browser upload paths; F1 captures the affected new exact-ref path.
- `timings`: pass. No new wait ceiling; existing interval retained.
- `cargo build --locked --bin agent-browser`: pass. Exact base/head compiled; build-base.log and build-head.log.
- `cargo fmt -- --check`: pass. fmt.log
- `cargo clippy --bin agent-browser -- -D warnings`: pass. clippy.log
- `cargo test --bin agent-browser -- --test-threads=1`: pass. tests-clean-env.log: 1391 passed, 0 failed, 145 ignored. Initial namespace-injected run had 15 harness/path failures; normalized environment rerun passes.
- `auth E2E`: pass. auth-e2e.log: 8 passed including all 3 new regressions.
- `force-red contributor regressions`: pass. force-red.log: 3 intended timeouts with parent implementation; all green at head.
- `radius`: pass. radius-impact-map.json saved as attention guidance only.

## Judgment lenses

- Inverse regression surface: run. Moving from selector re-resolution to a retained backend node introduces F1 when the DOM replaces an input.
- New-domain matrix: run. Exercised hidden, disabled, readonly, explicit CSS, stable, and replaced controls; matrix-results.json and race-results.json.
- Resolution-rule consistency across consumers: run. All three auth control selections use exact local refs; constructors preserve role fallback for existing snapshot refs.
- Shell re-parse append domain: skipped. No shell argument construction is changed.
- Emission channel and one-shot latch reachability: run. New stale error is returned through the daemon error path, but detached objects skip it and produce false success (F1).
- Shim hermeticity: skipped. No executable shim or PATH mock is added.
- Deliberate-default check: run. Issue 1998, existing visible-selector waits, and authored regressions establish that the hidden-first timeout is unintended.
- Fresh-seam scan: skipped. No new framework signal or callback is introduced.
- Substrate differential corpus: run. Real Chrome A/B compares stable, hidden, disabled, readonly and removed nodes. Detached DOM identity does not imply connected/focusable.
- Reference-implementation oracle: skipped. No getByRole, ARIA mapping, or adopted Playwright contract is changed; DOM lifetime is checked directly on Chrome.
- New-failure-outcome propagation: run. Reviewed caller sweep; exact refs remain local to auth. Missing later controls preserve partial form state and retry; stale path fails to reject.
- Flag-propagation dispatch sweep: run. Internal allow_role_fallback is true in all existing constructors and false only for add_exact_backend_node called by auth.
- Error-path forcing: run. Forced missing password, missing submit, and node replacement. Descriptor refusal/cancellation remain named gaps.
- Non-destructive recovery: run. The selected-node policy avoids role retargeting on resolution errors, but cannot prevent misdirected keyboard input after detached-node resolution.
- Cancellation and timeout hygiene: run. Missing-control timeouts and immediate retries exercised; transient CDP failure and cancellation are not exhaustively forced.
- Boundary pipeline trace: run. Traced Runtime.evaluate -> DOM.describeNode -> local ref -> DOM.resolveNode -> focus -> page-level Input.insertText. Last boundary breaks P3.
- Substrate verification: run. Observed actual DOM values, input-event targets, and submission, with isolated namespaces per compiled binary.
- Dogfood the built artifact: run. Both exact debug binaries drove CLI auth before contributor tests were trusted.
- Newly-asserted invariant ownership: run. The PR's safe-stale claim is false: DOM.resolveNode can return a detached object and focus can leave the previous input active.
- Docs-behavior parity: run. Custom CSS and normal auth contracts remain documented; hidden-duplicate fix is a repair of intended form filling. PR stale-safety prose is refuted by F1.
- Demonstrative example: skipped. No documentation example is added.
- Choice audit: skipped. No author decision trail was supplied.
- Complexity budget: run. Each selector materializes N matches and scans them linearly; per-poll cost O(sum of selector match counts), without nested per-node lookup.

## Findings

- F1: confirmed, open. Reject detached exact auth refs before keyboard input: a replaced password field can receive no input while its password is appended to username, then submitted with loggedIn:true. Evidence: Repeated twice per username/password race. Parent fills replacement correctly. Head stale-user inserts into decoy; head stale-pass produces user=review@example.testlocal-test-password, pass='', submitted=true. /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/race-results.json

## Gaps

- Confirmed P1 F1 prevents promotion: a detached password target can place the password in the username field and return loggedIn:true.
- Required Test Strength and Resilience receipts fail on the missing stale-node protection; transient descriptor/cancellation partitions remain unverified.
- Reviewer runtime protocol failure: two malformed specialist-spawn calls exceeded the per-operation limit. FX then failed its authentication-mode check and the native reviewer failed with a provider capability error. No independent model review completed; the primary runtime finished a disclosed sequential pass.
- A3 refuted; A5 transient transport partitions not fully exercised.

## Limits and provenance

- Author model: unknown external contributor
- Reviewer model: primary Codex runtime; independent gpt-6-astra reviewer unavailable
- Same family: no
- Independent challenge: satisfied. Expected form destinations were defined by the issue/contract. Real Chrome event targets refute the implementation's success result; parent and head driven twice per selected control. This is substrate evidence, not an independent model review.
