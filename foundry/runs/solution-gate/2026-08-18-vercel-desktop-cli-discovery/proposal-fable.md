The workspace is empty, so this is answered purely from the contract. Here is the proposed shape.

## 1. Shape

**One new component: a CLI locator.** A pure, side-effect-free function from `(environment dictionary, filesystem probe interface)` to an optional `CLILocation` value — resolved absolute executable path plus a provenance tag (pathEnv, homebrewARM, homebrewIntel, bun, nvmDefault, nvmHighest). Both inputs are injected so every discriminator cell is a unit test against a fake filesystem, not a machine setup.

**Discovery is filesystem probing only — no shell, ever.** The locator walks a fixed, ordered candidate table:

1. Each directory already on the inherited `PATH` (nearly free; makes the app correct when launched from a terminal).
2. `/opt/homebrew/bin/vercel`, then `/usr/local/bin/vercel`.
3. `~/.bun/bin/vercel` (honoring `BUN_INSTALL` only if present in the app's inherited environment).
4. nvm: enumerate `~/.nvm/versions/node/*/bin/vercel` (honoring inherited `NVM_DIR` if set). Precedence inside nvm: resolve the `alias/default` file (bounded alias-chain depth, `lts/*`/`node` handled by matching against installed dirs); if unresolvable, take the highest installed version whose `bin/` contains `vercel`. A terminal session's "active" version is per-process PATH state and is unknowable without executing rc code — by the authority decision, we substitute this documented deterministic rule instead of chasing parity.

First candidate passing validation wins; validation is: symlinks resolve, target is a regular file, `access(X_OK)` succeeds. A broken symlink or non-executable file is skipped, not fatal. ZDOTDIR is "accounted for" by construction: nothing reads any rc file, so relocated zsh configs cannot change or break discovery, and rc print/block/exec/job-control side effects are unreachable.

**Ownership and lifecycle.** The locator owns selection exclusively; the existing process runner never re-decides. The runner holds the `CLILocation` as an in-memory cache (no persistence). Before every launch it revalidates the cached path (two stats); on failure it rediscovers once, so an upgrade that moves the binary (nvm v20.1 → v20.3, brew relink) heals within one invocation. Locator returns nil → existing `.missing` state, unchanged. Spawn-time ENOENT after a successful validation (deletion race) triggers one rediscovery, then `.missing`. Everything after a successful exec — nonzero exit, output parsing — keeps the existing `.failed` semantics untouched.

**Launch contract.** `posix_spawn`-family API (Swift `Process`) with `executableURL` = the resolved path and `arguments` = the existing operand array verbatim (subcommands, operands, trailing `--no-color`), cwd `/tmp`, exactly as today. No `sh -c`, so spaces in the executable path are one argv[0] and metacharacters in operands are inert distinct argv items with zero quoting logic. One necessary addition to the child environment: prepend the resolved executable's parent directory to the child's `PATH`. This is load-bearing — npm-installed `vercel` is a script with a `#!/usr/bin/env node` shebang, and under `PATH=/usr/bin:/bin` the exec would fail even with a correct absolute argv[0]; the sibling `node`/`bun` always lives in that same directory for every supported layout.

## 2. Predictions

- **P1 (nvm + shebang).** On a machine where vercel exists only via `nvm install 20 && npm i -g vercel`, launching the app from Finder and triggering any CLI action succeeds; `ps -o args=` on the child shows argv[0] under `~/.nvm/versions/node/v20.*/bin/`. Falsified if the child fails with `env: node: No such file or directory` — which is exactly what happens if the PATH-prepend in the launch contract is dropped.
- **P2 (rc immunity).** Append `echo POISON; sleep 60; suspend` to `$ZDOTDIR/.zshrc`, `~/.zshrc`, and `~/.zprofile`. Discovery wall-clock stays under 100 ms and `POISON` appears in no captured output; `fs_usage`/dtrace during discovery shows zero fork/exec syscalls. Any rc effect observable in the app falsifies the no-shell claim.
- **P3 (missing is prompt).** With no vercel anywhere, time from trigger to the `.missing` state is bounded by a few dozen stat calls — measurably under 100 ms, no subprocess spawned. A hang or a spawn attempt falsifies it.
- **P4 (argv fidelity).** Point discovery at a stub at `~/dir with spaces/bin/vercel` that prints `$#` and each argument on its own line; invoke with an operand like `a b;$(reboot)`. The stub reports exactly the expected count with the operand byte-identical as one item. Any splitting or expansion falsifies the no-shell launch.
- **P5 (determinism).** With Homebrew and nvm installs simultaneously present, 100 consecutive launches all show the same argv[0] (the Homebrew path, per table order).
- **P6 (self-heal).** `rm` the resolved binary mid-session; the next trigger either runs the next candidate or lands `.missing` — it never surfaces `.failed` from a stale cache ENOENT.

## 3. Cost

One new source file for the locator (~200 lines: candidate table, nvm alias resolver, semver-ish directory sort, validation) plus one test file with the fake-filesystem cells; a small edit in the existing runner (use resolved URL, PATH prepend, revalidate-then-rediscover hook). No persistence, no new config surface, no entitlement changes — but note the assumption that the app is not App Sandbox-restricted, since probing `~/.nvm` and exec'ing user binaries requires it (already true if the app runs vercel today). Runtime cost: worst case ~20 stats plus one readdir of `versions/node` and bounded alias-file reads per discovery; two stats per subsequent launch. Maintenance is concentrated in the candidate table (adding pnpm/volta/fnm/mise rows later) and in tracking nvm's alias conventions.

## 4. What it makes worse

Terminal parity is deliberately sacrificed. A user whose rc file puts a custom prefix first (`~/tools/bin/vercel`), wraps vercel in a shell function, or relies on a nonstandard `NVM_DIR` set only in `.zshrc` will see the app run a *different* binary than `which vercel` shows in their terminal — possibly an older Homebrew install shadowing their newer nvm one, per the fixed table order — or see `.missing` despite a working terminal. There is no in-app expression of "use this specific binary" in this shape, and the hardcoded layout knowledge rots silently: if bun or nvm move their default directories, affected users degrade to `.missing` until the table is updated. That confusion is the accepted price of refusing rc execution; the mitigation is honest `.missing` copy (and, if ever needed, an explicit user-supplied path override as a later, separate decision).

## 5. Rejected alternatives

- **`zsh -ilc 'command -v vercel'` (harvest the interactive login PATH).** Killed by the discriminator cells directly: an rc file containing `sleep`, a prompt read, `suspend`, or bare `echo` blocks the GUI subprocess, corrupts the parsed output, or (with no controlling terminal) wedges on job control — and it hands arbitrary user code execution inside an app-owned process, which the authority decision forbids outright.
- **`zsh -lc` (login, non-interactive) as a "safer" variant.** Still executes arbitrary `.zprofile`/`.zshenv` code (same side-effect class), and *also* misses the many users who set PATH in `.zshrc` — unsafe and incomplete simultaneously.
- **Textually parsing rc files for PATH assignments.** Rc files are programs: `eval "$(brew shellenv)"`, conditionals, and ZDOTDIR indirection chains mean a parser either misses real PATHs or grows into an interpreter, which is rc execution with extra steps.
- **`launchctl getenv PATH` / `/etc/paths` / environment.plist.** The GUI login environment is precisely the minimal PATH the contract starts from; this covers no per-user cell (Bun, nvm) and usually not Homebrew ARM. Fails the mandatory cells.
- **Bundling or auto-installing the CLI.** Explicitly forbidden ("no bundling/install/update/mutation"), and it would create version skew against the user's terminal.
- **Launching through `sh -c` with a composed string.** Killed by the space/metacharacter cells: preserving operands byte-for-byte would require a quoting layer that is itself the standing bug; the argv-array contract makes the entire problem nonexistent.
- **Ask-the-user-for-a-path as the primary mechanism.** Fails the observable "find and run" for Homebrew/Bun/nvm without interaction; acceptable only as a future escape hatch for the parity gap in section 4, not as the discovery mechanism.
