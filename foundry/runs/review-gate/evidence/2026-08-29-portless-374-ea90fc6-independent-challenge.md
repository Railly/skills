# Portless PR #374 simplified-tree independent challenge

Date: 2026-08-29

Reviewer: Anthropic Claude Sonnet 4.5 through Fx

Isolation: `/tmp`, frozen contract and exported diff only, no repository or Git access

Reviewed tree: `ea90fc6a1b3f6e47475e07beea5e9c49cfd4f592`

## Verdict

Pass. No blocking finding remains.

## Challenge and disposition

The first pass questioned whether removing a separate protocol-version header
could disclose the bearer token to an older or marker-copying service, and
asked for mechanism-specific mutation evidence.

The concerns were refuted with observed probes:

- A current client against an older or marker-copying service returned `mute`
  and sent zero POST requests.
- Removing HMAC proof validation made that test fail with `acted`; restoring
  the filesystem snapshot returned it green.
- A current daemon rejects an older tokenless client with 401 before the stub
  callback.
- Removing `Origin` and `Sec-Fetch-Site` rejection made both browser-provenance
  tests return 204 instead of 401; restoration returned them green.
- A duplicated proof header returned `mute` and sent zero POST requests.

The challenge-bound HMAC is the protocol capability proof. A service that only
copies the public Portless marker cannot produce the HMAC for a fresh random
challenge without the daemon token, so the client does not disclose the bearer.

## Simplification judgment

The simplified tests retain the unique security invariants: authorization
before callback, proof before bearer disclosure, strict duplicate handling,
browser-provenance rejection, fail-closed mixed versions, shared timeout,
atomic publication, retained active token after failed replacement, and
cleanup.

All tests use stub callbacks, ephemeral loopback servers, and temporary state
directories. No privileged system file is read, written, or inspected.

## Residual boundary

Processes running as the same operating-system user remain inside the explicit
trust boundary.
