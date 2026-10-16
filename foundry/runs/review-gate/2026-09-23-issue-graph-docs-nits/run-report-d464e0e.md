# Review Gate: vercel-labs/issue-graph

Date: 2026-09-23
Repository: vercel-labs/issue-graph
Base: `5a4f21797b11824cd76f60b0943dc6e3a9249f47`
Head: `d464e0efa043b2de48bea9e7c8bafb5bff520585`
Profile: mechanical
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: pass

## Execution

- Mode: sequential_isolated
- Runtime receipt: focused-review.json
- Degraded from: native_subagent
- Schema failures: 1
- Independence gap: Same-author focused review; native subagent delivered no review and FX auth capability was unavailable. Independent challenge is not required for this mechanical profile.

## Contract

- Path: contract.md
- Spec status: not_required
- Acceptance reviewed: A1, A2, A3, A4, A5, A6, A7, A8

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. 12 real-browser green/old-CSS/restored cases; old CSS prevents native PageDown page motion; restored CSS passes native PageDown in all three panels at 390px.
- Resilience Audit: not_triggered. No new durable writes, retry, cleanup, lifecycle, or post-commit failure paths.
- Security Review: missing

## Verified properties

- P1: Original terminal examples remain complete and the page handles vertical scrolling. browser-falsification.json records 12 current/old/restored cases and native PageDown; focused-review.json confirms source payload identity.
- P2: Header links to npm, hero breaks after work, and the agent pill copies the repository shorthand. ui-checks.json records the npm href, external target and icon, headline break, and npx skills@latest add vercel-labs/issue-graph payload. OS clipboard readback is not claimed.
- P3: Documentation uses direct published-product wording while retaining existing prerequisites, coverage limits, and setup distinctions. Focused review inspected prose and boundaries; 89 docs tests and 85 HTTP route checks passed. CLI and canonical skill are byte-for-byte unchanged. Public-site skill fallback remains documented.

## Deterministic checks

- `exact head, clean tree, valid local signature`: pass. d464e0efa043b2de48bea9e7c8bafb5bff520585
- `style`: pass. No added prose punctuation findings.
- `stale packageReleasePending`: pass. Zero remaining hits after CONTRIBUTING fix.
- `doc siblings skills@latest add`: pass. Repository shorthand and public fallback are consistent.
- `surface sweep`: acknowledged. terminal-demo.test.ts unchanged intentionally: original examples and existing keyboard semantics are preserved; actual CSS scroll behavior is covered by browser falsification.
- `impact radius`: pass. impact-map.json and impact-map-receipt.json retained.
- `pnpm check`: pass. 592 tests, lint, typecheck, and build.
- `pnpm check:docs`: pass. 89 tests, docs lint, and typecheck.
- `production docs build and HTTP route suite`: pass. Build successful; 85 route checks.
- `fix-absent browser proof`: pass. 12 green/old-CSS/restored cases plus native PageDown.
- `git diff --check`: pass. Clean.

## Judgment lenses

- Inverse regression surface: skipped. No matcher, parser, or lookup data source changes.
- New-domain matrix: skipped. No validation or accepted-input domain changes.
- Resolution-rule consistency across consumers: skipped. No resolution or discovery algorithm changes.
- Shell re-parse append domain: skipped. No shell argument construction or package-script changes.
- Emission channel and one-shot latch reachability: skipped. No new warnings, latches, or daemon behavior.
- Shim hermeticity: skipped. No external binary shims added.
- Deliberate-default check: run. The former fixed-height terminal is intentionally replaced by natural height; all original payloads remain.
- Fresh-seam scan: skipped. No framework or runtime patch.
- Substrate differential corpus: skipped. No guard models an external substrate.
- Reference-implementation oracle: skipped. No spec or reference behavior is reimplemented.
- New-failure-outcome propagation: skipped. No new runtime outcome classes.
- Flag-propagation dispatch sweep: skipped. No new flags or modes; obsolete constant branch removed from published-product copy.
- Error-path forcing: skipped. No new branch, guard, wrapper, or durable side effect.
- Non-destructive recovery: skipped. No recovery action added.
- Cancellation and timeout hygiene: skipped. No new async operations or waits.
- Boundary pipeline trace: skipped. No runtime feature crosses a new boundary.
- Substrate verification: run. Consumed exact-head browser measurements, clipboard-write payload, and rendered npm link evidence.
- Dogfood the built artifact: run. Built production docs and exercised routes, terminal tabs, keyboard input, header and copy button.
- Newly-asserted invariant ownership: skipped. Copy restates existing behavior; no new mutable-state invariant is asserted.
- Docs-behavior parity: run. Reviewed README and all authored docs against retained CLI contracts and website behavior.
- Demonstrative example: run. Original three terminal examples retained; command examples remain consistent with installed CLI help and existing contract tests.
- Choice audit: skipped. No decision trail was emitted for this bounded docs change.
- Complexity budget: skipped. No per-element loop or lookup is added.
- security: skipped. Permissions/privacy prose retains existing boundaries. No credential, authorization, confidentiality, sandbox, or security runtime behavior changes.

## Findings

- F1: confirmed, fixed. CONTRIBUTING still mentioned removed packageReleasePending constant. Evidence: Exact-head CONTRIBUTING now describes publication and repository visibility without the removed constant.

## Gaps

None.

## Limits and provenance

- Author model: Codex, exact inherited backend not recorded
- Reviewer model: same Codex root agent
- Same family: yes
- Independent challenge: not satisfied. Mechanical profile uses one focused sequential review. Browser falsification supplies a direct independent-of-implementation oracle, not a separate reviewer.
