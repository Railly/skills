# Case: Verify extension points across every reachable boundary

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-11
Visibility: public
Repository: vercel-labs/emulate
Role: contributor
Source: https://github.com/vercel-labs/emulate/issues/97, https://github.com/vercel-labs/emulate/issues/98, https://github.com/vercel-labs/emulate/pull/100, https://github.com/vercel-labs/emulate/pull/198, head commit `5315037572e5aa45c451c660c4ffe9f968bf4367`, merge commit `e200442672df6d9010c565e6fe1e81003429d83c`

> Contributor validation, independent maintainer review, acceptance, and merge are complete. Release status was not checked.

## Observed condition or claim

The shared webhook dispatcher emitted GitHub-compatible headers for every service. Issues #97 and #98 reported that configured Stripe deliveries therefore lacked the `Stripe-Signature` wire format expected by Stripe consumers.

PR #198 introduces an instance-scoped header factory. The dispatcher retains GitHub-compatible headers by default, while the Stripe plugin installs a Stripe-specific factory that signs `<timestamp>.<raw body>`.

## Red signal

Review of the first implementation found three boundary gaps:

1. Header construction ran outside the protected delivery path, so a throwing factory could bypass failed-delivery logging.
2. The public standalone `seedFromConfig()` path could register Stripe subscriptions without first installing the Stripe factory.
3. The behavior change was absent from required documentation surfaces.

Two fix-absent mutations produced behavior-specific failures. Removing Stripe factory installation made the Stripe regression test fail because `Stripe-Signature` was absent. Removing factory installation from `seedFromConfig()` made the standalone seed test fail for the same reason.

## Method used

1. Preserved the existing GitHub header behavior as the dispatcher default.
2. Installed the service-specific factory on the dispatcher instance rather than storing functions on public subscription records.
3. Moved factory execution inside the protected delivery block so construction failures remain observable in the delivery log.
4. Audited every public entry into Stripe webhook registration, including plugin registration and standalone `seedFromConfig()`.
5. Updated the root README, Stripe skill, docs site, package README, and built CLI help.
6. Recomputed the documented Stripe HMAC contract with `node:crypto` and asserted that Stripe deliveries omit GitHub-specific headers.
7. Forced both installation boundaries red, restored the implementation, and recovered green results.

## Outcome

PR #198 was approved by maintainer `ctate` at head `5315037572e5aa45c451c660c4ffe9f968bf4367` and merged on 2026-08-11 as `e200442672df6d9010c565e6fe1e81003429d83c`.

The contributor-observed validation passed:

- 34 monorepo type-check tasks
- 33 monorepo test tasks
- 70 core tests
- 23 Stripe tests
- 17 GitHub tests
- two behavior-specific force-red mutations
- formatting, lint, style, documentation-surface, built CLI, and diff checks

GitHub CI, Vercel, Socket, and Vercel Agent Review were successful on 2026-08-11. Issues #97 and #98 closed automatically when the PR merged.

## Evidence

- Source: [closed issues #97 and #98](https://github.com/vercel-labs/emulate/issues/97), [closed PR #100](https://github.com/vercel-labs/emulate/pull/100), [merged PR #198](https://github.com/vercel-labs/emulate/pull/198), head commit `5315037572e5aa45c451c660c4ffe9f968bf4367`, and merge commit `e200442672df6d9010c565e6fe1e81003429d83c`.
- Runtime: built CLI help and the shared dispatcher exercised through the core, Stripe plugin, standalone Stripe seed, and GitHub wrapper paths.
- Tests: 34 type-check tasks, 33 test tasks, focused core, Stripe, and GitHub suites, plus two force-red mutations.
- Review: [Review Gate record](../../foundry/runs/review-gate/2026-08-11-vercel-labs-emulate-5315037.md). Automated checks passed, and maintainer `ctate` approved the head commit on 2026-08-11.
- Artifact: PR #198 merged as `e200442672df6d9010c565e6fe1e81003429d83c`; issues #97 and #98 closed as completed.

## Transferable lesson

A new extension point is not complete when its happy path works. Verify the failure path, every public entry that can reach it, and every documentation surface that defines the behavior.

For factories used during delivery, force a construction failure and prove that existing failure observability survives. For plugin-installed behavior, bypass the normal plugin lifecycle through each public standalone entry and prove that the service contract still holds.

## Exceptions

- The case proves the reachable GitHub and Stripe webhook paths. It does not claim support for services without a public production subscription surface.
- Merge proves maintainer acceptance and delivery to the default branch, but this case does not claim that a package release containing the change has shipped.
- The force-red mutations are mechanism proxies. They prove the regression tests detect missing factory installation at both observed boundaries.

## Candidate changes

- Deterministic check: when adding a plugin-installed extension point, enumerate and test its failure path, every public lifecycle entry, and every required documentation surface. Force at least one normal-path and one standalone-entry mutation to fail for the intended reason.

## Confidentiality review

The case contains only public issues, pull requests, commits, repository behavior, automated checks, and aggregate test results. It excludes private conversations, private provenance, secrets, local paths, and internal identities.
