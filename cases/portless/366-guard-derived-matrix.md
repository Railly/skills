# Case: Review gate on script-flag forwarding; matrix cells derived from the guard under test missed a runner-wrapped bypass

Status: observed
Validation: unvalidated
Human review: maintainer-reviewed (2026-07-20, two edge cases, both fixed)
Maintainer acceptance: pending
Delivery: PR pushed (head `1aba57e`, rebased onto main `e0c2af5` 2026-07-22)
Upstream status checked: 2026-07-22
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/366; base 74c9868; heads reviewed a4f0628 then a9c7726

> Agent-authored record of a live review-gate run. Evidence is session-run output plus public PR state; claims and statuses pending human review.

## 2026-07-22 update — round 3, three maintainer findings; blind gate caught all three

The maintainer (ctate) raised three more findings on #366. All confirmed by reading the diff at head `cf596be`; none fixed on the branch as of 2026-07-22 (no commits since 07-21). A blind review-gate run (codex, gpt-5.6-sol, hint-free) surfaced all three independently at exact file:line before harvest.

- **Quoted metacharacters and redirections misread as compound scripts.** `"vite dev --open '/foo&bar'"` and `"vite dev >vite.log 2>&1"` are single commands, but the raw-string control-operator test (added in the 07-20 fix) sees `&`/`>`, classifies them compound, skips injection, and leaves Vite on 5173 while portless routes to the assigned port → 502. Same guard-derived blind spot, one form deeper: the detector's cells never included quoted or redirection forms the shell still honors. Blind gate: `cli-utils.ts:1144`.
- **Partial flag injection blocked by a present sibling.** With app port 4567 and `"dev": "expo start --port 4567"`, an existing `--port` returns before independently injecting the missing `--host localhost`, so Expo stays in LAN mode. The injection matrix tested all-present/all-absent, never the partial cell. Blind gate: `cli-utils.ts:1201`.
- **Test shim shadowed by a real binary.** The new integration tests fail when Bun is installed beside Node: `spawnCommand` resolves the real Bun ahead of the PATH-prepended shim, so no capture file is written and the test reads a missing file. Test-harness hermeticity, not a product bug. Blind gate: `cli.test.ts:1724`.

Catalog updated: new-domain-matrix detector cells now include quoted metacharacters, redirections, and the partial-injection cell; new **Shim hermeticity** lens added. Harvest-loop validation, not unseen-bug proof.

**Fix (pushed 2026-07-22, commit in `1aba57e`).** Three changes in `cli-utils.ts` (+ `cli.test.ts`): (1) the regex `SHELL_CONTROL_OPERATOR_PATTERN` was replaced with `isCompoundShellScript()`, a quote-aware scanner that tracks single/double-quote and escape state (like `splitCommand`) and only counts `;`, `|`, newline/CR, or a non-redirection `&` outside quotes as a separator — so `'/foo&bar'` and `2>&1`/`&>`/`>&` no longer misclassify a single command; (2) the blanket `if (hasCliOption(..., "--port")) return` early-out was removed so `injectFrameworkFlags` injects `--port` and `--host` independently (partial-injection); (3) the integration-test shim is written to `node_modules/.bin/<pm>` and run under an isolated `PATH`, so a real `bun` colocated with Node (which `augmentedPath()` prepends) can no longer shadow it. The exact decoy-bun failure (`ENOENT capture.json`) was reproduced red, then green with the decoy still live. Issue candidates left open: `augmentedPath()` unconditionally prioritizes Node's own bin dir over the caller's `PATH` (intentional for Windows `.cmd`, but can shadow a user's chosen runtime in production), and the `npm` forwarding path can't be shadowed the same way in tests.

## 2026-07-20 update — the same guard-derived blind spot recurred on the fix's own new guard

The maintainer reviewed #366 and raised two edge cases. Both are the same mechanism as this case, one layer deeper: the guard-derived-cells rule was applied to the reused helper but not recursively to the guards this PR itself added.

- **`bunx vite build` still forwarded server flags.** The build guard inspected a fixed `rawScript[1]`, which a runner wrapper shifts. This is the exact bypass this case names; it had been left as a deliberate conservative descope, and the maintainer re-flagging it means the descope was wrong. Fixed in commit `f35193c`: locate the framework past the runner via `findFrameworkIndex`, then scan every bare positional after it (also catches `vite --mode production build`, a flag value preceding the subcommand).
- **`vite dev&&node` (glued operator) still forwarded and 502'd.** The compound-script skip guard this PR added matched operators as whole tokens; `splitCommand` keeps a glued `&&` inside one token, so it slipped through. The guard's own cells inherited its whitespace-tokenization assumption. Fixed in commit `cf596be`: test the raw script string (not the tokens) for control operators, including newline separators, which `splitCommand` also collapses.

The first cold agnostic gate on this session's fix caught both `bunx vite build` and the glued form plus the newline residual before the maintainer's list arrived; a re-gate against the committed tip returned PASS. Catalog updated: new-domain-matrix now carries an explicit guard-recursion clause (a detector the fix adds is itself an artifact under test). Delivery advanced observed → PR pushed; maintainer acceptance still pending.

## Observed condition or claim

Pre-push review-gate run on PR #366 (`injectPackageScriptFrameworkFlags`: forward framework flags through `<pm> run <script>` indirection). Two review agents ran in parallel on a dedicated worktree: behavioral lenses (force-red, new-domain matrix, error-path forcing, argument boundaries) and docs-behavior-parity plus surface adjudication. One external round followed (Vercel Agent Review bot at a9c7726) and produced one confirmed finding the gate had missed.

## Red signal

- Force-red on the diff's own tests: reverted the cli.ts call site and neutered the helper body (export kept so it compiles), rebuilt. 7 of 15 unit and 2 of 4 integration tests went red; every positive-forwarding assertion failed, every negative guard assertion stayed green. Restore and rebuild: 19/19 green.
- External-miss repro (this session): package.json `{"scripts":{"dev":"bunx vite build"}}`, then `injectPackageScriptFrameworkFlags(["bun","run","dev"], 4567, dir)` returns `["bun","run","dev","--port","4567","--strictPort","--host","127.0.0.1"]`. Dev-server flags forwarded to a build command; the `NON_SERVER_FRAMEWORK_SUBCOMMANDS` guard inspects only `rawScript[1]` (cli-utils.ts:1163 area) while `findFrameworkBasename` (cli-utils.ts:1040-1080) skips runner wrappers (npx, bunx, pnpx, yarn/pnpm dlx and exec) before matching the framework.

## Method used

1. Deterministic layer (`gate.sh`): style (em-dash hits exempt per house norm), surfaces (2 findings: cli.ts touched without README.md and skills/portless/SKILL.md), siblings, stale.
2. Behavioral lenses via a review agent on a separate model from the writer: matrix regenerated post-guards (user `--port` after `--`, runner flags between run and script, env-prefixed scripts, nested delegation, build guard cells `vite build --watch` and `next build`, forwarded-slice correctness, zero-arg path), error paths forced (malformed and missing package.json, empty and non-string scripts: no throw, `resolveScript` swallows parse errors), CWD-mismatch suspicion refuted (all three `runApp` callers operate on `process.cwd()`; `spawnCommand` sets no cwd), empirical runner-boundary probes against real binaries (npm 11.13 drops trailing flags without `--` and forwards after `--`; pnpm 10.15 and bun 1.3.11 forward directly).
3. Docs round: surfaces findings adjudicated as required updates; author landed a9c7726 adding the compound-script scope clause to README.md, SKILL.md, and cli.ts help; surfaces re-run passed and the new prose was checked against observed behavior.
4. External round harvest: fetched the bot review via the public REST API (gh CLI blocked by org SAML on this machine), reproduced the finding, classified it as a new-domain-matrix miss.

## Outcome

Gate reported no blocking findings; docs findings were fixed pre-review. The external round still surfaced one real bug the matrix should have owned: the build-subcommand cells were enumerated from the guard's own inspected position (`rawScript[1]`) instead of from the input domain the composed helper accepts (runner-wrapped invocations, a class the same file already handles and issue #150 had already named). Cells derived from the guard under test inherit the guard's blind spot.

## Evidence

- Source: PR #366 diff (packages/portless/src/cli-utils.ts, cli.ts, both test files); cli-utils.ts:1040-1080 runner skip; cli.ts:3725 and 3595 multi-app path with no injector call.
- Runtime: repro of the bypass above; runner-boundary probe script outputs; forced error paths.
- Tests: force-red numbers above; full suite 730 passed, 6 failed, all 6 pre-existing worktree-name artifacts (checkout named `pr-366` gets prefixed into inferred app URLs).
- Review: Vercel Agent Review comment at a9c7726 on cli-utils.ts:1163 (public PR thread); no human review yet.
- Artifact: CI green at a4f0628 and a9c7726 (ci, ci-windows, Socket, checked 2026-07-17); PR undrafted 2026-07-17.

## Transferable lesson

When a diff adds a guard, the new-domain matrix must be generated from the input domain accepted by the helpers the guarded code composes with, never from the argument positions the guard itself inspects. The guard is the artifact under test; deriving cells from its shape re-encodes its blind spot into the verification. Here the composed helper deliberately skips runner wrappers, so every guard cell (build, port-present, host-present) needed a runner-wrapped twin.

Limits: yarn trailing-arg forwarding remains unverified on any machine involved (author e2e covered bun, npm, pnpm; yarn absent locally); end-to-end 502 disappearance not re-observed in-session (author PR body claims it against a minimal Vite app).

## Exceptions

- Multi-app workspace path never calls either injector; pre-existing, acknowledged in the PR body, issue drafted but not yet opened.
- Env-prefixed and nested-delegation scripts resolve but never inject; conservative skips, documented as scope limits.

## Candidate changes

- Reference rule: sharpen the new-domain matrix lens with the guard-derived-cells failure mode (this case as provenance).

## Confidentiality review

Public repository, public PR, public bot review. No secrets, customer data, private review text, or employer-internal context. Local machine paths omitted; evidence cited by commit, file:line, and public URLs.
