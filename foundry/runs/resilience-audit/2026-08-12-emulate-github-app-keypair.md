# Resilience audit: GitHub App generated keypair

- Repository: `vercel-labs/emulate`
- Branch: `feat/github-app-generated-keypair`
- Date: `2026-08-12`
- Mode: fault injection and remediation verification against built artifacts
- Verdict: pass for the PR #200 slice; broader lifecycle follow-ups remain

## Scope

Audited `createEmulator`, generated GitHub App seed material, `reset()`, `close()`, port binding, token state, webhook state, duplicate seed identities, external seed mutation, repeated lifecycle operations, and synchronous key generation.

## Failure invariants

1. Initialization either binds successfully and returns a usable emulator, or rejects without an uncaught process error.
2. `reset()` removes runtime state and replays one stable seed snapshot.
3. Generated secrets correspond one-to-one with stored Apps that can authenticate.
4. Caller mutations after initialization cannot alter later resets.
5. Repeated reset and close operations do not leak live handles or credentials.
6. Invalid configuration fails before expensive irreversible work.
7. Key generation does not create an unbounded event-loop stall.

## Resolved findings

### RA-4: Duplicate App identities expose unusable generated secrets

- Original severity: medium
- Resolution: fixed in `865c7fb`.
- Fix:
  - Reject duplicate `app_id` and `slug` values before generating any key.
  - Validate the complete App list before entering the generation loop.
  - Reject duplicate configuration before server startup.
- Verification:
  - Duplicate slug rejects with `Duplicate GitHub App slug: "duplicate"`.
  - Duplicate App ID rejects with `Duplicate GitHub App app_id: 301`.
  - A duplicate on the final App rejects before a zero-delay timer runs, proving no asynchronous RSA work started.
  - Force-red removal of either duplicate check makes its regression case resolve.
- Invariant restored: every returned secret maps one-to-one to a stored App that can authenticate.

### RA-6: Synchronous key generation blocks the event loop linearly

- Original severity: medium
- Resolution: fixed in `865c7fb`.
- Fix:
  - Replace `generateKeyPairSync` with callback-based `generateKeyPair`.
  - Generate sequentially to bound crypto concurrency to one operation and preserve App order.
  - Propagate the async contract through registry preparation and `createEmulator`.
- Verification:
  - Zero-delay timer delay remains about 1 to 2 ms for 1, 10, 25, and 50 Apps.
  - Fifty sequential keys still take about 1.18 seconds total on this machine, but the event loop remains responsive.
  - Generated and explicit Apps preserve input order.
  - Restoring synchronous generation makes the timer-progress test fail.
- Invariant restored: large valid seeds no longer monopolize the event loop, and malformed seeds reject before crypto work.

## Remaining confirmed findings

### RA-1: Reset preserves installation tokens and allows unbounded credential growth

- Severity: high
- Classification: stale authorization state and unbounded growth
- Ownership: pre-existing `createEmulator.reset()` lifecycle defect exposed by the new App-token flow
- Evidence:
  - Minted a `ghs_` installation token.
  - Private repository access returned 200 before reset.
  - The same token returned 200 after reset.
  - After 200 mint-and-reset cycles, the oldest, middle, and newest tokens all returned 200.
- Cause:
  - `reset()` clears only `Store`.
  - Installation tokens live in `tokenMap`, outside `Store`.
- Invariant violated: reset does not isolate tests or revoke runtime-created credentials.

### RA-2: Reset leaves zombie webhook subscriptions

- Severity: high
- Classification: corrupted split state
- Ownership: pre-existing `createEmulator.reset()` lifecycle defect
- Evidence:
  - Created one repository webhook successfully.
  - After reset, the webhook listing returned zero entries.
  - Creating an issue after reset still delivered one request to the removed webhook URL.
- Cause:
  - The webhook entity is cleared from `Store`.
  - `WebhookDispatcher.subscriptions` is not cleared.
- Invariant violated: observable store state and delivery behavior disagree after reset.

### RA-3: Port collision returns false success and emits an uncaught error

- Severity: high
- Classification: false success and lifecycle error
- Ownership: pre-existing programmatic API defect
- Evidence:
  - Occupied the requested port before calling `createEmulator`.
  - `createEmulator()` resolved with one generated secret.
  - The server emitted uncaught `EADDRINUSE`.
  - Calling `close()` rejected with `ERR_SERVER_NOT_RUNNING`.
- Cause:
  - `serve()` returns immediately after `server.listen()` and does not await `listening` or reject on `error`.
- Invariant violated: a resolved emulator is not necessarily listening or safely closable.

### RA-5: The retained seed is shallow and changes across resets

- Severity: medium
- Classification: recovery drift
- Ownership: existing seed-reference behavior retained by the new materializer
- Evidence:
  - Mutated nested `permissions` and `installations` on the caller-owned seed after initialization.
  - After reset, the old installation returned 404, the mutated installation returned 200, and permissions changed from read to write.
  - The generated private key remained stable.
- Cause:
  - The materializer clones the config and each App only one level deep.
  - Nested objects and arrays remain shared with caller input.
- Invariant violated: reset does not replay the configuration observed at initialization.

### RA-7: Close is not idempotent

- Severity: low
- Classification: lifecycle sharp edge
- Ownership: pre-existing programmatic API behavior
- Evidence:
  - The first `close()` resolved.
  - Subsequent sequential and concurrent calls rejected with `ERR_SERVER_NOT_RUNNING`.
- Invariant violated: cleanup is unsafe to repeat from overlapping test teardown paths.

## Preserved invariants

- Empty explicit keys reject before starting a server.
- Direct invalid seed validation leaves the store untouched.
- The generated key remained valid after 1000 resets.
- A request overlapping one synchronous reset completed with 201.
- Thirty create/close cycles left no additional active handles.
- Reset after close did not reopen the server.
- Normal close released the port.

## Verification gaps

- RSS increased across create/close cycles, but active handles returned to baseline and the second batch grew less than the first. This is insufficient to classify a memory leak without heap snapshots and a longer steady-state campaign.
- No Windows lifecycle run was available.
- No process-signal cancellation path exists in the programmatic API to test.

## Recommended remediation order

1. Make reset own all mutable runtime state: clear and reseed `tokenMap` and `WebhookDispatcher`.
2. Make server startup await `listening` and reject cleanly on `error`.
3. Materialize an owned deep seed snapshot before retaining it for reset.
4. Make `close()` idempotent.

## Gate impact

RA-4 and RA-6 are resolved and covered by deterministic regression tests. The PR #200 slice is ready for review. RA-1, RA-2, RA-3, RA-5, and RA-7 remain separate lifecycle issue candidates and do not originate in generated-key materialization.
