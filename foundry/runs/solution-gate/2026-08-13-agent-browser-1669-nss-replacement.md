# Solution gate: agent-browser #1669 true CA trust replacement

- Date: 2026-08-13
- Base: `vercel-labs/agent-browser` at `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`
- Candidate: PR #1669 at `79feeaa803377fa7e2db3fef53876382e9eb6bfb`
- Mode: candidate audit followed by greenfield replacement design
- Proposers: `anthropic/claude-fable-5-thinking-high` and `google/gemini-3.1-pro`
- Synthesizer and implementer: Codex root runtime
- Proposals: `2026-08-13-agent-browser-1669-nss-replacement-proposals.md`
- Drawing: `2026-08-13-agent-browser-1669-nss-replacement.html`

## 0. Trigger

Fires. The existing candidate promises CA trust but implements a certificate-error bypass. The replacement changes process environment, trust-store ownership, browser lifecycle, dependency behavior, concurrency, and platform compatibility.

## 1. Candidate seal and isolation

The candidate body, diff, commits, reviews, and linked issue were saved outside both reviewer directories. Two shallow clones of upstream `main` resolved to `548b159`; both returned `CANDIDATE_ABSENT` for candidate head `79feeaa`.

## 2. Reconciled blind contract

**Property.** A locally launched Chromium instance can receive a user-supplied CA as an additional trust anchor without weakening hostname, validity-period, or unrelated-authority verification.

**Observable.**

- Accept a correctly named valid leaf signed by the supplied CA when that CA is omitted from the server chain.
- Reject wrong-hostname, expired, not-yet-valid, and unrelated-CA leaves.
- Keep concurrent daemon trust stores disjoint.
- Fail actionably before Chromium starts when store preparation is unavailable.
- Never delete trust state while an owned Chromium process remains live.

**Must not change.**

- No CA means existing launch and TLS behavior.
- `--ignore-https-errors` remains the explicit broad bypass.
- Default Chrome launches keep isolated temporary profiles.
- Profile semantics remain unchanged, which allows rejecting the combination in v1.
- Browser kill-and-reap precedes owned temporary-state deletion.
- Graceful, idle, and signal shutdown continue to run destructors.
- Unsupported platforms and backends do not claim support.

## 3. Observed subsystem facts

1. `ChromeProcess` already owns the Chrome child, Unix process group, temporary profile, and Linux Xvfb.
2. Its destructor kills and reaps the Chrome tree before deleting the temporary profile.
3. Local launches create a UUID profile by default; persistent profile paths are user-owned.
4. Browser launch occurs inside the daemon and early launch failure reaches the invoking CLI through captured daemon stderr.
5. Daemon configuration has a fingerprint and restarts an existing session when fingerprinted values change.
6. The current broad bypass is applied both at Chrome launch and through CDP.
7. Chromium Linux selects an existing `$HOME/.pki/nssdb` before `$XDG_DATA_HOME/pki/nssdb`, then falls back to `$HOME/.local/share/pki/nssdb`.

## 4. Probe log

### P1. Private HOME provides trust rather than bypass

Command:

```text
docker run --rm --platform linux/arm64 -i debian:bookworm-slim bash -s < nss-probe.sh
```

Observed on Chromium 151.0.7922.137:

```text
no-trust status=0 result=PRIVACY_ERROR
ca-a-good status=0 result=LOADED
ca-a-wrong-host status=0 result=PRIVACY_ERROR
ca-b-good status=0 result=PRIVACY_ERROR
```

Result: survives. A private HOME/XDG NSS database accepts the supplied CA, retains hostname verification, and isolates two CAs.

### P2. NSS path precedence and public trust

Observed:

```text
pki-b status=0 result=LOADED
xdg-a-shadowed status=0 result=PRIVACY_ERROR
xdg-a status=0 result=LOADED
public-root-store status=0 result=PUBLIC_LOADED
symlink-a status=0 result=LOADED
```

Result:

- An existing `$HOME/.pki/nssdb` shadows XDG.
- Removing it selects XDG.
- A `.pki` symlink to the XDG `pki` directory makes both paths select one database.
- Public sites remain trusted under the private HOME on Chromium 151.

### P3. Existing profile compatibility

The path-selection probe proves that changing HOME changes the NSS database visible to Chromium independently of `--user-data-dir`.

Result: refutes Proposal B's unqualified profile support. V1 rejects `--ca-cert` with `--profile` to preserve profile semantics.

### P4. Candidate semantic matrix

Previously recorded runtime evidence:

- CA SPKI plus a separately keyed leaf with the CA omitted remains rejected.
- CA or leaf SPKI can accept a wrong-hostname certificate when the matching key appears in the presented chain.
- An isolated Linux NSS store accepts the valid CA-built chain and retains hostname rejection.

Result: refutes the candidate mechanism.

## 5. Forward chains

### Proposal A

- Private HOME is created before Chrome launch (`inferred`).
- NSS database is initialized and certificates imported (`observed primitives`, composition inferred).
- Chrome receives private HOME/XDG and resolves both modern and legacy NSS paths to one database (`observed` with symlink probe).
- Chrome owns normal verification with only the anchor set extended (`observed` matrix).
- `ChromeProcess` kills and reaps before deleting the store (`inferred` from existing ownership).
- Harmful branch: daemon SIGKILL skips cleanup and leaves disk state (`inferred`).
- Harmful branch: private HOME hides user NSS client certificates (`inferred`).
- Helpful branch: no CA leaves process environment unchanged (`inferred`, directly testable).

### Proposal B

- Same private HOME and ownership path (`inferred`).
- Persistent profiles run under a different HOME (`proposed`).
- Their visible NSS database changes even though user-data-dir stays constant (`observed` path-selection probe).
- Harmful branch: client certificates and NSS-backed profile state disappear (`inferred`).
- Result: refuted as a whole because it violates profile must-not-change semantics.

### Candidate

- Validated certificate bytes become SPKI hashes (`observed` from code).
- Chrome receives `--ignore-certificate-errors-spki-list` (`observed`).
- Matching a presented key returns success before normal verification (`observed` Chromium semantics).
- Harmful branch: wrong-hostname and expired certificates can load (`observed/inferred`).
- Harmful branch: a supplied CA omitted from the chain cannot build trust (`observed`).
- Result: primitive-contract mismatch.

## 6. Failure-shape scoring

| Shape | Proposal A | Proposal B | Candidate |
|---|---|---|---|
| S1 over-reach | Private HOME affects HOME-derived state; bounded by rejecting profiles and CA-only activation | Hit: silently changes profile NSS semantics | Hit: suppresses more errors than trust allows |
| S2 under-reach | Bundle, concurrency, dependency, and negative matrix required | Hit: single-cert and untested profile path | Hit: only passes shared happy path |
| S3 direction inheritance | Both accept and reject directions covered | Same matrix, but profile direction missed | Hit: bypass accepts too much and trust accepts too little |
| S4 proxy property | NSS anchor semantics match required property | User-data-dir preservation does not prove profile semantics | Hit: key match is adjacent to CA authority |
| S5 unregistered peer | Orphan sweep required; residual accepted explicitly | Orphans accepted with no owner beyond tmp cleanup | Candidate creates no trust store but introduces an untracked bypass contract |
| S6 peer-version blindness | `.pki` and XDG resolve to one DB | No version fallback | Not applicable |
| S7 wrong layer | Chrome remains verifier; daemon only prepares trust | Same | Hit: exception primitive replaces trust semantics |
| S8 guard-derived cells | Matrix comes from trust contract | Partial | Hit: happy path derived from implementation |
| S9 test pins wrong thing | Mechanism-specific mutation targets required | Weak lifecycle predictions | Hit: SPKI presence tests assert the wrong mechanism |
| S10 claim from prose | Path precedence and public trust probed | Profile support remained prose | Candidate description contradicted runtime semantics |
| S11 asymmetric validation | Shared loader supplies both consumers | Single cert only | Validation hardened the stronger grant rather than fixing its semantics |
| S12 primitive-contract mismatch | Miss | Miss on trust primitive, profile issue separate | Direct hit |

S1 and S2 receive highest weight because this replaces a defective review-round fix.

## 7. Blind synthesis

**Kind: Proposal A whole, with two refinements discovered during synthesis.**

Chosen shape:

1. Reuse the candidate's flag, config, environment, shared PEM/DER loader, help, and documentation plumbing.
2. Accept only locally launched Chromium on Linux.
3. Reject `--ca-cert` with CDP attach, providers, Lightpanda, Safari, iOS, macOS, Windows, and `--profile`.
4. Create a UUID private NSS HOME beside the Chrome profile.
5. Initialize `$XDG_DATA_HOME/pki/nssdb` and make `$HOME/.pki` point to the same `pki` directory.
6. Import every certificate returned by the shared loader with `certutil -A -t C,,`.
7. Set HOME and XDG_DATA_HOME only on the Chrome child.
8. Make `ChromeProcess` own the NSS HOME and delete it only after Chrome is killed and reaped.
9. Include the canonical CA path in daemon configuration identity so adding, changing, or removing it restarts the session instead of reusing old trust.
10. Treat SIGKILL orphan directories as an explicit residual; sweep only stores whose recorded Chrome process is demonstrably gone.
11. Keep `--ignore-https-errors` separate. If both flags are supplied, reject the combination rather than claiming targeted trust has effect.

Proposal B's genuinely better property was a smaller first implementation without bundle or version compatibility. It was not taken because its persistent-profile assumption was refuted and its smaller shape did not cover the existing shared loader.

## 8. Candidate reveal and verdict

The candidate mechanism computes SPKI hashes from validated certificate bytes and supplies them through Chromium's error-ignore allowlist. Its loader, flag/config/env plumbing, parser tests, and documentation surface are useful. Its mechanism, mechanism-specific dependencies, ASN.1 walker, SPKI tests, and security claims are not.

**Verdict: absorb and recreate.**

Reusable:

- `--ca-cert`, `AGENT_BROWSER_CA_CERT`, and `caCert`
- flag/config parsing and cleanup
- shared PEM-bundle/single-DER loader
- CLI-to-daemon plumbing
- help, README, skill, and docs surfaces
- credit to Chris Tate and Martín Fernández

Removed:

- `--ignore-certificate-errors-spki-list`
- SHA-256/base64 SPKI computation
- positional ASN.1 parsing
- tests whose oracle is an SPKI argument
- every statement equating a key exception with a CA trust anchor

## 9. Carried assumptions

1. Headed Chromium under Xvfb respects the same private HOME/XDG selection.
2. `certutil` imports each validated DER certificate equivalently to the PEM probe.
3. A PID-backed orphan sweep can avoid deleting a live store; if not proved, cleanup stays manual/system-temporary rather than unsafe.
4. `certutil` is available in Linux environments that opt into the feature or yields an actionable package hint.
5. Rejecting profiles in v1 is acceptable product scope.

## 10. Review handoff

- Drive every trust-matrix cell.
- Run two daemons with different CAs concurrently.
- Remove or fake `certutil` and prove Chrome never starts.
- Exercise normal close, Chrome crash, daemon SIGTERM, and daemon SIGKILL.
- Verify no-CA launch environment and behavior are unchanged.
- Verify changing or removing CA configuration restarts the daemon.
- Mutate out HOME/XDG, `.pki` compatibility, each certificate import, kill-before-delete ordering, platform validation, and fingerprinting; a distinct test must fail for each.
