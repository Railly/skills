# Case: PR #366 round 4 — three misses whose dominant cause is that the round-3 fix commit was never gated

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open (head `1aba57e`, base `e0c2af5`)
Upstream status checked: 2026-07-27
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/366; retrospective run 2026-07-27

> Agent-authored record. Findings were supplied externally; this case records the reproduction and the gate autopsy, not the discovery.

## The three findings

1. **Expo package scripts still receive `HOST=127.0.0.1` in LAN mode, breaking Metro HMR.**
2. **A shell comment in a package script makes the injected `--port`/`--host` disappear, producing a 502.**
3. **Docs overstate support: the scope limit names compound scripts only, while the code also skips env-prefixed and wrapped scripts.**

## Reproduction

Worktree at head `1aba57e`, probe package with four scripts, calling the shipped helpers directly:

```
dev      -> ["bun","run","dev","--port","4321","--strictPort","--host","127.0.0.1"]   # "vite dev # start the dev server"
expo     -> ["bun","run","expo","--port","4321","--host","localhost"]
envdev   -> ["bun","run","envdev"]                                                    # "NODE_ENV=development vite"  — no injection
nested   -> ["bun","run","nested"]                                                    # "npm run dev:vite"           — no injection
expo LAN -> ["bun","run","expo","--port","4321"]                                      # --host correctly omitted
```

Finding 2, at the substrate. Script `"dev": "printf 'ARGS:[%s]\\n' \"$*\" # start the dev server"`:

```
$ bun run dev --port 4321 --strictPort
$ printf 'ARGS:[%s]\n' "$*" # start the dev server --port "4321" --strictPort
ARGS:[]
```

The injector did its job; the shell discarded the result. Exit 0, no error, framework on its default port, route 502s.

Finding 1, read at the code layer (`cli.ts:1391-1394` on the branch):

```ts
const basename = path.basename(commandArgs[0]);   // "bun", not "expo"
const isExpo = basename === "expo";
const isExpoLan = isExpo && (lanMode || isLanEnvEnabled());
const hostBind = isExpoLan ? undefined : "127.0.0.1";
```

`injectPackageScriptFrameworkFlags` resolves the script and correctly omits `--host` for Expo in LAN mode (probe row 5). The env binder, 400 lines away in another file, never learned to look through the script and exports `HOST=127.0.0.1` — the exact variable the carve-out exists to suppress. The two halves of one rule disagree, and each half in isolation reads as correct.

## Why the gate missed all three

**Dominant cause: the gate never ran on this tree.** The last run report for #366 is `2026-07-22-portless-cf596be.json`, whose own note says "bugs still present on branch as of 2026-07-22". The branch was then force-pushed; `git merge-base --is-ancestor cf596be HEAD` is false. Commit `1aba57e` — the fix for round 3, and the origin of findings 1 and 2 — has no run report and never had one. This is structural, not an oversight: the fix commit that closes a review round is written under the belief that the round is closed, so it is the commit least likely to be re-gated and the most likely to introduce the next round's defects. Two of three findings here live in it.

**Finding 2, past the guard-recursion clause.** `isCompoundShellScript` had been hardened twice already (glued operators 07-20, quoted metacharacters and redirections 07-22). Every round enumerated cells from the class the previous reviewer named — *what starts a new command* — so the detector accumulated separators and quoting and never reached the orthogonal class: *what makes the shell discard the tail*. The new-domain-matrix guard-recursion clause fired correctly and still missed it, because it treats the guard as the artifact under test while the artifact that actually needed enumerating is the substrate the guard models. Its failure signature also defeats testing-by-assertion: every unit test over the returned array passes, since the array is correct and the shell throws it away.

**Finding 1, invisible to a call-site sweep.** `gate.sh callers injectFrameworkFlags` enumerates call sites; the env binder is not a call site. It re-derives the framework inline from `commandArgs[0]`. The **resolution-rule consistency across consumers** lens is exactly the right lens and did not fire: its trigger read "a hostname, route, or key", and this is a framework-discovery rule. A rule that identifies *what the user asked for* is a resolution rule too.

**Finding 3, presence checked instead of accuracy.** `surfaces` and `siblings` both passed — every doc surface was in the diff. Docs-behavior-parity ran and confirmed the added sentence is present and true. Nothing checked whether its *exception list* is complete. The PR body enumerates four skip classes; the docs enumerate one. A partial exception list is worse than silence: it reads as exhaustive, so a user with `"dev": "NODE_ENV=development vite"` concludes the feature is broken rather than out of scope.

## Closed by

| finding | gate |
|---|---|
| all three (dominant) | **Head coverage** deterministic gate, `gate.sh covered <runs-dir>` — force-red against `1aba57e` |
| shell comment | **Shell-metacharacter coverage** deterministic gate, `gate.sh shellmeta` — force-red, flags `#`, `(`, `` ` ``, `$(` — plus the **Shell re-parse append domain** lens |
| Expo `HOST` | **Resolution-rule consistency across consumers** trigger widened to any discovery rule, pass question now greps the raw input alongside `gate.sh callers`; lens promoted (second independent instance) |
| docs scope limit | **scope-limit completeness** clause on docs-behavior-parity: enumerate every early `return` in the new path and check the docs cover each |

Two subsystem invariants added to [conventions](conventions.md): *framework discovery has two consumers, and they live 400 lines apart*, and *a package script is re-parsed by a shell, so appending is not composition*.

## Residual, not yet fixed on the branch

The four defects above are recorded, not repaired. Separately: `injectFrameworkFlags` gates the Expo LAN carve-out on `isLanEnvEnabled()` alone while `cli.ts` uses `lanMode || isLanEnvEnabled()`, so `--lan` passed as a flag (without the env var reaching the helper) diverges in a third way. Surfaced while reading for finding 1; not externally reported.
