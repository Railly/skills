# Review gate: GitHub App generated keypair

- Repository: `vercel-labs/emulate`
- Branch: `feat/github-app-generated-keypair`
- Base and current HEAD: `a72de43124fca64e370640312ae1e5ee5c096341`
- Working-tree diff SHA-256: `2c416d5e2efc7314165eb4c9ad6892b214c7e9c5cc5bcca79af7f8d3f84cc80d`
- Status: incomplete
- Technical verdict: approve
- Completion blocker: the implementation is uncommitted, so HEAD still identifies PR #199 and `covered` matched its older report instead of this working-tree diff

## Outcome

No blocking finding remains. The slice generates omitted GitHub App keys once inside `createEmulator`, exposes only generated keys through readonly `generatedSecrets`, and reuses the materialized seed across `reset()`.

Explicit keys remain private, empty keys fail, direct `seedFromConfig` callers fail loudly and atomically when a key is omitted, and CLI plus Next/Nuxt adapters remain outside this slice.

## Deterministic checks

- `style`: pass.
- `surfaces`: acknowledged. `packages/emulate/src/index.ts` is intentionally unchanged because CLI key generation and delivery are outside scope. The CLI continues to require an explicit key.
- `siblings generatedSecrets`: pass.
- `callers materializeGitHubSeedConfig`: pass.
- Workspace type-check: pass.
- Workspace tests: pass.
- Workspace build: pass.
- Workspace lint: pass with existing warnings only.
- Prettier: pass.
- `git diff --check`: pass.
- Force-red: pass for missing generation, key rotation during reset, and removed secret exposure.
- `covered`: mechanically returned pass for `a72de43`, but that report belongs to PR #199. It does not cover the current uncommitted diff and is not accepted as evidence.

## Built artifact dogfood

The built `packages/emulate/dist/api.js` was driven through the public API:

- Generated secret kind: `github.app_private_key`.
- Installation token before reset: HTTP 201.
- Installation token after reset using the captured key: HTTP 201.
- Captured key remained identical after reset.

## External review

Claude Sonnet reviewed the current diff, decision trail, direct seed callers, CLI path, and Next/Nuxt adapters.

Verdict: approve, with no blocking findings.

## Lens results

- New-domain matrix: pass. Omitted, explicit, empty, and wrong-key inputs are covered.
- New-failure-outcome propagation: pass. Direct seed callers throw an actionable error.
- Error-path forcing: pass. Invalid direct seed fails before mutating the store.
- Substrate verification: pass. Stored entity keys remain required strings.
- Dogfood built artifact: pass through the compiled programmatic API.
- Docs-behavior parity: pass.
- Choice audit: pass.
- Complexity budget: pass with one non-blocking redundancy candidate.

## Exemptions claimed

- `packages/emulate/src/index.ts` remains unchanged because the CLI does not generate or expose private keys in this slice. Its direct seed path fails explicitly if a key is omitted.
- Next and Nuxt adapters remain unchanged. Their direct seed paths fail explicitly rather than generating inaccessible material.

## Issue candidates

1. Add diagnostic logging to the pre-existing GitHub App JWT verification catch in `packages/@emulators/core/src/middleware/auth.ts`.
2. Consider simplifying the defensive second `private_key` validation inside the app insertion loop after the atomic pre-validation.

## Required final step

Commit the working tree, regenerate this report for the new commit SHA, and run `gate.sh covered` against that exact HEAD.
