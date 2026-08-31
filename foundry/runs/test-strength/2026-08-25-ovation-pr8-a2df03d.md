# Ovation PR #8 test strength

Status: pass

Head: `a2df03dac1315e975ed320fb6aa7f5f19b482436`

## Behavioral model

| Dimension | Values exercised |
| --- | --- |
| Coverage prior state | no report, partial report, complete report |
| Write mode | single item, two concurrent items, complete repository publication |
| Item kind | issue, pull request |
| Calculation authority | active generation, old generation, replaced active calculation |
| Page ordering | issue page before pull page, stale issue retry after pull page |
| Outcome | success, provider failure, post-commit caller failure and immediate retry |
| Read boundary | first report page, selected item, live GitHub REST item through PostgreSQL |

Excluded: closed-item ranking, because the contract ranks only current open work. Cross-repository normalization is excluded because rank is repository-scoped.

Smallest wrong implementations rejected:

- read and replace an accepted report without serializing concurrent item writers;
- accept a stale issue-page continuation after a newer pull-request page;
- publish a full report without checking generation and active calculation identity;
- claim complete coverage when an unseen item is added to a complete report;
- clear the accepted report when a rerun fails.

## Oracle and fixture provenance

The oracle is independent of the production branch structure: PostgreSQL row counts and identities, the fixed publication-authority contract, and a live GitHub REST item. Test fixtures use valid GitHub issue and pull-request shapes and are converted by the same public boundary used by production. The live producer drive fetched an open item from `vercel-labs/ovation`, published it through the exact-head store, and read one coherent partial report back.

## Fix-absent falsification

| Mutation | Red | Restored green |
| --- | --- | --- |
| Remove `FOR UPDATE` from item publication | Expected 3 ranked items, received 2. | Narrow concurrency test: 1 pass. |
| Allow stale page continuation after compare-and-set loss | Expected PR branch `feature`, received `undefined`. | Narrow stale-page test: 1 pass. |
| Remove generation and active-calculation publication fences | Expected `false`, received `true`. | Narrow old-generation test: 1 pass. |

The mutations were applied in three detached exact-head worktrees, verified as applied, run against real PostgreSQL, and removed. Evidence files:

- `/tmp/ovation-a2df03d-mutation-lock-red.txt`
- `/tmp/ovation-a2df03d-mutation-lock-green.txt`
- `/tmp/ovation-a2df03d-mutation-stale-red.txt`
- `/tmp/ovation-a2df03d-mutation-stale-green.txt`
- `/tmp/ovation-a2df03d-mutation-authority-red.txt`
- `/tmp/ovation-a2df03d-mutation-authority-green.txt`

## Real boundary, determinism, and cost

- All 49 migrations applied to PostgreSQL 5433.
- Store suite: 11 pass, 0 fail.
- Store suite repeated 25 times: pass.
- Full web suite: 395 pass, 0 fail.
- Live GitHub item to PostgreSQL to report page: 1 pass.
- Post-commit caller failure and immediate retry: 1 pass.
- Production build: pass with disposable database and Better Auth configuration.

No surviving critical mutant or producer gap remains.
