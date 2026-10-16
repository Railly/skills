# Portless PR #374 simplification Solution Gate

Status: pass to detail

Mode: candidate audit reconciliation

Base: `8eb6a33779b452ee56626c8e17d4eee6308c8a82`

Selected tree: `ea90fc6a1b3f6e47475e07beea5e9c49cfd4f592`

Contract: `/tmp/portless374-security-frozen-packet.md`

## Reconciled shapes

The Gemini blind shape selected a per-daemon 256-bit secret in owner-only state
with strict bearer validation. The Claude-family shape independently required
proof of possession before bearer disclosure and rejected provenance-only
authorization.

The selected composition is:

1. Generate and publish one per-daemon token after listener ownership.
2. Let the client send a fresh challenge over a non-privileged HEAD request.
3. Require a challenge-bound HMAC before sending the bearer token.
4. Reject missing, malformed, duplicated, stale, or browser-provenance input
   before the callback.
5. Use one 500 ms abort signal for discovery and POST.
6. Publish atomically, preserve active state after failed replacement, and
   remove final and temporary artifacts on shutdown and clean.

The separate protocol-version header is unnecessary. A valid HMAC over the
fresh challenge is itself an unforgeable capability signal. New client to old
daemon sends no POST; old client to new daemon lacks the token and receives
401.

## Simplification decision

Pass. Remove duplicated test files and helpers while retaining every accepted
behavioral cell. The isolated 226-line reproduction is absorbed into the
parameterized proxy boundary tests. Client negotiation cases are consolidated
in one integration harness. No production security boundary is removed.

## Failure-shape check

- Over-reach: normal proxy routing and current client result mapping stay green.
- Under-reach: malformed, duplicate, stale, browser, authority, peer, HTTP, and
  HTTPS cells remain covered.
- Proxy property: public service markers never authorize bearer disclosure.
- Unregistered state: final and temporary token files remain in cleanup.
- Peer-version blindness: both upgrade directions fail closed.
- Wrong-test reason: HMAC, browser rejection, callback authorization, and
  retained-token mutations fail at their intended assertions.

Residual boundary: same-user processes can read same-user state.
