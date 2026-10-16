# Review Gate: vercel-labs/json-render

Date: 2026-09-14
Repository: vercel-labs/json-render
Base: `6c7164342a37fab055907f1666658e1333e2cb86`
Head: `de6a9bdbc0100ac778dff1ad48ab2f732b7d181e`
Profile: external-pr
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: incomplete

## Execution

- Mode: native_subagent
- Runtime receipt: resumed-coordinator/resumption.json
- Degraded from: fx_worker
- Schema failures: 0
- Independence gap: Author and exact reviewer model identities/families are unknown. Native specialists are not cross-family evidence. Independent challenge is satisfied only by the saved implementation-independent normative oracle corpus; no blinded model/human review is claimed.

## Contract

- Path: contract.json
- Spec status: not_provided
- Acceptance reviewed: A1, A2, A3, A4

## Stage receipts

- Test Strength: fail at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Authored tests allow removal of the copy-source guard, and real renderer callers violate the newly hardened rejection contract.
- Resilience Audit: fail at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. resumed-resilience/receipt.json: 28 executed cells, six explicit gaps, six N/A; head 26/28, base controls 28/28; immediate retries and cleanup owners documented. F1/F2 remain violated; descriptive passing probes do not certify baseline resilience.
- Security Review: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. resumed-security/security-receipt.json and security-review.md: 1251 core cases; six source-pinned React characterization cases; no demonstrated cross-authority security blocker. Scope is core ordinary JSON/API, not universal renderer rejection. Nonmaterial limits retained in verification.limitations.

## Property ledger (includes refuted claims)

- P1: Core canonical decimal array handling and literal object-key behavior pass the recorded public export probes. public-export-probe.json; coordinator-dogfood.log; core-tests.log. This is bounded direct evidence, not a Test Strength pass.
- P2: Core rejected immutable writes retain snapshot identity and avoid store/adapter publication in the recorded scenarios. public-export-probe.json records rejected identity, zero rejected adapter writes, and one accepted-batch notification/write.
- P3: UNSATISFIED: every public compound streaming patch preserves its source on malformed destination. F1; coordinator/hook-proof-head.json and hook-proof-base-public.json show actual data loss in built React while core compileSpecStream rejects safely. Reconfirmed with immediate retries: resumed-resilience/traces-head-8.json#H01 versus traces-base-3.json#H01.
- P4: Core reserved-token read/write/remove/store/compound boundaries preserve global prototype integrity for ordinary JSON graphs. This does not assert universal legacy-renderer token rejection. resumed-security/security-receipt.json and security-review.md: 1251 core cases; six source-pinned React characterization cases; no demonstrated cross-authority security blocker. Scope is core ordinary JSON/API, not universal renderer rejection. Nonmaterial limits retained in verification.limitations.
- P5: UNSATISFIED: state-provider change callbacks report only accepted writes. F2; consumer/result.json versus resumed-caller-review/base-invalid-result.json. Head preserves items yet callback still reports rejected /items/01 write. Reconfirmed with repetition: resumed-resilience/traces-head-8.json#P01 versus traces-base-3.json#P01.

## Deterministic checks

- `covered`: acknowledged. covered exited 0, but recognizes the SHA-named directory and is not a content/pass gate. Exact report validator remains required.
- `exact-state`: pass. resumed-coordinator/checks.json and pr-state.stdout revalidate unchanged base/head, clean target and 23 successful exact-head checks.
- `skill-identity`: pass. identity.json ties canonical executing package tree to git revision; identity_recheck.log has no changes for review-gate or specialist packages.
- `style`: pass. style.log; rerun exit 0 in resumed-coordinator/checks.json
- `surfaces`: pass. surfaces.log and conventions.used.md; rerun exit 0 in resumed-coordinator/checks.json
- `siblings`: acknowledged. sibling-contexts.txt: unaffected sources are terse provider/export listings or canonical path examples; core README/API/skill and data-binding path rule passages were updated.
- `callers`: acknowledged. caller-contexts.txt and public-export-review.json; F1/F2 remain open.
- `raw-input-consumers`: acknowledged. additional_callers.log plus legacy renderer compound patch handlers; F1.
- `diff-check`: pass. git diff --check; diff-check.log; rerun exit 0 in resumed-coordinator/checks.json
- `core-build`: pass. core-build.log: ESM, CJS and DTS built successfully.
- `core-tests`: pass. core-tests.log: 577 tests across 12 files passed after initial built-artifact dogfood.
- `core-typecheck`: acknowledged. typecheck-comparison.json: exact base and head both have 115 equivalent diagnostics; no diagnostic delta after file/line normalization.
- `workspace-typecheck`: acknowledged. root-typecheck.log and repo-typecheck.log: Turbo invokes pnpm dependency auto-install, which fails in the linked local worktree. Live exact-head CI Type Check is successful.
- `version-sync`: pass. version-check.log: every public package is 0.20.0.
- `stale/producers/timings/shellmeta/artifacts/flagsweep/execdeps`: acknowledged. No retired duplicated value, error classifier, timing constants, shell parser, persistent file writer, new flag or external executable changed.
- `specialist-receipt-integrity`: pass. Security schema validation exit 0; Resilience 216 checks exit 0 without overriding fail; challenge validation exit 0 with 37 source-map checks. Pre-integration receipt audits are preserved, not promotion tests.

## Judgment lenses

- Inverse regression surface: run. Saved base/head public hook comparison and failed Test Strength receipt reused. F1 and coverage survivor TS-3 remain; receipt is present, not missing.
- New-domain matrix: run. Missing-container and null handling inspected; complete falsifier matrix unavailable and explicitly left as a gap.
- Resolution-rule consistency across consumers: run. Caller and raw parser sweeps found independent renderer compound dispatchers; F1. Official Redux/Zustand/Jotai/XState adapters delegate to shared core helper.
- Shell re-parse append domain: skipped. No shell argument or script-string composition changed.
- Emission channel and one-shot latch reachability: skipped. No daemon emission channel or one-shot latch changed.
- Shim hermeticity: skipped. No external executable shim was authored in the diff.
- Deliberate-default check: run. Exact base/head comparisons distinguish introduced F1/F2 from pre-existing overlapping valid-batch callback mismatch.
- Fresh-seam scan: skipped. No runtime/framework signal-forwarding seam changed.
- Substrate differential corpus: run. resumed-challenge executes 744 normative/product-attributed checks across built ESM/CJS plus 9042 preserved corpus assertions. No full Cartesian or RFC-compliance claim.
- Reference-implementation oracle: run. Independent normative expected outputs are frozen with RFC excerpts/hashes before imports. Two root-slash mismatches retained. Independent challenge-source obligation discharged, not all conformance obligations.
- New-failure-outcome propagation: run. Built React useUIStream loses move source or inserts undefined, and built React StateProvider callbacks report rejected entries; F1/F2.
- Flag-propagation dispatch sweep: skipped. No new flag, mode or config bit.
- Error-path forcing: run. resumed-resilience method complete: 28 executed partitions with retry/cleanup, six explicit gaps and six N/A; F1/F2 fail. Full production/browser guarantees remain unverified.
- Non-destructive recovery: skipped. No heuristic recovery action.
- Cancellation and timeout hygiene: skipped. No new asynchronous operation, timeout or cancellation mechanism.
- Boundary pipeline trace: skipped. No newly supported frame/process/platform boundary; existing consumer propagation was reviewed separately.
- Substrate verification: run. Observed own undefined keys, serialized state, snapshot identity, callback records and rendered DOM rather than only command success.
- Dogfood the built artifact: run. Core ESM/CJS/store-utils and public React hook/provider evidence saved in public-export-probe.json, coordinator and consumer.
- Newly-asserted invariant ownership: run. F1/F2 reconfirm independent writers. SEC-004 records legacy element-dictionary rejection exception without demonstrated new authority; not a universal renderer security pass.
- Docs-behavior parity: run. Canonical core behavior prose was compared to probes. Sibling provider listings make no independent malformed-path contract. Consumer guarantees fail at F1/F2.
- Demonstrative example: run. Changed canonical/noncanonical path examples map to exercised cases. Exhaustive mutation proof remains missing.
- Choice audit: skipped. No implementation decision trail was supplied.
- Complexity budget: run. New path validation is linear in path depth; staging clones touched arrays, so cost includes touched array lengths. No performance guarantee is proved or claimed.

## Findings

- F1: confirmed, open. Propagate compound patch validation to renderer stream handlers. The new getByPath/setByPath rejection outcomes are not handled by the older renderer applyPatch implementations. Built React useUIStream processing move from /state/source to /state/items/01 removes source then silently rejects its destination. Copy/move from /state/items/01 to a valid key creates an own undefined property. Core applySpecStreamPatch safely rejects the same compound patches, but these handlers bypass it. This introduces data loss when noncanonical input previously coerced to index 1. Evidence: coordinator/hook-proof.test.ts; coordinator/hook-proof-head.json; caller-contexts.txt; coordinator/hook-proof-base-public.json; public-export-review.json; resumed-resilience/receipt.json and traces-head-8.json versus traces-base-3.json
- F2: confirmed, open. Exclude rejected batch entries from state-provider change callbacks. After update({"/items/01":"rejected","/count":1}), new core state correctly preserves items but StateProvider onStateChange reports both entries because it compares submitted values with the old snapshot. Applications persisting callbacks receive a write that never occurred. Exact base executed the coerced array write, so the same callback matched its state; the new rejection exposes this mismatch. Evidence: consumer/result.json; resumed-caller-review/base-invalid-result.json; resumed-caller-review/base-invalid-probe.mjs; resumed-caller-review/base-invalid.log; resumed-resilience/receipt.json and traces-head-8.json versus traces-base-3.json
- R1: refuted, not_applicable. The valid overlapping-path callback discrepancy is introduced by this PR. Evidence: resumed-caller-review/result.json and resumed-caller-review/base-result.json produce identical mismatch; exact base createStateStore already evaluates entries progressively.
- TS-3: confirmed, open. The malformed copy-source test uses toEqual, which misses an extra own property whose value is undefined. Removing the copy source guard leaves all 203 focused authored tests green. The separate own-key assertion fails on that mutant and passes with the guard restored. Evidence: test-strength/receipt.json; test-strength/copy-survivor-results.json; test-strength/logs/copy-mutant-full-suite.log; test-strength/logs/copy-mutant-own-key.log; test-strength/logs/copy-restored-own-key.log

## Gaps

- Required Test Strength remains fail: TS-3 copy-source guard survives 203 authored tests; F1/F2 remain open. No complete per-class falsifier coverage; saved receipt is consumed unchanged, not upgraded by positive corpus checks.
- Required Resilience Audit now has a method-complete exact-head receipt but remains fail: 26/28 observations pass, F1 and F2 fail. Real browser/network/resource bounds and other renderer runtimes are not verified; see resumed-resilience/receipt.json G01-G05.
- Full local workspace type-check remains unavailable under shared linked dependencies; no install/rebuild was attempted. Saved base/head core diagnostics are both 115 with zero normalized delta, and all 23 live exact-head CI checks succeeded.
- Source fixes and regression-test changes are not authorized in this review-only cycle. F1, F2 and TS-3 must be resolved on a new reviewed head before promotion.

## Limits and provenance

- Author model: unknown
- Reviewer model: fx native subagents; exact model identifiers and families not asserted
- Same family: unknown; no cross-family independence claimed
- Independent challenge: satisfied. RFC-derived frozen expected outputs and public ESM/CJS JSONL boundaries: 742/744 checks pass, two explicitly retained root-slash normative diagnostics, zero unexpected failures; reused corpus 9042 assertions. Independent oracle only, not independent model family or full RFC conformance.
