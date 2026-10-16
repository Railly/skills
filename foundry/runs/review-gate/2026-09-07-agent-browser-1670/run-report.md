# Review Gate: vercel-labs/agent-browser

Date: 2026-09-07
Repository: vercel-labs/agent-browser
Base: `a45f1b656cb13c74bf1dca2f1439b77e8020360c`
Head: `a45f1b656cb13c74bf1dca2f1439b77e8020360c`
Profile: high-risk
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: fx_worker
- Runtime receipt: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-07-agent-browser-1670/fx-review.json
- Degraded from: native_subagent
- Schema failures: 0
- Independence gap: none

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-07-agent-browser-1670/packet.md
- Spec status: pass
- Acceptance reviewed: R0, R1, R2, R3, R4, R5, R6

## Stage receipts

- Test Strength: unavailable at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. 1176 tests pass; 3 production mutations killed and restored; separate Chrome/MCP real-boundary evidence. Unexecuted cells explicitly named below. pool-proof.json exercises an old in-flight pooled HTTP operation, root replacement, rejection of the previous issuer at the next acquisition, and success after server certificate rotation, all with one daemon. Follow-up verified all 36 explicit/native selection transition cells, 32 structured input classes, six additional killed faults, cancellation/timeout/disconnect/shutdown recovery, CPU-width concurrent requests, and real Debian native-store plus Chromium NSS behavior.
- Resilience Audit: unavailable at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Forced unknown issuer, corrupt retained file, failed explicit update, restore file and immediate retry; daemon and live page continuity. pool-proof.json exercises an old in-flight pooled HTTP operation, root replacement, rejection of the previous issuer at the next acquisition, and success after server certificate rotation, all with one daemon. Follow-up verified all 36 explicit/native selection transition cells, 32 structured input classes, six additional killed faults, cancellation/timeout/disconnect/shutdown recovery, CPU-width concurrent requests, and real Debian native-store plus Chromium NSS behavior.
- Security Review: pass

## Verified properties

- P1: read and install use explicit TLS trust without Chromium/NSS setup cargo-test.log; baseline and browserless-dispatch mutation: known private issuer request reaches local server only with CA.
- P2: Changed selections, omission, clear and explicit false are honored in a reused session TLS CLI tests and mcp-smoke.json; daemon command-wiring mutation fails at the real read boundary.
- P3: Same-path and symlink certificate rotation affect new TLS clients without killing admitted operations TLS CLI/unit tests, stale-client-generation mutation and pool-proof.json.
- P4: Issuer, hostname and expiry verification remain enabled TLS negative fixtures and installer local CONNECT acceptance/rejection.
- P5: Daemon and browser state survive TLS-only updates; old protocol daemon restarts once chrome-proof.log, page marker and tab identity; migration.json records old PID -> new PID -> same new PID.
- P6: UNVERIFIED: actual managed native-root rotation across all supported operating systems Real Debian native-store rotation verified with SSL_CERT_FILE/DIR unset; macOS MDM/Keychain and Windows native store remain unverified.

## Deterministic checks

- `Rust full suite`: pass. 1167 unit + 2 doctor + 7 TLS integration, 0 failed; 105 ignored including separately executed Chrome proof.
- `Chrome/MCP/pool/migration boundaries`: pass. See chrome-proof.log, mcp-smoke.json, pool-proof.json, migration.json.
- `clippy all-targets all-features`: pass. One pre-existing unbounded-range warning in untouched native/browser.rs test.
- `fmt and git diff whitespace`: pass. cargo fmt --check and git diff --check.
- `style and callers`: pass. deterministic.log; all fallible trust-client call sites updated.
- `surfaces`: acknowledged. streaming page only documents frame transport; outbound trust semantics documented on TLS surfaces.
- `schemas`: pass. Only three descriptions changed; exact parity test rerun after formatting-only cleanup.
- `skill identity`: pass. skills-doctor reports linked review-gate at clean 77fdde3e8d7e.
- `Follow-up transition/input/mutation/pressure/native-Linux/preview verification`: pass. /Users/raillyhugo/Programming/railly/skills/foundry/runs/solution-gate/2026-09-07-agent-browser-1670/followup-verification.json
- `Follow-up clippy/fmt`: pass. Only pre-existing unbounded-range warning in native/browser.rs; no production source edits.

## Judgment lenses

- Inverse regression surface: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- New-domain matrix: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Resolution-rule consistency across consumers: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Shell re-parse append domain: skipped. No shell parser or command string generation changed.
- Emission channel and one-shot latch reachability: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Shim hermeticity: skipped. No shim introduced.
- Deliberate-default check: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Fresh-seam scan: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Substrate differential corpus: skipped. Native platform store corpus remains an explicit verification gap.
- Reference-implementation oracle: skipped. TLS boundary certificate acceptance is the independent oracle; no adapter reference implementation changed.
- New-failure-outcome propagation: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Flag-propagation dispatch sweep: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Error-path forcing: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Non-destructive recovery: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Cancellation and timeout hygiene: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Boundary pipeline trace: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Substrate verification: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Dogfood the built artifact: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Newly-asserted invariant ownership: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Docs-behavior parity: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Demonstrative example: run. Reviewed against TLS source, caller sweep, actual CLI/MCP boundary traces, failure and rotation proofs; independent FX review also examined triggered lenses.
- Choice audit: skipped. No decision trail was created; shape decision is recorded separately.
- Complexity budget: skipped. Root sorting is O(n log n) followed by deduplication once per acquisition, no nested per-element lookup added.

## Findings

None.

## Gaps

- Zscaler interception with MDM-managed macOS Keychain rotation on the reporter machine.
- Native Windows store acceptance and rotation not executed.
- Zscaler interception with MDM-managed macOS Keychain rotation on the reporter machine.
- Native Windows store acceptance and rotation not executed.

## Limits and provenance

- Author model: GPT-6 Codex
- Reviewer model: anthropic/claude-opus-4.6
- Same family: no
- Independent challenge: satisfied. Independent local source review found no concrete blocking defect; observations and test gaps corrected against raw evidence.
