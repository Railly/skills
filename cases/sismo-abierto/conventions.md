# sismo-abierto review conventions

Bootstrapped 2026-08-07 from the repository rules and the full Verifica audit.

## Surface map

```surfaces
packages/audit/src/geography.ts -> packages/geo/src/index.ts packages/audit/test/protocol.test.ts data/predictions/audit-protocol.md data/predictions/historical-audit-protocol.md apps/web/app/verifica/metodologia/page.tsx
packages/audit/src/run.ts -> data/audits/audit-results.json data/audits/audit-results.csv data/audits/audit-log.md data/audits/final-audit.md data/audits/ledger.jsonl apps/web/app/verifica/page.tsx
data/predictions/historical-reports.json -> data/audits/historical-report-results.json data/audits/historical-report-results.md apps/web/app/verifica/page.tsx apps/web/app/verifica/informes/[reportNumber]/page.tsx
data/predictions/claimed-validations.json -> packages/audit/src/claimed-validations.ts apps/web/app/verifica/[predictionId]/page.tsx
```

## Norms

- Use Bun and Biome. Do not use npm, ESLint, Prettier, or Playwright.
- Use `agent-browser` for browser automation and production smoke tests.
- A strict coincidence requires time, magnitude, and point-in-polygon geography.
- Bounding boxes are catalog query prefilters, never final country classifiers.
- Open windows remain `PENDING` even when a candidate event exists.
- A claimed validation is evidence to audit, not an accepted result.
- Generated audit artifacts and the public Verifica interface must match the same run.
- Validation set: `bun run check`, `bun test packages/audit/test`, `bun run build`, `git diff --check`, then local and production `agent-browser` smoke tests.

## Gate-miss ledger

- 2026-08-07: country bounding boxes misclassified events across borders. Added Natural Earth point-in-polygon classification and Colombia/Venezuela regression coverage.
- 2026-08-07: the audit runner covered only the original 8 predictions while the index exposed 44. Added complete panorama registry evaluation and result-count coverage.
