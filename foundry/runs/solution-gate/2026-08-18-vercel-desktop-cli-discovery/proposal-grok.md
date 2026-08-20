HEAD’s launcher still goes through `/bin/zsh -lc` and the argv word `vercel`. The shape below replaces that discovery protocol; it does not change CLI verbs, effect keys, or the missing/failed mapping.

## 1. Shape

**Discovery state.** Runtime only. No vault/settings field, no user-picked path. A pure resolver (`resolveVercelExecutable`, living next to `spawnVercel` or in a tiny sibling module) takes the process environ (`PATH`, `HOME`, `ZDOTDIR`, `NVM_DIR`, `NVM_BIN`, `BUN_INSTALL`, `PNPM_HOME`) and returns either one absolute executable path or none. Inputs are `getenv` facts plus `stat`/`read` of small files. Nothing is sourced.

**Who owns selection.** The app owns a published total order. User rc/aliases do not. The user owns the bytes on disk; the resolver only names the first *usable* candidate (exists, not a directory, executable bit, symlink target exists and is executable). Broken/non-executable entries are skipped, not fatal.

Order:

1. Inherited `PATH`, left to right (so a Terminal-launched app still matches `command -v` without reading rc).
2. pnpm global: `$PNPM_HOME`, else `~/Library/pnpm`, else `~/.local/share/pnpm` (the onboarding command is `pnpm i -g vercel`).
3. Homebrew/global: `/opt/homebrew/bin`, `/usr/local/bin`. Do not run `brew`.
4. Bun: `$BUN_INSTALL/bin`, else `~/.bun/bin`.
5. nvm, without `nvm.sh`: `NVM_DIR` from env, else `$HOME/.nvm`, else `$ZDOTDIR/.nvm` when `ZDOTDIR` is set. Among nvm versions: inherited `$NVM_BIN/vercel` (active), then alias file `current`, then `default`, following alias text with a hard hop cap (including `lts/*` → `alias/lts/*`). Never “newest semver”. Other installed versions are ignored.

`ZDOTDIR` is a filesystem root for that nvm fallback and is never a reason to open `.zshrc`. `$HOME/.zshrc` is not consulted.

**Lifecycle.** Resolve on every `spawnVercel` and, when the result is none, inside `checkVercelCli` *before* any spawn. `retry_setup` already re-enters `checkVercelCli`, so install/upgrade/path change is picked up without FSEvents. Keep the discovered path as the path found (often a prefix symlink). Do not `realpath` into Homebrew Cellar, or an upgrade mid-session points at a deleted keg. No discovery subprocess, no spawn timeout (a timeout would retarget today’s CLI hangs into `.cancelled` → `.failed`).

**Launch contract.** Same `fx.spawn` collect/on_exit/keys. Operands and trailing `--no-color` unchanged. Do not exec the argv word `vercel`.

`SpawnOptions` has no `cwd`, and `/tmp` must stay. Keep a trampoline that is not a user shell:

`/bin/zsh -fc 'cd /tmp || exit 1; exec "$@"'` plus `$0`, then the **resolved path as one argv slot**, then the existing operands, then `--no-color`.

`-f` is `NO_RCS` (no `/etc/zshenv`, no `ZDOTDIR` files, no `.zshrc`). No `-l`, no `-i`. Spaces/metacharacters stay in argv; zsh does not parse them. If the resolver returns none, `checkVercelCli` sets `.missing` / phase / `clearError` itself and **does not spawn** (today `spawnVercel == false` is the argv-budget path into `.failed`). Later verbs still run only after a successful version probe; they re-resolve so a mid-session path change is visible.

## 2. Predictions

1. **Homebrew / GUI PATH.** `PATH=/usr/bin:/bin`, no TTY, `/opt/homebrew/bin/vercel` executable. Boot spawn argv contains that path as one slot (not the word `vercel`); the `--version` child `cliExitOk`s. Measurement: pending-spawn argv + exit.
2. **Bun.** Same PATH; only `~/.bun/bin/vercel` exists. Probe `cliExitOk`. Measurement: `stat "$HOME/.bun/bin/vercel"` vs resolved argv slot.
3. **nvm default vs multiple versions.** `$HOME/.nvm/versions/node/v20.*/bin/vercel` and `v18.*/bin/vercel` both executable; `alias/default` is `18.20.0`; `NVM_BIN` unset. Resolved path contains `v18.20.0`, not v20. Measurement: `cat "$NVM_DIR/alias/default"` vs argv path.
4. **`ZDOTDIR` + ignored rc.** `ZDOTDIR=/tmp/zdot`, `$ZDOTDIR/.zshrc` prepends a fake `vercel` onto PATH; real CLI only under `$HOME/.nvm` default. Resolver still returns the nvm path; `ps` during probe shows no `zsh -l`/`-i`. Measurement: argv path + process list.
5. **Rc side effects.** Same as (1) or (4), but `$HOME/.zshrc` / `$ZDOTDIR/.zshrc` is `echo '{oops}'; sleep 30; exit 1` (and/or job-control). Probe finishes in well under 2s (`date +%s` around `checkVercelCli`); collected version stdout has no `{oops}`; no SIGTSTP. Measurement: wall time, `EffectExit.output`, `ps`.
6. **Missing.** No usable candidate. `checkVercelCli` leaves `cli_state == .missing`, `needsVercelCli`, install string `pnpm i -g vercel`, `pendingSpawnCount() == 0` for the probe. Measurement: model + fake-effects spawn count, immediate.
7. **Spaces + metacharacters.** Executable at `/tmp/dir with spaces/vercel`; later spawn with `--name` `Casey's Mac`. Path is one argv item; the name stays its own slot; `--no-color` last. Measurement: argv equality (existing Casey’s Mac index, shifted only by the path replacing the word `vercel`).
8. **Stale symlink / non-executable.** `/opt/homebrew/bin/vercel` dangling or mode `0644`, Bun present. Bun wins. Measurement: `ls -l` of both + resolved path.
9. **Upgrade mid-lifetime.** First resolve Bun; delete `~/.bun/bin/vercel`; `retry_setup`. Second resolve is Homebrew or `.missing`. Measurement: second spawn argv or `cli_state`.

## 3. Cost

- **Files:** `spawnVercel` / `checkVercelCli` in `src/app.zig`; likely `src/cli_path.zig` so the order is unit-testable; `src/tests.zig` (boot argv today pins `/bin/zsh`, `-lc`, `argv[4] == "vercel"`).
- **Fields:** none durable. Optional Model scratch for the last path (not required: `fx.spawn` copies argv). Resolver uses stack buffers + environ.
- **Probes:** per resolve, one `stat`/`access` per `PATH` dir plus ~6 well-known paths plus ≤8 nvm alias reads. No child for discovery.
- **Caching:** none. Optional “last path” as a first `stat` then full walk on miss.
- **Maintenance:** Homebrew prefixes, pnpm/Bun default dirs, nvm alias grammar (`default` / `current` / `lts/*`). New managers are a list edit or honest `.missing`.

## 4. What it makes worse

A CLI that exists only as a zsh function/alias, or only because `.zshrc` mutates `PATH` to a custom prefix, becomes `.missing` in the GUI even when Terminal `vercel --version` works. That is the recovery path (`pnpm i -g vercel`), not a parse-rc fallback.

Also: with both a global (pnpm/Homebrew) and an nvm-pinned CLI, the GUI takes the global one. That can be a different major than Terminal, where nvm usually prepends. Putting nvm first would invert that and make onboarding’s `pnpm i -g vercel` + Check Again keep running the old nvm binary.

Longer absolute paths consume `max_effect_argv_bytes` (2048) where the word `vercel` did not; a huge path plus `--key=` can hit the existing reject → `.failed` path.

## 5. Rejected alternatives

- **`zsh -lic` / any interactive login.** Rc is arbitrary code; the no-TTY job-control stop already happened; blocking rc never reaches `.missing`. Authority forbids executing startup files to learn `PATH`.
- **Keep `-lc` and hope login files are enough.** P2: `-lc` sees Homebrew, not Bun/nvm. `.zshenv`/`.zprofile` still run and can print/fail/block. Comment that “login shell resolves nvm” is already false on this host.
- **Discovery spawn: `zsh -c 'source ~/.zshrc; command -v vercel'`.** Executes rc; ignores `ZDOTDIR` if `$HOME` is hardcoded; mixes rc stdout into collect; functions are not execve-able paths.
- **Regex-parse `.zshrc` / `$ZDOTDIR/.zshrc` for PATH.** Zsh is not a data format; misses `nvm`/`bun` functions that prepend at runtime; `$HOME` vs `ZDOTDIR` becomes a second parser.
- **`source nvm.sh` / bun shellenv.** Same as executing rc.
- **Exact Terminal/`command -v` parity.** Requires the rc protocol the authority declined.
- **Bundle, `pnpm i -g`, or rewrite user shell files.** Explicitly out of gate.
- **Direct exec of the resolved path with no trampoline.** `SpawnOptions` has no `cwd`; drops the `/tmp` contract.
- **User-picked sticky path in settings.** New state, goes stale on upgrade, unused by current onboarding (Check Again is already the recovery).
- **FSEvents / periodic re-probe.** Upgrade is already covered by resolve-on-spawn; extra watchers and effect keys for no extra discriminator.
- **`spawnVercel == false` for “not found”.** That return is argv/slot failure and already maps to `.failed`, not `.missing`.
