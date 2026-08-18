# Review gate: GitHub App generated keypair

- Repository: `vercel-labs/emulate`
- Branch: `feat/github-app-generated-keypair`
- Base: `7aea54ad7c0b4a16b0208846e3d6fd4f2b7a2cf9`
- Head: `865c7fb433f0a1b919ed1d7a33f10ad492e8709c`
- Status: pass
- Technical verdict: approve

## Outcome

PR #200 now rejects duplicate GitHub App IDs and slugs before generating any key. Omitted RSA keys are generated asynchronously and sequentially, preserving input order while yielding the event loop and avoiding unbounded crypto concurrency.

The original programmatic API contract remains intact: explicit keys are not exposed, generated keys remain stable across `reset()`, and direct seed callers still require an explicit key.

## Deterministic checks

- `style`: pass.
- `surfaces`: acknowledged. `packages/emulate/src/index.ts` remains unchanged because CLI key generation and delivery are explicitly outside this slice. The CLI direct-seed path still requires `private_key`.
- `siblings generatedSecrets`: pass when scoped to repository product and documentation surfaces. The local untracked `.decisions.tsv` is review evidence, not a product surface.
- `callers materializeGitHubSeedConfig`: pass.
- `callers prepareSeed`: pass.
- Workspace type-check: pass.
- Workspace tests: pass.
- Workspace build: pass.
- Workspace lint: pass with existing warnings only.
- Prettier: pass.
- `git diff --check`: pass.
- Force-red: pass. Removing duplicate checks makes both duplicate cases resolve; restoring synchronous RSA generation makes the timer-progress test fail.

## Resilience verification

- Duplicate slug rejects with `Duplicate GitHub App slug: "duplicate"`.
- Duplicate App ID rejects with `Duplicate GitHub App app_id: 301`.
- Validation completes before any key generation, including when the duplicate is the final App.
- Generated and explicit Apps preserve their original order.
- Zero-delay timer delay remains about 1 to 2 ms for 1, 10, 25, and 50 Apps.
- Sequential generation remains bounded to one RSA operation at a time. Fifty Apps take about 1.18 seconds total on this machine without blocking the event loop.

## External review

Claude Sonnet reviewed the final corrective diff and its callers.

Verdict: approve, with no bugs found. Its two optional test suggestions were added: interleaved generated and explicit Apps preserve order, and a duplicate at the end of the list prevents all key generation.

## Impact map

Radius reported 19 changed symbols, 70 impacted symbols, 31 convergence items, 4,832 edges, and 20,452 unresolved calls.

The map correctly ranked the direct seed helpers and CLI registry consumers. Because unresolved calls substantially exceed resolved edges, the map under-covers and was used only to direct inspection. The CLI, direct seed calls, registry preparation, reset reuse, and GitHub test helpers were inspected independently.

## Lens results

- New-domain matrix: pass. Omitted, explicit, empty, duplicate ID, duplicate slug, wrong-key, and interleaved App inputs are covered.
- Fresh-seam scan: pass. Async preparation is awaited through registry and public API callers.
- New-failure-outcome propagation: pass. Duplicate identities reject before server startup.
- Error-path forcing: pass. Each duplicate guard was force-red independently.
- Cancellation and timeout hygiene: pass. The async crypto callback has no retained application state, key generation is sequential, and errors reject the preparation promise.
- Substrate verification: pass. Generated keys authenticate through the public HTTP installation-token flow.
- Dogfood built artifact: pass.
- Docs-behavior parity: pass.
- Choice audit: pass. Sequential generation bounds concurrency and retains deterministic order.
- Complexity budget: pass. Duplicate validation is linear and key generation is sequential.

## Exemptions claimed

- CLI help and implementation remain unchanged because CLI key delivery is a separate slice. The current CLI path fails explicitly when `private_key` is omitted.
- Next and Nuxt adapters remain unchanged because persistent key recovery and server-only delivery require a separate contract.
- `.decisions.tsv` remains local and uncommitted because it is implementation review evidence.

## Issue candidates

1. Reset should clear and reseed `tokenMap` and `WebhookDispatcher`.
2. Server startup should await `listening` and reject cleanly on port errors.
3. Retained seed configuration should use an owned deep snapshot.
4. `close()` should be idempotent.
5. GitHub App JWT verification could emit debug diagnostics for rejected key material.
