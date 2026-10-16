# Review Gate: vercel-labs/portless

Date: 2026-09-14
Repository: vercel-labs/portless
Base: `1ad573bb95810daf6cd50c1718707015450f3f09`
Head: `fad78e9c5e3f1958558eca616d747313e4d4ba60`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: native_subagent
- Runtime receipt: runtime-fallback.json
- Degraded from: fx_worker
- Schema failures: 1
- Independence gap: Separate native reviewers were used after the FX wrapper rejected its status response (unsupported auth mode: missing). Cross-family independence is unverified; author model is unknown.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-portless-424-fad78e9c/contract.json
- Spec status: not_provided
- Acceptance reviewed: A1, A2, A3, A4, A5, A6

## Stage receipts

- Test Strength: fail at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. 27 existing tests green twice; 18 mutants:14 killed/4 survived; all four survivors killed by scratch tests; base source yields four expected failures; final 33 tests green twice; all scratch production restored; frozen fingerprints and clean status verified.
- Resilience Audit: unavailable at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. 53 cells/159 CLI invocations and 144 base/head module executions; scoped guarantees preserved, limitations documented.
- Security Review: pass

## Verified properties

- P1: An initial hosts-file read failure prevents writes and returns failure. resilience/evidence.json initial-read cells: zero writes and byte equality; test-strength initial-source, initial-built, cleanup-source and cleanup-built mutants killed.
- P2: Readable empty content is distinct from an unreadable file. Readable-empty fixture succeeds; falsey-initial-source mutant is killed. Empty content and unreadability use separate observed cases.
- P3: Sync fails when its post-write hosts read fails or the managed block mismatches. Post-read failure cells exit 1 for empty/populated routes. Predicate-skipping mutants killed; empty mismatch survivor exposed with a scratch regression.
- P4: Manual zero-route sync reconciles valid managed blocks and reports errors through existing privilege/error paths. Valid stale blocks removed with unrelated fixture mappings retained; immediate retries recorded, sudo failure/success stub paths observed.
- P5: getManagedHostnames stays best-effort on read failure. hosts.test.ts and independent security differential corpus retain [] for unreadable best-effort inspection; callers read in cli-utils.ts and doctor.
- P6: Docs and success text accurately describe the supported cleanup scope. F1; parser defect at base too, stronger user-facing assertion is new.

## Deterministic checks

- `identity`: pass. Exact requested clean head; remote head unchanged, eight successful checks/statuses, REVIEW_REQUIRED.
- `install`: pass. Exit 0; 290 cached packages installed in isolated copy.
- `build`: pass. Exit 0; ESM and declarations built successfully.
- `type-check`: pass. Exit 0; tsc --noEmit.
- `lint`: pass. Exit 0.
- `format`: pass. Exit 0; all matched files use Prettier code style, per target repo conventions.
- `diff-check`: pass. Exit 0.
- `style`: pass. Exit 0; PASS [style].
- `surfaces`: pass. Exit 0; PASS [surfaces].
- `callers`: pass. Exit 0; all read helper callers in changed file. Public function callers separately enumerated/read.
- `pressure`: pass. Exit 0; 53 cells, 159 executions, no unexpected oracle failures; expected product failures retained.
- `base-comparison`: pass. Exit 0; 144 base/head helper executions.
- `test-strength`: pass. Each orchestrator exit 0; 27 authored tests green twice; 18 mutants: 14 killed with intended exit 1 and four survivors; all four killed by scratch tests, final 33 green twice. Expanded commands and exact cwd/env in test-strength/commands.json.
- `skill-identity`: pass. Exit 0 from canonical skills checkout: exact-copy review-gate 77fdde3e8d7e source=clean.
- `covered (initial)`: acknowledged. Exit 1 expected before this run: no report for exact head. Historical reports were not reused.
- `siblings`: acknowledged. Six passages/files flagged. Read evidence: README:487, commands:274 and SKILL:418 describe unchanged auto-sync warnings; SKILL:170 is a topical add-entry recommendation, not a full contract; landing page:114 describes unchanged warning/resolver behavior; changelog:47 is historical multi-TLD release prose; CLI untouched mentions are dispatch/standalone commands, not conflicting safety claims.
- `non-triggered deterministic gates`: acknowledged. No retired flags/values, classifier narrowing, new timer, shell detector, new persistent production artifact, deepened resolver, executable or incompatible configuration example. Force-red covered by specialist receipt.

## Judgment lenses

- Inverse regression surface: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- New-domain matrix: run. Null vs empty read and zero/populated routes, post-read faults, root/nonroot paths exercised in specialist matrix.
- Resolution-rule consistency across consumers: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Shell re-parse append domain: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Emission channel and one-shot latch reachability: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Shim hermeticity: run. Inspected Node preloads; captures prove interception; external processes/network blocked in independent pressure driver.
- Deliberate-default check: run. Base hosts code/comment already intends empty-route reconciliation; no unrelated default reversal.
- Fresh-seam scan: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Substrate differential corpus: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Reference-implementation oracle: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- New-failure-outcome propagation: run. Read manual handlers, top-level clean, daemon sync/shutdown, syncHostsWithWarning and best-effort doctor/reportHostsSync callers. Manual CLI forced; daemon execution remains a named gap.
- Flag-propagation dispatch sweep: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Error-path forcing: run. Consumed Resilience commit-point/failure-partition receipt and Test Strength mutations.
- Non-destructive recovery: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Cancellation and timeout hygiene: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Boundary pipeline trace: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Substrate verification: run. Independent fixture bytes and call trace inspected; actual privileged OS substrate remains unverified.
- Dogfood the built artifact: run. 53 cells / 159 CLI executions before authored tests.
- Newly-asserted invariant ownership: run. Verification claim scoped to manual sync, not clean or transactionality; orphan wording yields F1.
- Docs-behavior parity: run. README, CLI help, skill and command docs aligned except F1. Historical/terse sibling mentions explicitly exempted.
- Demonstrative example: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Choice audit: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.
- Complexity budget: skipped. Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.

## Findings

- F1: confirmed, open. Qualify the new empty-sync success assertion for malformed managed blocks. Evidence: routes=[] and hosts containing # portless-start / 127.0.0.1 stale.localhost without # portless-end: CLI exits 0, prints No stale portless entries remain, performs zero writes, leaves mapping. Three invocations reproduce; underlying parser/cleanup behavior at base is identical. Narrow wording or address recovery separately.

## Gaps

- Required Test Strength receipt has gaps: four representative mutants survive the selected committed tests. Scratch-only probes kill them but do not add regression coverage to this PR.
- Required Resilience receipt has gaps: actual elevated child execution, Linux/Windows fault injection, live daemon/route producers and concurrent real filesystem writers were not exercised. Remote Linux/Windows CI is green but is not those fault-injection campaigns.
- Separate native reviewers were used after the FX wrapper rejected its status response (unsupported auth mode: missing). Cross-family independence is unverified; author model is unknown.
- No preexisting work-item manifest or formal issue/design contract was found. This manifest is materialized after specialist execution; stage-local contract/environment digests remain preserved rather than falsely presented as a shared pre-run fingerprint.
- P3 F1 remains open: stronger no-stale-entries success wording is false for an orphaned managed block. Underlying parser behavior predates this PR.
- No separate Spec or design receipt; external PR claims reviewed directly.

## Limits and provenance

- Author model: unknown (ctate)
- Reviewer model: native fx subagents, exact model not attested
- Same family: yes
- Independent challenge: not satisfied. Separate-context reviews and independently specified filesystem corpus exist; neither cross-family nor full native privileged substrate independence is established.
