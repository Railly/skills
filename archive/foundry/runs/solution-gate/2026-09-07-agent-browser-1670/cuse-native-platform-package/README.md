# Local cuse native trust verification package

This package is prepared locally. Neither native Windows validation nor the managed macOS validation has been executed. No workflow has been published or dispatched.

## Windows

Copy cli-tls-cuse.yml into .github/workflows/ and both cli-tls-windows.json and windows-native-store.py into .github/scenarios/ on a branch containing the local PR #1670 TLS amendment and fixtures. The unamended remote PR head is not the tested local source. The workflow checks out that branch, builds the TLS integration tests, and uses cuse v0.2.1 to run them followed by the native store probe.

The Python probe requires an explicitly selected disposable GitHub-hosted Windows runner. It imports test CA A into CurrentUser/Root, checks A succeeds and B fails, removes A, imports B, checks B succeeds and A fails, disables and reenables native trust, and verifies an unchanged daemon PID with no launched browser. SSL_CERT_FILE and SSL_CERT_DIR are unset. The probe checks store membership through X509Store separately from the HTTP assertions, records binary/root SHA-256 hashes, and removes only its own fixture roots in finally. Runner disposal remains the cleanup boundary if execution is forcibly terminated.

CurrentUser/Root matches the rustls-native-certs backend used by this worktree. This case does not establish LocalMachine policy, enterprise Windows deployment or MDM behavior. It tests native discovery through read; installer behavior has separate TLS integration coverage.

Validated locally: Python syntax, cuse scenario schema, workflow YAML, and refusal on this macOS host without changing trust. Native Windows runtime behavior remains unverified.

## Managed macOS

Use managed-macos.md on a consenting test machine already behind the affected Zscaler deployment. A hosted macOS runner or a PEM override is not equivalent to an MDM-managed System Keychain. The recipe leaves corporate certificates and trust policy to the organization. cuse can run the commands on the available host but does not supply the host or perform the organization's certificate rollout.
