# Case: provider launch dropped the explicit CA clear transition

Status: reviewed
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: changes-requested
Delivery: PR open
Upstream status checked: 2026-08-18
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: PR #1669 at `2d4c797e62ce06171da858e6b138200b006ba35d`; `cli/src/main.rs`; `cli/src/native/actions.rs`

## Observed condition or claim

PR #1669 introduces sticky CA state with three request states: set, omit, and explicit clear. A later command that omits the field preserves the CA. `--no-ca-cert` must send `clearCaCert: true` so the daemon removes it.

The CLI independently constructs launch envelopes for local Chromium, CDP, auto-connect, and providers. Local, CDP, and auto-connect envelopes forwarded the clear field. The provider envelope did not.

## Red signal

After a local session enables CA trust, a provider launch with `--no-ca-cert` arrives at the daemon without `clearCaCert`. The daemon therefore interprets the request as omission and retains the previous CA.

Provider launches reject an effective CA because the trust store belongs only to local Linux Chromium. The command intended to clear the incompatible state is rejected by the stale state it failed to clear.

## Method used

1. Traced CLI parsing of `--no-ca-cert` to `flags.clear_ca_cert`.
2. Enumerated every independent `action: "launch"` envelope constructor.
3. Compared field forwarding across local, CDP, auto-connect, and provider paths.
4. Traced an absent provider field through `resolve_effective_ca_cert`.
5. Confirmed that omission returns `state.effective_ca_cert`, which then fails external-launch validation.

## Outcome

The finding is confirmed by the exact dispatch path:

`--provider X --no-ca-cert` → provider launch envelope without `clearCaCert` → sticky omission fallback → previous CA retained → provider rejected.

The existing tests separately proved explicit clear and provider rejection, but never crossed prior state, request state, and launch family.

## Evidence

- Source: `main.rs` provider envelope lacks the field forwarded by the three sibling launch constructors.
- Runtime model: `resolve_effective_ca_cert` returns current state when `clearCaCert` is absent; `validate_ca_cert_launch_mode` rejects effective CA on external launches.
- Tests: existing unit tests cover clear in isolation and provider incompatibility in isolation, not their transition.
- Review: independent maintainer review requested changes.
- Artifact: source-level end-to-end dispatch trace against PR head `2d4c797`.

## Transferable lesson

Sticky and tri-state settings are transition systems. Reviewing field parsing or one successful path is insufficient.

Build the matrix:

`prior state × request state × launch family`

At minimum, cross unset/set prior state with set/omit/clear requests through every independently constructed command envelope. An explicit clear dropped by one wrapper becomes omission, and omission is intentionally sticky.

## Exceptions

A path that cannot encounter prior sticky state may omit the clear transition only if that isolation is enforced and tested. A provider path sharing the same daemon state has no such exemption.

## Candidate changes

- Reference rule: sharpen the Flag-propagation dispatch sweep with a sticky transition matrix.

## Confidentiality review

Public repository source and an independently reconstructed dispatch trace only. No private review text, provider credentials, customer identity, or local absolute paths are included.
