# Review Gate: vercel-labs/portless

Date: 2026-09-14
Repository: vercel-labs/portless
Base: `1ad573bb95810daf6cd50c1718707015450f3f09`
Head: `fad78e9c5e3f1958558eca616d747313e4d4ba60`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;SKILL.md@sha256:aa1b09c3864bfca6e882e2c9ea11b63dd9f89279f36018e24e67edeee5edfa4f`
Verdict: gaps

## Execution

- Mode: native
- Runtime receipt: none
- Degraded from: fx_worker
- Schema failures: 1
- Independence gap: Native fallback after FX auth schema failure is user-reported; no failed FX worker receipt or author/reviewer family identity available. No independent cross-family challenge is claimed.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-portless-424-fad78e9c/resilience/contract-snapshot.json
- Spec status: not supplied
- Acceptance reviewed: RA1, RA2, RA3, RA4, RA5

## Stage receipts

- Test Strength: not executed by this stage. Parent work owns any separate Test Strength receipt; no suite pass or mutation score invented.
- Resilience Audit: gaps at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af;SKILL.md@sha256:aa1b09c3864bfca6e882e2c9ea11b63dd9f89279f36018e24e67edeee5edfa4f`. /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-portless-424-fad78e9c/resilience/evidence.json,/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-portless-424-fad78e9c/resilience/base-comparison.json,/Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-portless-424-fad78e9c/resilience/pressure-matrix.json
- Security Review: not performed by this stage

## Verified properties

- RA1: Initial read failures never write sync-empty/nonempty-initial-read and clean-empty-initial-read across uid0/501; zero writes and exact bytes retained; base populated sync loses unrelated bytes
- RA2: Manual sync requires a readable post-write managed-block verification Both route cardinalities reject post-read fault, including base/head discrimination for empty set
- RA3: Empty routes remove stale entries Valid complete block removed with unrelated entries preserved; orphan block counterexample RA-DOC-1
- RA4: Unchanged manual caller false/error handling remains bounded Root rejects without sudo; nonroot exactly one stubbed sudo; failure/timeout exit1; status0 trusted without re-read
- RA5: Immediate retry boundaries and remaining corruption distinguished All cells retry twice against retained fixture; no rollback asserted; partial-write and clean verification gaps reproduced at supplied base

## Deterministic checks

- `node --check preload.cjs && node --check pressure.mjs && node pressure.mjs > pressure.log 2>&1`: pass. 53 cells, 159 built CLI executions, unexpectedOracleFailures [], cleanCheckout true
- `node --check compare-base.mjs && node compare-base.mjs > base-comparison.log 2>&1`: pass. 144 module executions, unexpectedHarnessFailures []; exactly four first-attempt differences for initial read and empty verification contracts
- `bash /Users/raillyhugo/Programming/railly/skills/skills/review-gate/scripts/gate.sh surfaces /Users/raillyhugo/Programming/railly/skills/cases/portless/conventions.md 1ad573bb95810daf6cd50c1718707015450f3f09`: pass. PASS [surfaces]
- `git rev-parse HEAD; git status --porcelain=v1 --untracked-files=all`: pass. fad78e9c5e3f1958558eca616d747313e4d4ba60; empty worktree status

## Judgment lenses

- filesystem commit and retry: run. Before/at/after write faults
- caller error/elevation handling: run. Built manual sync/clean callers driven; daemon/global clean read only
- docs behavior parity: run. Orphan-block counterexample to new absolute success text
- cross-platform lifecycle: skipped. Real Linux/Windows substrates unavailable and live OS mutations forbidden
- concurrency and sustained load: skipped. No broadened atomicity or load promise; remains gap

## Findings

- RA-DOC-1: confirmed, No fix authorized. Qualify reconciliation to parseable managed blocks or separately address the already-existing orphan-block recovery problem.. Empty sync can claim no stale entries remain while an orphaned managed block still contains stale.localhost. Evidence: evidence.json results[id=sync-orphan-0]: all 3 invocations exit0, reads1/writes0, print No stale portless entries remain, preserve stale.localhost; base-comparison.json sync-orphan-0 has identical residual state/success. New text is stronger than prior No active routes to sync.

## Gaps

- Parent manifest absent during initial and repeated inspections; not edited per user. Contract digest/acceptance IDs are stage-local and require parent integration.
- Native fallback after FX auth schema failure is user-reported; no failed FX worker receipt or author/reviewer family identity available. No independent cross-family challenge is claimed.
- Only Darwin arm64 Node v24.18.0 executed. Linux, Windows, real sudo/Admin, ACLs, protected-file permission asymmetry, native resolver/cache and real hosts inode are unverified.
- Routes are schema-valid hand-authored fixture JSON consumed by real RouteStore, not emitted by alias/app registration. Real daemon startup/reload/shutdown, IPC capability outcomes, warning delivery and real elevated child execution are unverified.
- In-place partial writes/noops are bounded Node API injections, not actual ENOSPC, interrupted kernel writes, power loss or fsync tests. Concurrent writers, race windows and sustained process/descriptor/memory load were not exercised.
- Authored tests were read only after the independent built run. They were not executed: CLI tests permit real proxy discovery and need extra isolation; a suite pass is not claimed. No source mutation/fix-absent mutation test was performed.
- Provided build was not reproduced and has no source maps. Bundle hashes and agreement with native exact-head hosts source probes identify observed behavior, not an independently reproduced toolchain build.
- Parent manifest absent during initial and repeated inspections; not edited per user. Contract digest/acceptance IDs are stage-local and require parent integration.

## Limits and provenance

- Author model: unknown
- Reviewer model: not independently recorded
- Same family: no
- Independent challenge: not satisfied. Native fallback after FX auth schema failure is user-reported; no failed FX worker receipt or author/reviewer family identity available. No independent cross-family challenge is claimed.
