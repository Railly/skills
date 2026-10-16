# Solution gate: emulate GitHub App identity in framework adapters

- Date: 2026-08-19.
- Target: `vercel-labs/emulate` at `d0219d05818adca4c12bb76ec79a7562c1766a3d`.
- Tracker: `vercel-labs/emulate#203`, slice 3.
- Proposers: `anthropic/claude-fable-5` and `google/gemini-3.1-pro`, blind to each other in isolated detached worktrees.
- Synthesizer and implementer: Codex root runtime, which proposed neither candidate.

## Trigger

Fires in greenfield mode. The slice changes the contract between async secret generation, adapter initialization, persistent snapshots, App JWT verification, and server-only consumers.

## Neutral contract

**Property violated.** An embedded emulator configured with a GitHub App whose `private_key` is omitted must establish one durable App identity per persisted emulator state and make that identity available only to trusted server-side application code.

**Observable that must change.** Both adapters initialize keyless GitHub Apps, restore the same private key into a second handler over the same persistence state, authenticate JWTs signed before restoration, and expose generated material only through an in-process server API.

**Must not change.** Explicit keys are not reported as generated; routing, response rewriting, token persistence, OAuth, non-GitHub services, and direct `seedFromConfig` behavior remain unchanged; no route, response, log, inspector, or client-facing serialization gains a private key.

## Observed subsystem facts

1. Both adapters call `seedFromConfig` directly, and a keyless GitHub App throws before the first response.
2. `materializeGitHubSeedConfig` already generates asynchronously and distinguishes generated keys from supplied keys.
3. The Apps collection stores `private_key`, and the existing Store snapshot round-trip preserves it byte-for-byte.
4. Both adapters probe for `createAppKeyResolver`, but `@emulators/github` does not export it. The only implementation is duplicated inside the CLI registry, so embedded App JWT verification is currently unreachable.
5. No GitHub route, adapter doc, skill, or web UI references private keys.
6. Next's initial persistence save is currently skipped because `enqueueSave()` observes module state before `apps` is assigned. Nuxt passes its local map and does save.

## Forward chains

### Proposal A: prepare hook, live-store accessor, provenance on App rows

- GitHub exports preparation and resolver hooks (`inferred`).
- Adapters materialize only on the non-restored path (`inferred`).
- Existing Store snapshots preserve the key (`observed`, P2).
- A live-store accessor returns restored state (`inferred`).
- Harmful branch: access before the first request needs a duplicated origin or waits for request initialization (`inferred`).
- Harmful branch: adding provenance to the public GitHub App entity changes every serialized App row (`inferred`).

### Proposal B: prepare hook, live-store accessor, explicit base URL

- The same existing snapshot remains the durable unit (`observed`, P2).
- An explicit base URL permits eager app construction (`inferred`).
- Harmful branch: applications must duplicate framework origin configuration solely to read a secret (`inferred`).
- Harmful branch: the accessor contract returns explicit keys unless a separate provenance mechanism exists (`inferred`).

### Synthesized shape: preparation state before request initialization

- Each adapter starts one memoized preparation promise at handler construction (`inferred`).
- Preparation loads and validates persistence before generating anything (`inferred`).
- A valid snapshot restores generated-secret descriptors from optional top-level metadata; an old snapshot has none and remains compatible (`inferred`).
- Without a valid snapshot, each service's optional `prepareSeed` runs once and returns materialized config plus generated-only descriptors (`inferred`).
- The in-process `generatedSecrets()` API awaits preparation only, so it does not need an origin or first HTTP request (`inferred`).
- Request initialization later builds stores with the real request origin, then restores or seeds using the already prepared state (`inferred`).
- The first snapshot persists Store, tokens, and generated-only descriptors as one JSON unit (`inferred`).
- Harmful branch: generated keys appear twice in the same encrypted-or-plaintext persistence value, once in the App row and once in access metadata (`inferred`). Accepted because both copies share one atomic persistence unit and early server access otherwise requires full request initialization.
- Harmful branch: a persistence backend now stores a usable signing key (`observed from existing App snapshot semantics`). Documented as a security obligation.

## Probe log

### P1. Current keyless adapter behavior

Command: build core, GitHub, and both adapters, then invoke Next `GET /emulate/github/app` with a keyless App seed.

Observed:

```text
EXPECTED_FAILURE GitHub App "probe" requires private_key when seedFromConfig is called directly; use createEmulator to generate one
```

Result: the defect reproduces.

### P2. Existing snapshot identity

Command: materialize a GitHub seed, seed a Store, JSON round-trip `store.snapshot()`, restore a second Store, and compare App keys.

Observed:

```text
SNAPSHOT_KEY_EQUAL true true
```

Result: survives. No separate secret persistence primitive is needed.

### P3. Embedded resolver export

Command: search adapters, GitHub, and the CLI registry for `createAppKeyResolver`.

Observed: both adapters consume the hook; only the CLI registry implements it; GitHub exports none.

Result: both proposals must include the resolver export or JWT verification remains broken.

### P4. Existing exposure surface

Command: search GitHub routes, adapters, web docs, and adapter skills for `private_key`, `privateKey`, PEM markers, and `generatedSecrets`.

Observed: zero matches.

Result: the no-HTTP baseline is explicit and can be guarded mechanically.

### P5. Access before first request

Code inspection: adapter Store construction requires request-derived `origin`, but persistence load and seed materialization do not.

Result: refutes making the accessor depend on a live Store or mandatory duplicated base URL. Split preparation from request initialization.

## Failure-shape scoring

| Shape | Proposal A | Proposal B | Synthesis |
|---|---|---|---|
| S1 over-reach | Hit if public App rows gain provenance | Hit if every caller must supply base URL | Avoided with optional snapshot metadata and unchanged route config |
| S2 under-reach | Hit if resolver remains CLI-only | Hit if explicit keys are returned | Resolver exported; generated-only metadata |
| S3 direction inheritance | Potential restore/generate race | Same | Persistence is read before materialization |
| S4 proxy property | App row alone does not prove generated provenance | Same | Descriptor metadata records provenance |
| S5 unregistered peer | New metadata needs restore and save peers | Same | Both live in one snapshot contract |
| S6 peer-version blindness | Old snapshots lack provenance | Same | Optional field means old snapshots contain zero generated identities |
| S7 wrong layer | Live accessor needs request origin | Explicit base URL pushes burden to app | Preparation-only accessor avoids both |
| S8 guard-derived cells | Risk | Risk | Tests derive cells from generated, explicit, restored, corrupt, and non-GitHub domains |
| S9 test pins wrong thing | Risk | Risk | Remove preparation, resolver, metadata, and no-exposure mechanisms independently |
| S10 claim from prose | Persistence security claim | Same | Document exact plaintext-backend consequence |
| S11 asymmetric validation | No new input consumer | No new input consumer | No new input consumer |
| S12 primitive mismatch | No | No | No |

## Synthesis

**Kind: graft.** Take the shared async preparation and GitHub-owned resolver from both proposals. Replace their live-store accessor with a preparation-state accessor that does not need a first request or duplicated origin. Store generated-only descriptors as optional top-level snapshot metadata, while the App collection remains authoritative for authentication.

Chosen contract:

1. `@emulators/github` exports a generic preparation wrapper and App-key resolver.
2. Both adapters add optional `prepareSeed` to `EmulatorModule`.
3. Persistence is loaded and parsed once before materialization.
4. Valid snapshots restore state and generated-secret descriptors without generation.
5. Keyless new state materializes once, seeds once, and saves the complete identity plus generated-only metadata.
6. Each adapter exposes `generatedSecrets(): Promise<readonly GeneratedSecret[]>` only on its returned in-process handler value.
7. Explicit keys never enter that list.
8. Corrupt persistence plus a seed that would generate identity fails explicitly rather than silently replacing identity. Existing corrupt-snapshot reseeding remains for configs without generated identities.
9. No HTTP endpoint, response transformation, log, UI, or inspector carries the accessor or key.

## Visuals

Observed:

```text
keyless seed -> adapter seedFromConfig -> throw                 [P1]
materialized seed -> Store(App.private_key) -> snapshot -> same key [P2]
adapter App JWT hook -> missing GitHub export -> no resolver    [P3]
```

Proposed:

```text
create handler
  -> load persistence [inferred]
     -> valid snapshot -> descriptors + later Store restore [inferred]
     -> no snapshot -> prepareSeed once -> descriptors + config [inferred]
  -> generatedSecrets() returns descriptors in-process [inferred]

first request
  -> derive origin [observed]
  -> create Store/server [observed]
  -> restore OR seed prepared config [inferred]
  -> save Store + tokens + descriptors atomically [inferred]
```

## Carried assumptions

1. Generated-secret descriptors are small enough to duplicate in the JSON snapshot.
2. Persistence implementations protect signing keys appropriately; file persistence needs an explicit warning because it does not enforce owner-only ACLs.
3. Old snapshots cannot contain adapter-generated keys because adapters could not previously materialize them.
4. The returned handler object/function remains server-only when users follow framework route placement guidance.

## Review handoff

- Drive both adapters through generate, authenticate, save, restore, and authenticate-again.
- Verify explicit keys authenticate but never enter `generatedSecrets()`.
- Verify old snapshots load with an empty generated list.
- Verify corrupt persistence fails only when silent identity replacement would occur.
- Delete each mechanism separately and require a distinct test failure.
- Search built output, routes, docs, logs, and UI for private-key exposure.
- Check existing routing, rewrite, OAuth, token persistence, non-GitHub behavior, and Next initial save.
