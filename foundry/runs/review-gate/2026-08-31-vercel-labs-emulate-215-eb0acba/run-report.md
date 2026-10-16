# Review Gate: vercel-labs/emulate#215

Date: 2026-08-31
Repository: vercel-labs/emulate#215
Base: `e4d665715f2b6ccdd28dc3f1dccd2be5ea223caa`
Head: `eb0acba6ea8852a77d0176bb68188161914b0267`
Profile: external-pr
Skill revision: `git:a006c7a52acfdb112e7a4882063d0a3dbbe757d7`
Verdict: incomplete

## Execution

- Mode: fx_worker
- Runtime receipt: fx-review.json
- Degraded from: none
- Schema failures: 0
- Independence gap: none

## Contract

- Path: User request dated 2026-08-31 for vercel-labs/emulate#215
- Spec status: not_provided
- Acceptance reviewed: A1 inspection metadata remains secret-free, A2 reset clears installation authorization and metadata while preserving seeded state and App identity, A3 Next.js and Nuxt cold starts restore durable metadata and authorization, A4 legacy snapshots do not fabricate metadata, A5 endpoint, persistence, reset, and adapters preserve the confidentiality boundary

## Stage receipts

- Test Strength: unavailable. No exact-head Test Strength receipt was found for the changed adapter persistence and authorization lifecycle.
- Resilience Audit: unavailable. No exact-head Resilience Audit receipt was found for the durable metadata/token commit points, post-response save, failure cleanup, and immediate cold-start retry behavior.
- Security Review: unavailable

## Verified properties

- P1: Inspection responses and the metadata collection exclude minted token values, private keys, webhook secrets, and token-derived identifiers. The endpoint projection at packages/@emulators/github/src/routes/installation-tokens.ts:7-33 exposes only metadata. Built dogfood found no minted token, token field, private key, or base64 private key in the response or metadata collection.
- P2: Programmatic reset clears minted installation authorization and metadata while preserving seeded authorization and the generated App identity. packages/emulate/src/api.ts:95-100 deletes token-map entries carrying installation state before store reset and re-seed. The built boundary verified the complete outcome.
- P3: A successful adapter token mint is durably available to an immediate cold start. packages/@emulators/core/src/adapter-runtime.ts:335-339 queues but does not await persistence before returning the response, and lines 240-248 swallow ordinary save failures. tests/contracts/github-app-identity.js:239 waits for the save before creating the cold handler, masking the defect.
- P4: A legacy snapshot can restore installation authorization without fabricating inspection metadata, and a later mint creates metadata normally. tests/contracts/github-app-identity.js:247-281 verifies empty metadata, retained authorization, and normal metadata creation on a subsequent mint.
- P5: Metadata publication and in-memory token authorization are committed consistently for each successful mint. packages/@emulators/github/src/routes/apps.ts:197-226 inserts metadata before tokenMap.set and the 201 response. This property is limited to in-memory state and does not clear the durable adapter finding P3.

## Deterministic checks

- `clean exact-head identity`: pass
- `live GitHub frozen head/base before and after`: pass
- `git diff --check`: pass
- `style`: acknowledged. The generic gate flags an em dash in packages/@emulators/github/README.md, but repository AGENTS.md explicitly requires an em dash instead of prose double hyphens.
- `surface sweep`: pass
- `doc sibling sweep for installation-tokens`: pass
- `timing ceiling sweep`: pass
- `shell metacharacter sweep`: pass
- `external executable dependency sweep`: pass
- `radius impact map`: pass
- `pnpm build`: pass
- `pnpm test`: pass
- `focused GitHub, emulate API, Next, and Nuxt tests`: pass
- `pnpm type-check`: pass
- `pnpm lint`: pass. Completed with pre-existing warnings and no errors.
- `pnpm format:check`: pass
- `sync-versions --check`: pass
- `built-artifact confidentiality/reset/persistence dogfood`: pass
- `post-201 delayed-save cold-start`: acknowledged. Confirmed F1: immediate cold start restored zero metadata and returned 401 for the newly minted token.
- `post-201 failed-save cold-start`: acknowledged. Confirmed F1: ordinary persistence failure was swallowed, leaving the successful mint absent from durable state.

## Judgment lenses

- inverse regression surface: skipped. The diff does not replace a matcher, parser, or lookup data source.
- new-domain matrix: skipped. The diff does not widen a guard or relax a validator.
- resolution-rule consistency across consumers: skipped. No user-input resolution rule changes.
- shell re-parse append domain: skipped. No shell-parsed argument construction changes.
- emission channel and one-shot latch reachability: skipped. No warning channel or one-shot latch changes.
- shim hermeticity: skipped. No external-binary shim was added.
- deliberate-default check: run. Reset semantics and adapter persistence behavior were compared against prior tests and documentation; programmatic reset is intentional and adapter durability remains weaker than the new cold-start claim.
- fresh-seam scan: skipped. The diff does not patch a framework runtime to expose a new application signal.
- substrate differential corpus: skipped. No guard models an external substrate.
- reference-implementation oracle: skipped. The new emulator-only inspection contract has no claimed GitHub reference endpoint.
- new-failure-outcome propagation: run. Persistence save failure was forced through the real adapter caller; the failure is swallowed after the response and a cold start loses the successful mint.
- flag-propagation dispatch sweep: skipped. No flag, mode, or config bit was added.
- error-path forcing: run. Metadata insertion failure, delayed persistence, failed persistence, reset, and legacy snapshot paths were exercised.
- non-destructive recovery: run. Immediate cold-start recovery after delayed and failed persistence was tested; the failed-save path loses the mint from durable state.
- cancellation and timeout hygiene: skipped. The changed code introduces no cancellation or timeout mechanism.
- boundary pipeline trace: run. Mint validation, metadata insert, tokenMap set, HTTP 201, adapter save queue, snapshot restore, endpoint projection, and reset were traced end to end.
- substrate verification: run. The built distributions were driven against real HTTP and custom persistence backends.
- dogfood the built artifact: run. Built GitHub, emulate API, and Next adapter artifacts were used for mint, inspection, reset, persistence, expiry, and cold-start probes.
- newly-asserted invariant ownership: run. The route owns in-memory metadata/token ordering, while the shared adapter runtime owns durability; the latter does not await or fail closed on ordinary saves.
- docs-behavior parity: run. Endpoint shape, informational expiry, reset, and paths match; the broad cold-start persistence claim does not disclose the post-201 asynchronous durability window.
- demonstrative example: skipped. The added curl example demonstrates inspection but is not relied on as proof.
- choice audit: skipped. No decision trail was provided.
- complexity budget: run. The endpoint maps all retained metadata rows and storage grows by one row per successful mint with no pruning; recorded as a non-blocking issue candidate.

## Findings

- F1: confirmed, open. The adapters can return HTTP 201 for a minted installation token before its metadata and authorization are durable, so an immediate cold start loses both; an ordinary persistence failure makes the loss permanent. Evidence: packages/@emulators/core/src/adapter-runtime.ts:335-339 calls enqueueSave without await, and lines 240-248 swallow non-fail-closed save failures. durability-race.json records 201 then metadataCount 0 and tokenAuthStatus 401 before the save settles. persistence-failure.json records 201, a swallowed failed save, metadataCount 0, and tokenAuthStatus 401. The changed contract test at tests/contracts/github-app-identity.js:239 waits for persistence before cold-starting, so it cannot reject this implementation.

## Gaps

- Required exact-head Test Strength receipt is missing.
- Required exact-head Resilience Audit receipt is missing.
- Required exact-head Security Review receipt is missing.
- No canonical work-item manifest was provided or found; the explicit user request was used as the frozen work-item contract.
- No canonical work-item manifest with upstream stage fingerprints was available.

## Limits and provenance

- Author model: unknown
- Reviewer model: zai/glm-5.3-flash
- Same family: no
- Independent challenge: satisfied. The packaged FX wrapper completed through Vercel AI Gateway using zai/glm-5.3-flash. It found no defect, but its durability conclusion relied on the authored test waiting for persistence. Direct built-artifact failure forcing independently disproved that assumption.
