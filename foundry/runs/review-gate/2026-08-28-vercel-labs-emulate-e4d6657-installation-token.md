# Review Gate: installation-token metadata inspection

Date: 2026-08-28
Repository: `vercel-labs/emulate`
Git HEAD: `e4d665715f2b6ccdd28dc3f1dccd2be5ea223caa`
Reviewed dirty-worktree checksum: `7a15fafdb8da92e7f0bc77467f3b4fbaa62f8688336841f60bc61747d12c6e44`
Diff SHA-256: `3b8b799aa10f0409218d0c4dbefb115de848c4cae0ac04ecde2bd8cf03f95a21`

## Status

Pass. The separate Spec review passes R0 through R12. The independent Anthropic Standards review passes with no open findings. The repository checksum was identical before and after that review.

The Git commit identifies the unchanged base because this slice is not committed. The dirty-worktree checksum and complete diff SHA identify the exact reviewed implementation.

## Reviewed behavior

- Each successful GitHub App installation-token mint records one secret-free metadata row.
- Rejected mints and seeded tokens record no rows.
- `GET /_emulate/installation-tokens` returns copied App, installation, account, permission, repository and lifecycle metadata.
- The response omits token values, token prefixes, token-derived identifiers and Store entity IDs.
- Status is active before expiry and expired at or after expiry. Authorization expiry remains out of scope.
- Standalone reset clears inspection metadata and installation authorization while preserving seeded fallback behavior and generated App identity.
- Next.js and Nuxt snapshots restore metadata and authorization.
- Legacy snapshots fabricate no metadata. A later mint recreates and persists the missing collection normally.

## Evidence

- Spec: `/tmp/emulate-installation-token-spec.md`
- Independent Standards: `/tmp/emulate-installation-token-standards.md`
- Reduce: `/tmp/emulate-installation-token-reduce.md`
- Resilience: `/tmp/emulate-installation-token-resilience.md`
- Test Strength: `/tmp/emulate-installation-token-test-strength.md`
- Mutation checksum equivalence: `/tmp/emulate-test-strength-equivalence.md`
- Built HTTP proof: `/tmp/emulate-installation-token-http-proof.json`
- Complete diff: `/tmp/emulate-installation-token.diff`

The mutation campaign killed seven of seven fix-absent mutants. It covered missing ledger insertion, cardinality collapse, token leakage, expiry equality inversion, reset deletion omission, adapter token-map restore omission and legacy stale-collection use. The campaign substrate differs from the final checksum only by four documentation files; the targeted production and test files are byte-identical.

The built HTTP proof observed mint 201, one secret-free inspection row, private-repository access 200 before reset, an empty inspection collection after reset, old installation access 403, fallback `/user` access 200 and a stable generated key.

## Deterministic checks

- Surfaces: pass.
- Timings: pass, no wait ceiling.
- Style: acknowledged. Hunter explicitly confirmed on 2026-08-28 that em dashes are valid for this repository's prose style. The em dash in the GitHub package README remains.
- Sibling `packages/@emulators/core/src/__tests__/auth.test.ts`: acknowledged. It tests existing generic token-map serialization, not the new metadata route.
- `createEmulator` callers: acknowledged. The public return contract is unchanged; the new behavior is internal GitHub reset cleanup.
- `getGitHubStore` callers: acknowledged. The added collection property is additive and existing callers access named collections.

## Impact Map

Radius reported 16 changed and 258 impacted symbols. It also reported 20,937 unresolved calls against 4,966 edges, so the map materially under-covers. Review passes inspected beyond mapped consumers. No finding was attributed solely to the map.

## Standards lenses

Error-path forcing, boundary pipeline trace, substrate verification, built-artifact dogfood, newly asserted invariant ownership, docs-behavior parity, complexity budget and mandatory Test Strength passed. Every remaining catalog lens was either run or skipped with a trigger-specific reason in the independent Standards artifact.

No production helper exceeds cyclomatic complexity 2. The inspection projection and reset sweep are linear in the number of recorded metadata rows and tokens.

## Exemptions claimed

- The em dash is intentional repository prose style, confirmed by Hunter.
- The generic Core installation-credential serialization test is unaffected.
- Expiry enforcement, per-token lookup, OAuth inspection and revocation UI remain explicitly out of scope.
- The inspection route is emulator-only and intentionally has no auth guard; the direct confidentiality oracle proves its response is secret-free.

## Issue candidates

None.

## Verdict

Pass for the exact dirty-worktree checksum and diff SHA above. No commit, push, PR update, release or other promotion action is authorized by this report.
