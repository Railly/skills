# Review gate: crafter-research/sunat-cli privacy hardening

- Base: `origin/main` at `7f607033ecd94d241dd41b7039f2b01e3e61d053`
- Head: `b39aba834469c6ce33521d6c7bb927d18cab18d0`
- Branch: `security/privacy-hardening`
- Status: **incomplete**. No new exact-head defect was confirmed, but high-risk work lacks an independent challenge and authenticated SUNAT/Keychain producers were deliberately not exercised.
- Spec review: not provided. No Issue Contract or reviewed acceptance IDs were supplied.
- **Same-family warning:** author and reviewer are both OpenAI GPT-5 Codex, so this review can share the implementation's priors and blind spots.

## Outcome

The current tree, packaged 0.8.1 artifact, tests, and release workflow are materially hardened against PII and secret leakage. Secrets move through stdin instead of argv, child environments are allowlisted, persistent config and audit data are fail-closed allowlists, inherited macOS ACL access is removed, remote errors are sanitized, personal workflow defaults are gone, and the release pipeline transports one exact tarball through attestation and publication.

This is not yet an unconditional production-readiness pass. A human or cross-family reviewer must challenge the exact HEAD, GitHub CI must pass after push, and the release path can only be closed after registry bytes, provenance, attestations, tag, release asset, and installed CLI behavior are verified. Authenticated SUNAT QA remains a separately authorized activity.

## Subsystem model

Credential inputs originate in prompts, environment variables, config references, or the OS credential store. They flow into login, REST/SOAP, browser, and CDP adapters. The critical channel rule is that a secret may cross a child-process boundary only through stdin or an explicit allowlisted environment, never argv, reflected errors, or ambient inheritance.

Local state is split among config, audit, token/idempotency, and downloaded output. Sensitive internal state is written through owner-only directories and atomic replacement, then repaired on read. macOS ACL cleanup is part of the confidentiality property because restrictive mode bits alone do not remove inherited access. Audit and config serializers own the data-minimization rule, including active and archived legacy files recreated after a privacy marker.

The release topology is package construction with npm 11.6.4, Bun 1.3.11 runtime/tests, one tarball artifact, GitHub attestation, npm trusted publishing with provenance, byte verification, and installed smoke. Publication is an external commit point. No release was performed in this review.

The radius map indexes 118 files, 761 symbols, 1,458 edges, 181 changed symbols, and 127 impacted symbols. It has 3,507 unresolved calls, so it strongly under-covers the change. The map directed attention to browser/auth convergence but did not exonerate paths absent from the graph.

## Verification

- npm 11.6.4 audit: zero vulnerabilities.
- npm signatures: 228 registry signatures and 77 attestations verified.
- Unit tests: 353 passed.
- E2E: 32 passed, with two credentialed beta tests explicitly skipped.
- Mock CLI smoke: passed.
- Astro build: passed.
- gitleaks 8.28.0: no leaks.
- actionlint 1.7.7: clean.
- The first GitHub CI run failed because `gitleaks-action` requires a paid organization license, not because it found a leak. Exact HEAD replaces it with gitleaks OSS 8.28.0, downloaded from the official release and verified by SHA-256; actionlint and a 73-commit local scan pass.
- Exact-head GitHub Actions run `32808912754` passed every step on `b39aba834469c6ce33521d6c7bb927d18cab18d0`, including secret scan, dependency audit/signatures, privacy tests, unit, E2E, smoke, website build, and package contents.
- Deterministic gates: style, surfaces, timings, and execdeps passed.
- Seven force-red mutations failed at the intended privacy assertions and restored green from snapshots.
- Real offline browser boundary: `fill()` sent a value through stdin to agent-browser against a local data page; the session was closed.
- Package allowlist: 91 files, excluding tests, scripts, research, configs, and lockfiles.
- Two consecutive npm 11.6.4 packs were byte-identical. Final local 0.8.1 tarball SHA-256: `b653800351ea6112579e5e0f800e09c88300655893adcc3c12e58e541ba960f4`.

## Focused lenses

Run: resolution-rule consistency, shim hermeticity, deliberate defaults, substrate differential corpus, new-failure propagation, error-path forcing, boundary pipeline trace, substrate verification, built-artifact dogfood, newly asserted invariant ownership, docs-behavior parity, demonstrative examples, and complexity budget.

Skipped with absent triggers: inverse regression surface, new-domain matrix, shell re-parse append domain, emission/latch reachability, fresh-seam scan, reference-implementation oracle, flag propagation, non-destructive recovery, cancellation/timeout hygiene, and choice audit. The exact reason for every disposition is recorded in the JSON report.

## Gaps

- No independent human or cross-family review artifact exists for exact HEAD.
- No authenticated SUNAT portal/CDP producer was driven. Doing so requires private credentials and may perform legally meaningful actions.
- No real Keychain item was created or updated.
- Linux secret-service behavior is shim-tested but not exercised on Linux.
- Version 0.8.1 has not been published, so registry bytes, npm provenance, GitHub attestation, installed smoke, tag, and release asset are unverified.
- Radius is strongly under-covering because unresolved calls exceed resolved edges.

## Exemptions claimed

- No live SUNAT filing, payment, or production mutation was performed. Those are legal acts requiring explicit authorization; mocks, local fixtures, public read-only identifiers, and offline browser boundaries were used.
- Public SUNAT test RUCs and deliberately invalid synthetic records are not personal PII. Their surrounding fixtures identify their test purpose.
- No npm release was performed. Merge and exact-head CI must precede publication.
- No choice audit was possible because the repository has no `.decisions.tsv` trail.

## Issue candidates

- **Remediate personal identifiers in public Git and npm history.** The current tree and 0.8.1 package are clean, but historical commits, npm maintainer metadata, and immutable prior versions retain personal identifiers. Closing this absolutely requires an approved history rewrite and force update, npm Support withdrawal requests, and an npm account metadata change. These destructive or externally coordinated actions are outside this hardening diff.
