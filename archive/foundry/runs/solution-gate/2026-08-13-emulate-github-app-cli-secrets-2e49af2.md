# Solution gate: emulate CLI generated-secret delivery

- Date: 2026-08-13.
- Target: `vercel-labs/emulate` at `2e49af2e91eae4377dbb3610b8bd2b0ac826daec`.
- Tracker: `vercel-labs/emulate#203`, slice 2.
- Proposers: `anthropic/claude-fable-5-thinking-high` and `google/gemini-3.1-pro`, blind to each other in isolated detached worktrees.
- Synthesizer and future implementer: Codex root runtime, which proposed neither candidate.
- Proposals verbatim: `2026-08-13-emulate-github-app-cli-secrets-2e49af2-proposals.md`.
- Drawing: `2026-08-13-emulate-github-app-cli-secrets-2e49af2.html`.

## 0. Trigger

Fires. The slice adds a persistent secret artifact and changes the contract between CLI seed preparation, filesystem publication, Portless setup, and server startup. Plausible shapes differ in whether materialization is implicit, whether publication is atomic, and which component owns failure ordering.

## 1. Neutral contract

**Property violated.** When the CLI materializes service-owned generated secrets from seed configuration, it must own their safe delivery so that a server never becomes reachable unless any requested durable secret artifact has been created confidentially and completely. A default invocation must neither disclose nor persist generated secrets.

**Observable that must change.** With a GitHub App seed that omits `private_key`, a requested durable delivery produces a machine-readable, versioned artifact containing exactly the generated secrets before the banner is printed or any port accepts connections. The artifact has owner-only permissions. If its destination exists, is invalid, or cannot be written safely, the command exits nonzero with no server listening and no secret printed. Without a delivery request, no artifact is created and no private key appears on stdout or stderr.

**Must not change.**

- Explicitly supplied `private_key` values are never exported.
- `createEmulator.generatedSecrets` remains unchanged.
- Generated keys remain stable across `reset()`.
- Current service selection, port allocation, base URL, Portless registration, banner, shutdown, config discovery, parsing, and existing errors continue working.
- No HTTP endpoint exposes private keys.
- Non-GitHub services and seeds that generate no secrets continue working.

The brief named no solution.

## 2. Observed subsystem facts

1. CLI `startCommand` currently passes raw service config directly to `seedFromConfig`; a GitHub App missing `private_key` exits with an error before `serve()`.
2. That failure is documented in `skills/github/SKILL.md` and `apps/web/app/docs/github/page.mdx`.
3. `createEmulator` already calls the generic optional `prepareSeed` hook, and the GitHub registry entry maps only generated private keys into secret descriptors.
4. In `startCommand`, `ensurePortless()` currently runs before service modules are loaded and before any hypothetical seed preparation. It can prompt to install Portless or require a running proxy.
5. `registerAliases()` runs before stores and HTTP servers are created. `serve()` runs once per prepared service, followed by the banner.
6. Node on this machine exposes `O_EXCL` and `COPYFILE_EXCL`, but not `O_TMPFILE`.
7. Direct `wx` creation with mode 0600 rejects an existing symlink and preserves its target.
8. A direct `wx` destination becomes visible with partial JSON while the writer is still running.
9. A same-directory 0600 temporary file can be fully written and fsynced, then published with `linkSync(temp, destination)`; the destination remains absent until complete, and linking over an existing destination fails with `EEXIST`.
10. Directory fsync succeeds on the active macOS filesystem.
11. With process umask 0777, opening with mode 0600 produced mode 000. An explicit `fchmod(0600)` restored the required owner permissions.

## 3. Forward chains

### Proposal A: prepare in CLI and write the destination directly

- Explicit flag requests delivery (`observed`: proposed shape).
- CLI calls `prepareSeed` for each service (`inferred`: existing hook supports it).
- Materialized config lets GitHub seeding succeed (`inferred`: existing programmatic path proves compatibility).
- Direct `O_EXCL` destination is created before its payload is complete (`observed`: partial-file probe).
- Harmful branch: process crash or write failure leaves a final-path artifact with partial secret JSON (`inferred` from the observed visibility).
- Harmful branch: preparation without the flag changes the current documented missing-key failure into a successful but unrecoverable server (`observed` current error plus proposal wording).
- Harmful branch: `ensurePortless` remains earlier unless deliberately moved, so delivery failure can occur after external Portless setup (`inferred` from current ordering).

### Proposal B: unconditional preparation and `writeFileSync(..., { flag: "wx" })`

- Every CLI start materializes missing keys (`observed`: proposed shape).
- Default keyless GitHub CLI invocation starts instead of returning the documented error (`observed`: current built CLI returns the error).
- Without an output flag, generated material exists only in memory and cannot be recovered (`inferred`).
- `writeFileSync` uses exclusive creation and protects existing destinations (`observed`: filesystem probe).
- Harmful branch: destination is visible while incomplete because exclusivity is not atomic publication (`observed`: partial-file probe).
- Harmful branch: mode 0600 can be masked to 000 and make the requested artifact unreadable to its owner (`observed`: umask probe).

### Synthesized shape: opt-in prepare and transactional publication

- `--generated-secrets-file <path>` explicitly opts into both materialization and delivery (`inferred`: chosen contract).
- Without the flag, the CLI does not call `prepareSeed`, preserving current errors and behavior (`inferred`, directly testable).
- With the flag, destination and platform preflight run before key generation (`inferred`).
- All selected services are loaded and prepared, and generated descriptors are collected (`inferred`).
- A versioned JSON payload is built fully in memory (`inferred`).
- A same-directory random temporary file is opened exclusively, explicitly chmodded to 0600, written, fsynced, and closed (`observed primitives; composition inferred`).
- An exclusive hard link publishes the completed inode at the requested path, the temporary name is removed, and the parent directory is fsynced (`observed primitives; composition inferred`).
- Only after successful publication may `ensurePortless`, alias registration, server construction, `serve()`, and the banner run (`inferred`, directly testable).
- Harmful branch: a process crash before cleanup may leave a hidden owner-only temporary artifact (`inferred`). The implementation must use a unique recognizable prefix, clean it in every handled failure, and record crash leftovers as an accepted residual rather than deleting unrelated files.
- Helpful branch: an empty generated-secret set still produces a valid empty artifact when delivery was explicitly requested (`inferred`), which keeps multi-service automation deterministic.

## 4. Probe log

### P1. What does the current CLI do without a private key?

Command:

```text
node packages/emulate/dist/index.js start --service github --seed <keyless-seed> --port 45991
```

Observed:

```text
Error: GitHub App "probe-app" requires private_key when seedFromConfig is called directly; use createEmulator to generate one
EXIT=1
curl: connection refused
```

Result: refutes both proposals where they prepare unconditionally. The default must remain unchanged and the new behavior must be gated by the delivery flag.

### P2. Does `wx` protect existing paths and symlinks?

Command: Node probe using `writeFileSync(path, data, { flag: "wx", mode: 0o600 })` against a fresh path and a symlink.

Observed:

```text
directMode 600
symlink EEXIST
targetContent keep
```

Result: survives. Exclusive creation is a valid no-overwrite primitive, but does not prove atomic completeness.

### P3. Is direct exclusive creation atomically complete?

Command: child process opens the final path with `wx`, writes half the JSON, waits 500 ms, then finishes while the parent polls the path.

Observed:

```json
{"ms":26,"size":30,"content":"{\"schemaVersion\":1,\"secrets\":["}
```

The partial content remained visible until completion.

Result: refutes direct final-path writing in both proposals. Exclusivity and atomic publication are different properties.

### P4. Can a completed temporary inode be published without overwrite?

Command: create a same-directory temporary file with mode 0600, write and fsync it, call `linkSync(temp, destination)`, then unlink the temporary name.

Observed:

```text
destSeenBeforeComplete false
final {"schemaVersion":1,"secrets":[]} 600
linkExisting EEXIST
existingContent old
```

Result: survives on the active filesystem. The final pathname is absent until the completed inode is linked, and an existing destination is preserved.

### P5. Does mode 0600 alone guarantee an owner-readable file?

Command: set `process.umask(0o777)`, open a new file with mode 0600, inspect mode, then call `chmod(0600)`.

Observed:

```text
before 0
after 600
```

Result: refutes relying only on the creation mode. The writer must explicitly set permissions on the open temporary file before publication.

### P6. Can the parent directory be fsynced?

Command: open the generated directory read-only and call `fsyncSync`.

Observed:

```text
DIR_FSYNC_OK
```

Result: survives on the active macOS filesystem. Other platforms remain an implementation assumption.

### P7. Is Portless setup already after preparation?

Command:

```text
nl -ba packages/emulate/src/commands/start.ts | sed -n '79,194p'
```

Observed: `ensurePortless()` is at lines 117 to 119; service loading starts at line 133; alias registration is at 155; `serve()` is at 190.

Result: refutes the assumption that inserting a writer before `serve()` is enough. Preparation and publication must also move before `ensurePortless()`.

### P8. Are explicit keys already excluded from generated descriptors?

Command: inspect `materializeGitHubSeedConfig` and `registry.ts`.

Observed: an app with `private_key !== undefined` is copied and skipped by `generatedPrivateKeys`; only `generatedPrivateKeys` becomes `generatedSecrets`.

Result: survives. Reusing `prepareSeed` preserves the no-explicit-key-export property.

## 5. Failure-shape scoring

### Proposal A

| Shape | Verdict |
|---|---|
| S1 over-reach | **Hit.** Its stated prepare path changes the existing default missing-key error. Designed out by preparing only with the explicit flag. |
| S2 under-reach | **Hit.** It checks existing destinations and permissions but not partial final-path visibility, Portless ordering, umask 0777, or crash leftovers. |
| S3 direction inheritance | Miss after both disclosure and availability are checked. |
| S4 proxy property | **Hit.** `O_EXCL` proves no overwrite, not atomic completeness. |
| S5 unregistered peer | **Hit.** A crash can leave a partial final artifact or an unmanaged temporary file. Designed down with transactional publication, handled-failure cleanup, and a recognizable private temporary name. |
| S6 peer-version blindness | Not applicable. No cross-version process protocol. |
| S7 wrong layer | **Hit unless reordered.** `ensurePortless` currently precedes preparation. Designed out by making publication the last preflight before all external infrastructure. |
| S8 guard-derived cells | Potential hit. Test cells must come from filesystem and CLI domains, including symlinks, directories, missing parents, restrictive umask, empty secret sets, multiple services, and Portless. |
| S9 test pins wrong thing | Potential hit. Deleting exclusive publication, chmod, or the pre-Portless ordering must fail distinct tests. |
| S10 claim from prose | **Hit on Windows permissions.** The proposal admits 0600 is not portable; the implementation must fail closed where it cannot verify owner-only access. |

### Proposal B

| Shape | Verdict |
|---|---|
| S1 over-reach | **Hit.** Unconditional preparation changes a documented default error. |
| S2 under-reach | **Hit.** `writeFileSync` with `wx` covers overwrite only, not complete publication, restrictive umask, or Portless ordering. |
| S3 direction inheritance | Miss after both leakage and recoverability are tested. |
| S4 proxy property | **Hit.** File existence and mode do not prove complete JSON at first visibility. |
| S5 unregistered peer | **Hit.** Direct final-path writes leave partial state on crash. |
| S6 peer-version blindness | Not applicable. |
| S7 wrong layer | **Hit unless reordered before `ensurePortless`.** |
| S8 guard-derived cells | Potential hit for the same omitted filesystem classes. |
| S9 test pins wrong thing | Potential hit. A green happy-path artifact test does not prove no partial publication. |
| S10 claim from prose | **Hit.** `mode: 0o600` alone was falsified under umask 0777. |

## 6. Synthesis

**Kind: neither proposal whole; a graft of their common CLI preparation shape with a stricter activation and publication contract.**

Chosen shape:

1. Add only `--generated-secrets-file <path>` to `start`.
2. Without the flag, do not call `prepareSeed`; preserve the current CLI requirement and current errors exactly.
3. With the flag, validate the platform and destination before generating keys. Fail closed where owner-only permissions cannot be verified.
4. Load and prepare every selected service before any Portless operation, alias registration, store creation, socket binding, or banner output.
5. Seed from each prepared config and collect only `prepareSeed.generatedSecrets`, tagged with service.
6. Serialize exactly:

```json
{
  "schemaVersion": 1,
  "generatedSecrets": []
}
```

No timestamp enters the stable artifact contract.
7. Publish through a same-directory uniquely named temporary file: exclusive open, explicit 0600 permissions, complete write, fsync, close, exclusive hard link to the requested destination, unlink temporary name, and fsync parent directory.
8. On every handled error, close descriptors, remove only the exact temporary path created by this invocation, print no secret material, and exit before infrastructure starts.
9. Refuse every existing destination. Do not add overwrite behavior in this slice.
10. Do not change the banner or print a secret count. The caller already supplied the output path.
11. An explicit-key-only or non-generating seed writes a valid empty artifact when the flag is requested.

What Proposal A had that was better: it named fsync and the full documentation surface. Its direct-final-path write and implicit default behavior were rejected.

What Proposal B had that was better: it used the existing simple `wx` Node API and kept the artifact schema small. Its unconditional preparation and direct write were rejected.

## 7. Carried assumptions for implementation

1. Same-directory hard-link publication is supported on every platform accepted by the flag. Otherwise the flag fails closed before generating keys.
2. Owner-only permission verification can be expressed as an exact post-`fchmod` mode check on supported platforms.
3. The generated-secret payload remains small enough to build fully in memory.
4. `prepareSeed` has no external side effects beyond CPU and memory, so it is safe before Portless and server startup.
5. An empty artifact is useful and less surprising than failing when the selected services generated nothing.
6. A crash may leave a hidden owner-only temporary file. The implementation does not sweep arbitrary stale files; normal errors remove the exact path they created.

Each assumption becomes a verification target in the implementation trail and Review Gate.

## 8. Must-not-change handoff to Review Gate

- Without the flag, keyless GitHub CLI seed files still fail with the existing guidance and no file.
- Explicit keys still authenticate and never appear in the artifact.
- `createEmulator.generatedSecrets` and reset identity remain unchanged.
- Invalid, empty, and duplicate App configurations still fail before a listener exists.
- Existing destination files, directories, and symlinks remain untouched.
- Missing or unwritable parents fail without a listener, alias, banner, or secret output.
- Service order, port allocation, base URL, config discovery, parsing, tokens, banner, shutdown, and non-GitHub behavior remain unchanged.
- No HTTP response or default stdout or stderr contains a private key.
- With the flag, the final destination is never observable as partial JSON.
- Portless installation checks and alias registration do not run when secret delivery fails.

## 9. Issue candidates

- Portable owner-only secret-file delivery on Windows needs an ACL-backed design. Best-effort mode bits do not satisfy this slice's contract.
- Crash-leftover cleanup for hidden temporary secret files needs a separate lifecycle policy if real-world evidence shows accumulation.

## 10. Decision-trail self-audit

Gemini 3.1 Pro audited the five implementation decisions appended to `.decisions.tsv` and flagged three rows for deliberate verification:

1. Moving delivery before `ensurePortless()` inverts the current boot order. Plugin loading and key generation will now precede Portless validation and prompts. This is required by the no-external-effects-on-delivery-failure contract, but tests must prove ordinary Portless behavior remains intact after successful delivery.
2. Exclusive hard links and parent-directory fsync are not universally available. The implementation must detect unsupported filesystems and fail before key generation, rather than silently falling back to direct final-path writes.
3. Failing closed on unverifiable owner-only permissions makes the flag unavailable on Windows. This is an accepted limitation for this slice, not cross-platform support.
