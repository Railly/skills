# Case: PR #366 round 7 — a guard that classifies a subcommand must read the CLI's grammar, not the argument positions

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR pushed, all checks green (head `60394ae`, base `e0c2af5`)
Upstream status checked: 2026-07-28
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/366

> Agent-authored record. The round-7 finding was supplied by the maintainer; the two defects in the first fix for it were found by a blind agnostic gate, and are recorded here with the reproduction rather than the discovery.

## The maintainer's finding

> "The only blocking one for 366: injecting flags into non-server commands such as vite optimize. This is a regression: the command previously ran successfully and now exits with an unknown-option error. The existing build exclusion shows the PR intends to preserve non-server commands"

Reproduced at the substrate with the vite in the repo's own store (7.3.1):

```
$ node vite.js optimize --force                                      # exit 0, optimizes
$ node vite.js optimize --force --port 4567 --strictPort --host …    # CACError: Unknown option `--port`
```

The guard being pointed at was `NON_SERVER_FRAMEWORK_SUBCOMMANDS = new Set(["build"])`, a blocklist of one name scanned across every bare positional after the framework.

Scope correction the maintainer's wording invites: this is a regression **through the package-script path only**. On the merge base, `injectFrameworkFlags` carries no subcommand guard at all (`git show e0c2af5:…/cli-utils.ts`), so `portless run vite build` already injected on main. Same class, pre-existing, and closed by the same fix — but not introduced by this PR.

## First fix, and the defect it shipped

The blocklist was inverted into a per-framework allowlist of server subcommands plus a `defaultIsServer` flag, with the guard moved into `injectFrameworkFlags` so both consumers share it. Force-red passed (18 tests fell when the guard was neutered), the substrate case ran clean, 178 tests green.

An agnostic review (codex, gpt-5.6-sol, hint-free) found the hole in one pass: `invokesFrameworkServer` read the first bare positional as the subcommand without knowing which flags consume the next token.

```
vite --mode dev build      -> INJECTS   # `dev` is the value of --mode, not the subcommand
vite -m dev optimize       -> INJECTS   # the maintainer's exact command, one flag deeper
vite --mode preview build  -> INJECTS
```

`dev`, `serve` and `preview` are ordinary mode names, so this is not contrived. Verified at the substrate: `vite --mode dev build --port 4567` exits with the same `CACError` the maintainer reported. **The blocking finding was still open after the fix that claimed to close it.**

The test written with that fix — `vite --mode production build` declines — passed for the wrong reason: `production` is not in the allowlist, so the cell exercised the false-negative direction and never the false-positive one. Third instance on this PR of a test pinned by its own author certifying the thing it was written to prevent (rounds 5 and 7 being the others).

## Second fix, and the blind gate on it

The classifier now consumes flag values before reading the subcommand: `--name=value` never consumes, a bare `--` ends the scan, listed value flags consume the next token, and a CLI that declares no value flags is **not classified at all** once a flag precedes the subcommand. That last rule is what makes a missing entry fail safe: without it, `vp --mode dev build` reads `dev` as the subcommand and injects into a build.

A second hint-free gate ran on the fix commit, told explicitly not to trust the comments, commit messages, or tests, since the same author wrote all four. Three findings, two real:

- **Real: `nestedNonServer: { dev: ["status","stop","logs"] }` for astro was invented.** Taken from a doc line about astro 7 without executing anything; the astro installed in the repo is 5.17.3 and has no such subcommands. Its dispatcher reads `const cmd = flags._[2]` and validates no unknown flags at all (`astro/dist/cli/index.js:4`), so the guard bought nothing against the maintainer's class and cost a false negative. Removed from the table, the type, the logic, the test, the corpus and three doc surfaces. The comment asserting it and the test pinning it were both false.
- **Real: flags appended after a bare `--` never reach the framework.** Pre-existing on main; the corpus row `dashDash` claimed injection worked and a new test asserted the resulting array was correct. At the substrate, `vite dev -- --extra --port 4567` leaves vite on 5173 and nothing answers on 4567. Flags now splice in before the `--`; a *package script* carrying its own `--` is skipped instead, because appending can never reach past it. Verified both ways: `--port` before `--` binds 4567 and answers 200.
- **False: "bare `vite` and `vite dev` no longer get injected", reported as critical.** Refuted in one run across five shapes (argv and package script, wrapped and bare). The reviewer reasoned from "the first positional is the subcommand" being wrong for vite's default `[root]` command and did not read the absent-positional branch. Accepting it would have "fixed" working behavior.

## Verifying a CLI whose package is not installed

Three table entries were doc-sourced rather than executed, and the corporate registry answers 401 for both `npm install` and `pnpm`. Fetching the tarball straight from the public registry with curl bypasses the package manager entirely and reads the CLI's own option table:

```
curl -s https://registry.npmjs.org/@rsbuild/core/latest | jq -r .dist.tarball
curl -sL <tarball> | tar xz -C /tmp/rsb --strip-components=1
grep -oE "option\('(-., )?--[a-zA-Z-]+ [<\[]" /tmp/rsb/dist/626.js | sort -u
```

Results, all previously assumed:

- **rsbuild 2.1.8**: `cli.command('')` with `.alias('dev')` — the bare command *is* the dev server, so `defaultIsServer: true` is now source-backed. The value-flag list was right but incomplete (missing `--config-loader`, `--dist-path`, `--env-dir`, `--env-mode`, `--environment`, `--host`, `--output`, `--port`, `-o/--open`). Checked in the dangerous direction too: its real booleans (`--no-env`, `--source-map`, `--strict-port`, `--verbose`, `-w`) appear in no list.
- **@expo/cli 57.0.10**: `const defaultCmd = 'start'` confirms bare `expo` starts the server. It also has a `serve` command that serves the export and takes `--port` (`build/src/serve/index.js`), which the allowlist was missing — `"start": "expo serve"` got no port.
- **vite 6.4.1 and 7.3.1**: value flags taken as the union of both `dist/node/cli.js` option tables, after confirming that no entry is boolean in either version.
- **vite-plus 0.2.6**: its shipped docs name `vp dev` and `vp preview`, but the CLI is an opaque binary and `--port` support for `preview` could not be observed. `preview` was **not** added. An earlier reviewer suggested adding it; adding to an allowlist without execution evidence is exactly what produced the astro defect above.

## Test quality

Force-red per mechanism, not per fix, is what caught the weak tests. Removing the arity consumption fails 9 tests; removing the nested check failed 3 (before the mechanism was deleted); removing the unknown-grammar bail fails 1.

Removing rsbuild's value-flag list, however, failed **nothing**: `rsbuild --mode dev build` declines either way, once by arity and once by the unknown-grammar bail. Same verdict, different mechanism, so no assertion could see the data disappear. Closed by adding the cell where the two disagree — `rsbuild --env-mode production` must inject, and does not without the table.

## Outcome

`vite optimize`, `vite --mode dev build`, `vite -m dev optimize`, `vite --mode=dev build`, `vp --mode dev build` and `rsbuild --mode dev build` all decline. `vite --config ./cfg.ts`, `vite --logLevel info dev`, `vite --mode build` (a mode named "build"), `rsbuild --env-mode production` and `expo serve` all inject — four of them regressions the arity work closed on the way past. All checks green at `60394ae`, including `ci-windows`.

## Evidence

- Source: `cli-utils.ts` framework table, `frameworkPositionals`, `invokesFrameworkServer`, `isSafeToInjectIntoScript`; merge base compared with `git show e0c2af5:`.
- Runtime: vite 7.3.1 driven directly for the optimize, build, `--config` and `--` cases, with curl against the resulting dev server (200 on 4567); `bun`/`npm` child argv observed through a `printf` shim to confirm neither passes its own `--` to the script.
- Tests: 800 passing; force-red numbers above; 5 failures pre-existing at `d1a78f7` without this diff, caused by the branch name leaking into the inferred app URL.
- Review: two hint-free agnostic passes (gpt-5.6-sol) plus one perspective pass (fable); public PR thread.
- Artifact: `ci`, `ci-windows`, Socket and Vercel green at `60394ae`.

## Transferable lessons

1. **A classifier that reads argument positions is reading the wrong artifact.** What a token *means* is decided by the CLI's grammar — chiefly which flags consume the next token. Positional guessing produces both a false positive (`--mode dev build` reads as a dev server) and a false negative (`--config ./cfg.ts` reads as an unknown subcommand) from the same missing fact, so they arrive as one bug and are fixed as one.
2. **When the data is a claim about someone else's CLI, the safe default is silence, not a guess.** An entry that says "this is a server" is load-bearing in the dangerous direction; an absent entry only costs coverage. Make the absent case fail closed explicitly, so an unverifiable CLI degrades rather than misfires.
3. **A registry that rejects your package manager does not block verification.** The tarball is one curl away and the option table is in it.
4. **Force-red per mechanism, not per fix.** A test that survives the deletion of the data it supposedly pins is asserting a verdict two mechanisms can produce. Delete each mechanism separately and require a distinct failure for each.

## Exceptions

- react-native's entry (`start`, no default server) remains unverified by execution; both possible errors fall in the safe direction.
- A subshell (`(expo start)`) or a leading command substitution still hides the framework from a tokenizer that does not parse shell, so those Expo scripts get `HOST` in LAN mode. Unchanged from round 4; closing it means parsing shell.
- The `--` placement fix is broader than the maintainer's report and repairs a pre-existing main defect. Flagged for the maintainer rather than folded in silently.

## Confidentiality review

Public repository, public PR. No secrets, customer data, or employer-internal context. Local paths omitted; evidence cited by commit, file:line, and published package versions.
