# Review Gate: vercel-labs/agent-browser

Date: 2026-09-28
Repository: vercel-labs/agent-browser
Base: `d01253d9db28d75080e36da3c1c31ef89454731e`
Head: `fad34d20403e67619cde5340731575745e2762e6`
Profile: high-risk
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-sha256:02dbea86720f75b4d8bd513340bc5a2590b915ced95790a7d6729e6da7d2d80d`
Verdict: pass

## Execution

- Mode: sequential_isolated
- Runtime receipt: none
- Degraded from: native_subagent
- Schema failures: 2
- Independence gap: Independent native C3 review returned LGTM before the final exception-handle cleanup delta. Its requested narrow follow-up did not return a verdict and was stopped. The final cleanup delta was reviewed sequentially by the author against independent normative V8 wrapEvaluateResult source and a protocol-shaped regression that failed before the fix and passed afterwards. Required high-risk independent challenge is supplied by the pre-solution actual-browser corpus and normative runtime behavior, not by claiming a fresh independent-model review of the final cleanup.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/contract.md
- Spec status: not_required
- Acceptance reviewed: R1, R2, R3, R4, R5

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-sha256:02dbea86720f75b4d8bd513340bc5a2590b915ced95790a7d6729e6da7d2d80d`. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/auth-final.log; /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/unit-final.log; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lifecycle-final-results.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/compatibility-results.json
- Resilience Audit: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;package-sha256:02dbea86720f75b4d8bd513340bc5a2590b915ced95790a7d6729e6da7d2d80d`. /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lifecycle-final-results.json: 32 rejections and 32 immediate retries; both engine missing-control matrices; CDP unit partitions.
- Security Review: pass

## Verified properties

- P1: Usable duplicate control selection fills intended fields and leaves unusable twins untouched. /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/fix-matrix-results.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lightpanda-matrix-results.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/auth-final.log
- P2: Replaced/focus-redirected credential fields reject without wrong-field entry or command submission. /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/fix-race-results.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lightpanda-race-results.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lifecycle-final-results.json
- P3: Normal auth preserves tested editable surfaces, exact Unicode values and controlled React state on both exercised engines. /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/compatibility-results.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/react-cli-probe.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/react-lightpanda-probe.json; /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/ordinary-fill.log
- P4: Selection repolls after descriptor rejection, observed handles are released on completed command paths, and page-fault retries succeed. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/unit-final.log; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lifecycle-final-results.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/fix-matrix-results.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lightpanda-matrix-results.json
- P5: Existing origin/no-navigation/provider behavior and general fill remain intact; attribution and packaging match authorized scope. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/auth-final.log; /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/ordinary-fill.log; git show fad34d20403e67619cde5340731575745e2762e6; /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/gate-surfaces.log

## Deterministic checks

- `exact identity`: pass. Clean committed tree 73e89ac4ef93f221187f90505122b41e4a6bdac1; live main d01253d9db28d75080e36da3c1c31ef89454731e; original PR remains 1b4cacd0.
- `skill identity`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/skill-identity.log: linked review-gate 77fdde3e8d7e source=clean.
- `style and surfaces`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/gate-style.log; /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/gate-surfaces.log
- `callers and timings`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/gate-callers.log; /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/gate-timings.log: all auth selector callsites in diff; no new wait ceiling.
- `doc sibling sweep`: acknowledged. commands.rs is syntax/parser tests; configuration/plugins pages describe provider setup; core SKILL and template give terse examples and no conflicting selection promise; changelog is historical. Unchanged README/help/docs passages concern navigation, origin, plugin or syntax and remain true.
- `cargo fmt and git diff --check`: pass. Final format and whitespace checks pass.
- `cargo clippy -- -D warnings`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/post-cleanup-checks.log
- `cargo test`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/unit-final.log: 1393 unit and 6 integration passed; 146 unit E2E and 2 pin-tab integration ignored by repository defaults.
- `auth E2E`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/auth-final.log: 9 passed; ordinary-fill.log passed.
- `force red and restored green`: pass. Test Strength records source-PR, focus guard, cleanup, capability and actual-engine contenteditable falsifiers.
- `radius`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/radius-impact-map.json retained as attention guidance only.

## Judgment lenses

- Inverse regression surface: run. Auth-only helper leaves ordinary interaction::fill unchanged. Native/absent capability, textarea/contenteditable and React compatibility driven.
- New-domain matrix: run. Automatic/explicit selectors, unusable twins, both credential targets, both engines and lifecycle/capability partitions exercised.
- Resolution-rule consistency across consumers: run. Both credentials share AuthLoginElement::fill; submit uses exact ref. Existing RefMap constructors retain role fallback.
- Shell re-parse append domain: skipped. No shell parsing or command construction change.
- Emission channel and one-shot latch reachability: run. Fill failure propagates through ? before password/submit; JS false and exception become command errors.
- Shim hermeticity: skipped. No executable shim or PATH mock.
- Deliberate-default check: run. Issue1998 requires the usable duplicate; DOM oracle and original before/after establish the defect.
- Fresh-seam scan: run. Synchronous focus/select/input callbacks pressured; checks before edit prevent wrong-field delivery; post-input detachment stops submit.
- Substrate differential corpus: run. Original and fixed compiled CLIs driven against real Chrome and actual Lightpanda with DOM state observations.
- Reference-implementation oracle: skipped. No ARIA/getByRole/reference-library behavior changed; real DOM is the oracle.
- New-failure-outcome propagation: run. Only auth creates exact refs; caller ? stops on rejection. Immediate retry and retained intended partial values verified.
- Flag-propagation dispatch sweep: run. Internal fallback boolean defaults true in all old constructors; false only in add_exact_backend_node.
- Error-path forcing: run. 32 real-engine failure cases with immediate retry plus descriptor and CDP error mock partitions. Final cleanup follows independently verified V8 exception wrapping and its new regression was red before release correction.
- Non-destructive recovery: run. No automatic retarget/retry; caller retry is explicit and succeeds after page fault removal.
- Cancellation and timeout hygiene: run. Existing bounded polling and CDP waits retained. Missing controls time out and retry; no task-abort cleanup claim.
- Boundary pipeline trace: run. Discovery -> exact backend -> resolve -> synchronous guarded edit -> release. No page-level Input.insertText on credential path.
- Substrate verification: run. Independent DOM values, decoy, submission and controlled React state distinguish correctness from CLI success.
- Dogfood the built artifact: run. Stable named binaries prevent shared Cargo-cache identity mistakes; invalid earlier runs preserved and excluded.
- Newly-asserted invariant ownership: run. No blanket hidden/occlusion or arbitrary cancellation claim; docs describe checked properties and pre-entry rejection.
- Docs-behavior parity: run. README/help/MCP/docs/skill references aligned. Terse command/plugin listings remain valid; historical changelog unchanged.
- Demonstrative example: skipped. No new command example; behavior statements are directly exercised.
- Choice audit: run. Kimi reduction-review challenged initial C2; native final review challenges C3 and actual engine evidence; trail preserved.
- Complexity budget: run. Per selector querySelectorAll plus linear find; bounded polling; no nested per-node search introduced.

## Findings

- F1: refuted, fixed. Original PR silently delivers credentials to another focused field after replacement. Evidence: Original remains red; exact-target synchronous edit rejects in both real engines; 32 failure/retry partitions pass.
- F2: refuted, fixed. Rejected selector evaluation retains remote handles. Evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/unit-final.log; /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/mutant-rejected-object.log
- F3: refuted, fixed. Unconditional native edit or select regresses supported engine/editable forms. Evidence: /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/compatibility-results.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/react-lightpanda-probe.json; /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lifecycle-final-results.json

## Gaps

None.

## Limits and provenance

- Author model: Codex GPT-6 with retained Jony contribution
- Reviewer model: Independent native Codex C3 reviewer; supplemental Moonshot Kimi K3 Fast shape/reduction review; final cleanup delta audited sequentially against normative V8 source
- Same family: yes
- Independent challenge: satisfied. Destination oracle was defined from the issue and original PR failure before implementation. Both original and corrected binaries driven; native independent code review artifact and Kimi choice challenge also retained. Final cleanup proof independently uses V8 injected-script.cc wrapEvaluateResult, which wraps native thrown errors as remote IDs irrespective of returnByValue. The test expected handles follow that protocol rather than the production helper.
