# Candidate audit fixture: certificate trust

This fixture preserves only the evidence packet available before revealing a candidate implementation.

## Reporter evidence

- Chromium navigation behind an HTTPS interception proxy fails with `ERR_CERT_AUTHORITY_INVALID`.
- The proxy issues certificates from a private CA supplied by the operator.
- The existing global ignore-errors option loads the page but disables certificate validation broadly.

## Required product contract

- A certificate chain valid under the supplied CA is accepted.
- The supplied CA does not authorize unrelated chains.
- Ordinary certificate checks, including hostname and validity dates, remain active.
- The default without an explicit CA remains unchanged.

## Required discriminator cells

| Presented chain | Hostname | Signing authority | Expected |
|---|---|---|---|
| leaf only | correct | supplied CA | accept |
| leaf only | wrong | supplied CA | reject |
| leaf plus CA | wrong | supplied CA | reject |
| leaf only | correct | unrelated CA | reject |
| expired leaf | correct | supplied CA | reject |

## Candidate reveal

The candidate hashes the supplied CA certificate's SPKI and passes the hash to Chromium through a certificate-error exception list. Chromium compares the list against keys in certificates presented on the connection and returns success on a match before the normal verifier.

## Expected audit result

The candidate is not equivalent to the required contract:

- it rejects a separately keyed leaf when the CA is omitted from the presented chain;
- it accepts hostname, expiry, or other certificate errors when a presented certificate key matches.

The audit should reject or replace the mechanism while preserving reusable CLI/config plumbing and contributor credit.
