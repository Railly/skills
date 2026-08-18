# Solution Gate: emulate PR #204 secrets correction

- Date: 2026-08-18
- Repository: `vercel-labs/emulate`
- Mode: candidate audit
- Trigger: fixes findings from a previous review round, changes confidentiality and startup lifecycle contracts, and admits multiple solution shapes
- Candidate PR: `#204 feat(cli): deliver generated secrets securely`
- Candidate commit: `e1edd0ceafcdaf6392844d63a108b57351446fc6`
- Candidate base: `c39777943ec879dc75102d3cd741d8c961d61b06`
- Candidate state at verification: open, review required, merge blocked
- Frozen packet: `2026-08-18-emulate-204-secrets-correction-packet.md`
- Verbatim blind proposals: `2026-08-18-emulate-204-secrets-correction-proposals.md`
- Proposer A: Claude Fable 5, isolated snapshot `/tmp/emulate-204-sg-claude.mrCYAH`
- Proposer B: Gemini 3.7 Flash, isolated snapshot `/tmp/emulate-204-sg-gemini.sn692G`
- Synthesizer and future implementer: Codex root runtime, which proposed neither blind shape
- Verdict: **Amend**

## 0. Scope and candidate seal

This decision is scoped to remote PR head `e1edd0c`. The local checkout was at `865c7fb` during final verification because it had moved to later GitHub App work. That later local commit is not part of this audit.

The blind snapshots contained base `c397779` and no `.git` directory, candidate code, PR body, reviews, or candidate tests. The two proposers were from different model families and were blind to each other.

## 1. Frozen contract

### Violated property

A durable secret artifact must be effectively owner-only, and the invocation that publishes it must own its complete startup lifecycle until startup commits.

### Observable

When `--generated-secrets-file` is requested:

- successful startup exposes one complete schema v1 artifact before Portless, aliases, listeners, or banner;
- another local principal cannot read it through mode bits, inherited ACLs, or another supported access-control mechanism;
- any handled startup failure after publication removes only the exact artifact inode published by that invocation and permits an immediate identical retry.

### Must not change

- No-flag CLI behavior and missing-key failure.
- Existing service selection, ports, base URLs, config discovery, Portless behavior, banner, and shutdown.
- Programmatic `createEmulator.generatedSecrets`.
- Stable service order.
- Empty artifact support.
- Explicit-key exclusion.
- No secret values in stdout, stderr, banner, or HTTP.
- Existing file, directory, symlink, or competing destination preservation.
- Exclusive publication and no partial final JSON.
- Schema v1 fields.

## 2. Requirements

| Req | Requirement | Status |
|---|---|---|
| R0 | A requested durable artifact contains exactly the generated secrets required to use the prepared emulator configuration. | Core goal |
| R1 | At successful startup, the final artifact is complete before any listener, alias, Portless action, or banner becomes externally visible. | Must-have |
| R2 | The final artifact is effectively unreadable by non-owner principals on every filesystem and operating system where the feature is supported. Mode bits alone cannot satisfy this requirement when another access-control mechanism exists. | Must-have |
| R3 | If effective owner-only access cannot be established and verified, startup fails before any generated secret is published at the final path. | Must-have |
| R4 | Any handled failure after publication removes only the artifact owned by that invocation and leaves the same command immediately retryable without manual repair. | Must-have |
| R5 | A pre-existing destination or destination that changes identity is preserved and causes a safe failure. | Must-have |
| R6 | Explicitly supplied secrets are never exported. Generated secrets never enter stdout, stderr, banner, or HTTP. | Must-have |
| R7 | Without the opt-in delivery request, existing missing-secret errors, service selection, ports, base URLs, Portless behavior, banner, shutdown, and config discovery remain unchanged. | Must-have |
| R8 | Programmatic `createEmulator.generatedSecrets`, reset stability, and non-GitHub services remain unchanged. | Must-have |
| R9 | Crash residuals must not be mistaken for successful final publication or cause deletion of unrelated user files. Any unavoidable crash residual has a bounded, recognizable ownership rule and recovery story. | Must-have |
| R10 | The design must work with multiple selected services and with an empty generated-secret set. | Must-have |

R4 is intentionally limited to handled startup failures. `SIGKILL`, machine loss, and equivalent uncatchable termination cannot guarantee automatic rollback. R9 covers that residual honestly.

## 3. Blind proposals

### Proposal A: verified single-file artifact with exit-hook transaction

Proposer A recommended:

1. Keep an opt-in single-file output.
2. Prepare generated secrets before reachability.
3. Create a same-directory temporary file with `O_EXCL` and `0600`.
4. Strip and verify ACLs with platform tools.
5. Publish using an exclusive hard link and track `dev` plus `ino`.
6. Register synchronous LIFO undo work on thrown errors and `process.on("exit")`.
7. Fail closed on filesystems outside an explicit allowlist.
8. Add `generatedAt` and invocation metadata to the schema.

Predictions:

- inherited macOS ACLs are absent after sanitation;
- a competing destination is preserved by hard-link `EEXIST`;
- post-publication Portless, alias, and listener failures unwind the file and resources;
- `SIGKILL` can leave only a complete final artifact or recognizable temporary residual.

Costs and worse behavior:

- platform command dependencies;
- a filesystem allowlist rejects legitimate filesystems;
- a second startup path increases maintenance divergence;
- exit-hook cleanup must be synchronous;
- extra schema metadata changes the accepted v1 artifact.

Rejected by the proposer:

- mode bits alone;
- publish after listeners;
- overwrite;
- caller-owned file descriptors;
- encryption without a separate secure key channel.

### Proposal B: sibling or lockbox staging with lease rollback

Proposer B compared:

- A: sibling temporary file, ACL sanitation, atomic rename, inode-tracked rollback;
- B: `0700` lockbox directory, sanitized directory, staged file, rename, lease rollback;
- C: subprocess custodian holding a watchdog lease.

It selected sibling staging with:

1. platform ACL sanitation;
2. preflight destination checks;
3. atomic rename;
4. a LIFO startup rollback coordinator;
5. signal and unhandled-rejection interception;
6. steady-state commit after initialization.

Predictions:

- ACL inheritance is removed before publication;
- destination identity protects rollback;
- forced Portless, alias, store, and listener failures unwind;
- the no-flag path remains unchanged.

Costs and worse behavior:

- hidden temporary siblings;
- OS-specific tooling;
- signal coordination;
- lockbox variants add directory cleanup;
- subprocess supervision adds IPC and orphan risks.

Rejected by the proposer:

- mode-only protection;
- late publication;
- overwrite;
- unlink by pathname without inode verification.

### Proposal convergence

Both independent proposers converged on the two missing concepts:

- sanitize and verify effective ACL state before publication;
- treat publication and the rest of startup as one owned transaction.

Their convergence does not validate their exact primitives. The probes below rejected important parts of both proposals.

## 4. Forward chains

### Proposal A

1. Sanitize the open temporary inode before publication.
   - Mechanism: platform ACL removal plus verification.
   - Mark: `inferred` before probe, `observed` after P2.
2. Publish the same inode through an exclusive hard link.
   - Mechanism: hard links share `dev` and `ino`; `EEXIST` preserves a competing name.
   - Mark: `observed` after P3 and already present in candidate.
3. Track the published inode in a cleanup token.
   - Mechanism: rollback checks exact `dev` and `ino` before unlink.
   - Mark: `inferred`.
4. Attach cleanup to `process.on("exit")`.
   - Mechanism: synchronous exit callback.
   - Mark: `inferred`.
5. Cleanup needs directory sync, listener close, store reset, alias removal, and artifact unlink.
   - Mechanism: several operations are asynchronous or can fail independently.
   - Mark: `observed` from current APIs and candidate ordering.

Harmful branches:

- `process.on("exit")` cannot be the primary async rollback boundary.
- A filesystem allowlist rejects valid filesystems without proving the required property.
- timestamps and invocation metadata change schema v1 without solving either defect.

### Proposal B

1. Sanitize a sibling temporary file or lockbox.
   - Mechanism: remove inherited ACLs before writing or publication.
   - Mark: `inferred`, then `observed` for the open-file sibling case after P2.
2. Publish with `rename`.
   - Mechanism: same-filesystem atomic name replacement.
   - Mark: `guessed`.
3. A competing destination appears between preflight and publication.
   - Mechanism: `rename` replaces the destination on POSIX.
   - Mark: `observed` after P4.
4. The product overwrites another writer.
   - Mechanism: primitive semantics violate exclusive publication.
   - Mark: `observed`.

Harmful branches:

- lockbox delivery adds a directory contract the CLI did not request;
- subprocess supervision adds a second failure domain;
- returning from `listen()` is not proof that a listener successfully bound.

### Candidate PR #204

1. Create and `fchmod(0600)` a temporary inode.
   - Mechanism: candidate lines `165-173`.
   - Mark: `observed`.
2. Verify only regular-file type and POSIX mode.
   - Mechanism: candidate lines `62-69`.
   - Mark: `observed`.
3. A parent supplies an inherited `everyone allow read` ACL.
   - Mechanism: macOS ACL inheritance survives mode `0600`.
   - Mark: `observed` after P1.
4. Candidate publishes the inode through an exclusive hard link.
   - Mechanism: candidate line `180`.
   - Mark: `observed`.
5. The final artifact retains the inherited ACL.
   - Mechanism: hard link preserves the same inode and ACL.
   - Mark: `observed` by P1 and P3 composition.

Second branch:

1. Candidate publishes and returns `void`.
   - Mechanism: candidate lines `156-198`.
   - Mark: `observed`.
2. `startCommand` continues through Portless, aliases, stores, seeding, and listeners.
   - Mechanism: candidate lines `203-246`.
   - Mark: `observed`.
3. Any later step fails.
   - Mechanism: explicit throws, `process.exit`, synchronous seed errors, or asynchronous listener errors.
   - Mark: `observed`.
4. No caller owns a published-artifact rollback handle.
   - Mechanism: publication identity is discarded.
   - Mark: `observed`.
5. The artifact remains and the identical retry fails `EEXIST`.
   - Mechanism: preflight refuses the stranded destination.
   - Mark: `inferred`, directly implied by candidate calls and reported externally.

Third branch:

1. `serve()` returns a server object.
   - Mark: `observed`.
2. The actual bind error arrives later through `error`.
   - Mark: `observed` after P5.
3. Candidate can continue to later services or banner before startup is known successful.
   - Mark: `inferred`.

## 5. Probe log

| ID | Claim under test | Command or mechanism | Observed result | Disposition |
|---|---|---|---|---|
| P0 | Harness setup | First ACL rerun omitted exporting `ACL_FILE` | Node opened `""` and failed `ENOENT` | Harness error, no product conclusion |
| P1 | `0600` proves owner-only access on macOS | Parent ACL: `group:everyone allow read,file_inherit`; create child with `0600`; `/bin/ls -le` | `-rw-------@` plus `group:everyone inherited allow read` | Refutes candidate mode-only check |
| P2 | The already-open inode can be sanitized without reopening its temp pathname | Inherit file descriptor as child fd 3; `/bin/chmod -N /dev/fd/3`; `fstat`; `/bin/ls -le` | exit `0`, mode `600`, ACL entry removed | Survives; use open-inode sanitation |
| P3 | Exclusive hard-link publication preserves the sanitized inode | `ln source destination`; compare `stat -f '%d:%i'` and mode | `SAME_INODE=true`, mode `600` | Preserve candidate hard-link primitive |
| P4 | `rename` preserves a competing destination | Precreate destination with `winner`; rename source containing `secret` over it | `RENAME_RESULT=secret` | Refutes both rename shapes |
| P5 | Returning from listener creation proves bind success | Occupy a port, call `listen`, set `returned=true`, observe `error` | `LISTEN_RETURNED_BEFORE_ERROR=true`, `ERROR_EVENT=EADDRINUSE` | Startup must await each listener |

Temporary probe directories were removed after observation.

## 6. Failure-shape scoring

| Shape | Candidate `e1edd0c` | Selected amendment |
|---|---|---|
| S1 Over-reach | Partial pass. Feature is opt-in, but a broad non-Windows claim exceeds what mode verification proves. | Designed out. Support only platforms where effective ACL sanitation and verification succeeds. No filesystem allowlist. |
| S2 Under-reach | Hit. It closes partial publication and destination races but not inherited ACLs or post-publication startup failures. | Designed out through ACL discriminators and every acquisition stage after publication. |
| S3 Direction inheritance | Hit risk. Identity protection exists during publication but not during later cleanup because no ownership handle survives. | Exact identity is carried into rollback; replacement means preserve and report, never delete by pathname alone. |
| S4 Proxy property | Hit. Mode `0600` is adjacent to effective confidentiality. A returned server object is adjacent to a bound listener. | Directly verify ACL state and await `listening` or `error`. |
| S5 Unregistered peer | Hit. The published artifact is not registered with the startup lifecycle owner. | Publication returns a resource handle registered in the same transaction as aliases, stores, and listeners. |
| S6 Peer-version blindness | Not applicable. No cross-version protocol is added. | Not applicable. |
| S7 Wrong layer | Hit. `ensurePortless()` can call `process.exit`, bypassing caller-owned async rollback. Listener errors surface outside the current control flow. | Transactional path throws, and listener readiness is awaited inside the transaction. |
| S8 Guard-derived cells | Hit. Candidate tests derive confidentiality from mode bits and startup from synchronous returns. | Cells derive from OS ACLs, competing names, async listener events, resource ordering, and identity replacement. |
| S9 Test pins wrong thing | Hit. Green tests do not fail if inherited ACLs remain or if a later startup stage strands the artifact. | Require force-red mutations for ACL sanitation, rollback ownership, listener readiness, and identity-safe deletion. |
| S10 Claim from prose | Hit in blind proposals. `rename` safety and exit-hook cleanup were asserted without substrate proof. | Load-bearing primitive claims are tied to P1-P5 and implementation tests. |
| S11 Asymmetric validation | Hit risk. Publication validates identity strongly, but later lifecycle has no equivalent authority check. | One owned handle centralizes identity validation for every deletion attempt. |
| S12 Primitive-contract mismatch | Candidate hard link matches exclusive publication. Blind `rename` shapes do not. | Preserve the hard link; reject `rename`, overwrite, and directory-container substitution. |

S1 and S2 receive the highest weight because this is a fix to a previously reviewed implementation.

## 7. Candidate reveal comparison

| Dimension | Blind result | Candidate `e1edd0c` | Delta |
|---|---|---|---|
| Contract observable | Effective owner-only artifact plus retryable failed startup | Mode-only artifact plus publication-local cleanup | Material gaps in confidentiality and lifecycle |
| Primitive semantics | Sanitize inode, publish exclusively, track ownership | Exclusive same-inode hard link already present | Preserve hard link; add sanitation and ownership return |
| Authority and trust boundary | OS ACL layer plus startup transaction | POSIX mode layer plus publisher-local try/catch | Candidate trusts an incomplete access-control proxy |
| Negative discriminator cells | Inherited ACL, late failure, listener bind error, identity replacement | Existing path, race, serialization failure, partial read | Add missing negative cells |
| Ownership and lifecycle | LIFO transaction across all acquired resources | Artifact identity discarded after publication | Return owned handle and unwind in reverse |
| Compatibility and portability | Fail closed when access semantics cannot be verified | Reject Windows, otherwise assume mode is enough | Add platform ACL adapters and fail closed |
| Reusable implementation | Shared transaction and owned resource handles | Strong exclusive publication helper | Amend candidate rather than recreate |
| New accepted costs | Platform tools, explicit startup transaction, listener readiness wait | None for ACL verification or rollback | Accepted because both properties are contractual |

## 8. Synthesis

**Kind: graft.**

The selected shape combines:

- candidate #204's exclusive same-inode hard-link publication and destination protection;
- both blind proposals' ACL sanitation and inode-tracked rollback concepts;
- an explicit startup transaction instead of exit-hook cleanup;
- event-confirmed listener readiness, learned from P5.

### Selected shape

#### G1. Sanitize and verify the open inode

Before secret bytes are written or the final name is published:

1. Create the same-directory temporary file with `O_CREAT | O_EXCL`.
2. Keep the file handle open.
3. `fchmod(0600)`.
4. Verify regular file, current effective owner, and exact `0600` through `fstat`.
5. Sanitize and verify ACLs through the inherited descriptor, not by reopening the temporary pathname.

Platform policy:

- Darwin: `/bin/chmod -N /dev/fd/3`, then verify the same descriptor has no ACL entries using `/bin/ls -le /dev/fd/3`.
- Linux: use `setfacl -b /proc/self/fd/3`, then `getfacl` on the same descriptor and require only base owner, group, and other entries. If the tools, `/proc` descriptor path, or output verification are unavailable, fail closed.
- Windows and other platforms: unsupported until an equally strong verifier exists.

Do not add a filesystem allowlist. Capability is decided by whether the required property can be established and verified on the actual open inode.

#### G2. Preserve exclusive hard-link publication

Write schema v1 exactly as it exists, `fsync` the file, then:

1. `link(temporary, destination)`;
2. verify source and destination are the same `dev` and `ino`;
3. remove the temporary name by matching identity;
4. sync the parent directory;
5. verify the destination identity again.

Do not use `rename`. P4 proves it can overwrite a competing destination.

#### G3. Return an owned publication handle

`publishGeneratedSecretsFile()` returns a handle similar to:

```ts
interface PublishedGeneratedSecretsFile {
  path: string;
  identity: { dev: bigint; ino: bigint };
  rollback(): Promise<void>;
}
```

`rollback()`:

- checks exact `dev` and `ino`;
- unlinks only the matching inode;
- preserves a missing or replaced destination;
- syncs the parent after removal;
- reports cleanup failure without exposing secret data.

Publication-local failures remain cleaned inside the publisher.

#### G4. Make post-publication startup transactional

After publication, acquire resources inside one explicit `try`:

1. Portless readiness.
2. Alias registration.
3. Store creation and seeding.
4. Listener creation and confirmed readiness.
5. Banner.

On failure, unwind in reverse:

1. close every started listener;
2. reset every acquired store;
3. remove aliases registered by the invocation;
4. roll back the generated-secrets artifact.

Preserve the primary startup error. Cleanup failures are collected and reported separately without replacing it.

Do not use `process.on("exit")` as the primary rollback mechanism. Refactor transactional `ensurePortless()` paths to throw or return a failure instead of calling `process.exit(1)`.

#### G5. Confirm listener readiness

For every `serve()` result, await one of:

- `listening`, which acquires the listener resource;
- `error`, which fails startup.

Startup commits only after every selected service is listening and the banner succeeds. A listener that was created but not confirmed must still be closed during rollback.

Normal SIGINT and SIGTERM shutdown after commit preserves the durable artifact, matching the existing product contract.

#### G6. Bound crash residuals honestly

For handled failures, rollback is required.

For `SIGKILL`, machine loss, or equivalent uncatchable termination:

- a temporary residual may exist under the invocation-specific hidden name;
- if the final destination exists, hard-link publication guarantees complete JSON, never partial JSON;
- automatic deletion is not promised;
- recovery is to verify no active invocation owns the artifact, then remove it manually or select a new path.

No timestamps, invocation metadata, sidecar lease, or schema changes are added to v1.

## 9. Rejected material

| Material | Decision | Reason |
|---|---|---|
| `rename` publication | Reject | P4 shows it overwrites a competing destination |
| Filesystem allowlist | Reject | Rejects safe filesystems while proving only a filesystem name, not effective confidentiality |
| `process.on("exit")` as primary rollback | Reject | Async cleanup cannot be completed reliably there |
| Directory or lockbox as requested artifact | Reject | Changes the single-file contract and adds inode ownership complexity |
| Custodian subprocess | Reject | Adds IPC, orphan, and second-process failure modes |
| Timestamps or invocation metadata in schema v1 | Reject | Unnecessary contract expansion |
| Blind unlink by pathname | Reject | Can delete a replacement owned by another actor |
| Mode-only verification | Reject | P1 directly refutes it |
| Treating `serve()` return as readiness | Reject | P5 directly refutes it |

## 10. Fit check for selected shape

| Req | Requirement | Status | Graft |
|---|---|---|---|
| R0 | A requested durable artifact contains exactly the generated secrets required to use the prepared emulator configuration. | Core goal | ✅ |
| R1 | At successful startup, the final artifact is complete before any listener, alias, Portless action, or banner becomes externally visible. | Must-have | ✅ |
| R2 | The final artifact is effectively unreadable by non-owner principals on every filesystem and operating system where the feature is supported. Mode bits alone cannot satisfy this requirement when another access-control mechanism exists. | Must-have | ✅ |
| R3 | If effective owner-only access cannot be established and verified, startup fails before any generated secret is published at the final path. | Must-have | ✅ |
| R4 | Any handled failure after publication removes only the artifact owned by that invocation and leaves the same command immediately retryable without manual repair. | Must-have | ✅ |
| R5 | A pre-existing destination or destination that changes identity is preserved and causes a safe failure. | Must-have | ✅ |
| R6 | Explicitly supplied secrets are never exported. Generated secrets never enter stdout, stderr, banner, or HTTP. | Must-have | ✅ |
| R7 | Without the opt-in delivery request, existing missing-secret errors, service selection, ports, base URLs, Portless behavior, banner, shutdown, and config discovery remain unchanged. | Must-have | ✅ |
| R8 | Programmatic `createEmulator.generatedSecrets`, reset stability, and non-GitHub services remain unchanged. | Must-have | ✅ |
| R9 | Crash residuals must not be mistaken for successful final publication or cause deletion of unrelated user files. Any unavoidable crash residual has a bounded, recognizable ownership rule and recovery story. | Must-have | ✅ |
| R10 | The design must work with multiple selected services and with an empty generated-secret set. | Must-have | ✅ |

## 11. Smallest auditable visuals

### Observed candidate behavior

```text
open temp inode
  -> fchmod 0600
  -> mode-only check
  -> inherited ACL can remain [P1]
  -> hard-link same inode to destination [P3]
  -> publish returns void
  -> later startup step can fail
  -> no artifact owner remains
  -> retry sees EEXIST

serve() returns
  -> bind result still pending
  -> error can arrive later [P5]
```

### Proposed behavior

```text
open temp inode
  -> sanitize ACL through open fd [observed P2]
  -> verify owner + mode + effective ACL [inferred]
  -> write + fsync [observed candidate primitive]
  -> exclusive hard-link publish [observed P3]
  -> return owned inode handle [inferred]
  -> acquire Portless
  -> acquire aliases
  -> acquire stores
  -> acquire listeners only after "listening" [observed need P5]
  -> print banner
  -> COMMIT

failure before COMMIT
  -> close listeners
  -> reset stores
  -> remove aliases
  -> unlink only matching artifact inode
  -> preserve primary error
```

## 12. Implementation slices

### Slice 1: Effective confidentiality and owned publication

Files:

- `packages/emulate/src/generated-secrets-file.ts`
- focused generated-secrets file tests

Work:

- add open-file ACL sanitation adapters;
- verify effective owner-only state;
- keep schema and hard-link publication unchanged;
- return the owned publication handle;
- add identity-safe rollback;
- fail closed on unsupported verification.

Exit checks:

- inherited macOS ACL is removed or publication fails before destination creation;
- Linux verifier succeeds only with effective ACL proof and fails closed otherwise;
- competing destination remains untouched;
- mutation removing sanitation makes the ACL regression test fail;
- mutation removing identity check makes the replacement test fail.

### Slice 2: Transactional startup and listener readiness

Files:

- `packages/emulate/src/commands/start.ts`
- `packages/emulate/src/portless.ts`
- focused startup tests

Work:

- make transactional Portless failures throw;
- register aliases, stores, listeners, and artifact in one startup transaction;
- await `listening` or `error` for each server;
- unwind in reverse on failure;
- preserve the primary error and report cleanup failures separately;
- keep normal successful shutdown and durable artifact behavior.

Exit checks:

- Portless failure after publication permits immediate retry;
- alias failure after publication permits immediate retry;
- second listener `EADDRINUSE` closes the first and permits immediate retry;
- store or seed failure after prior acquisition unwinds everything;
- banner failure unwinds everything;
- no-flag behavior remains unchanged.

### Slice 3: Adversarial lifecycle matrix and release docs

Files:

- generated-secrets and startup integration tests
- CLI and feature documentation only where behavior changed

Work:

- cover destination replacement before rollback;
- cover cleanup failure while preserving the primary error;
- cover empty artifact, explicit-key exclusion, stable service order, and existing objects;
- document unsupported ACL verification and `SIGKILL` residual recovery;
- run Review Gate, Resilience Audit, and Test Strength with the carried targets below.

Exit checks:

- every discriminator D1-D12 has an executable test or documented uncatchable residual;
- each introduced mechanism has a force-red mutation;
- full repository checks are green.

## 13. Carried assumptions and verification targets

1. `/bin/chmod -N /dev/fd/3` operates on the inherited open inode on supported macOS versions. P2 survived locally; implementation tests must keep it executable.
2. Darwin ACL verification output can be parsed without relying only on the `@` mode suffix.
3. Linux `setfacl` and `getfacl` can operate on an inherited `/proc/self/fd/3`; if not, Linux must fail closed rather than fall back to mode bits.
4. The temporary descriptor is inherited only by the short-lived ACL tool and is not leaked to later children.
5. `rollback()` preserves a replaced destination even if cleanup cannot complete.
6. Listener readiness can be wrapped without changing `@emulators/core` public behavior.
7. A listener that errors after another listener became ready is still closed during unwind.
8. Alias rollback accounts for `registerAliases()` partial self-cleanup and does not double-delete unrelated aliases.
9. Store reset and listener close errors do not replace the primary startup error.
10. No-flag execution keeps its current ordering and missing-key behavior.
11. Successful normal shutdown preserves the artifact.
12. `SIGKILL` cleanup remains explicitly unguaranteed.

## 14. Review Gate and resilience handoff

Review Gate must drive, not merely inspect:

- inherited ACL parent;
- ACL sanitation unavailable or unverifiable;
- existing file, directory, symlink, and competing writer;
- Portless failure after publication;
- alias failure after partial and complete registration;
- first listener ready, second listener `EADDRINUSE`;
- seed failure after an earlier store or listener acquisition;
- destination identity replacement before rollback;
- cleanup failure plus primary startup failure;
- no-flag missing-key behavior;
- multiple services, stable order, explicit-key exclusion, and empty artifact;
- `SIGKILL` residual documentation.

Resilience Audit must focus on:

- acquisition and reverse-order release;
- asynchronous listener errors;
- idempotent rollback;
- cleanup failure aggregation;
- signal boundaries;
- retryability;
- descriptor and temporary-name leaks;
- destination identity races.

Test Strength must independently remove or bypass:

- ACL sanitation;
- ACL verification;
- hard-link exclusivity;
- returned ownership identity;
- identity check before unlink;
- listener readiness await;
- each rollback stage.

## 15. Verdict

**Amend PR #204.**

Do not recreate the feature. The candidate already contains the correct user contract, generated-secret preparation, exclusive hard-link publication, destination protection, stable output, documentation, and useful test foundation.

The amendment is bounded to two missing properties:

1. effective ACL sanitation and verification on the open inode;
2. explicit transactional ownership from publication through confirmed listener readiness and banner.

Implementation may begin with Slice 1.
