# Case: Validate canonical generated identity by exact membership on every restore path

Status: evaluated
Validation: contributor-validated
Human review: pending
Maintainer acceptance: changes-requested
Delivery: local
Upstream status checked: 2026-08-24
Visibility: public
Repository: vercel-labs/emulate
Role: contributor
Source: https://github.com/vercel-labs/emulate/issues/203, https://github.com/vercel-labs/emulate/pull/205, https://github.com/vercel-labs/emulate/pull/205#discussion_r3819470307, local head `f07deb20f1ebbd339e73cc91551521055e4b7ccd`

> The final correction is contributor-validated but remains local. PR #205 still points to `d13093cf9fbbf7531dbe4aec95c45f282472d1ce`, the maintainer thread is unresolved, and the final head has not received human review.

## Observed condition or claim

PR #205 persists generated GitHub App identity across cold starts in the Next.js and Nuxt adapters. Maintainer review found that `initialize()` could return a canonical `seeded: false` snapshot without the configured App secret. Preparing from that incomplete snapshot generated a replacement key, so a handler could diverge from the persisted identity.

The first local correction checked only the `initialize()` response and compared generated-secret list length. An external review then found that a retry through `load()` bypassed the guard and that a same-length secret for the wrong service could hide a missing GitHub identity.

## Red signal

The important signal was not malformed JSON. The snapshot was structurally valid but semantically incomplete for the configured seeds.

- First attempt: `initialize()` persisted an incomplete canonical snapshot and the handler rejected it.
- Retry: `load()` returned that same snapshot, but the earlier guard did not run on this path.
- Padding: replacing the required GitHub secret with another structurally valid secret preserved list length while still forcing key generation.

The original regression did not persist the incomplete response, so its retry continued to exercise `initialize()` rather than the distinct `load()` path.

## Method used

1. Represented generated identity as exact `service`, `kind`, `id`, and `value` membership.
2. Rejected empty fields during snapshot parsing.
3. Applied strict identity validation to both canonical `seeded: false` paths: the immediate `initialize()` response and every later `load()`.
4. Changed the shared Next/Nuxt contract so `initialize()` actually persists the incomplete snapshot.
5. Retried with a new handler to force the second attempt through `load()`.
6. Removed the strict validation to prove the intended assertion accepts a realistic wrong implementation, then restored it.
7. Repeated the built adapter contract 10 times for Next.js and 10 times for Nuxt.

## Outcome

Local head `f07deb20f1ebbd339e73cc91551521055e4b7ccd` rejects a canonical snapshot unless every generated identity required by seed preparation already exists with the exact service, kind, id, and value. The same validation runs after `initialize()` and after `load()`.

The final local diff against the PR base is 999 additions and 747 deletions. The shared contract has 15 cases. Build, type-check, full tests, lint, format, diff check, Test Strength, and the repeated resilience matrix passed in the saved gate reports. A final Grok 4.6 xhigh review explicitly closed the retry and padding findings and reported no new actionable finding.

Delivery is still local. On 2026-08-24, GitHub reported PR #205 open and mergeable at `d13093cf9fbbf7531dbe4aec95c45f282472d1ce`, with review required and the maintainer thread unresolved. The six checks on that older remote head were successful, but they do not validate `f07deb20f1ebbd339e73cc91551521055e4b7ccd`.

## Evidence

- Source: [tracker #203](https://github.com/vercel-labs/emulate/issues/203), [PR #205](https://github.com/vercel-labs/emulate/pull/205), [maintainer thread](https://github.com/vercel-labs/emulate/pull/205#discussion_r3819470307), PR base `d0219d05818adca4c12bb76ec79a7562c1766a3d`, remote head `d13093cf9fbbf7531dbe4aec95c45f282472d1ce`, and final local head `f07deb20f1ebbd339e73cc91551521055e4b7ccd`.
- Runtime: the shared contract exercised the built Next.js and Nuxt adapters sequentially.
- Tests: 15 shared identity cases; fix-absent strict-validation mutation; 10 sequential rounds per built adapter; build, type-check, full tests, lint, format, and diff check.
- Review: maintainer feedback identified the original omission. Grok 4.6 xhigh identified the `load()` and same-length padding residuals, then re-read the final tree and closed both. Human review of the final head remains pending.
- Artifact: final correction exists only in local commit `f07deb20f1ebbd339e73cc91551521055e4b7ccd`; no remote branch, merge, or release contains it as of 2026-08-24.

## Transferable lesson

A structurally valid persisted snapshot can still be semantically incomplete for the current configuration. When restore may regenerate identity, validate the exact identities required by preparation, not aggregate properties such as list length.

Apply that validation to every path that can return canonical state. A retry must persist the first ambiguous result and enter through a new handler so it proves the later `load()` path rather than replaying `initialize()`.

## Exceptions

- The case proves generated GitHub App identity completeness for the shared Next.js and Nuxt adapter runtime. It does not claim validation for unrelated persistence consumers.
- The repeated matrix is a failure-family proxy, not proof against every storage backend implementation.
- Automated external review does not advance human review or maintainer acceptance of the final local head.
- Successful checks on remote head `d13093c` do not validate local head `f07deb2`.

## Candidate changes

- Deterministic check: for canonical state that can regenerate durable identity, persist a semantically incomplete but structurally valid snapshot, require the first attempt to fail closed, create a new runtime instance, require the retry through `load()` to fail closed, and include same-cardinality wrong-identity padding.

## Confidentiality review

The case contains only public repository behavior, public GitHub references, commit identifiers, aggregate validation results, and public-safe technical findings. It excludes secrets, private conversations, local paths, employer-only context, and non-public identities.
