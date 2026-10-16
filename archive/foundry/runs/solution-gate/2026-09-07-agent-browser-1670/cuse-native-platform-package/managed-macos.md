# Managed macOS acceptance and rotation recipe

Status: not executed. The September 3, 2026 Zscaler/macOS report on vercel-labs/agent-browser#1670 is reporter evidence, not our reproduction.

## Required environment

Use a test device already enrolled in the relevant MDM and routed through the affected Zscaler inspection policy, with the organization authorizing its normal test certificate rollout. Use the exact local amended preview binary and record its SHA-256; a build from remote PR head a45f1b656cb13c74bf1dca2f1439b77e8020360c lacks the local amendment. Record OS, Zscaler version, relevant trust-root public fingerprints and policy version without exporting credentials or private keys.

## Before rotation

Use a fresh temporary HOME and AGENT_BROWSER_SOCKET_DIR, one session named native, and no Agent Browser config. Unset SSL_CERT_FILE, SSL_CERT_DIR, NODE_EXTRA_CA_CERTS and AGENT_BROWSER_CA_CERT. Record rather than silently change any proxy settings needed by the corporate network. Keep TLS verification enabled.

1. Use an approved inspected HTTPS endpoint. Confirm the macOS-native client validates its intercepted chain, recording the peer and root fingerprints through the organization's approved inspection method.
2. Run the preview with --session native --json --use-system-ca read URL. Require success and browserLaunched=false.
3. Run with --session native --json read URL. Require success and save native.pid from the isolated socket directory.
4. Run with --session native --json --use-system-ca false read URL. Require TLS issuer rejection. If this succeeds, the endpoint/root isolation is unsuitable and the proof is inconclusive.
5. Reenable --use-system-ca and require recovery with the same PID.
6. Run --use-system-ca install with a separate temporary HOME. Require successful version lookup and download through inspection. This downloads Chrome into that temporary HOME; keep its logs and remove only that directory afterward.

## Across the organization's rollout

Keep the daemon from the previous phase running. The organization rotates the test device's managed root and interception signing chain through its normal mechanism. cuse must not bypass authentication prompts, alter MDM profiles or replace the organization's certificates itself.

1. Confirm the effective managed root set changed from A to B. Record public fingerprints and rollout completion evidence. A still present alongside B is overlap, not proof of old-root removal.
2. With the same socket directory and session, read the newly inspected endpoint without resending trust flags. Require success and the same PID.
3. An authorized endpoint still presenting an A-only chain must now fail if A was removed from the effective store. Without such an endpoint and root-removal evidence, report new-root acceptance only; old-root rejection remains unverified.
4. Repeat native-off rejection and native-on recovery. Run the isolated installer check again.
5. Close only the isolated preview session and remove its temporary directories. Preserve JSON/log receipts without internal URLs or certificate metadata in public issue attachments.

## Result contract

Report acceptance, installer, new-root acquisition, old-root rejection, same-PID continuity and cleanup separately as passed, failed or not observed. A cuse process exit code alone does not establish managed-store rotation. The existing local macOS, Linux and Windows synthetic fixtures cannot be relabeled as this result.
