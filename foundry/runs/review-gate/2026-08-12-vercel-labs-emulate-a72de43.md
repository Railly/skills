# Review gate: vercel-labs/emulate #96

- Base: `70028df5ea02792b768605e416da87b0faf43ccf`
- Head: `a72de43124fca64e370640312ae1e5ee5c096341`
- Status: complete
- Verdict: pass
- Original author: `@sidpalas`

## Outcome

No blocking finding remains. The existing patch was rebased onto `main` after #191, retaining Sid's authorship, and expanded to cover both private key formats consumers can supply.

The middleware now derives public key material from the seeded private key before passing it to jose for RS256 verification.

## Verification

- Build: 26 of 26 tasks passed.
- Tests: 33 of 33 tasks passed.
- Type-check: 34 of 34 tasks passed.
- Lint: 42 of 42 tasks passed with warnings only.
- Core: 73 tests passed.
- GitHub: 81 tests passed.
- Prettier and `git diff --check` passed.

Force-red restored the defective private-key verification:

- The middleware test received no `authApp`.
- The installation-token route returned 401 instead of 201.

Restoring derived public key verification returned both layers to green.

## Built artifact dogfood

The built CLI started GitHub on port 4420 using a seed with the documented PKCS#1 `BEGIN RSA PRIVATE KEY` format.

- Valid RS256 App JWT: installation-token endpoint returned 201.
- Minted token prefix: `ghs`.
- Installation token repository request: returned 200 for `octocat/hello-world`.
- Invalid JWT: returned 401 with `A JSON web token could not be decoded`.

Focused middleware coverage also passes with PKCS#8 input.

## Subsystem model

- The CLI seeds GitHub App private key material into the GitHub store.
- `createAppKeyResolver()` retrieves the seeded app by the JWT issuer.
- The private key signs; derived public key material verifies.
- Successful verification sets `authApp` before `requireAppAuth()`.
- The installation route mints a scoped `ghs_` token that enters the ordinary token map.

## Impact map

Radius reported 9 changed and 4 impacted symbols, but zero edges and 20,367 unresolved calls. The map materially under-covers this diff and was not treated as safety evidence.

## Exemptions claimed

- No documentation update is needed. Existing surfaces already promise the corrected behavior, and dogfood proved the statement with the documented PKCS#1 format.
- Callers without `appKeyResolver` are unaffected because they cannot enter the changed App JWT branch.

## Issue candidates

None.
