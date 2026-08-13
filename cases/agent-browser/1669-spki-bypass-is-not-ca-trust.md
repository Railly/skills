# Case: An SPKI error bypass was presented as CA trust

Status: evaluated
Validation: independently-validated
Human review: received 2026-08-10
Maintainer acceptance: changes-requested
Delivery: PR open
Upstream status checked: 2026-08-13
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1669 at `79feeaa803377fa7e2db3fef53876382e9eb6bfb`; Chromium `services/network/ignore_errors_cert_verifier.cc`; Chromium Linux certificate management documentation

> The PR remains open. This case validates the reported mechanism and records why the review process recognized the primitive's danger but failed to reject it as the wrong implementation of the feature contract.

## Observed condition or claim

PR #1669 exposes `--ca-cert <path>` as a way to trust an HTTPS interception proxy CA in Chromium. It parses the supplied certificate, hashes its Subject Public Key Info, and launches Chromium with `--ignore-certificate-errors-spki-list=<hash>`.

The PR description says that only the supplied CA is trusted and certificate and hostname verification stay enabled. In the same description, after the final hardening commit, it also says that the Chromium flag suppresses every certificate error for a chain carrying the key.

Those statements cannot both describe the same mechanism.

## Red signal

Chromium names the implementation `IgnoreErrorsCertVerifier`. Its `Verify` method hashes only certificates in the connection's presented certificate object. If any hash intersects the command-line allowlist, it resets the verification result and returns `net::OK` without calling the wrapped verifier.

That yields two observable differences from installing a CA as a trust anchor:

1. Hostname and other certificate errors are bypassed when a presented certificate carries a listed key.
2. Hashing the CA certificate does nothing when a proxy presents a separately keyed leaf and omits that CA from the TLS chain, because Chromium never sees the CA key to match.

## Method used

1. Read PR #1669 at its current head and traced `--ca-cert` from the parsed file to the Chromium launch argument.
2. Read Chromium's current `IgnoreErrorsCertVerifier` implementation and the original switch introduction.
3. Generated one CA and one separately keyed leaf certificate whose only DNS name was `wrong.test`.
4. Served the leaf over local TLS in two forms: leaf only, and leaf plus CA in the presented chain.
5. Drove Google Chrome 151.0.7922.138 through CDP with no exception, the CA SPKI listed, and the leaf SPKI listed.
6. Created a disposable Debian container with Chromium 151.0.7922.137 and an isolated NSS Shared DB. Imported the CA with `certutil`, then repeated matching-hostname and wrong-hostname controls.

## Outcome

Every material technical claim was validated.

### SPKI is an error bypass, not a trust-anchor installation

With the leaf SPKI listed, Chrome loaded `https://127.0.0.1` even though the leaf certificate was valid only for `wrong.test`. Without the SPKI argument, the same request returned `net::ERR_CERT_AUTHORITY_INVALID` and the privacy interstitial.

The match returns success before Chromium's normal verifier can reject the hostname.

### A separately keyed leaf fails when the CA is omitted

With the CA SPKI listed and the server presenting only the separately keyed leaf, Chrome still returned `net::ERR_CERT_AUTHORITY_INVALID`.

With the same CA SPKI listed and the server also presenting the CA certificate, Chrome loaded the page despite the hostname mismatch.

The result follows Chromium's code exactly: it intersects the allowlist with keys from certificates presented on the connection. The supplied CA is not available as an anchor for path building.

### An isolated NSS store is viable on Linux

In a disposable Debian container:

- no NSS entry, correct hostname: privacy error;
- CA imported into an isolated HOME's NSS Shared DB, correct hostname: page loaded even though the server omitted the CA;
- same NSS database, hostname mismatch: privacy error.

This is the desired trust behavior. The CA participates in path building while ordinary hostname verification remains active.

The result is Linux-specific. Chromium's own documentation says Linux uses the NSS Shared DB. A cross-platform design still needs separate investigation for macOS and Windows.

## Evidence

- Source:
  - PR head `79feeaa803377fa7e2db3fef53876382e9eb6bfb` still generates `--ignore-certificate-errors-spki-list`.
  - Chromium's `IgnoreErrorsCertVerifier::Verify` extracts hashes from `params.certificate()->cert_buffers()`, resets the result, and returns `net::OK` on intersection.
  - Chromium's switch introduction states that verification is skipped when any certificate presented by the server matches.
  - Chromium's Linux certificate management documentation identifies the NSS Shared DB and the `certutil -A -t "C,,"` root import.
- Runtime, macOS Chrome 151.0.7922.138:
  - no SPKI, leaf only: `net::ERR_CERT_AUTHORITY_INVALID`;
  - CA SPKI, leaf only: `net::ERR_CERT_AUTHORITY_INVALID`;
  - CA SPKI, leaf plus CA: loaded with wrong hostname;
  - leaf SPKI, leaf only: loaded with wrong hostname.
- Runtime, Debian Chromium 151.0.7922.137:
  - no isolated NSS trust: privacy error;
  - isolated NSS root, matching hostname: loaded;
  - isolated NSS root, hostname mismatch: privacy error.
- Tests:
  - OpenSSL independently rejected the leaf for `127.0.0.1` with hostname mismatch.
  - The CA and leaf used different SPKI hashes.
- Review:
  - The implementation concern was raised after the PR was opened; this case independently reproduced both reported failure modes.
- Artifact:
  - No product fix was written during this investigation.

## Transferable lesson

A feature named `--ca-cert` carries a trust-store contract. Its acceptance test is not “a page behind my proxy loads.” Both true trust and a certificate-error bypass satisfy that happy path.

The discriminating tests are negative and structural:

1. A valid chain with the wrong hostname must still fail.
2. A leaf signed by the supplied CA must succeed when the CA is omitted from the presented chain.
3. A leaf under an unrelated CA must fail.
4. Expired and not-yet-valid leaves must fail.

More generally, when an implementation uses a primitive named `ignore`, `skip`, `allow insecure`, or `bypass` to satisfy a feature named `trust`, the primitive-to-contract mismatch is itself a blocker until those negative properties prove equivalence.

## Why the existing process missed it

The process did discover the dangerous fact. The final commit, PR body, handoff, and solution-gate proposals all say the SPKI flag is stronger than adding a root and suppresses hostname and expiry errors.

The miss was not absent information. It was failure to promote known information into a contract violation.

Five factors contributed:

1. **Inherited-shape anchoring.** PR #1669 was framed as a rebased and hardened version of #1026. Review optimized the inherited SPKI design instead of reopening the mechanism choice.
2. **The wrong property was under review.** The solution gate focused on whether all consumers parsed the same valid certificate bytes. It proved input-domain consistency, not CA trust semantics.
3. **Only the happy path was dogfooded.** A mitmproxy page loaded after the flag was added. No negative case tested hostname, validity dates, or a separately keyed leaf with the CA omitted.
4. **The prose contradiction was not gated.** “Verification stays on” and “every certificate error is suppressed” coexisted in the PR description without a claim-consistency check.
5. **The solution gate used a stale installed copy.** Its own run record says the current forward-tracing step was not executed. That could have forced the chain from “SPKI bypass” to “what happens to path building and hostname verification,” though the known contradiction was already sufficient.

## Exceptions

An SPKI exception can be appropriate for controlled testing or replay infrastructure where bypassing certificate errors for a known presented key is the explicit contract. It is not equivalent to adding a CA root and should not be documented as such.

The NSS result establishes feasibility for Linux Chromium, not a complete production design. The implementation still needs lifecycle, concurrent process, cleanup, dependency, profile, macOS, and Windows decisions.

## Candidate changes

- Coverage gap: add a trust-semantics matrix for any CA or certificate-store feature, including wrong hostname and CA-omitted-chain cells.

## Confidentiality review

Public repository, public PR, public Chromium source, and locally generated certificates only. No private discussion, customer identity, secret, local absolute path, or internal environment detail is included.
