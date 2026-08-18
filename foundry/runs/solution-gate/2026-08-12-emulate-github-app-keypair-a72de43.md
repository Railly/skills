# Solution gate: emulate GitHub App keypair ergonomics

- Date: 2026-08-12.
- Target: `vercel-labs/emulate` at `a72de43124fca64e370640312ae1e5ee5c096341`, the head of PR #199.
- Origin: Anthropic parity item, "Generate an App keypair at startup."
- Proposers: `anthropic/claude-opus-5` and `google/gemini-3.1-pro-preview`, blind to each other through Vercel AI Gateway.
- Synthesizer and future implementer: Codex root runtime, which proposed neither candidate.
- Proposals verbatim: `2026-08-12-emulate-github-app-keypair-a72de43-proposals.md`.
- Drawing: `2026-08-12-emulate-github-app-keypair-a72de43.html`.

## 0. Trigger

Fires. The change admits multiple shapes that differ in where generated secret state lives, when it becomes stable, and which surface exposes it. It changes the contract between the GitHub seed, the store, the generic `Emulator` API, the CLI, and the embedded adapters. It is not mechanical.

## 1. Neutral contract

**Property violated.** A GitHub App configured for local emulation cannot authenticate unless the user generates, stores, and supplies external RSA private-key material before startup.

**Observable that must change.** Starting the built emulator with a GitHub App seed that omits key material must produce key material through a documented, consumer-accessible surface. A test must obtain that material, sign an RS256 App JWT for the configured `app_id`, exchange it through the existing installation access-token route, and receive `201` with a `ghs_` token. The measurement uses the built CLI or public programmatic API, not direct store access.

**Must not change.**

- A configured app with an explicit valid private key uses that exact key.
- Existing GitHub App seed fields, IDs, slugs, permissions, events, installations, webhook delivery, and token restrictions retain their behavior.
- The RS256 verification behavior on the target head stays intact, including PKCS#1 and PKCS#8 compatibility.
- Invalid App JWTs still fail with `401`.
- GitHub OAuth Apps and non-GitHub emulators are unaffected.
- Startup, reset, state serialization, and shutdown do not leak, replace, or unexpectedly regenerate configured key material.
- No generated private key must be committed to the repository.

The brief named no solution.

## 2. Observed subsystem facts

All facts below were inspected or measured at `a72de43`.

1. `GitHubSeedConfig.apps[].private_key` is required, and `seedFromConfig()` copies it into the required `GitHubApp.private_key` entity field. Evidence: `packages/@emulators/github/src/index.ts:69-87,318-333`.
2. App JWT verification resolves the stored private key, derives public material with `createPublicKey()`, and verifies RS256. Invalid inputs leave `authApp` unset and the App routes return `401`. Evidence: `packages/@emulators/core/src/middleware/auth.ts:81-107`.
3. The public `Emulator` API exposes only `url`, `reset()`, and `close()`. Evidence: `packages/emulate/src/api.ts:19-23`.
4. `reset()` clears the store and calls the same seed closure again. Evidence: `packages/emulate/src/api.ts:61-76`.
5. The CLI calls `seedFromConfig()` once per process and currently prints URLs, bearer tokens, and the config source. Evidence: `packages/emulate/src/commands/start.ts:163-194,213-245`.
6. Next and Nuxt adapters call a package's `seedFromConfig()` directly. They restore a persisted store snapshot instead of seeding when one exists. Evidence: `adapter-next/src/index.ts:212-239`; `adapter-nuxt/src/index.ts:332-359`.
7. `Store.snapshot()` serializes collection fields, including `GitHubApp.private_key`. `reset()` clears both collections and auxiliary data. Evidence: `core/src/store.ts:251-285`.
8. No GitHub route currently implements `/apps/:slug`; `/app` requires a valid App JWT. `external_url` and `html_url` currently point at `${baseUrl}/apps/${slug}` without a route behind them. Evidence: `github/src/routes/apps.ts:14-51`, route grep with no `/apps` result.
9. Existing emulator-only HTTP surfaces use names such as `/_inspector` and `/_twilio/simulate/*`; they are reachable over the emulator port. Evidence: route grep across packages.
10. Five local RSA-2048 PKCS#1 generations took 4.68–24.53 ms and produced 1675–1679-byte PEMs. A generated key signed and verified successfully through Node's `createPublicKey()` path. Evidence: recorded Node probes in section 4.

## 3. Forward chains

### Proposal A: materializer, runner hook, API and CLI disclosure

- Seed key becomes optional → a materializer creates a normalized clone plus generated-secret descriptors (`observed`: stated proposal).
- Normalization before seeding → initial seed and `reset()` consume the same PEM (`inferred`, supported by `api.ts:61-76`).
- Generic `Emulator.generatedSecrets` exposes generated material in-process (`observed`: stated proposal).
- Branch: CLI prints PEM by default → CI and shared terminal logs retain signing material (`inferred`, admitted by proposer).
- Branch: hook exists only in `packages/emulate` → adapters continue to call raw `seedFromConfig()` and miss normalization (`inferred`, probed and confirmed).
- Branch: generated PEM lives in the entity → persisted snapshots include it (`inferred`, confirmed from store serialization).

### Proposal B: generate in seed, mutate config, expose by HTTP

- Missing seed key → synchronous generation inside `seedFromConfig()` (`observed`: stated proposal).
- Mutate the input object → a repeated seed in the same process sees the generated PEM (`inferred`).
- Branch: callers with reused mutable config retain identity across `reset()` (`inferred`, limited to `createEmulator`).
- Branch: persisted adapters restore the entity without reseeding → store identity survives, but the caller's original config still lacks the key (`inferred`).
- `/apps/:slug` returns private key → any process able to reach the emulator can obtain signing material (`inferred`).
- Route resembles a GitHub resource and adds a non-standard secret field → clients and documentation inherit a false API contract (`inferred`, admitted by proposer).

## 4. Probe log

### P1. Does reset re-run seeding?

Command:

`nl -ba packages/emulate/src/api.ts | sed -n '61,76p'`

Observed: `reset()` runs `store.reset(); seed();`. A key generated afresh inside an unprepared seed path rotates on reset.

Result:

- Refutes a naive "generate every seed call" shape.
- Supports Proposal A's normalize-once requirement.
- Proposal B survives only because it relies on mutating the caller's config object, an unstated public side effect.

### P2. Are there seed callers outside `packages/emulate`?

Command:

`rg -n "seedFromConfig\\(" packages examples -g '*.ts' -g '*.tsx'`

Observed: Next and Nuxt adapters call service `seedFromConfig()` directly at `adapter-next/src/index.ts:233` and `adapter-nuxt/src/index.ts:353`.

Result:

- Refutes Proposal A whole as a complete parity solution. Its runner hook covers CLI and `createEmulator`, not the adapters.
- Shows a defensive direct-call behavior is necessary if `private_key` becomes optional.

### P3. Do adapters seed on every start?

Commands:

`nl -ba packages/@emulators/adapter-next/src/index.ts | sed -n '212,239p'`

`nl -ba packages/@emulators/adapter-nuxt/src/index.ts | sed -n '332,359p'`

Observed: both restore persisted snapshots when available and skip seeding; otherwise they seed and persist.

Result:

- A generated key stored in the existing entity persists through adapter snapshots.
- Exposing the matching private key from an adapter is a separate contract. The generic `Emulator.generatedSecrets` surface does not exist there.
- Refutes silently claiming adapter parity in the first implementation slice.

### P4. Can an HTTP key route be protected by the current App auth?

Command:

`sed -n '1,130p' packages/@emulators/core/src/middleware/auth.ts`

Observed: App authentication itself requires possession of the key. A route that supplies the key cannot require App JWT auth without a circular dependency. Bearer fallback auth accepts arbitrary non-empty tokens when configured.

Result:

- Refutes Proposal B's HTTP route as a safe default.
- A separate capability token or loopback-only security contract would be required, which exceeds this slice.

### P5. Does `/apps/:slug` already exist?

Command:

`rg -n 'app\\.(get|post)\\(\"/apps' packages/@emulators/github/src -g '*.ts'`

Observed: no route. Existing `/app` returns `external_url` and `html_url` under `/apps/:slug`, but requires App JWT and does not disclose keys.

Result:

- Proposal B invents a new wire contract and overloads a GitHub-shaped URL with emulator-only secret behavior.

### P6. Does RSA-2048 PKCS#1 work with the verifier's public-key derivation?

Command:

```text
node:
generateKeyPairSync("rsa", { modulusLength: 2048 })
privateKey.export({ type: "pkcs1", format: "pem" })
sign("RSA-SHA256", message, pem)
verify("RSA-SHA256", message, createPublicKey(pem), signature)
```

Observed:

`{"pemHeader":"-----BEGIN RSA PRIVATE KEY-----","verified":true,"bytes":1679}`

Result: survives. PKCS#1 is compatible with the verifier path on #199.

### P7. What is the measured startup cost per key?

Command: five repeated `generateKeyPairSync("rsa", { modulusLength: 2048 })` calls, exporting PKCS#1.

Observed:

`[12.589, 24.531, 4.681, 19.508, 9.990] ms`, 1675–1679 bytes.

Result:

- Both proposals survive their "small synchronous startup cost" assumption on this machine.
- Opus's predicted 50–300 ms typical range was not observed here. It remains possible on slower or entropy-constrained systems, but is not promoted to fact.

### P8. What disclosure surfaces already exist?

Commands:

`rg -n 'app\\.(get|post)\\(\"/(?:_|__|apps)' packages/@emulators/*/src -g '*.ts'`

`nl -ba packages/emulate/src/commands/start.ts | sed -n '213,245p'`

Observed: emulator-only HTTP surfaces are externally reachable on the service port. CLI banner output is ordinary stdout.

Result:

- Refutes private-key HTTP disclosure and default stdout disclosure as safe defaults.
- In-process return data is the only existing surface that does not widen network or log exposure.

## 5. Failure-shape scoring

### Proposal A

| Shape | Verdict |
|---|---|
| S1 over-reach | **Hit if whole.** Generic secret descriptors, default stdout disclosure, two CLI flags, and adapter claims exceed the first observable. Designed out by limiting the first slice to `createEmulator`. |
| S2 under-reach | **Hit if described as complete parity.** P2 and P3 show adapters bypass the runner hook. Accepted as an explicit follow-up, not hidden. |
| S3 direction inheritance | Miss. It covers generation and access to generated material. |
| S4 proxy property | Miss after the real JWT exchange test is required. Merely seeing a PEM is insufficient. |
| S5 unregistered peer | **Hit if adapters are claimed.** Persistence knows the entity but not the in-process generated-secret descriptor. Designed out by excluding adapters from this slice. |
| S6 peer-version blindness | Not applicable. No multi-version process protocol. |
| S7 wrong layer | **Hit for stdout.** The key is generated correctly but delivered through logs rather than a caller-owned channel. Designed out. |
| S8 guard-derived cells | Potential hit if tests cover only missing key. Designed out with explicit-key, wrong-key, reset, and empty-string cells. |
| S9 test pins wrong thing | Clean only with force-red: removing normalization or generated-secret exposure must fail distinct tests. |
| S10 claim from prose | **Hit on performance estimate.** P7 observed 4.68–24.53 ms, not the proposed 50–300 ms range. The design does not depend on that estimate. |

### Proposal B

| Shape | Verdict |
|---|---|
| S1 over-reach | **Hit.** A new GitHub-shaped route returns private key material to network clients. No narrower use case justifies that public contract. |
| S2 under-reach | **Hit.** Config mutation stabilizes only callers that reuse the same mutable object and does not provide a safe consumer surface for adapters. |
| S3 direction inheritance | Miss. |
| S4 proxy property | **Hit.** Seeing a PEM over HTTP does not prove stable identity across reset or persistence. |
| S5 unregistered peer | **Hit.** Input mutation is new state outside Store snapshot semantics and outside typed output contracts. |
| S6 peer-version blindness | Not applicable. |
| S7 wrong layer | **Hit.** Secret delivery is placed on the service API layer, where any reachable client can request it. |
| S8 guard-derived cells | Potential hit if route tests omit explicit-key leakage and reset identity. |
| S9 test pins wrong thing | Clean for the JWT exchange, but not for safe disclosure. A successful exchange can coexist with a leaked key. |
| S10 claim from prose | Miss after measured RSA probe. |

## 6. Synthesis

**Kind: neither proposal whole; a reduced graft dominated by Proposal A.**

The first implementation slice is the public programmatic API only:

1. `GitHubSeedConfig.apps[].private_key` becomes optional, while `GitHubApp.private_key` remains a required string.
2. `@emulators/github` owns a pure seed materializer. It clones the GitHub seed, preserves every explicit non-empty `private_key` byte-for-byte, and generates RSA-2048 PKCS#1 PEM only for omitted keys.
3. `packages/emulate` calls the materializer exactly once inside `createEmulator`, before server creation. The normalized config is retained in the seed closure and reused by `reset()`.
4. `Emulator` gains a readonly generic `generatedSecrets` array. Only generated keys appear. Explicitly configured keys are never returned through this new surface.
5. The proof is a full public API flow: obtain the generated key from `Emulator.generatedSecrets`, sign a JWT, receive an installation token, call `reset()`, sign a fresh JWT with the same captured key, and receive another installation token.
6. No HTTP route, default stdout output, implicit disk write, entity change, auth-middleware change, or key rotation endpoint enters this slice.

Why not Proposal A whole:

- Its normalize-once ownership and in-process API are correct.
- Default stdout disclosure is an avoidable secret leak.
- CLI flags and adapters are separate contracts, not necessary to prove the first slice.
- Its direct `seedFromConfig` fallback must not silently generate inaccessible material. Direct callers that omit a key should receive a clear error directing them to the materializer until they have their own exposure contract.

Why not Proposal B:

- HTTP cannot be protected by the App credential it exists to supply.
- Returning a private key from `/apps/:slug` creates a misleading GitHub API surface and broadens network disclosure.
- Mutating user config is an implicit state channel outside Store and typed output contracts.

## 7. Follow-up slices

### CLI key delivery

Design separately. The leading candidate is an explicit output path or file descriptor with restrictive permissions, never default stdout. The CLI must say where it wrote the key without printing the key. This requires its own failure-path and overwrite contract.

### Next and Nuxt adapters

Design separately around persistence identity:

- First seed can generate and persist the key in the existing entity.
- Restore skips seed and must recover the same key from the snapshot.
- The consuming application still needs an in-process, server-only way to access the key without exposing it over the mounted HTTP route.

Do not claim full GitHub App ergonomics until these two slices land or are deliberately declined.

## 8. Carried assumptions for implementation

1. Adding a readonly generic `generatedSecrets` array to `Emulator` is acceptable source-compatible growth. Verify with type-check and current consumers.
2. The materializer uses Node `crypto.generateKeyPairSync("rsa", { modulusLength: 2048 })` and PKCS#1 PEM. Verify the built CLI/runtime target supports it.
3. Empty-string `private_key` is treated as invalid explicit input, not as omission. This prevents accidental silent correction of malformed config.
4. Generated keys last for one `createEmulator` instance and its resets, not across process restarts. Document this boundary.
5. Snapshots will contain the generated PEM because it is an entity field. That is accepted for embedded persistence but must be documented before adapter support is claimed.

## 9. Must-not-change handoff to Review Gate

- Explicit PKCS#1 and PKCS#8 keys still authenticate.
- Explicit key bytes are not altered and do not appear in `generatedSecrets`.
- Missing key generates exactly once per emulator instance.
- `reset()` does not rotate it.
- Invalid and wrong-key JWTs return `401`.
- Installation permissions and selected-repository restrictions remain enforced.
- GitHub OAuth Apps, webhook delivery, other services, and store entity shapes remain unchanged.
- No key appears in HTTP responses or CLI stdout.
