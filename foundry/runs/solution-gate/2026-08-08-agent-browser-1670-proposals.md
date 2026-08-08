# Proposals, verbatim — agent-browser #1670 CA trust

Both produced independently in clones of `1c251b4`, blind to each other and to the implementer's shape.

---

## Proposer A — gpt-5.6-sol (codex, read-only, effort high)

## Shape

Defect 1: `cli/src/tls.rs` becomes the sole owner of CA-file interpretation. It resolves source precedence and provenance, reads the file, identifies either a PEM certificate bundle or exactly one complete DER certificate, and produces an immutable validated certificate set. PEM remains capable of holding one or many certificates. DER permits one certificate only.

Validation is transactional. Every certificate must parse as X.509, be accepted as a rustls trust anchor, and yield a valid SPKI. At least one certificate must exist. Trailing DER data, malformed certificate blocks, and partially valid bundles reject the entire source. No consumer receives a partial set.

The CLI root store, reqwest clients, `doctor`, and Chromium SPKI generation consume this same validated set. `compute_spki_hash` stops reading or interpreting files independently. It only hashes SPKIs already extracted from the validated set. Explicit sources return structured errors. An unusable ambient `SSL_CERT_FILE` produces the built-in-root fallback plus a structured warning.

This atomicity is a security requirement. Hashing a certificate that rustls rejected would grant Chromium a certificate-error exception for a key outside the CLI’s accepted trust set. Accepting the valid prefix of a malformed bundle would similarly let the two consumers trust different sets. Both behaviors are unacceptable. Failure anywhere means no certificate from that file is installed and no SPKI flag is generated. The implementation must never substitute global certificate-error suppression or disable hostname verification.

Defect 2: trust resolution returns diagnostics as data rather than printing them. The process performing TLS owns resolution, but the foreground CLI owns presentation.

Daemon requests accumulate trust diagnostics in their response envelope. The existing singular warning capacity should become a warning collection so trust warnings cannot overwrite dialog or lifecycle warnings. The daemon response boundary deduplicates diagnostics by source and reason. CLI-side operations such as `doctor` use the same envelope.

`cli/src/output.rs` renders each warning as one terminal line in normal mode. In JSON mode it includes warnings inside the single JSON response and emits no separate diagnostic text. The special `--cdp` launch path must use this response handling instead of extracting only its error string. Daemon stderr remains detached and is no longer a user-facing diagnostic channel.

An ambient failure remains a successful trust-resolution outcome containing built-in roots and a warning, so daemon startup and command exit semantics are unchanged. Explicit-source failures remain errors.

## Predictions

Defect 1:

- Given a PEM bundle containing two distinct certificates, `agent-browser --ca-cert bundle.pem doctor` reports two additional certificates, and the generated `--ignore-certificate-errors-spki-list` contains two hashes. If either side reports a different count, the shape is wrong.
- Given the same certificate as PEM and raw DER, `agent-browser --ca-cert cert.der doctor` accepts one certificate, and `compute_spki_hash` produces the same hash as for the PEM form. The current PEM-only CLI behavior would fail this prediction.
- Given a bundle containing one valid certificate followed by a malformed certificate block, `agent-browser --ca-cert mixed.pem doctor` reports an error naming the malformed certificate, and Chrome launch produces no SPKI-list argument from that file. Any partial trust proves the shape is wrong.
- Given a private-key PEM, empty file, or truncated DER file, both `doctor` and Chrome argument construction refuse it with the path and the actual parse or trust-anchor reason. A generic “no certificates” result for raw malformed DER, or acceptance by only one consumer, fails the prediction.

Defect 2:

- `SSL_CERT_FILE=/nonexistent/ca.pem agent-browser --cdp wss://example.com/devtools/browser/x open https://example.com 2>&1` prints exactly one warning line naming `SSL_CERT_FILE`, `/nonexistent/ca.pem`, and the read failure. The existing command error may follow. Absence of that warning, or a warning visible only in daemon output, fails the prediction.
- Adding `--json` to that command produces one parseable JSON document containing the warning and no standalone warning line. Parsing stdout as one JSON value demonstrates the result.
- Running the same command with `SSL_CERT_FILE` unset produces no trust warning. Pointing it at a valid bundle also produces no trust warning.
- After the ambient-source failure, the daemon remains running, and the command retains the same exit status it had before this change. A warning that prevents startup or changes success into failure disproves the shape.

## Cost

This adds a shared validated-certificate representation, source-provenance and diagnostic types, and likely a proper X.509 parser or stricter DER helper. TLS client constructors and Chrome argument construction must accept the resolved representation rather than paths.

Warnings must propagate through daemon actions, connection responses, CLI output, JSON output, and MCP transport. The response schema gains warning collection semantics, with compatibility handling for the existing singular warning field. Tests must cover PEM, multi-certificate PEM, DER, atomic rejection, ambient fallback, normal output, JSON output, and CLI/MCP parity.

There is additional certificate parsing, allocation, and propagation complexity. Caching can avoid repeated parsing within a process. No new daemon round trip or sidecar file is required.

## What it makes worse

Chromium becomes intentionally coupled to rustls’s certificate acceptance rules. A certificate Chromium could hash but rustls refuses will now be rejected everywhere.

Transactional validation is stricter than permissive parsing. Bundles containing malformed certificate blocks that previously yielded some usable hashes will stop working until corrected.

The warning collection enlarges the response contract and makes every future response-producing path responsible for preserving diagnostics. Ambient warnings may also recur on separate TLS-using invocations instead of disappearing with the daemon’s stderr.

## Rejected alternatives

- Teach only the CLI loader to recognize DER. This leaves two parsers and recreates the exact drift that caused the defect.
- Restrict both consumers to PEM. Raw DER is a legitimate certificate representation already accepted by the Chromium path; rejecting it would be an unnecessary compatibility regression.
- Accept every valid certificate found and skip malformed entries. This silently creates a different trust set from the file the operator supplied and permits partial, attacker-influenced trust.
- Hash first and let rustls validate separately. This can grant Chromium an exception for a public key whose certificate was rejected by the CLI trust store.
- Inherit or forward daemon stderr. A detached or previously running daemon is not reliably attached to the invoking terminal, unrelated daemon logs would leak into command output, and JSON would be corrupted.
- Poll a daemon log or warning sidecar. It introduces stale-warning races, cleanup requirements, and uncertain association between a diagnostic and the command that used the trust source.
- Validate only in the foreground CLI. The file can change before daemon consumption, and non-CLI entry points could bypass the decision. The process actually constructing the TLS configuration must resolve it and return the result structurally.
- Append the warning only to TLS connection errors. Ambient fallback is required to warn even when built-in roots subsequently allow the connection, and embedding warnings in error strings discards structured JSON semantics.

---

## Proposer B — fable-5 (subagent, read-only in /tmp/sg-b)

**Shape**

One loader, one owner, two consumers. All parsing of the `--ca-cert` file moves into `cli/src/tls.rs` behind a single function — call it `load_ca_certs(path) -> Result<Vec<CertificateDer<'static>>, String>` — and `compute_spki_hash` in `cli/src/native/cdp/chrome.rs` loses its private PEM decoder, its prefix sniff, and its hand-rolled ASN.1 certificate walker for input acceptance. It receives the already-validated DER list and only extracts/hashes SPKIs.

The loader's contract defines the single accepted input domain:

1. Read the file once. Run `rustls_pemfile::certs` over it. If it yields one or more certificates, that is the result (parse errors inside a PEM block are errors, as today).
2. If it yields **zero** PEM certificates, attempt exactly one fallback: treat the whole file as a single DER certificate — but "is this DER a certificate" is decided by webpki, not by byte-sniffing: `webpki::anchor_from_trusted_cert` (the same call `RootCertStore::add` makes internally in rustls 0.23.37 — verified at `rustls-0.23.37/src/webpki/anchors.rs:70-77`) must succeed. If it does, the result is that one cert; if not, the error names both failures ("no PEM certificates and not a DER certificate").
3. Both consumers — `build_root_store` (CLI trust) and the Chromium `--ignore-certificate-errors-spki-list` builder — call this loader and therefore accept or refuse the identical set of files, with the identical message.

The prefix sniff must die because it is not a sound discriminator in either direction. `data.starts_with(b"-----BEGIN")` misroutes (a) a PEM bundle with any preamble — openssl `s_client` output, comment headers, a UTF-8 BOM — into the DER branch, where the hand-rolled walker fails with a misleading ASN.1 error while the CLI side happily accepts the same file (rustls-pemfile skips preamble; verified in `rustls-pemfile-2.2.0/src/lib.rs`, `certs()` filters on `Item::X509Certificate`); and (b) it routes **arbitrary bytes** into `extract_spki_from_der` (`chrome.rs:459`), which walks TBSCertificate fields positionally with no OID or structure validation. Any DER-SEQUENCE-shaped blob whose 7th-ish element parses becomes an SPKI hash fed to `--ignore-certificate-errors-spki-list` — a flag that suppresses **all** certificate errors (expiry, hostname, revocation) for any chain containing that key, which is strictly more power than adding a root. Today the more dangerous consumer has the weaker validator. After the change, nothing reaches the SPKI hasher that webpki did not accept as a well-formed X.509 certificate. (Note honestly: webpki's anchor conversion checks structure, not CA:TRUE basicConstraints or expiry — neither path checks those today, and this shape does not add that check; it removes the gap between the paths, not that shared limitation.)

Ownership of implicit-vs-explicit stays where it is: `TrustOptions` in tls.rs remains the only place that knows `SSL_CERT_FILE` is ambient. The Chromium path is only ever fed an explicit `--ca-cert`, so it always gets the hard-error behavior.

**Defect 2.** The decision "is the configured trust source usable, and should a human hear about it" moves to the **client process**, which owns the terminal. Today the only emitter is `eprintln!` inside `build_root_store`, which runs lazily inside the daemon (the daemon owns the wss:// connection); the spawn at `connection.rs:888-891` pipes daemon stderr but reads it only on early exit, and the pipe is dropped when the client returns — so the "ignoring SSL_CERT_FILE" line is written to a pipe nobody drains. Shape: a `tls::preflight()` called once in the client, in `main.rs` after flags are folded into env (near line 983), before the daemon is contacted. It evaluates `TrustOptions::from_env()`: default → silent; usable source → silent; implicit unusable → one warning line to the client's stderr, continue; explicit unusable → the existing error string on the client's stderr, fail before spawn (this is already the contracted behavior, it just currently dies invisibly inside the daemon). The daemon-side `eprintln!`s stay for daemon logs but stop being the user-facing channel. `--json` is unaffected because the line goes to stderr, never stdout.

**Predictions**

Defect 1:
- P1: Take the DER form of a CA (`openssl x509 -in ca.pem -outform der -out ca.der`). Today `agent-browser --ca-cert ca.der doctor` reports the bundle ignored/refused ("No certificates found", since pemfile yields zero items for DER) while a headed launch passes an SPKI hash for it to Chromium. After the fix, `doctor` reports "plus 1 certificate(s) from ca.der" **and** the Chromium args contain the same single hash. If doctor still refuses DER while chrome.rs accepts it, the shape failed.
- P2: Prepend a text line ("subject=...") to a valid PEM. Today the Chromium path errors (prefix sniff → DER branch → ASN.1 failure) while `doctor` accepts it. After the fix both accept it, and the SPKI hash equals the hash of the un-prefixed file. Measured by diffing the `--ignore-certificate-errors-spki-list` value in the spawned Chromium command line.
- P3: A file of random DER-ish bytes that the old walker would hash is now refused by both consumers with an error naming the file. Measured: craft a DER SEQUENCE wrapping garbage; old binary emits a hash, new binary errors.

Defect 2:
- P4: `SSL_CERT_FILE=/nonexistent/ca.pem agent-browser --cdp wss://... open https://example.com 2>&1` prints, in the invoking terminal, one line containing `SSL_CERT_FILE` and `/nonexistent/ca.pem`. Today that command prints only the generic connection failure. If the line still doesn't reach the terminal, the shape failed.
- P5: Same command with `SSL_CERT_FILE` unset, and with a valid bundle, prints zero trust-related lines; `--json` stdout still parses with `jq .`. A shape that warns unconditionally fails this.
- P6: `agent-browser --ca-cert /nonexistent/ca.pem open …` fails **before** a daemon appears (no new pid file / socket for a fresh session), with the "Failed to read CA certificate" message on the client terminal.

**Cost**

- One new public function in tls.rs and one exported preflight; `chrome.rs` shrinks (deletes `decode_pem_certificates` for the runtime path and the sniff).
- The loader is called in up to three places per invocation (preflight, root store, chrome args) — up to three reads/parses of the same small file per command. Acceptable; memoizing is an optimization someone may later add and must then keep coherent with `describe()`.
- A new invariant future changes must remember: **any** new consumer of `--ca-cert` (e.g. the reqwest path in `apply_to_reqwest`, which today still calls `reqwest::Certificate::from_pem_bundle` independently) must go through the shared loader or the two-domains bug regrows. The reqwest path should be folded in as part of this work or explicitly ticketed.
- The DER fallback slightly widens the CLI's accepted inputs (it previously took PEM only); docs and the `--ca-cert` help text must say "PEM bundle or single DER certificate".

**What it makes worse**

- Client-side preflight duplicates evaluation the daemon will redo, and the two can disagree if the file changes between client preflight and daemon connect — a TOCTOU where the user was told "ok" but the daemon fails, or warned about a file that got fixed. Window is milliseconds, but it exists and didn't before.
- Accepting DER in the CLI path means a truncated/corrupt PEM whose headers were stripped now gets a second parse attempt and a two-clause error message that is wordier and marginally more confusing than today's single "No certificates found".
- An existing user who (accidentally) relied on the CLI rejecting a DER file as a config lint loses that signal.
- The explicit-unusable case now fails before daemon spawn; any workflow that depended on the daemon coming up anyway (then fixing the cert and retrying against the live daemon) loses that daemon. Exit code is unchanged (still an error) but the failure point moves earlier.

**Rejected alternatives**

- **Teach `compute_spki_hash` PEM-with-preamble and better sniffing (fix the sniff, keep two parsers).** Killed by the security asymmetry: two independently-evolving parsers guarantee the domains drift again, and the browser-side parser feeds Chromium's strongest trust-bypass flag; the only sound discriminator is "webpki parsed it", which is what the shared loader is.
- **Drop DER support entirely (both sides PEM-only).** Defensible and smaller, but it breaks anyone currently feeding DER to the browser path (works today), and the brief's bar is agreement, not narrowing; rejected because it converts a silent inconsistency into a silent regression for existing users.
- **Have the daemon ship trust warnings back over the control socket for the client to print.** Killed by lifecycle: the root store is built lazily on first TLS use, potentially after the client that spawned the daemon has exited, and warnings would need buffering, dedup across clients, and a protocol field — all to deliver one line the client can compute locally from the same env.
- **Stop nulling/dropping daemon stderr; tee it to a log file and tail it on failure.** Improves debuggability generally but fails P4's "on the terminal the user is attached to" for the success-with-warning case, and pushes JSON-mode contamination risk into whichever code decides when to replay the log.
- **Validate CA:TRUE / expiry in the loader while we're there.** Rejected for this change: rustls's own `RootCertStore::add` deliberately doesn't (verified in 0.23.37 source), corporate proxy CAs are routinely weird, and tightening beyond the platform's own semantics risks breaking the exact users the flag exists for. Worth a separate discussion, not a rider.
