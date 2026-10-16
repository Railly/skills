# Blind proposals: agent-browser #1669 NSS replacement

- Date: 2026-08-13
- Base: `vercel-labs/agent-browser` at `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`
- Proposal A: `anthropic/claude-fable-5-thinking-high`
- Proposal B: `google/gemini-3.1-pro`
- Both proposers worked in separate shallow clones that did not contain PR #1669.
- Neither proposer saw the candidate or the other proposal.
- The Codex root runtime synthesized and will implement; it proposed neither shape.

## Proposal A: Fable 5

### Shape

**State location.** When a CA is supplied, each Chrome launch gets a private HOME directory beside the existing temp profile: `std::env::temp_dir()/agent-browser-nss-<uuid>`, containing `.local/share/pki/nssdb`. It is a sibling of, not inside, the temp user-data directory, because persistent and copied profile launches have no agent-browser-owned user-data directory to nest it in, and one uniform location avoids the unverified assumption that Chromium tolerates foreign subdirectories inside its user-data dir.

**Ownership.** `ChromeProcess` gains a second owned path (`temp_nss_home: Option<PathBuf>`) alongside `temp_user_data_dir`. The contract requires the component that can kill and reap Chromium to own trust-state deletion; `ChromeProcess::drop` already kills the process group and reaps before deleting owned state, so the NSS home is deleted there, after the kill/reap, with the same retry loop.

**Creation, import, selection, deletion.** New CLI flag `--ca-cert <path>`, forwarded as `AGENT_BROWSER_CA_CERT` through the existing environment-variable boundary, with the path resolved to absolute in the CLI. In the daemon's blocking launch path, before spawning Chromium: create the NSS home, run `certutil -N --empty-password -d sql:<home>/.local/share/pki/nssdb`, then one `certutil -A -t C,, -n agent-browser-ca-<i> -i <cert>` per certificate. Selection is done by setting `HOME=<nss-home>` and `XDG_DATA_HOME=<nss-home>/.local/share` only on the Chrome child's environment; the daemon's environment is untouched, and with no `--ca-cert` nothing changes. Also create a `.pki` symlink to `.local/share/pki` inside the private HOME so pre-146 Chromium builds that read `$HOME/.pki/nssdb` find the same database.

Assumptions not verified by the first probe: the `.pki` fallback for older builds, public-site trust under a private HOME, and headed mode under Xvfb.

**Concurrency identity.** The per-launch UUID in the directory name is the identity. Two private HOMEs with the same nickname remain disjoint, so nickname collisions require no lock or registry.

**Missing or failing certutil.** The CLI does a fast preflight for an actionable error before daemon spawn; the daemon repeats the authoritative check because browser launch happens there. Any failure aborts before Chromium spawns, removes partial state, and returns stderr plus a `libnss3-tools` installation hint.

**Normal close.** Graceful, idle, and signal close run destructors. `ChromeProcess::drop` kills and reaps the browser tree before deleting the profile and NSS HOME.

**Daemon SIGKILL.** Destructors do not run. The NSS HOME remains, so a surviving Chromium never points to deleted trust state. Write a Chrome PID marker after spawn and sweep directories whose recorded process is dead on a later startup. PID reuse remains a best-effort limitation.

**Chrome crash.** The existing daemon loop detects process exit, closes the browser, and drops `ChromeProcess`, deleting the NSS HOME after the child is reaped.

**Platforms and backends.** Accept only locally launched Chromium on Linux. Reject macOS, Windows, CDP attach, providers, Lightpanda, Safari, and iOS explicitly.

**Persistent and copied profiles.** Reject `--ca-cert` combined with `--profile` in v1. A private HOME changes the NSS database visible to a persistent profile, risking the must-not-change profile contract.

**Single certificate versus bundle.** Accept a PEM bundle and single DER certificate through one shared validated loader. Import each parsed certificate separately with indexed nicknames.

### Predictions

1. Against a controlled TLS server, the correctly named valid leaf signed by CA A loads with CA A omitted from the chain, while wrong-hostname, expired, not-yet-valid, and CA-B-signed leaves fail.
2. Two sessions with CA A and CA B expose disjoint `cert9.db` paths through `lsof`; each rejects the other's leaf.
3. Without `certutil`, the command exits nonzero naming `certutil` and `libnss3-tools`, with no Chrome process or leaked NSS HOME.
4. After normal `agent-browser close`, the private NSS HOME is absent and no Chrome process references it.
5. After daemon SIGKILL, the NSS HOME remains while any surviving Chrome uses it; after Chrome exits, a later startup removes the stale directory.
6. Without `--ca-cert`, Chrome receives the normal HOME and existing tests pass unchanged.

### Cost

Approximately 150 to 250 lines in Chrome launch and NSS preparation, plus flag/config/environment/MCP plumbing, documentation, and Linux integration coverage. Each CA launch adds external `certutil` subprocesses.

### What it makes worse

- Chrome runs under a private HOME on the CA path, hiding the user's NSS client certificates and other HOME-derived state.
- Hard daemon crashes can leave an orphan directory until a later sweep.
- The feature adds a `certutil` runtime dependency.
- Profile users cannot combine their profile with the feature in v1.
- The CA path becomes daemon configuration that must restart an existing session when changed.

### Rejected alternatives

- The global user NSS database because it shares durable trust across daemons and normal browsers.
- Broad HTTPS-error bypass because it violates the negative matrix.
- SPKI error allowlisting because it accepts wrong-hostname and expired certificates and fails CA-omitted chain building.
- Reimplementing verification from CDP events because Chromium must remain the verifier.
- Machine-wide enterprise policy because it cannot isolate trust per daemon.
- Deleting NSS state outside `ChromeProcess` because only `ChromeProcess` owns kill-and-reap ordering.

## Proposal B: Gemini 3.1 Pro

### Shape

- Create a UUID-named temporary directory that acts as a private HOME. Store the NSS database at `.local/share/pki/nssdb`.
- Make `ChromeProcess` own the private HOME so its lifecycle matches the Chrome child.
- Before launch, run `certutil -N --empty-password` and `certutil -A -t "C,,"` against the private database.
- Launch Chromium with HOME and XDG_DATA_HOME pointing into the private HOME.
- Delete the private HOME from `ChromeProcess::drop` only after Chrome is killed and reaped.
- Let UUID paths isolate concurrent daemons.
- On missing or failed `certutil`, remove partial state and return an actionable pre-launch error.
- On daemon SIGKILL, accept an orphan NSS directory while preserving the invariant that trust state is not deleted under a live Chrome.
- On Chrome crash, let existing process-exit detection drop the owner and delete the store.
- Reject non-Linux and non-local-Chromium modes.
- Support persistent and copied profiles by changing HOME while preserving `--user-data-dir`.
- Accept one certificate per input file.

Unverified assumptions: changing HOME does not alter persistent-profile semantics, and `certutil -A` behavior for certificate bundles.

### Predictions

1. On macOS, `--ca-cert` exits nonzero with an unsupported-platform error before Chrome starts.
2. After daemon SIGKILL, an NSS database remains on disk.
3. Concurrent CA sessions show two disjoint `cert9.db` paths in `lsof`.
4. Without `certutil`, launch fails actionably and leaves no NSS directory.

### Cost

- External subprocess latency on the CA path.
- Orphan disk state after hard crashes.
- A new `libnss3-tools` dependency.

### What it makes worse

- Hard crashes accumulate temporary directories.
- Launch becomes slower.
- Minimal images need an additional package.

### Rejected alternatives

- The global user NSS database because it cannot isolate concurrent sessions.
- Broad error bypass because it disables unrelated verification.
- SPKI allowlisting because it is an error bypass rather than CA trust.
