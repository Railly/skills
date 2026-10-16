## Missing coverage

Add an opt-in managed-macOS protocol to the cuse rig for Agent Browser TLS trust acceptance and certificate rotation. The target is a test device behind Zscaler inspection with its corporate CA deployed to the System Keychain through MDM.

The motivating report is [SugeethK's September 3, 2026 comment](https://github.com/vercel-labs/agent-browser/pull/1670#issuecomment-5530141260). It reports failures in `read` and `install` on macOS 26.6.2 with agent-browser 0.35.2, despite native clients trusting the intercepted chain. This remains reporter evidence; we have not reproduced that environment.

Cuse v0.2.1 completed an eight-step local macOS scenario against the amended preview. That establishes scenario execution on this Mac. The available machine has no detected Zscaler application, and we have no access to the reporter's MDM rollout. A hosted macOS runner or a PEM override cannot establish this managed-environment result.

## Proposed protocol

Keep this as an opt-in consumer rig or documented operator-assisted protocol, consistent with #85. The organization supplies the enrolled test device and controls its certificate rollout.

Before rotation:

1. Record candidate SHA-256, OS and inspection-agent versions, and approved public root fingerprints. Identify the amended source; remote PR #1670 alone does not contain the current local amendment.
2. Use temporary config and socket directories with no extra CA bundle or `SSL_CERT_FILE`/`SSL_CERT_DIR` overrides. Keep the corporate routing configuration required by the test.
3. Confirm a macOS-native client trusts the inspected endpoint, with evidence of the effective intercepted chain.
4. Require `--use-system-ca read` and a subsequent flagless read to succeed without launching a browser. Record the daemon PID.
5. Require native-off issuer rejection and native-on recovery. If native-off still succeeds, mark this isolation check inconclusive.
6. Require `--use-system-ca install` to fetch metadata and download successfully into a separate temporary HOME.

Across the organization's authorized rollout:

1. Keep the daemon alive while the organization changes the deployed root and interception chain from A to B.
2. Record that B is effective and whether A has actually been removed. Overlapping roots do not prove removal.
3. Require the new B chain to succeed on the same session and PID without resending trust flags.
4. Require an authorized A-only test endpoint to fail after A is removed. Without that endpoint or removal evidence, report new-root acceptance only.
5. Repeat native-off rejection, native-on recovery and the isolated installer check. Close the isolated session and remove its temporary downloads.

## Completion criteria

Report read acceptance, installer success, new-root acquisition, old-root rejection, PID continuity and cleanup separately. Distinguish observed results, operator-attested rollout facts and missing evidence. Preserve useful JSON without publishing internal endpoints, credentials or private certificate material.

Cuse should mark unavailable prerequisites as blocked or skipped and retain a resumable operator handoff. It must not automate credential entry, bypass security prompts, or modify MDM profiles to manufacture the environment. A local recipe is prepared; the managed-device run and rotation remain unexecuted.
