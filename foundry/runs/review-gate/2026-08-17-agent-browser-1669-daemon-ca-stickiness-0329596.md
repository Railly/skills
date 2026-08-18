# Escape autopsy: agent-browser #1669 CA omission restarts the daemon

Status: confirmed against `0329596e6dda233a2f0c7711fff7bdfca31ed163`.

## External finding

After:

```bash
agent-browser --ca-cert ca.pem open https://internal
agent-browser snapshot
```

the second command omits `--ca-cert`, changes the daemon configuration fingerprint, restarts the daemon, closes Chromium, loses the page, and launches a fresh browser without the CA.

## Reproduction

The exact sequence was driven in Linux ARM64 with Chromium, `certutil`, the release binary from #1669, a private CA, and an HTTPS endpoint whose leaf is signed by that CA.

Before `snapshot`:

- daemon PID: `22270`
- target: `5AAA1E0767A2C7BD667FABEE7880E942`
- URL: `https://good.test:4443/`
- fingerprint: `ed1acb999cf2e24d`

After `snapshot` without the flag:

- daemon PID: `22404`
- target: `ACEF8514C376F4C1513B7A88B8FC6E86`
- URL: `about:blank`
- fingerprint: `f5b4ade1dfc51c5e`
- output: `(empty page)`
- lifecycle: `restartedBackground:true`

Control: repeating `--ca-cert` on `snapshot` preserved the daemon PID, fingerprint, target, URL, and returned `StaticText "OK 4443"`.

## Why the gate missed it

The solution shape encoded the wrong invariant: it required adding, changing, or removing `ca_cert` to restart the session. The implementation followed that requirement by hashing `Option<ca_cert>` and its file contents into daemon identity.

The unit test then protected that decision:

```rust
assert_ne!(daemon_config_fingerprint(&without_ca), initial);
```

That test passes today. It proves the defect rather than guarding against it.

The Linux matrix tested one command per session, then immediately closed the session. Its `ca-omitted` cell used a separate session to prove an untrusted page is rejected. It never tested the normal multi-command workflow where a launch option is supplied once and omitted from a later command.

The review reconstructed CA trust, NSS isolation, concurrency, and cleanup, but did not classify `--ca-cert` as session-sticky browser launch state. It inspected configuration identity only in the direction “changed input must restart,” not the inverse “omitted on a later invocation must preserve effective session configuration.”

Radius did not help: the saved map reported zero changed and impacted symbols despite the diff, with 2,446 unresolved calls and 83 SCIP-unmapped entries.

## Root cause

The CLI treats absence on a later invocation as an explicit request to remove a previously selected browser launch option. For session-scoped launch configuration, omission should mean “keep the effective session value”; removal needs an explicit clear operation.

The opposite direction is also reachable: supplying a different CA path or changed CA bytes must deliberately replace the effective value and restart, while ordinary omission must not.

## Coverage required

An end-to-end test must execute at least two commands in the same session:

1. open with `--ca-cert`;
2. snapshot without `--ca-cert`;
3. assert the daemon PID, target, URL, and trusted page remain unchanged.

Separate controls must prove that an explicitly different CA or explicit clear operation changes effective configuration and restarts safely.

## Exemptions claimed

None.

## Issue candidates

None. This defect is in code shipped by #1669 and belongs in the PR.
