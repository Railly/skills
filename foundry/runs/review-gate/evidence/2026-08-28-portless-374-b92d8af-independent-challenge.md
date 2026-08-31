# Portless PR #374 independent challenge

Date: 2026-08-28

Reviewer: Anthropic Claude Sonnet 4.5 through Fx

Isolation: `/tmp`, frozen contract and exported diff only, no repository access

Reviewed tree: `b92d8af3b4c80f9aeedd6c45d9c0846182253837`

## Verdict

Pass with documented residuals. No blocking findings.

## Verified

- The daemon no longer removes a live token before it owns the listening port.
- Token publication occurs after bind through an owner-fixed temporary file and atomic rename.
- Failed replacement preserves the active token and emits a startup warning.
- Shutdown and `clean` remove both the active and temporary token files.
- The client sends no bearer token until the daemon returns a challenge-bound HMAC proof.
- Missing, malformed, duplicated, stale, or incorrect authorization rejects before the callback.
- Any `Origin` or `Sec-Fetch-Site` request header rejects before the callback.
- Upgraded client to older daemon and older client to upgraded daemon fail closed.
- One 500 ms abort deadline bounds discovery plus the privileged request.
- Tests use temporary state and stub callbacks. They do not read or write privileged system files.

## Residual boundary

Processes running as the same operating-system user can read the owner-only token file. This is the explicit trust boundary, not a claimed protection.

## Promotion recommendation

Promote only the exact reviewed tree after the local deterministic, Spec, Review Gate, and before/after evidence agree on that identity.
