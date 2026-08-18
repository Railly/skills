# Proposals, verbatim: emulate CLI generated-secret delivery

Date: 2026-08-13.

Target: `vercel-labs/emulate` at `2e49af2e91eae4377dbb3610b8bd2b0ac826daec`.

Both proposers received the same neutral contract in isolated detached worktrees. Neither saw the other proposal. Neither is the implementing runtime.

- Proposer A: `anthropic/claude-fable-5-thinking-high`, through Cursor Agent.
- Proposer B: `google/gemini-3.1-pro`, through Cursor Agent.

## Proposal A: Fable 5

### Shape

The CLI gains an opt-in durable secret delivery, and the `start` path adopts the already existing `prepareSeed` materialization that today only `createEmulator` uses.

1. New flag `--secrets-file <path>` on `emulate start` (`packages/emulate/src/index.ts`), threaded as `secretsFile?: string` through `StartOptions` into `startCommand`.
2. In the existing prepare loop in `packages/emulate/src/commands/start.ts` (which already runs entirely before `serve()` is ever called), call `loadedSvc.prepareSeed?.(svcSeedConfig)` per service, seed from the materialized config, and collect the returned `generatedSecrets` tagged with the service name. Use the same record shape as `GeneratedSecret` in `api.ts`: `service`, `kind`, `id`, `label`, `value`. GitHub's registry entry already wires `materializeGitHubSeedConfig` into `prepareSeed`, so no emulator-package change is needed. `createEmulator` and its `generatedSecrets` are untouched. Because `seedFromConfig` now receives materialized config from the CLI, its `requires private_key` guard no longer trips for omitted keys, while empty-key and duplicate-app validation errors from `materializeGitHubSeedConfig` now surface before any server exists.
3. A single write step sits between the prepare loop and everything that makes the process externally observable: Portless `registerAliases`, the serve loop, and the banner. If `--secrets-file` was given, serialize `{ "version": 1, "generated_at": <ISO>, "secrets": [...] }` and write it with `openSync(path, O_WRONLY | O_CREAT | O_EXCL, 0o600)`, then write, fsync, and close. `O_EXCL` makes an existing destination, including a symlink, a hard failure. A missing parent directory or unwritable location fails the same way. Any failure prints a non-secret error and exits with code 1. At that point no alias is registered, no port is bound, and no banner is printed. An empty secrets list still writes the artifact.
4. Without the flag, nothing changes: no file and no key on stdout or stderr. The banner may add one dim line such as `2 generated secrets withheld (rerun with --secrets-file <path>)`, which contains a count but never a value.
5. Update `README.md`, `skills/github/SKILL.md`, the web GitHub and configuration pages, and CLI help.

Explicitly supplied `private_key` values never enter `generatedPrivateKeys`, so they never reach the artifact. Stability across reset is a `createEmulator` concern and is untouched. The CLI has no reseed path.

### Predictions

1. With a seed whose GitHub App omits `private_key`, `npx emulate start --service github --seed seed.yaml --secrets-file ./out/secrets.json` in a fresh directory yields `600` from `stat -f '%Lp' out/secrets.json`, and `jq -r '.version, .secrets[0].kind' out/secrets.json` prints `1` and `github.app_private_key`. This is false if the file is missing, group or world readable, or lacks those fields.
2. After `touch secrets.json`, the same command exits nonzero and an immediate `curl -sf http://localhost:4000/rate_limit` fails with connection refused. This is false if the exit code is zero or curl connects.
3. A default invocation piped through `grep -c 'BEGIN RSA PRIVATE KEY'` prints `0`, and `ls` shows no new artifact. This is false if key material or a file appears.
4. `pnpm test` passes with `packages/emulate/src/__tests__/api.test.ts` unmodified because `createEmulator` is untouched.

### Cost

Roughly 60 to 90 lines in `start.ts`, about five lines in `index.ts`, 100 to 150 lines of CLI tests, plus four documentation surfaces. No new dependencies and no changes to `@emulators/github` or `@emulators/core`.

### What it makes worse

- A GitHub seed omitting `private_key` used to fail in `seedFromConfig`; now it starts a working server whose key is unrecoverable unless `--secrets-file` was passed.
- Refuse-if-exists means every rerun with the same path needs manual removal.
- The 0600 guarantee is POSIX-only; on Windows mode bits are largely a no-op.
- A durable plaintext secret file can be committed accidentally.
- `start.ts` gains a security-sensitive path whose ordering must stay before `serve()`.

### Rejected alternatives

- Printing keys to stdout or the banner because CI logs retain them.
- An HTTP endpoint because it widens network disclosure.
- Writing keys back into the seed because it mutates user input and risks commits.
- An unconditional default artifact path because it persists without a request.
- Overwrite-if-exists with temp-file-plus-rename because the destination-exists contract calls for refusal.
- Refactoring the CLI to call `createEmulator` because it would disturb Portless, banner, shutdown, and port allocation.

## Proposal B: Gemini 3.1 Pro

### Shape

- Add an `--out-secrets <path>` flag to the `start` command.
- Before initializing HTTP servers or Portless aliases, iterate through requested services and call `loadedSvc.prepareSeed(svcSeedConfig)` if it exists.
- Replace raw `svcSeedConfig` with the materialized `config`.
- Accumulate generated secrets and append the service name to each.
- If `--out-secrets` is provided, write `{ "version": 1, "secrets": [...] }` to the path.
- Use `fs.writeFileSync` with `flag: "wx"` and `mode: 0o600`.
- If the destination exists, is invalid, or cannot be written, print a message and exit with code 1 before `serve()` or the banner.
- Without the flag, keep generated secrets in memory for seeding but do not persist or print them.

### Predictions

1. `npx emulate start --seed app.json --out-secrets secrets.json` with a GitHub App lacking `private_key` creates an owner-only file. `stat -c "%a" secrets.json` outputs `600`.
2. If `secrets.json` already exists, the command exits with code 1 and a subsequent curl to port 4000 fails with connection refused.
3. Without `--out-secrets`, the command starts successfully and a grep for `BEGIN RSA PRIVATE KEY` in its output finds nothing.

### Cost

- One CLI flag that must be documented and maintained.
- More asynchronous preparation and filesystem error handling in `startCommand`.
- More failure handling to prove the server does not start when delivery fails.

### What it makes worse

- Debugging requires reading a file instead of seeing the key in the terminal.
- Restarting with the same output path requires deleting the previous file.

### Rejected alternatives

- Printing to stdout or stderr because logs can leak keys.
- Writing a default file automatically because persistence must be explicit.
- Overwriting the destination because clients may still rely on the old key.
- Mutating the seed configuration because it may be tracked in version control.
