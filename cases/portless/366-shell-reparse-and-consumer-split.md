# Case: PR #366 round 4 — three misses whose dominant cause is that the round-3 fix commit was never gated

Status: observed
Validation: unvalidated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open, all checks green (head `d1a78f7`, base `e0c2af5`; earlier shas retired by a message-only rewrite)
Upstream status checked: 2026-07-28
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

## Residual at round 4 (rounds 5 and 6 fixed all four; see below)

The four defects above are recorded, not repaired. Separately: `injectFrameworkFlags` gates the Expo LAN carve-out on `isLanEnvEnabled()` alone while `cli.ts` uses `lanMode || isLanEnvEnabled()`, so `--lan` passed as a flag (without the env var reaching the helper) diverges in a third way. Surfaced while reading for finding 1; not externally reported.

## 2026-07-27 round 5 — agnostic review of the fix, and the defect the fix reintroduced

The round-4 fixes shipped as `8f9d332`. An agnostic review (gpt-5.6-sol, full catalog, hint-free on the fix commit) returned three confirmed findings and one verdict of request-changes. Round-2 fixes shipped as `f558828`.

**P1, and it is the same bug.** `resolvePackageScriptTokens` was written to answer "which command will run", and then quietly also answered "may I append to it": it returned null for an unsafe script. `resolveFrameworkBasename` sat on top, so the Expo LAN carve-out went blind again for every script portless declines to touch. `"dev": "expo start --port 4567 # note"` supplies its own port, needs no injection at all, and still received `HOST=127.0.0.1` in LAN mode. The reviewer drove it against real Bun with a capture shim; the failure is the exact HMR-breaking condition the carve-out exists to prevent.

The part worth keeping: **the test added with the fix pinned the wrong behavior.** `returns null for a script portless declines to touch` asserted the conflation, so a green suite certified the regression. A force-red proves a test can fail; it does not prove the thing it asserts is the thing you wanted.

**P2, escaped space before `#`.** `--open /foo\ #bar` is one argument. The detector consumed the escape and then read the raw previous character, a space, and called the `#` word-initial. Injection that worked at `1aba57e` stopped working at `8f9d332`, so this is a regression the fix introduced, established by running both revisions rather than by reading either. Word start is now tracked as state.

**P2, the scope limit was still incomplete.** The round-4 fix rewrote five surfaces from one skip class to four. There are five: runner flags before the script name (`bun run --bun dev`) hit an early return whose own comment said so. The clause says to enumerate the early returns; the author assembled the list from the reported cases instead.

**Harness finding, not a product one.** The reviewer's force-red created a scratch worktree and ran `pnpm install` there. That repointed `node_modules` symlinks inside the worktree under review at a temp store, which was then deleted, leaving the reviewed checkout unbuildable after the review finished. A force-red belongs in the checkout under review, reverting and restoring in place; scratch fixtures belong outside the repository entirely.

Standing residual, recorded rather than fixed: a subshell (`(expo start)`) and a leading command substitution (`` `printf expo` start ``) hide the framework name from a tokenizer that does not parse shell syntax, so those Expo scripts still get `HOST` in LAN mode. Closing it means parsing shell, which is a larger change than this PR.

## 2026-07-28 round 6 — the corpus pays for itself, and a method error

The differential corpus landed green locally and failed on its first CI run, on a real defect: `&>` is a bash extension, and package managers hand scripts to `sh`, which is dash on Debian and Ubuntu. There `vite dev &> out.log --port 4567` backgrounds the framework and runs the redirect as its own command, so every appended flag is lost. Confirmed at the substrate by running the same line under bash and dash side by side, then by sweeping the whole corpus under `/bin/dash`: one violation before, zero after. The `&` exemption now covers only POSIX fd duplication.

This is the argument for the corpus in one data point. Five rounds of enumeration by imagination each shipped with the next case open; the corpus found the sixth on a shell the author's machine does not have, in CI, before a maintainer saw it.

Two harness defects came out of the same run, both mine. The sweep defaulted to bun and neither CI job installs bun, so the file skipped on both runners: a test nobody executes. And the shim helper forced `PATH=/usr/bin:/bin`, which on Windows leaves the child without System32, so the `.cmd` shim could never run.

The method error is worth more than either. I reported the Windows failures as pre-existing baseline because they also failed at `1aba57e`. That commit is on this branch. The tests arrived in `13c2c38`, the branch's first commit, so `ci-windows` had been red for the whole PR and it was ours to fix. **A pre-existing claim is only pre-existing against the merge base.** I asserted an exoneration instead of verifying it, and it exonerated an entire platform for several rounds.

All checks green at `d79d6bf`, including `ci-windows` for the first time in this PR's history.

## Delivery

Eight commits on top of `1aba57e`, all checks green at `d1a78f7`, including `ci-windows` for the first time in the PR's history. Fixed: the three external findings of round 4, the three from the round-5 agnostic review (two of which the round-4 fix introduced), and the dash-only `&>` defect the corpus found in round 6.

Still open and recorded rather than closed: a subshell (`(expo start)`) or a leading command substitution hides the framework name from a tokenizer that does not parse shell, so those Expo scripts still get `HOST` in LAN mode. Closing it means parsing shell.

Two process notes from the delivery itself. The commit messages first went out written as a debugging narrative in first person, which puts the author's reasoning process into a permanent record signed by someone else; they were rewritten to state the change and the reason only. And the message-only rewrite retired every sha the run reports name, so `gate.sh covered` now reports no coverage for the head, which is the check working as designed on its own author.
