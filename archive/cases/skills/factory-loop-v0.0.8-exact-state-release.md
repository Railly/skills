# Case: Factory Loop v0.0.8 exact-state release

Status: reviewed
Validation: independently-validated
Human review: pending
Maintainer acceptance: approved
Delivery: artifact verified
Upstream status checked: 2026-08-25
Visibility: public
Repository: Railly/skills
Role: maintainer
Source: [PR #19](https://github.com/Railly/skills/pull/19) · [merge `3c09112`](https://github.com/Railly/skills/commit/3c09112467665367555e2aa5f2c01aa462241c97) · [release v0.0.8](https://github.com/Railly/skills/releases/tag/v0.0.8) · [Actions run 32887534418](https://github.com/Railly/skills/actions/runs/32887534418) · [production](https://skills.railly.dev)

> The maintainer explicitly authorized commit, push, PR, merge, and release after the exact-state gates. No separate substantive human review of the implementation was recorded.

## Observed condition or claim

Railly Skills published the component methods and the Herdr visibility adapter, but no installable skill owned lifecycle routing, evidence invalidation, re-entry, or promotion authority across one engineering cycle.

## Red signal

The first Standards review of the integrated tree found six defects that green repository checks did not expose: an unguarded external delivery dependency, a workflow footer narrower than its eleven-stage graph, false fixture-verification credit, weak contract tests, mixed graph vocabulary, and a stale public release string.

## Method used

The change integrated current `main`, froze an Issue Contract, ran independent Spec and Standards passes on one exact tree, fixed every Standards finding in a successor tree, and repeated both reviews. Test Strength rejected six representative wrong states. A real-build Before After compared the prior release with the reviewed commit before the authorized PR, merge, release, and production verification.

An exact-tree check also caught a formatter changing an already reviewed JSON file before push. The formatting-only drift was removed and the commit was amended until its tree again matched the reviewed tree.

## Outcome

PR #19 merged as `3c09112`. GitHub Actions passed on the PR and merge commit. Tag and release `v0.0.8` point to that merge. Production shows release 0.0.8, 19 methods, the experimental `factory-loop` entry, the eleven-stage graph, and registry-derived release evidence without page overflow.

## Evidence

- Source: PR #19, merge `3c09112`, tag and release `v0.0.8`.
- Runtime: production Chromium check against `https://skills.railly.dev` returned 11 workflow stages, release 0.0.8, and the Factory Loop registry entry.
- Tests: 19 skills, six Issue Contracts, five existing executable fixtures, 24 Bun tests, Astro diagnostics, Biome, static build, style, surfaces, and documentation siblings passed.
- Review: independent Spec passed A1-A6 and I1-I5; independent Standards closed six findings and passed the successor tree.
- Artifact: Actions run 32887534418 passed and the Vercel Production deployment for `3c09112` completed successfully.

## Transferable lesson

Review and promotion attach to immutable content, not to a branch name or remembered stage. Any edit, including a formatter, invalidates dependent evidence until the resulting tree is proved identical or the downstream gates are rerun.

## Exceptions

- This run proves orchestration and exact-state safety, not an outcome improvement against a baseline. Factory Loop remains experimental.
- Factory Loop eval JSON is structural in v0.0.8; no dedicated executable eval harness exists yet.
- Mobile iCloud sync was unavailable on the release machine and was not part of repository delivery.

## Candidate changes

- No change: retain this as the first complete Factory Loop dogfood. The current invalidation and exact-state rules already express the lesson; maturity promotion remains a separate decision.

## Confidentiality review

Public GitHub, release, CI, and production handles only. Local paths, private agent transcripts, machine identity, credentials, and unrelated checkout state are excluded.
