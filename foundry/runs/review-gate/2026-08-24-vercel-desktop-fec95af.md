# Review Gate: Vercel Desktop usage-report

Status: pass for `fec95af` on base `1c3d4c7`.

The change moves Today, 7-day, and 30-day numeric authority to one key-filtered `/ai-gateway/usage-report` snapshot. CLI and OAuth sessions share one strict parser and publisher. Legacy hourly, model, and top-spender requests remain only where the new endpoint cannot preserve existing detail.

All checks passed: formatting, diff check, `pnpm check`, 171 tests, ReleaseFast build, surface/stale/sibling/caller/timing gates, Test Strength, and Resilience Audit.

The review found one obsolete comment describing the retired incremental window fetch. It was corrected before this exact HEAD. No code findings remain open.

Same-family warning: GPT-5 Codex authored and performed the exact-head review. Independent challenge came from Fable 5 during Solution Gate, reconciled with Gemini and checked against production probes plus merged `vercel/api` source.

## Exemptions claimed

- README stays unchanged because endpoint selection is internal and the visible spend-monitoring contract is unchanged.
- Version and changelog stay unchanged because releases use a separate release PR.
- The exact app was not launched against the real account because the production shape was already captured and final verification should not expose customer spend or touch real credentials.

## Issue candidates

- Timezone-aware local-day spend remains separate. This PR intentionally preserves UTC-day semantics and needs an upstream timezone or timestamp contract to change that safely.
