## Missing coverage

Add an Agent Browser native certificate-store rotation cell to the cuse rig on a disposable Windows runner. This would close the Windows verification gap identified while validating vercel-labs/agent-browser#1670 and #1433.

As checked on September 7, 2026, `rig.yml` exposes `seam`, `ios` and `portless` cells. None tests Windows native TLS roots. Cuse v0.2.1 can orchestrate external commands, but this session has no Windows host, AWS CLI or provisioned Windows debug instance. This is a rig coverage request; a Windows cuse runtime failure has not been reproduced.

## Proposed cell

Use a disposable Windows x64 runner and an explicitly identified Agent Browser candidate. Record its source revision, any applied patch digest and binary SHA-256. The current local amendment is based on `a45f1b656cb13c74bf1dca2f1439b77e8020360c`; checking out that remote commit alone does not include the amendment.

Run the existing TLS integration suite, then execute this native-store sequence through a cuse scenario:

1. Start local HTTPS peers signed by distinct fixture roots A and B. Require both roots to be absent initially.
2. Unset `SSL_CERT_FILE`, `SSL_CERT_DIR` and explicit extra-CA configuration. Use an isolated Agent Browser session.
3. Confirm an A request fails with `--use-system-ca` before importing its root.
4. Import A into Windows `CurrentUser/Root`, which the candidate's `rustls-native-certs` backend opens. Confirm A succeeds and B fails.
5. Remove A and import B while keeping the daemon running. Confirm B succeeds and A fails without resending trust flags.
6. Confirm `--use-system-ca false` rejects B and reenabling native trust recovers.
7. Require the same daemon PID and `browserLaunched=false`. Record store membership independently through `X509Store`, plus peer request counts and root fingerprints.
8. Remove only roots added by this run and close its daemon. Preserve failure evidence and report cleanup errors. Dispose of the runner after forced termination.

## Completion criteria

- a live Windows result contains the native-store assertions above, exact candidate identity and cleanup evidence
- a deliberately stale-root implementation makes the scenario fail
- missing platform access or a skipped scenario never becomes a passing certificate-store verdict
- fixture import stays limited to a disposable runner; LocalMachine policy and enterprise deployment remain separate claims

A local Python probe and cuse workflow draft are prepared. Python syntax, the released scenario parser, YAML parsing and refusal on macOS were checked. The Windows probe has not run. Existing PEM-override tests do not count as native-store proof.
