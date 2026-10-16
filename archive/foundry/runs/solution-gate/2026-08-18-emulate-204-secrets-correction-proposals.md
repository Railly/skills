# Blind proposals: emulate PR #204 secrets correction

- Date: 2026-08-18
- Isolated base: `c39777943ec879dc75102d3cd741d8c961d61b06`
- Proposal A: Claude Fable 5
- Proposal B: Gemini 3.7 Flash
- Neither proposer could inspect PR #204, its branch, commit, tests, body, or the other proposal.

## Proposal A, verbatim proposal body

# Shaping: emulate CLI generated-secret durable delivery: Blind Proposer A

Audit of snapshot `c39777943ec879dc75102d3cd741d8c961d61b06`. Read-only; no candidate artifacts inspected.

## CURRENT (baseline)

| Element | Location | Behavior |
|---|---|---|
| CLI flags | `packages/emulate/src/index.ts:32-53` | `start` accepts `--port`, `--service`, `--seed`, `--base-url`, `--portless`. No secret-delivery option exists. |
| Startup order | `packages/emulate/src/commands/start.ts:117-194` | `ensurePortless` → per-service `load()` → `registerAliases` → `createServer` + seed → `serve()` → `printBanner`. |
| Generated secrets | `packages/emulate/src/api.ts:54-60`, `packages/emulate/src/registry.ts:85-95` | Only `createEmulator` calls `prepareSeed`; only GitHub implements it (RSA app keys via `materializeGitHubSeedConfig`). |
| CLI missing-key path | `packages/@emulators/github/src/index.ts:208-215` | CLI seeding of an app without `private_key` throws "requires private_key when seedFromConfig is called directly". |
| Failure handling | `packages/emulate/src/commands/start.ts` throughout | `process.exit(1)` on config/portless errors; no unwind of partially created listeners or stores mid-startup. |

## Requirements (R)

R0 through R10 preserved verbatim from the packet. R11 is extracted from the frozen temporal contract ("caller owns the requested pathname, startup transaction owns only the inode it creates"; continuity observable "exact created identity tracked") because the fit check below needs it to discriminate.

| Req | Requirement | Status |
|---|---|---|
| R0 | A requested durable artifact contains exactly the generated secrets required to use the prepared emulator configuration. | Core goal |
| R1 | At successful startup, the final artifact is complete before any listener, alias, Portless action, or banner becomes externally visible. | Must-have |
| R2 | The final artifact is effectively unreadable by non-owner principals on every filesystem and operating system where the feature is supported. Mode bits alone cannot satisfy this requirement when another access-control mechanism exists. | Must-have |
| R3 | If effective owner-only access cannot be established and verified, startup fails before any generated secret is published at the final path. | Must-have |
| R4 | Any failure after publication removes only the artifact owned by that invocation and leaves the same command immediately retryable without manual repair. | Must-have |
| R5 | A pre-existing destination or destination that changes identity is preserved and causes a safe failure. | Must-have |
| R6 | Explicitly supplied secrets are never exported. Generated secrets never enter stdout, stderr, banner, or HTTP. | Must-have |
| R7 | Without the opt-in delivery request, existing missing-secret errors, service selection, ports, base URLs, Portless behavior, banner, shutdown, and config discovery remain unchanged. | Must-have |
| R8 | Programmatic `createEmulator.generatedSecrets`, reset stability, and non-GitHub services remain unchanged. | Must-have |
| R9 | Crash residuals must not be mistaken for successful final publication or cause deletion of unrelated user files. Any unavoidable crash residual has a bounded, recognizable ownership rule and recovery story. | Must-have |
| R10 | The design must work with multiple selected services and with an empty generated-secret set. | Must-have |
| R11 | The invocation-owned final artifact is a single filesystem object whose usable content lives at exactly the caller-requested pathname, with ownership tracked by the identity of the one inode the transaction creates there. | Must-have (extracted from temporal contract) |

## A: Verified single-file artifact with exit-hook transaction

Publish one hardened, verified file at the requested path before anything becomes reachable; unwind everything through a LIFO stack wired to both thrown errors and `process.exit`.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **A1** | **Opt-in flag** | |
| A1.1 | Add `--secrets-out <path>` to the `start` command in `packages/emulate/src/index.ts`; thread through `StartOptions`. Absent flag executes the existing code path byte-for-byte (no reorder, no `prepareSeed`). | |
| **A2** | **Pre-reachability materialization** | |
| A2.1 | When the flag is set, after `loadSeedConfig` and service validation but before `ensurePortless`, run `entry.load()` and `loadedSvc.prepareSeed?.(svcSeedConfig)` for every selected service in the existing `services` array order, mirroring `api.ts:54-60`. Collect `GeneratedSecret[]` tagged `{service, kind, id, label, value}`; keep the materialized config per service for later seeding. | |
| A2.2 | Services without `prepareSeed` contribute zero secrets; an all-empty result still proceeds to publication (empty artifact). | |
| **A3** | **Transactional artifact writer** | |
| A3.1 | Platform and filesystem gate: allow `darwin` and `linux` only; on the destination's directory run `fs.statfs` and match the magic against an allowlist of local filesystems (APFS/HFS+ on darwin; ext4, xfs, btrfs, tmpfs on linux). Unknown magic, network filesystems, or `win32` fail with a non-secret diagnostic before any write. | |
| A3.2 | `lstat` the destination; any existing object (file, symlink, directory) refuses with a non-secret diagnostic. TOCTOU closed by A3.6. | |
| A3.3 | Create `<dest>.tmp-emulate-<pid>-<random>` in the destination's directory with `O_CREAT\|O_EXCL\|O_WRONLY`, mode `0600`. | |
| A3.4 | Harden and verify: on darwin spawn `/bin/chmod -N <tmp>` to strip inherited ACLs, then verify with `/bin/ls -lde <tmp>`, requiring no `+` suffix on the mode string and no indented ACL entry lines; on linux spawn `getfacl -p -- <tmp>` and require only base `user`/`group`/`other` entries (no `mask`, no named entries). Re-stat and require mode exactly `0600` and owner uid equal to `process.getuid()`. If the verification tool is missing or output is unparseable, fail closed before publication (R3). | |
| A3.5 | Write JSON `{schemaVersion: 1, generatedAt, invocation: {pid}, secrets: [...]}` in service order; `fsync` the file and its directory. | |
| A3.6 | Publish with `fs.linkSync(tmp, dest)`, which fails `EEXIST` if the destination appeared meanwhile (safe refusal, temp removed), then `unlinkSync(tmp)`. Record `stat(dest)` dev+ino as the owned identity. The hard link preserves the verified inode, so A3.4's verification carries to the final name unchanged. | |
| **A4** | **LIFO unwind bound to error and exit paths** | |
| A4.1 | Maintain a stack of idempotent synchronous undo actions: after publish push "if `stat(dest)` dev+ino matches recorded identity, `unlinkSync(dest)`; otherwise preserve and warn"; after `registerAliases` push `removeAliases` (its internal partial rollback at `portless.ts:66-80` covers mid-registration failure); after each `createServer` push `store.reset()`; after each `serve` push `srv.close()`. | |
| A4.2 | Register the unwind on `process.on("exit")` (fires for the existing `process.exit(1)` sites such as `ensurePortless`) and wrap the flag path in try/catch for thrown errors, then rethrow with a non-secret message and exit non-zero. Disarm the unwind only after the banner prints. | |
| **A5** | **Residual ownership rule** | |
| A5.1 | Temp names match the documented pattern `<dest>.tmp-emulate-<pid>-<random>`; the writer never deletes any name not created by this invocation. Recovery doc: a leftover temp is always safe to delete; a leftover final artifact after a SIGKILL is complete (link is atomic), carries `invocation.pid`, and the documented recovery is verify no emulate process owns it, then delete or choose a new path. | |
| **A6** | **Output hygiene** | |
| A6.1 | The secrets array is confined to the writer module; the banner and all logs print only the artifact path and counts, never values. Explicit keys never enter the collection (only `prepareSeed` output does, and `materializeGitHubSeedConfig` skips apps with `private_key !== undefined` at `github/src/index.ts:139-142`). | |
| **A7** | **Seeding from materialized config** | |
| A7.1 | In the flag path, `seedFromConfig` receives the materialized per-service config from A2.1, so GitHub apps without explicit keys seed with their generated keys instead of throwing. Without the flag, seeding keeps receiving the raw config and the existing error is untouched. | |

## B: Container-directory delivery with confinement by traversal denial

The requested destination becomes a `0700` directory the invocation creates, ACL-strips, and verifies once; secret files written inside afterward can never inherit foreign ACLs, so confidentiality rests on directory search-permission denial rather than per-file verification.

| Part | Mechanism | Flag |
|------|-----------|:----:|
| **B1** | Flag `--secrets-dir <path>` plus the same pre-reachability materialization as A2. | |
| **B2** | `fs.mkdirSync(dest, {mode: 0o700})`, which fails `EEXIST` on any pre-existing object (safe refusal). Then darwin `/bin/chmod -N` on the directory and verification via `/bin/ls -lde`; linux `getfacl` on the directory requiring base entries only; same platform/filesystem gate as A3.1. Fail closed before any secret is written. | |
| **B3** | Inside the verified container, write `secrets.json.partial` (mode `0600`, schema-versioned JSON as A3.5), `fsync`, then same-directory atomic `renameSync` to `secrets.json`. Files created after the ACL strip inherit nothing, because inheritance applies only at creation from the parent's then-current ACL. | |
| **B4** | Same LIFO unwind as A4, with the artifact undo being: verify dev+ino of the container directory, remove `secrets.json` and any `*.partial`, then `rmdirSync` the container. | |
| **B5** | Residual rule: the container directory is the ownership boundary. A container with only `*.partial` inside is recognizably failed; a container with `secrets.json` is complete. Recovery doc: remove the whole container after confirming no live emulate process. | |
| **B6** | Output hygiene and materialized-config seeding identical to A6 and A7. | |

## Fit Check

| Req | Requirement | Status | A | B |
|-----|-------------|--------|---|---|
| R0 | A requested durable artifact contains exactly the generated secrets required to use the prepared emulator configuration. | Core goal | ✅ | ✅ |
| R1 | At successful startup, the final artifact is complete before any listener, alias, Portless action, or banner becomes externally visible. | Must-have | ✅ | ✅ |
| R2 | The final artifact is effectively unreadable by non-owner principals on every filesystem and operating system where the feature is supported. Mode bits alone cannot satisfy this requirement when another access-control mechanism exists. | Must-have | ✅ | ✅ |
| R3 | If effective owner-only access cannot be established and verified, startup fails before any generated secret is published at the final path. | Must-have | ✅ | ✅ |
| R4 | Any failure after publication removes only the artifact owned by that invocation and leaves the same command immediately retryable without manual repair. | Must-have | ✅ | ✅ |
| R5 | A pre-existing destination or destination that changes identity is preserved and causes a safe failure. | Must-have | ✅ | ✅ |
| R6 | Explicitly supplied secrets are never exported. Generated secrets never enter stdout, stderr, banner, or HTTP. | Must-have | ✅ | ✅ |
| R7 | Without the opt-in delivery request, existing missing-secret errors, service selection, ports, base URLs, Portless behavior, banner, shutdown, and config discovery remain unchanged. | Must-have | ✅ | ✅ |
| R8 | Programmatic `createEmulator.generatedSecrets`, reset stability, and non-GitHub services remain unchanged. | Must-have | ✅ | ✅ |
| R9 | Crash residuals must not be mistaken for successful final publication or cause deletion of unrelated user files. Any unavoidable crash residual has a bounded, recognizable ownership rule and recovery story. | Must-have | ✅ | ✅ |
| R10 | The design must work with multiple selected services and with an empty generated-secret set. | Must-have | ✅ | ✅ |
| R11 | The invocation-owned final artifact is a single filesystem object whose usable content lives at exactly the caller-requested pathname, with ownership tracked by the identity of the one inode the transaction creates there. | Must-have (extracted) | ✅ | ❌ |

**Notes:**
- B fails R11: the usable secret content lives at `<dest>/secrets.json`, not at the caller-requested pathname; the transaction owns two inodes (directory plus file), which contradicts the temporal contract's "startup transaction owns only the inode it creates" and complicates the "exact created identity tracked" observable.
- Neither shape has flagged unknowns; every mechanism names its syscall or platform binary.

## Predictions (tied to discriminator cells, for shape A)

| Cell | Setup and command | Predicted observation |
|---|---|---|
| D1 | `mkdir fresh && npx emulate start -s github --seed seed.yaml --secrets-out fresh/secrets.json` with one keyless app in seed | Banner prints; `jq .schemaVersion fresh/secrets.json` is `1`; `stat -f '%Lp' fresh/secrets.json` is `600`; `jq -r '.secrets[0].value' fresh/secrets.json \| openssl rsa -check -noout` succeeds; the JWT-authenticated app endpoint works against the running emulator. |
| D2 | `mkdir p && chmod +a "everyone allow read,file_inherit" p`, then start with `--secrets-out p/secrets.json` | Either `ls -le p/secrets.json` shows no `+` and zero ACL entries and `sudo -u nobody cat p/secrets.json` returns Permission denied, or the process exits non-zero before any `p/secrets.json` exists. A bare `stat` mode of `0600` is not accepted as the check. |
| D3 | Pre-create destination as each of: `touch dest`, `ln -s /etc/passwd dest`, `mkdir dest` | Exit non-zero each time; `cmp`/`readlink`/`ls` show the object byte-identical; `lsof -i :4000` empty; `portless list` shows no `github.emulate`; stderr contains no key material. |
| D4 | Seed with duplicate `app_id` so `materializeGitHubSeedConfig` throws before publication | Exit non-zero; `test ! -e dest` passes; any `dest.tmp-emulate-*` is removed; the corrected identical command then succeeds. |
| D5 | `--portless --secrets-out dest` with the proxy stopped, so `ensurePortless` exits at `portless.ts:56-58` | The `process.on("exit")` unwind removes `dest`; exit non-zero; after `portless proxy start`, the identical command succeeds. |
| D6 | Make `portless alias` fail for the second of two services (e.g. stub `portless` on PATH that fails on the second alias) | `registerAliases`' internal rollback removes the first alias, the unwind removes `dest`; `portless list` clean; identical retry with a working proxy succeeds. |
| D7 | Two services with `nc -l 4001` occupying the second port | First listener closed, stores reset, aliases removed, `dest` unlinked; `lsof -i :4000` empty after exit; freeing the port makes the identical command succeed. |
| D8 | SIGKILL during the temp write, and again between publish and banner | First kill: residual matches only `dest.tmp-emulate-<pid>-*`, `test ! -e dest` passes. Second kill: `dest` exists and is complete (hard-link publish is atomic; no partial final artifact is ever observable), contains `invocation.pid` for recognition; recovery is the documented inspect-and-delete, touching no other files. |
| D9 | `npx emulate start -s github --seed seed.yaml` (no flag) with a keyless app | Unchanged current behavior: `seedFromConfig` throws `GitHub App "x" requires private_key when seedFromConfig is called directly; use createEmulator to generate one` (`github/src/index.ts:210-214`); non-zero exit; no durable secret output anywhere. |
| D10 | Seed selecting `vercel,github` where GitHub has one app with explicit `private_key` and one without | Artifact lists exactly one secret (the generated one); the explicit key is absent from the file; ordering follows the `services` array then config order, stable across runs. |
| D11 | Run on `win32`, or with destination on an SMB/NFS mount (statfs magic outside the allowlist) | Exit non-zero before any write, diagnostic names the unsupported platform or filesystem and contains no secret; `test ! -e dest` passes. |
| D12 | `--secrets-out dest -s vercel` (no `prepareSeed`, zero secrets) | `dest` exists with `{"schemaVersion":1,...,"secrets":[]}`, mode and ACL verification identical to D1, and D3 through D8 lifecycle behavior is unchanged. |

Shape B differs only in D1/D12 observables (artifact at `<dest>/secrets.json` inside a `0700` container) and D8 (residual is a directory; a `*.partial`-only container is recognizably incomplete).

## Costs and what each shape makes worse

- **A**: `startCommand` gains a second, reordered path, increasing divergence risk with the legacy path (mitigated by the flag gate but still a maintenance cost). Verification spawns platform binaries (`/bin/chmod`, `/bin/ls -e`, `getfacl`), so a Linux host without the `acl` package fails closed even when no ACL mechanism is in play, which is deliberate under R3 but is real user friction. The statfs magic allowlist will reject some legitimate exotic local filesystems until extended. Under the flag, all services load before the Portless check, so a missing proxy is reported slightly later than today.
- **B**: Everything in A's list, plus the artifact is a directory, which breaks single-file consumers (`cat`, Docker/Kubernetes file-secret mounts, `--from-file` style flags), owns two inodes against a contract worded for one, and has a heavier recovery story (recursive removal instead of a single unlink).

## Rejected alternatives

- **Mode bits only (0600 + umask)**: directly falsified by E3/D2; an inherited macOS ACL survives mode bits.
- **Publish after startup completes**: violates R1/E7; the artifact must precede reachability.
- **Overwrite or truncate an existing destination**: violates R5/E6 and the temporal contract's preservation clause.
- **Reclaim a stranded destination on retry via a sidecar journal**: requires deleting a path the current invocation did not create, colliding with R5 and R9's prohibition on deleting user files on mistaken identity; the in-process unwind plus exit hook makes it unnecessary for every non-SIGKILL failure.
- **Deliver via caller-supplied file descriptor (`--secrets-fd 3`)**: the CLI can no longer establish or verify confidentiality or atomicity of the durable artifact, failing R2/R3/R9's verification obligations; durability becomes the caller's unverifiable promise.
- **Encrypt the artifact at rest**: moves the problem to key delivery for the decryption key, which itself needs the same durable confidential channel; adds no effective protection over verified owner-only access.
- **`fs.chmod`-based ACL handling from Node alone**: Node's stdlib cannot read or strip macOS ACLs or Linux extended ACLs, so verification without spawning platform tools is not possible; silently skipping verification would fail R2.

## Recommended survivor

**A** (verified single-file artifact with exit-hook transaction). It passes all twelve requirements including the extracted R11, keeps the artifact a single file at the exact caller-requested pathname as the temporal contract words it, and its only structural risk (the reordered flag path in `startCommand`) is bounded by the opt-in gate that leaves the legacy path untouched, which is what R7 and D9 demand.

## Proposal B, verbatim proposal body

# Shaping Artifact: CLI Generated-Secret Materialization and Transactional Lifecycle

## Frame

### Problem

The CLI needs an explicit way to materialize service-generated secrets into a durable artifact before a server becomes reachable. Two externally reported failures constrain the solution:

1. A file whose POSIX mode reports `0600` can still be readable by another principal on macOS when an inherited ACL grants access.
2. A startup can publish the requested artifact and then fail during later setup. The published destination remains, and the next identical invocation fails because the destination already exists.

### Outcome

When durable generated-secret delivery is requested, successful startup exposes exactly one complete artifact that is effectively unreadable by non-owner principals on every supported filesystem. Failed startup leaves no invocation-owned final artifact or other state that blocks an immediate identical retry.

Without a delivery request, existing CLI behavior remains unchanged.

---

## Requirements (R)

| Req | Requirement | Status |
|---|---|---|
| R0 | A requested durable artifact contains exactly the generated secrets required to use the prepared emulator configuration. | Core goal |
| R1 | At successful startup, the final artifact is complete before any listener, alias, Portless action, or banner becomes externally visible. | Must-have |
| R2 | The final artifact is effectively unreadable by non-owner principals on every filesystem and operating system where the feature is supported. Mode bits alone cannot satisfy this requirement when another access-control mechanism exists. | Must-have |
| R3 | If effective owner-only access cannot be established and verified, startup fails before any generated secret is published at the final path. | Must-have |
| R4 | Any failure after publication removes only the artifact owned by that invocation and leaves the same command immediately retryable without manual repair. | Must-have |
| R5 | A pre-existing destination or destination that changes identity is preserved and causes a safe failure. | Must-have |
| R6 | Explicitly supplied secrets are never exported. Generated secrets never enter stdout, stderr, banner, or HTTP. | Must-have |
| R7 | Without the opt-in delivery request, existing missing-secret errors, service selection, ports, base URLs, Portless behavior, banner, shutdown, and config discovery remain unchanged. | Must-have |
| R8 | Programmatic `createEmulator.generatedSecrets`, reset stability, and non-GitHub services remain unchanged. | Must-have |
| R9 | Crash residuals must not be mistaken for successful final publication or cause deletion of unrelated user files. Any unavoidable crash residual has a bounded, recognizable ownership rule and recovery story. | Must-have |
| R10 | The design must work with multiple selected services and with an empty generated-secret set. | Must-have |

---

## Shapes

### Shape A: Sibling Inode-Tracked Staging with Native Darwin ACL Stripping and LIFO Transaction Rollback Stack

Shape A creates a sibling temporary file in the target directory, applies OS-specific ACL stripping (`/bin/chmod -N` on Darwin), verifies owner-only mode and ACL absence, atomically renames to the destination, captures the resulting `(dev, ino)` identity, and executes subsequent startup steps (Portless, alias registration, server listeners) inside a LIFO transactional rollback boundary that unlinks only the exact matching inode upon failure.

#### Parts (Shape A)

| Part | Mechanism | Flag |
|---|---|:---:|
| **A1** | **CLI Option and Seed Secret Materialization Pipeline**<br>Add `--output-secrets <path>` option to `packages/emulate/src/index.ts` and `StartOptions` in `packages/emulate/src/commands/start.ts`. During service loading in `startCommand`, invoke `loadedSvc.prepareSeed(svcSeedConfig)` for each selected service to collect `generatedSecrets` across services in deterministic order. Exclude explicit seed secrets and keep payload in memory. | |
| **A2** | **Platform Confidentiality Probe and Sibling ACL Sanitizer**<br>Detect OS and filesystem capability. On Windows or unverified filesystems, fail closed with a descriptive non-secret error. For POSIX, open `${destination}.tmp.${process.pid}.${randomHex}` with `O_CREAT \| O_EXCL \| O_WRONLY` and mode `0600`. On macOS (`process.platform === "darwin"`), execute `/bin/chmod -N <tempPath>` to strip parent-inherited ACLs. Serialize `{ version: 1, generatedSecrets }`, write to the file descriptor, call `fs.fsyncSync(fd)`, and close. Run `fs.statSync(tempPath)` to verify `0600` mode and clean ACL status before any rename. | |
| **A3** | **Pre-flight Destination Check and Atomic Inode Binding**<br>Perform `fs.lstatSync(destination)`. If the path exists (regular file, directory, symlink, or socket), abort immediately with a non-zero exit and leave the target untouched. Atomically move the verified temp file to destination via `fs.renameSync`. Immediately capture `stat = fs.statSync(destination)` and register a transaction token `{ path: destination, dev: stat.dev, ino: stat.ino }`. | |
| **A4** | **LIFO Startup Transaction Coordinator**<br>Wrap subsequent startup stages (`ensurePortless()`, `registerAliases()`, store seeding, and `serve()` HTTP listener binding) in a transactional scope. Register rollback actions: drain and close active HTTP servers, unregister Portless aliases, reset in-memory stores, and inspect `destination`: if and only if `fs.statSync(destination)` matches recorded `(dev, ino)`, unlink the file. | |
| **A5** | **Signal Interception and Crash Quarantine**<br>Attach one-time signal and unhandled rejection listeners during startup to trigger the rollback stack before process termination. Upon successful listener binding and banner display, mark transaction status as committed and detach startup rollback hooks so normal shutdown retains the durable file. | |

---

### Shape B: Ephemeral Lockbox Directory with Staged Relocation and Lease Coordinator

Shape B creates a dedicated ephemeral staging directory (`${dirname(destination)}/.emulate-stage.${pid}.${randomHex}`) with mode `0700`, strips inherited ACLs on the container directory itself, writes the secret artifact with mode `0600` inside the lockbox, moves the file into destination path after pre-flight validation, and tracks an active lease token that unwinds listeners, aliases, and the created destination inode if startup aborts.

#### Parts (Shape B)

| Part | Mechanism | Flag |
|---|---|:---:|
| **B1** | **CLI Option and Multi-Service Secret Extraction**<br>Add `--output-secrets <path>` to CLI and collect generated secrets across all services in `packages/emulate/src/commands/start.ts` via `loadedSvc.prepareSeed`. | |
| **B2** | **Isolated Staging Lockbox and ACL Neutralization**<br>Create directory `${dirname(destination)}/.emulate-stage.${process.pid}.${randomHex}` with mode `0700`. Execute `/bin/chmod -N` on the staging directory on macOS to prevent parent ACL propagation to child files. Fail closed on Windows or unverified filesystems. Write secret payload to `${lockbox}/secrets.json` with mode `0600` and `fsync`. Verify mode bits on both directory and file. | |
| **B3** | **Atomic Relocation and Destination Lease Registration**<br>Check destination non-existence via `lstatSync`. Atomically rename `${lockbox}/secrets.json` to `destination`, remove the empty lockbox folder, and obtain `(dev, ino)` into an active lease token. | |
| **B4** | **Lease-Guarded Resource Rollback Coordinator**<br>Execute Portless setup, alias registration, and HTTP listener binding under lease coordination. On any error, unwind in reverse order: close HTTP servers, remove aliases, verify destination `(dev, ino)` match before unlinking, and delete lingering staging directory. | |
| **B5** | **Lease Retirement at Steady State**<br>Upon successful initialization of all services and banner output, mark lease as completed. Subsequent SIGINT/SIGTERM handles server shutdown while preserving the generated secret file on disk. | |

---

### Shape C: Subprocess-Supervised Custodian with IPC Pipe Watchdog

Shape C delegates secret file creation, permission enforcement, and lifecycle rollback to an isolated supervisor child process that holds an open handle and an IPC pipe. If the parent CLI encounters an error, crashes, or terminates before sending a ready commit message over the pipe, the supervisor unlinks the destination file and exits.

#### Parts (Shape C)

| Part | Mechanism | Flag |
|---|---|:---:|
| **C1** | **CLI Parameter and Secret Generation in Parent**<br>Collect generated secrets in `startCommand` via `loadedSvc.prepareSeed`. | |
| **C2** | **Supervisor Process Spawn and IPC Handshake**<br>Spawn a Node.js custodian worker process with an inherited IPC channel, passing the secret payload and destination path over stdin/IPC. | ⚠️ |
| **C3** | **Supervisor File Creation and ACL Sanitization**<br>Custodian creates destination with `O_CREAT \| O_EXCL \| O_WRONLY`, mode `0600`, strips Darwin ACLs, and writes payload. | |
| **C4** | **IPC Watchdog and Abort Cleanup**<br>Custodian holds an open file descriptor and waits for a `COMMIT` message. If the IPC pipe breaks (parent crash, exception, or SIGKILL), custodian unlinks destination and exits. | ⚠️ |
| **C5** | **Parent Commit Signal and Custodian Detach**<br>Parent proceeds with Portless, aliases, and listeners. On success, sends `COMMIT` and custodian closes descriptor and exits. | |

---

## Fit Check (Decision Matrix)

| Req | Requirement | Status | Shape A | Shape B | Shape C |
|---|---|---|:---:|:---:|:---:|
| R0 | A requested durable artifact contains exactly the generated secrets required to use the prepared emulator configuration. | Core goal | PASS | PASS | PASS |
| R1 | At successful startup, the final artifact is complete before any listener, alias, Portless action, or banner becomes externally visible. | Must-have | PASS | PASS | PASS |
| R2 | The final artifact is effectively unreadable by non-owner principals on every filesystem and operating system where the feature is supported. Mode bits alone cannot satisfy this requirement when another access-control mechanism exists. | Must-have | PASS | PASS | PASS |
| R3 | If effective owner-only access cannot be established and verified, startup fails before any generated secret is published at the final path. | Must-have | PASS | PASS | PASS |
| R4 | Any failure after publication removes only the artifact owned by that invocation and leaves the same command immediately retryable without manual repair. | Must-have | PASS | PASS | PASS |
| R5 | A pre-existing destination or destination that changes identity is preserved and causes a safe failure. | Must-have | PASS | PASS | PASS |
| R6 | Explicitly supplied secrets are never exported. Generated secrets never enter stdout, stderr, banner, or HTTP. | Must-have | PASS | PASS | PASS |
| R7 | Without the opt-in delivery request, existing missing-secret errors, service selection, ports, base URLs, Portless behavior, banner, shutdown, and config discovery remain unchanged. | Must-have | PASS | PASS | PASS |
| R8 | Programmatic `createEmulator.generatedSecrets`, reset stability, and non-GitHub services remain unchanged. | Must-have | PASS | PASS | PASS |
| R9 | Crash residuals must not be mistaken for successful final publication or cause deletion of unrelated user files. Any unavoidable crash residual has a bounded, recognizable ownership rule and recovery story. | Must-have | PASS | PASS | FAIL |
| R10 | The design must work with multiple selected services and with an empty generated-secret set. | Must-have | PASS | PASS | PASS |

### Notes on Fit Check Failures

- **Shape C fails R9**: Spawning a detached supervisor process introduces unpredictable residual states. If the supervisor process itself is terminated (e.g. killed by the operating system OOM killer or external signal) or if IPC synchronization hangs during parent startup, orphaned supervisor processes or unmanaged locks remain without a bounded deterministic recovery rule. Furthermore, parts C2 and C4 contain unverified IPC handshake complexity across platforms (flagged ⚠️).

---

## Predictions and Discriminator Matrix

| Cell | Setup | Required Observation | Shape A Prediction | Shape B Prediction |
|---|---|---|---|---|
| **D1** | Fresh parent with no ACL; valid generated secret; successful startup | Complete schema-versioned artifact exists before reachability and is usable. | **Pass**: Mode `0600` file containing versioned JSON with generated keys created before listeners start. | **Pass**: Staged via lockbox and moved to destination before listeners start. |
| **D2** | macOS parent grants inherited read access to `everyone` | Either the final artifact has no effective non-owner read access, or startup fails closed before final publication. A `0600` stat alone is not a pass. | **Pass**: `/bin/chmod -N` strips inherited ACL on temp file before rename. `ls -le` confirms no ACL entries. | **Pass**: Lockbox directory stripped of ACLs; file created without inherited ACLs. |
| **D3** | Destination already exists as a regular file, symlink, directory, or competing writer path | Existing object is unchanged; no listener or alias appears; no secret leaks. | **Pass**: `lstatSync` aborts before temp file write or rename; existing file/symlink untouched. | **Pass**: `lstatSync` aborts before lockbox creation or rename. |
| **D4** | Force a failure before final publication | No final artifact; no secret leak; immediate identical retry can succeed. | **Pass**: Temp file deleted on catch; destination untouched; retry succeeds. | **Pass**: Lockbox directory cleaned up; destination untouched; retry succeeds. |
| **D5** | Force a failure after final publication but before Portless completion | Invocation-owned artifact and setup state are rolled back; immediate identical retry can succeed. | **Pass**: Rollback checks `(dev, ino)` match, unlinks destination; retry succeeds without collision. | **Pass**: Lease rollback unlinks destination matching `(dev, ino)`. |
| **D6** | Force a failure after alias registration | Invocation-owned artifact and aliases are rolled back; immediate identical retry can succeed. | **Pass**: `removeAliases()` executed, destination unlinked; retry succeeds. | **Pass**: Aliases removed and destination unlinked. |
| **D7** | Force a failure after one listener starts while another service fails | All listeners, stores, aliases, and invocation-owned artifact are cleaned up; immediate identical retry can succeed. | **Pass**: Active HTTP server closed, stores reset, aliases removed, destination unlinked. | **Pass**: HTTP servers closed, stores reset, aliases cleared, destination unlinked. |
| **D8** | Terminate or crash during temporary write and during post-publication window | No partial final artifact. Residual temporary or final names follow a bounded ownership and recovery rule without deleting unrelated files. | **Pass**: Partial writes remain only as `.tmp.<pid>.<hex>` sibling files. Post-publication signals unlink matching inode. | **Pass**: Partial writes confined to `.emulate-stage.<pid>.<hex>` directory. |
| **D9** | Run without the delivery request and a GitHub App missing an explicit key | Existing documented failure and absence of durable secret output remain unchanged. | **Pass**: When `--output-secrets` is omitted, standard startup error or memory behavior is preserved. | **Pass**: Identical standard behavior preserved. |
| **D10** | Run with explicit keys and generated keys across multiple services | Only generated values are exported, in stable service order. | **Pass**: Only generated private keys appear in output; explicit secrets excluded; deterministic ordering. | **Pass**: Exact same payload generated. |
| **D11** | Run on Windows or a filesystem whose confidentiality semantics cannot be verified | Feature fails closed with a non-secret diagnostic before final publication. | **Pass**: Platform check detects Windows or unverified filesystem and aborts before creating output. | **Pass**: Fails closed before lockbox creation. |
| **D12** | Requested delivery produces zero generated secrets | A complete empty artifact is published and lifecycle guarantees remain identical. | **Pass**: Emits `{ "version": 1, "generatedSecrets": [] }` with mode `0600` and identical rollback safety. | **Pass**: Same empty payload published. |

---

## Costs, Trade-offs, and What Each Shape Makes Worse

### Shape A
- **What it adds**: Requires executing `/bin/chmod -N` on Darwin systems via synchronous process spawn, adding a minor one-time sub-millisecond overhead during startup when secret delivery is enabled.
- **What it makes worse**: Sibling temporary files (`.tmp.<pid>.<hex>`) exist momentarily in the destination directory prior to atomic rename. If process is hard-killed with `SIGKILL` mid-write, a zero-byte or partial `.tmp` residual remains in the caller's target folder (though it never interferes with destination or subsequent retries).
- **Implementation cost**: Low. Confined to `packages/emulate/src/commands/start.ts` and `packages/emulate/src/index.ts`. Reuses existing Node.js `fs` constants and `stat` primitives.

### Shape B
- **What it adds**: Creates and removes an auxiliary staging folder (`.emulate-stage.<pid>.<hex>`) for every secret materialization.
- **What it makes worse**: Involves multi-step filesystem directory management (directory creation, ACL stripping on directory, file creation, file relocation, directory removal). If a failure occurs during directory removal, orphaned empty hidden folders can accumulate.
- **Implementation cost**: Medium. Requires managing directory lifecycle and recursive cleanup paths.

### Shape C
- **What it adds**: Introduces a dedicated background supervisor process with IPC pipe protocol.
- **What it makes worse**: Substantial increase in startup latency due to child process spawning; high architectural complexity; risk of zombie supervisor processes or deadlocked IPC pipes under unexpected OS termination.
- **Implementation cost**: High. Requires multi-process coordination, IPC error handling, and cross-platform process management.

---

## Rejected Alternatives

1. **POSIX Mode Bits Only (`chmod 0600`) without ACL Sanitization**:
   - *Reason for rejection*: Violates R2 and fails discriminator D2. On macOS and filesystems with inherited ACLs, parent ACLs (such as `everyone allow read`) attach to the child regardless of `0600` mode bits, allowing unauthorized local principals to read generated secrets.
2. **Publishing Destination at the End of Startup (After Server Listen)**:
   - *Reason for rejection*: Violates R1 and E7. If listeners or aliases become reachable before the generated secret file exists, client applications listening on webhook ports or querying API endpoints receive connection opportunities before credentials can be loaded, creating race conditions.
3. **Overwriting Existing Destination Paths (`fs.writeFileSync` directly to destination)**:
   - *Reason for rejection*: Violates R5 and E6. Overwriting destroys pre-existing user files without consent and allows symlink redirection attacks.
4. **Non-Transactional Unlinking on Error without Inode Verification**:
   - *Reason for rejection*: Violates R4 and R5. If a command fails and blindly calls `fs.unlinkSync(destination)` by name, it risks deleting a pre-existing file or a file created concurrently by another process. Inode verification (`dev` and `ino` matching) is mandatory.

---

## Recommended Survivor

### **Survivor: Shape A (Sibling Inode-Tracked Staging with Native Darwin ACL Stripping and LIFO Transaction Rollback Stack)**

**Justification**:
- Shape A completely satisfies all requirements (R0 through R10) and passes all discriminator cells (D1 through D12) without introducing unverified mechanisms or flagged unknowns.
- It directly addresses the macOS inherited ACL flaw (E3, R2) by executing `/bin/chmod -N` on the staging file prior to publication, guaranteeing effective owner-only access.
- It completely solves the stranded-destination failure mode (E4, R4, R5) through an in-memory LIFO rollback stack that verifies inode identity `(dev, ino)` before unlinking, ensuring failed startups leave the system in a clean, immediately retryable state without risking user data.
- It avoids unnecessary multi-process supervisor overhead (Shape C) and redundant directory lifecycle complexity (Shape B), providing a clean, robust, and maintainable solution.
