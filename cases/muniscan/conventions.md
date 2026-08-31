# muniscan review conventions

Bootstrapped 2026-08-21 from README.md, METHOD.md, LIMITATIONS.md,
DATA-LICENSE.md, package.json, the monthly workflow and repository source.

## Surface map

```surfaces
src/discover.ts :: src/discover.test.ts, src/cli.ts, METHOD.md, LIMITATIONS.md, README.md
src/history.ts :: src/history.test.ts, src/cli.ts, METHOD.md, LIMITATIONS.md
src/fetch.ts :: src/fetch.test.ts, src/enrich.ts, src/discover.ts, METHOD.md, README.md
src/completeness.ts :: src/completeness.test.ts, src/cli.ts, METHOD.md, LIMITATIONS.md
.github/workflows/monthly-scan.yml :: README.md, METHOD.md
src/sample.ts :: src/sample.test.ts, src/cli.ts, HEALTH-SAMPLE.md, METHOD.md, LIMITATIONS.md, README.md, .github/workflows/monthly-scan.yml
```

## Norms

- Use Bun for install, tests and typecheck.
- A changed collection or scoring behavior updates METHOD.md and LIMITATIONS.md.
- Published run directories are immutable.
- Never bypass completeness with `--force` for an automated recurring run.
- Keep collection serial. gob.pe blocks concurrent crawling with HTTP 418.
- A public index change enters through a pull request and human review.
- HTTP observations never imply ownership, uptime, service quality, accessibility,
  security, legal compliance or historical availability.

## Subsystem invariants

- The municipal universe is current discovery unioned with the newest earlier
  published index. Failed directories without `index.json` are not baselines.
- Current discovery wins when a slug is present in both current and previous
  censuses. Only municipalities are carried forward.
- Every carried-forward municipality is fetched again. A non-2xx response is
  an explicit error, not successful evidence and not a silent removal.
- The completeness gate evaluates answered municipalities against the same
  published baseline used by discovery.
- Search saturation is nondeterministic. More sheets or two partial-run unions
  are not substitutes for the published-universe memory.
- `entities.json` keeps current-discovery and restored-municipality counts
  separate so reviewers can inspect source instability.
- The HTTP sample is outside the score. Its frame is municipalities with at
  least one domain classified as `sistemas_propios`, split into five ranking
  bands with 20 evenly spaced municipalities per band and one lexical-first
  domain per municipality.
- Each sampled domain receives one sequential GET with redirects and a bounded
  timeout. Bodies are discarded and errors become rows instead of aborting the
  sample.

## Gate-miss ledger

- None recorded.
