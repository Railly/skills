# Review gate: GitHub App generated keypair

- Repository: `vercel-labs/emulate`
- Branch: `feat/github-app-generated-keypair`
- Base: `7aea54a`
- Head: `6c1c9306d906f3f372e011eb7566e7cf2acc6464`
- Status: complete
- Verdict: fail

## Outcome

The intended programmatic API works and all repository checks pass. The built artifact generates a usable GitHub App key, exposes it through `generatedSecrets`, and preserves it across `reset()`.

The resilience audit found two defects introduced by this slice:

1. Duplicate App IDs or slugs can produce generated secrets for Apps that seeding discards, so some returned keys always authenticate with 401.
2. Synchronous RSA generation blocks the event loop linearly. On this machine, 10 Apps blocked about 221 ms and 50 Apps about 1.28 seconds.

The PR should remain draft until these are resolved or explicitly accepted.

## Verification

- GitHub package: type-check, 83 tests, and build passed.
- `emulate`: type-check, 9 tests, and build passed.
- Workspace type-check, tests, build, and lint passed.
- Prettier and `git diff --check` passed.
- Force-red passed for generation, reset stability, and secret exposure.
- Built artifact minted installation tokens before and after reset with the same captured key.

## Deterministic gates

- Style: pass.
- Surface sweep: acknowledged. CLI generation and delivery remain outside scope, so `packages/emulate/src/index.ts` is intentionally unchanged.
- `generatedSecrets` sibling sweep: pass.
- `materializeGitHubSeedConfig` caller sweep: pass.

## External review

Claude Sonnet reviewed the implementation and decision trail before the final rebase. It found no blocking correctness defect in the intended slice and approved the CLI and adapter exemptions because their direct seed paths fail loudly.

The final rebase dropped the already-merged PR #199 commit and retained the feature patch unchanged.

## Confirmed findings

### RG-RA-4: Duplicate App identities expose unusable generated secrets

- Severity: medium.
- Evidence: two Apps with the same slug produced two secrets; the first authenticated with 201 and the second with 401. Duplicate App IDs produced duplicate secret descriptor IDs with the same result.
- Layer: generated-secret contract.

### RG-RA-6: Synchronous key generation blocks the event loop

- Severity: medium.
- Evidence: 1, 10, 25, and 50 omitted keys blocked a zero-delay timer for approximately 44, 221, 515, and 1276 ms.
- Layer: initialization latency and overload.

## Exemptions claimed

- CLI remains unchanged because this slice does not define a secure CLI key-delivery channel. Missing keys fail explicitly.
- Next and Nuxt adapters remain unchanged because they do not yet have a key persistence and exposure contract. Missing keys fail explicitly.

## Additional issue candidates

The resilience audit also found pre-existing lifecycle defects in `createEmulator`: tokens and webhook subscriptions survive reset, port collisions return false success, nested seed references can drift across resets, and close is not idempotent. These are outside the generated-key slice but should be tracked separately.
