# Test strength: embedded GitHub App identity

Date: 2026-08-19

Starting HEAD: `7e9a1ed88a5be51fdaf796a0c2164b3548e34f80`

Verdict: pass after strengthening two surviving coverage gaps.

## Contracts

The adapter tests must reject implementations that rotate a generated App key, cannot retry transient persistence failures, overwrite canonical cross-process metadata, lose restored descriptors, expose private keys through HTTP, publish more than one filesystem identity, or leave temporary files after failed publication.

The runtime boundaries exercised were exported Next and Nuxt handlers with real `Request` and `Response` objects, GitHub JWT verification, compare-and-set persistence, and the macOS filesystem.

## Mutation results

| Mutation | Result | Intended failure |
|---|---|---|
| remove canonical prepared-state cache update | killed in Next and Nuxt | canonical label reverted to stale `Embedded` |
| retain rejected preparation promise | killed in Next and Nuxt | retry repeated `storage unavailable` |
| replace the canonical preparation with a fresh key after save failure | killed in Next and Nuxt | original JWT returned 401 |
| discard restored secret descriptors before merging new keys | killed in GitHub | restored-plus-new descriptor assertion failed |
| remove all temporary-file cleanup | killed in core | success and failure left `.tmp` files |
| remove only `save()` cleanup | survived before strengthening | no test forced failed save publication |
| leak the private key as base64 in an HTTP header | survived before strengthening | tests inspected body only |
| retain a rejected `initPromise` | killed in Next and Nuxt | request retry repeated the save error |
| replace compare-and-set link with rename | killed in core | concurrent initializers returned two identities |
| remove failed-save recovery from the save queue | killed in Next and Nuxt | third save attempt never occurred |

Clearing the cached preparation after a save failure also survived, but is justified: `initialize()` has already published the canonical identity, so the next preparation reloads the same key. The original JWT remained valid.

## Strengthening

- Added a real filesystem regression that forces `save()` publication failure and asserts no temporary file remains.
- Added owner-only mode verification for the final saved snapshot.
- Expanded HTTP non-exposure checks to inspect both headers and body, including the exact key and its base64 encoding.

Both new tests went red under their motivating mutations and green after restoring production.

## Determinism and cost

Next, Nuxt, core, and GitHub focused suites passed five consecutive rounds after restoration: 45 Next cases, 45 Nuxt cases, 380 core cases, and 435 GitHub cases. No flake was observed.

## Remaining gaps

None within the changed runtime contracts. The tests do not attempt arbitrary secret encodings; they guard the raw PEM and the common base64 transport form at the actual HTTP boundary.
