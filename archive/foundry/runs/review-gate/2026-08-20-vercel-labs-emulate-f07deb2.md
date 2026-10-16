# Review Gate: vercel-labs/emulate PR #205

Date: 2026-08-20

Base: `d0219d05818adca4c12bb76ec79a7562c1766a3d`

HEAD: `f07deb20f1ebbd339e73cc91551521055e4b7ccd`

Verdict: pass with zero open findings.

The maintainer feedback was valid. A canonical `seeded: false` snapshot could omit the configured GitHub App identity and trigger replacement-key generation. The first correction covered only `initialize()` and compared list length. Grok 4.6 xhigh found two residuals: retry through `load()` and same-length wrong-service padding. The final implementation validates exact service, kind, id, and value membership on both paths and rejects empty generated-secret fields.

The shared contract persists an incomplete canonical snapshot, then creates two handlers so the second attempt exercises `load()`. Removing strict validation made that assertion resolve with a replacement key. Restoring the fix returned 15/15 green. Ten sequential resilience rounds passed for each built adapter. Build, type-check, full tests, lint, format, diff check, style, and caller sweeps passed. The PR remains at 999 additions and 747 deletions.

Grok 4.6 xhigh then re-read the final tree, explicitly closed both findings, and reported no new actionable findings.

## Exemptions claimed

- `packages/emulate/src/index.ts` need not change because this correction affects adapter persistence rejection only, not CLI commands, flags, help, or output.
- `.decisions.tsv` remains untracked. Review read it for Choice Audit, but it is not a shipped surface.

## Issue candidates

None.
