# Case: certutil was documented but absent from first-party installers

Status: reviewed
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: changes-requested
Delivery: PR open
Upstream status checked: 2026-08-18
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: PR #1669 at `2d4c797e62ce06171da858e6b138200b006ba35d`; `cli/src/install.rs`; `packages/@agent-browser/eve/extension/lib/sandbox.ts`

## Observed condition or claim

PR #1669 makes local Chromium CA trust depend on the external `certutil` executable. The runtime error and documentation tell users which package to install, while the repository's first-party Linux setup paths claim to install Chromium system dependencies.

The CLI installer included Debian `libnss3` and RPM `nss`. Eve's sandbox bootstrap included the same runtime libraries. Neither installed the tools package that provides `certutil`.

## Red signal

A fresh installation can launch Chromium but cannot use `--ca-cert`. The first CA operation fails before browser launch because `certutil` is absent.

This is not satisfied by an actionable error. A first-party setup path that promises system dependencies owns the executable dependency of the feature it installs.

## Method used

1. Traced the `certutil` process invocation from the new NSS setup path.
2. Enumerated the CLI Linux installer and Eve sandbox bootstrap.
3. Compared their package lists with clean Debian and Amazon Linux package behavior.
4. Installed only the existing NSS runtime packages and checked executable resolution.
5. Installed the platform tools packages and checked again.

## Outcome

The finding is confirmed on both supported package families:

- Debian Bookworm: `libnss3` does not provide `certutil`; `libnss3-tools` installs `/usr/bin/certutil`.
- Amazon Linux 2023: `nss` does not provide `certutil`; `nss-tools` installs `/usr/bin/certutil`.

The gap affects both `agent-browser install --with-deps` and default Eve sandbox bootstrapping.

## Evidence

- Source: PR #1669 head `2d4c797`; `chrome.rs` invokes `certutil`; the CLI and Eve package lists contain only NSS runtime packages.
- Runtime: clean Debian Bookworm and Amazon Linux 2023 ARM64 containers.
- Tests: `gate.sh execdeps` is red against #1669 and green when both mapped installer packages are present.
- Review: independent maintainer review requested changes.
- Artifact: `skills/review-gate/scripts/test-execdeps-gate.sh`.

## Transferable lesson

An external executable creates an installer contract, not only a runtime error contract. When a product owns first-party dependency installation, every installer and sandbox bootstrap must install the package that provides the executable.

Test the dependency from the user's starting state: a clean supported image after the product's setup command. A development container with the tool preinstalled proves the feature but cannot prove installation completeness.

## Exceptions

A library-only feature with no first-party dependency installer may document a prerequisite and fail clearly. This exception does not apply when the product already offers a setup path that claims to install required system dependencies.

## Candidate changes

- Deterministic check: `gate.sh execdeps <conventions.md>`.

## Confidentiality review

Public repository source, public package names, and disposable local containers only. No private review text, customer data, secrets, or local absolute paths are included.
