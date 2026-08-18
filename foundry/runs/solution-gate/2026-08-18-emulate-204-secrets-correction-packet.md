# Frozen packet: emulate CLI generated-secret correction

- Date: 2026-08-18.
- Repository snapshot: `vercel-labs/emulate` at `c39777943ec879dc75102d3cd741d8c961d61b06`.
- Mode: candidate audit.
- Candidate artifacts are excluded.

## Frame

### Problem

The CLI needs an explicit way to materialize service-generated secrets into a durable artifact before a server becomes reachable. Two externally reported failures constrain the solution:

1. A file whose POSIX mode reports `0600` can still be readable by another principal on macOS when an inherited ACL grants access.
2. A startup can publish the requested artifact and then fail during later setup. The published destination remains, and the next identical invocation fails because the destination already exists.

### Outcome

When durable generated-secret delivery is requested, successful startup exposes exactly one complete artifact that is effectively unreadable by non-owner principals on every supported filesystem. Failed startup leaves no invocation-owned final artifact or other state that blocks an immediate identical retry.

Without a delivery request, existing CLI behavior remains unchanged.

## Evidence

| ID | State | Claim | Source |
|---|---|---|---|
| E1 | specified | Programmatic `createEmulator` already exposes only service-generated secrets and excludes explicit keys. | `packages/emulate/src/api.ts:19-31,54-60` and `packages/emulate/src/registry.ts:85-95` |
| E2 | observed | The base CLI performs Portless setup before loading services, registers aliases before constructing servers, and calls `serve()` after seeding. | `packages/emulate/src/commands/start.ts:117-190` |
| E3 | reported | On macOS, a parent ACL with file inheritance produced a child reporting mode `0600` while retaining `everyone allow read`. | External review reproduction, 2026-08-18 |
| E4 | reported | Publishing the destination before later fallible startup work can strand it; an identical retry then fails on destination existence. | External review, confirmed from candidate call ordering on 2026-08-18 |
| E5 | specified | Existing behavior without the opt-in delivery request must remain unchanged. | Prior accepted Solution Gate contract, 2026-08-13 |
| E6 | specified | The destination must not overwrite an existing path, explicit keys must never be exported, and no key may enter stdout, stderr, banner, or HTTP. | Prior accepted Solution Gate contract, 2026-08-13 |
| E7 | specified | Successful publication must precede Portless setup, alias registration, listener creation, and banner output. | Prior accepted Solution Gate contract, 2026-08-13 |

## Requirements

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

## Discriminator matrix

| Cell | Setup | Required observation |
|---|---|---|
| D1 | Fresh parent with no ACL; valid generated secret; successful startup | Complete schema-versioned artifact exists before reachability and is usable. |
| D2 | macOS parent grants inherited read access to `everyone` | Either the final artifact has no effective non-owner read access, or startup fails closed before final publication. A `0600` stat alone is not a pass. |
| D3 | Destination already exists as a regular file, symlink, directory, or competing writer path | Existing object is unchanged; no listener or alias appears; no secret leaks. |
| D4 | Force a failure before final publication | No final artifact; no secret leak; immediate identical retry can succeed. |
| D5 | Force a failure after final publication but before Portless completion | Invocation-owned artifact and setup state are rolled back; immediate identical retry can succeed. |
| D6 | Force a failure after alias registration | Invocation-owned artifact and aliases are rolled back; immediate identical retry can succeed. |
| D7 | Force a failure after one listener starts while another service fails | All listeners, stores, aliases, and invocation-owned artifact are cleaned up; immediate identical retry can succeed. |
| D8 | Terminate or crash during temporary write and during the post-publication window | No partial final artifact. Residual temporary or final names follow a bounded ownership and recovery rule without deleting unrelated files. |
| D9 | Run without the delivery request and a GitHub App missing an explicit key | Existing documented failure and absence of durable secret output remain unchanged. |
| D10 | Run with explicit keys and generated keys across multiple services | Only generated values are exported, in stable service order. |
| D11 | Run on Windows or a filesystem whose confidentiality semantics cannot be verified | Feature fails closed with a non-secret diagnostic before final publication. |
| D12 | Requested delivery produces zero generated secrets | A complete empty artifact is published and lifecycle guarantees remain identical. |

## Temporal contract

| State | Scope and owner | Initial default | `unset → set` | `set → omitted` | `set → same` | `set → changed` | `set → explicit clear` | Reuse, restart, or migrate | Continuity observables |
|---|---|---|---|---|---|---|---|---|---|
| Durable output path | One CLI invocation; caller owns the requested pathname, startup transaction owns only the inode it creates | No delivery and no artifact | Opts into generation and transactional delivery | A later independent invocation without the option does not inspect or delete the prior file | Existing destination causes safe refusal; it is never reused or overwritten | New path is a new independent transaction | Not applicable; omission means no delivery request, not deletion | Every invocation starts a new transaction; no persistent session state is inferred from omission | Existing files preserved, exact created identity tracked, retry after failed invocation succeeds |

## Reviewer task

Use the `shaping` methodology.

Produce:

1. The complete R table, preserving R0 through R10.
2. At least two materially different shapes.
3. Parts for each shape, with mechanisms and flags.
4. A binary R × Shape fit check.
5. Predictions tied to discriminator cells and concrete commands or measurements.
6. Costs, what each shape makes worse, and rejected alternatives.
7. A recommended survivor, or `none` if every shape fails.

Do not implement. Do not inspect any branch, commit, PR, review, or artifact beyond this snapshot and packet.
