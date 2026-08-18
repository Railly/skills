# Proposals, verbatim: emulate GitHub App keypair ergonomics

Date: 2026-08-12.
Target: `vercel-labs/emulate` at `a72de43124fca64e370640312ae1e5ee5c096341`.

Both proposers received the same neutral contract and a read-only evidence bundle from isolated detached worktrees. Neither saw the other proposal. Neither is the implementing runtime.

- Proposer A: `anthropic/claude-opus-5`, through Vercel AI Gateway.
- Proposer B: `google/gemini-3.1-pro-preview`, through Vercel AI Gateway.

## Proposal A: Claude Opus 5

### Shape

**State.** The private key continues to live exactly where it lives today: the `private_key` field of the `GitHubApp` entity in `store.collection("github.apps")`. No new collection, no new `store.setData` key, no change to `StoreSnapshot`/`CollectionSnapshot` shape. `GitHubApp.private_key` stays a required, non-nullable `string`, so the resolver in `registry.ts` (`createAppKeyResolver` → `{ privateKey, slug, name }`) and `@emulators/core`'s `authMiddleware`/`AppKeyResolver` need no change at all: that is what preserves RS256 verification, PKCS#1/PKCS#8 acceptance, and the `401` path for bad JWTs.

**What becomes optional.** Only the *seed* type widens: `GitHubSeedConfig.apps[].private_key` becomes optional. The entity does not.

**Who decides.** Three owners, deliberately separated:

1. `@emulators/github` owns *how* a key is produced and what "missing" means. It gains one exported pure function (call it a materializer) that takes a `GitHubSeedConfig` and returns a normalized clone plus a list of what it had to generate: `{ app_id, slug, private_key }`. Generation is RSA-2048 exported as PKCS#1 PEM (matching what real GitHub hands out, and already exercised by the existing token test). `seedFromConfig` keeps a defensive inline fallback so a direct library caller that skips normalization still gets a store invariant of "key is a non-empty string": but that fallback is not the surface the observable uses.
2. `packages/emulate` (registry) owns *when* normalization happens. `LoadedService` gains one optional hook alongside the existing `createAppKeyResolver` precedent: a `prepareSeed(config) -> { config, generatedSecrets }`. Only the github entry implements it. The registry also owns the shared, service-agnostic secret descriptor: `{ service, kind: "github.app_private_key", id, label, value }`.
3. `packages/emulate` runners (`api.ts`, `commands/start.ts`) own *exposure and stability*. Normalization runs **once**, before `createServer`, and the normalized config: not the raw one: is what both the initial `seed()` and `reset()` pass to `seedFromConfig`. That is the whole reason the key survives `reset()` instead of being re-minted, given `reset()` today is `store.reset(); seed();`.

**Public contract changes.**
- `Emulator` gains a readonly `generatedSecrets` array, populated once at construction and stable across `reset()`. This is the programmatic surface the test uses: read the PEM, sign an RS256 JWT with `iss = app_id`, POST to the existing `/app/installations/:id/access_tokens`, expect `201` + `ghs_`.
- The CLI banner in `start.ts` gains a "Generated secrets" block, printed from the same descriptor list, with the PEM in standard armor so it is greppable from stdout. An opt-out flag (`--no-print-secrets`) and an opt-in `--secrets-out <dir>` are the escape hatches; neither writes into the repo by default.
- Docs: `packages/@emulators/github/README.md` seed example shows `private_key` as optional and points at the CLI banner / `generatedSecrets`.

**Explicitly unchanged.** If `private_key` is a non-empty string, the materializer copies it through byte-for-byte and emits no descriptor. OAuth apps, IDs, slugs, permissions, events, installations, webhook delivery and signing, and the installation-token restriction logic in `routes/apps.ts` are untouched. Non-github services never see the hook.

### Predictions

1. **Reset does not rotate the key.** A vitest in `packages/emulate` that calls `createEmulator({ service: "github", seed: { github: { apps: [{ app_id, slug, name, installations: [...] }] } } })`, captures `emulator.generatedSecrets[0].value`, calls `emulator.reset()`, then signs a *fresh* JWT with the *captured* PEM and POSTs `/app/installations/:id/access_tokens`, receives `201` with a `ghs_` token. If normalization were left inside `seedFromConfig`, this exact test returns `401` after reset. Command: `pnpm --filter emulate test`.
2. **Explicit keys are untouched and unlisted.** Same test file, second case: seed an app with a PEM generated in-test. `emulator.generatedSecrets` has length `0` for that app, a JWT signed with that PEM returns `201`, and a JWT signed with a second, unrelated PEM returns `401`. Command: `pnpm --filter emulate test`.
3. **No regression in the github package.** Every existing case in `packages/@emulators/github/src/__tests__/webhook-installation.test.ts`: including the seven that pass the literal `private_key: "fake-key"` and the one that passes a real PKCS#1 PEM: still passes without edits, and `tsc` reports no errors from widening the seed field. Commands: `pnpm -r build`, `pnpm -r test`.
4. **CLI disclosure is conditional.** `node packages/emulate/dist/cli.js start --service github --seed seed-no-key.yaml | grep -c 'BEGIN RSA PRIVATE KEY'` returns `1`; the same command against a seed that supplies `private_key` returns `0`. Falsifiable in either direction.
5. **Startup cost is paid only on generation.** `time node packages/emulate/dist/cli.js start --service github --seed seed-no-key.yaml` is measurably slower to first banner than the same seed with an explicit key: expect roughly 50–300 ms per generated 2048-bit key on typical CI hardware, and ~0 ms delta when no app omits a key. If the delta is unmeasurable in the no-key case, generation is firing when it should not.

### Cost

**Files.** `packages/@emulators/github/src/index.ts` (seed type + materializer export + defensive fallback in the `config.apps` loop), `packages/@emulators/github/README.md`, `packages/emulate/src/registry.ts` (`LoadedService` hook + descriptor type + github wiring), `packages/emulate/src/api.ts` (normalize once, hold normalized config for `reset()`, extend `Emulator`), `packages/emulate/src/commands/start.ts` (normalize per prepared service, banner section, two flags), plus one new test file. Roughly five source files.

**Fields.** One seed field widened to optional. One new descriptor type with four or five fields. One new readonly property on `Emulator`. Zero entity fields added or changed.

**Public surface.** Two additions (`Emulator.generatedSecrets`, the exported materializer) and one optional internal hook on `LoadedService`. Both additions are permanent API you must keep working; the descriptor `kind` string becomes a de-facto stable identifier consumers will match on.

**Persistence.** None. `snapshot()`/`restore()` serialize the same `github.apps` rows they do today, and the generated PEM rides along in the existing `private_key` string: meaning a snapshot now contains a key the user never wrote down, which is a disclosure surface for anyone who serializes state to disk.

**Migration.** None required for existing configs; the change is purely a widening. Consumers who typed against `GitHubSeedConfig` and relied on `private_key` being required will see a weaker type, which can silently mask a genuinely missing key in their own tooling.

**Runtime.** One synchronous RSA-2048 keypair generation per keyless app per process start. `generateKeyPairSync` blocks the event loop; with several keyless apps in one seed the banner is delayed proportionally. Entropy-starved sandboxes and emulated CPUs make this worse than the numbers above.

**Maintenance.** Two normalization call sites (`api.ts` and `start.ts`) that must stay in agreement: the same duplication that already exists for token setup, `resolveBaseUrl`, and `createAppKeyResolver` wiring, now extended. The key format (PKCS#1, 2048 bits) becomes an implicit contract that consumers will hard-code against. The secret-printing path must be kept in sync with the docs and with any future secret kinds.

### What it makes worse

**Private key material now reaches stdout by default.** The CLI banner is captured by CI log aggregators, `tee`d into artifacts, and scrolled through in shared terminals. A user who previously had to deliberately place a PEM on disk now gets one emitted into their build log every run, and the flag to suppress it is opt-out rather than opt-in. That is a genuine reduction in the default security posture of `emulate start`, accepted only because the property demands a discoverable surface.

Second, **restart nondeterminism.** With an explicit key, a JWT minted in one process is verifiable in the next; with a generated key it is not. Anyone who caches an App JWT or a signing key across container restarts, or who records a fixture from a running emulator, now has a flow that breaks on restart and works on reset: a confusing asymmetry that did not exist before.

Third, **snapshot leakage widens.** `store.snapshot()` now carries a key the operator never chose, so state dumps shared for debugging carry usable signing material.

### Rejected alternatives

- **Generate only inside `seedFromConfig`, no runner normalization.** `api.ts` implements `reset()` as `store.reset(); seed();`, and `seed()` re-invokes `seedFromConfig` with the original config. Generation at that layer therefore mints a *new* key on every reset, invalidating any key the consumer already read. Directly contradicts "reset … does not … unexpectedly regenerate key material" and fails prediction 1.
- **Have the test read `getGitHubStore(store).apps`.** Excluded by the brief ("not direct access to an internal store"), and mechanically impossible from the public API anyway: `createEmulator` returns only `{ url, reset, close }`: `store` never escapes.
- **Serve the key over an emulator HTTP route (e.g. `GET /_emulate/apps/:id/private-key`).** Would make signing material readable by any process that can reach the port, with no auth in front of it (`authMiddleware` has a `fallbackUser` and public endpoints already work unauthenticated). It also invents a route the real GitHub API does not have, in a package whose README advertises a drop-in endpoint list. And it would have to special-case explicitly-configured keys to avoid "do not leak configured key material," adding exactly the branch this design avoids.
- **Ship a fixed default PEM in the package or in `initConfig`.** Barred by "does not require committing a generated private key," and every installation would share one publicly known signing key. `initConfig` is additionally the wrong place: `emulate init` writes a file users commit, which reproduces the original "user must store key material" problem.
- **Derive the key deterministically from `app_id`.** Node's `generateKeyPairSync` accepts no seed. Deterministic RSA would require a userland keygen dependency in `@emulators/github`, whose crypto usage today is stdlib-only (`createHmac`, `randomBytes`, and `sign` in tests). Not worth a new dependency to buy cross-restart stability that an explicit `private_key` already provides.
- **Make `GitHubApp.private_key` nullable and mint lazily inside `createAppKeyResolver`.** The resolver is a synchronous read invoked during JWT verification; making it mutate the store inverts its role. Worse, lazy minting cannot satisfy the observable: the consumer must hold the key *before* it can sign the JWT that would trigger the minting.
- **Write the PEM to the working directory by default.** Creates a file that lands in `git status` and eventually in a commit, plus shutdown-cleanup obligations that `start.ts`'s current shutdown path (alias removal, `store.reset()`, `srv.close()`) does not have. Retained only as an opt-in `--secrets-out` flag.
- **Add an `apps:` block with a generated key to the github `initConfig`.** Changes `emulate init` output and any assertions over it, and pushes key material into a committed config file: the same trap as the fixed-default option.

## Proposal B: Gemini 3.1 Pro Preview

### Shape

- **State location**: The private key lives in the `GitHubApp` entity within the `gh.apps` collection (specifically the `private_key` field).
- **Decision ownership**: `seedFromConfig` in `github/index.ts` owns the decision to generate an RSA key pair if `private_key` is missing from the app's seed config. `appsRoutes` in `github/apps.ts` owns exposing it to the consumer.
- **Contract changes**:
  - `GitHubSeedConfig.apps[].private_key` becomes optional (`private_key?: string`).
  - `seedFromConfig` synchronously generates a 2048-bit RSA key pair using Node's `crypto.generateKeyPairSync` if the key is omitted. It mutates the provided `config` object to backfill the `private_key` field, ensuring that `reset()` calls (which re-run seeding with the same config object) reuse the generated key instead of regenerating it.
  - A new public route `GET /apps/:app_slug` is added to `appsRoutes`. It returns the standard GitHub App JSON representation, augmented with a `private_key` field containing the PEM string, providing the consumer-accessible surface.

### Predictions

1. Starting the emulator with a seed config where an app omits `private_key` will succeed. Running `curl http://localhost:4000/apps/<slug>` will return a `200 OK` response containing a JSON object with a `private_key` field starting with `-----BEGIN RSA PRIVATE KEY-----`.
2. A test script that fetches the key from `GET /apps/<slug>`, signs a JWT with it, and sends it in the `Authorization` header to `POST /app/installations/<id>/access_tokens` will receive a `201 Created` response with a `ghs_` token, proving the generated key is cryptographically valid and correctly registered in the emulator's auth middleware.

### Cost

- **Files**: `github/index.ts` (types and seed logic), `github/apps.ts` (new route).
- **Fields**: `GitHubSeedConfig.apps[].private_key` becomes optional.
- **Public surface**: Adds the `GET /apps/:app_slug` endpoint, returning standard app metadata plus the `private_key`.
- **Persistence/Migration**: No changes to existing entities; `GitHubApp` already stores `private_key`.
- **Runtime**: Generating an RSA key pair takes a few milliseconds during startup/seeding.
- **Maintenance**: Minimal; the RSA generation uses standard Node.js `crypto`.

### What it makes worse

- Synchronous RSA key generation (`generateKeyPairSync`) blocks the Node.js event loop. If a seed configuration contains many GitHub Apps without pre-configured keys, emulator startup time will noticeably degrade.
- Including `private_key` in the `GET /apps/:app_slug` response adds an undocumented, non-standard field to a GitHub API response, which could cause deserialization errors in strictly-typed clients (like Octokit with strict schema validation) that expect exact matches with GitHub's OpenAPI spec.

### Rejected alternatives

- **Return the private key in `GET /app`**: Rejected because `GET /app` requires an App JWT for authentication, creating a chicken-and-egg problem where the consumer cannot fetch the key without already having it.
- **Add a `getAppKey(slug)` method to the programmatic `Emulator` instance**: Rejected because the `Emulator` interface in `@emulators/core` is generic across all services (Vercel, Slack, etc.). Adding GitHub-specific methods would violate the plugin architecture.
- **Write the generated key to a local `.pem` file on disk**: Rejected because it introduces file I/O side effects, complicates cleanup in ephemeral CI environments, and risks accidentally committing the key if not properly gitignored.
