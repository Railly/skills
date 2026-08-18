# ai-cli (vercel-labs/ai-cli) review conventions

Bootstrapped 2026-07-27 from AGENTS.md, CONTRIBUTING.md, CHANGELOG.md history and .github/workflows/release.yml.

## Surface map

```surfaces
packages/ai-cli/src/commands/** :: packages/ai-cli/README.md, apps/web/docs/commands.mdx, packages/ai-cli/src/cli.test.ts
apps/web/docs/commands.mdx :: apps/web/docs/troubleshooting.mdx
apps/web/docs/** :: apps/web/app/llms.txt/route.ts, apps/web/app/sitemap.ts, apps/web/lib/page-markdown.ts
apps/web/lib/site.ts :: apps/web/app/layout.tsx, apps/web/app/robots.ts, apps/web/middleware.ts
apps/web/middleware.ts :: apps/web/app/api/docs-md/*/route.ts, apps/web/next.config.ts
```

AGENTS.md rule, verbatim intent: a user-facing change (new command, new flag, changed behavior, renamed option) must update `packages/ai-cli/README.md`, `apps/web/docs/`, `apps/web/components/landing/` where marketing copy reflects it, and `CHANGELOG.md`. A user-facing change without matching README and website/docs updates is incomplete.

## Norms

- **CHANGELOG is hand-maintained per release, written by the "Prepare vX.Y.Z release (#N)" PR, not by feature PRs.** Every CHANGELOG commit in history is a release-prep PR (2a72d32, 43cae92, d6a1c43, 1cf578f...); feature PRs such as #77 (Remove Commander) add nothing. Entries live between `<!-- release:start -->` / `<!-- release:end -->` markers inside the section for the version being released; `.github/workflows/release.yml` extracts the first such block for the GitHub release. Adding a bullet to an already-published section (package.json version == npm version == tagged) both rewrites shipped notes and drops the note from the next release.
- **Entry references are PR numbers, not issue numbers** (`#75` = PR 40437e5, `#72`, `#64`).
- **`README.md` at repo root is a symlink to `packages/ai-cli/README.md`**: edit the package copy only.
- **Per-command flag inventory lives in `packages/ai-cli/src/cli.test.ts`** ("<cmd> --help exits 0 and lists flags"), spawning the real CLI. A new flag that is only tested against a synthetic `new Command()` leaves the registration itself unguarded.
- **`packages/ai-cli/src/lib/command.ts` is a homegrown parser (Commander removed in #77).** Semantics verified 2026-07-27: `option(flags, desc, parser, default)`; defaults pre-seed the options object; a value option with a `defaultValue` gets `(default: <json>)` auto-appended to its help row; missing value raises `CliUsageError`; a parser throwing a plain `Error` surfaces as `Error: <msg>` exit 1; `--` makes remaining tokens positionals (and thus "too many arguments" for single-argument commands); parent commands reject options placed before the subcommand name.
- **Runtime split matters.** `bun run dev` executes under Bun; the published bin is `#!/usr/bin/env node` with `engines.node >= 22`. Timer/range semantics differ (Bun accepts `setTimeout` delays > 2^31-1; Node overflows to 1 ms and throws above 4294967295). Verify timer-facing code under Node, not only `bun test`.

## Subsystem invariants

- **Docs inventory has one producer.** Public docs pages are discovered from `fromsrc` `getAllDocs("docs")`. `/llms.txt`, `sitemap.xml`, `sitemap.md`, and the homepage markdown docs list must consume that inventory, not a parallel hand-maintained list. Provenance: 2026-08-13 agent-discovery review.
- **HTML and markdown share one pathname contract.** Middleware (agent UA / `Accept: text/markdown`), `next.config` `.md` rewrites, and `markdownForPathname` must resolve the same pathname to the same canonical HTML URL. `.md` requests bypass middleware because the matcher excludes dotted paths. Provenance: 2026-08-13 agent-discovery review.
- **Browser 404 and agent 404 are different HTTP statuses on purpose.** Unknown paths return 404 to browsers and 200 markdown to detected agents. Soft-404 audits use a non-agent UA. Provenance: `@vercel/agent-readability` retrieval vs reachability checks.
- **Every URL consumer validates decoded docs path segments before `getDoc`.** Reject a segment equal to `..` or containing `/` or `\` in both HTML and Markdown routes. Joining decoded params into a pathname first loses segment boundaries, while `fromsrc` joins the resulting slug onto the docs directory without a containment check. Provenance: PR #82 external review, 2026-08-15.
- Every request abort signal is created per job inside the `runJobs` generate callback, so a timeout is per-request, not per-invocation; a multi-model or `-n > 1` run gives each job the full budget.
- Single-job `runJobs` rethrows a generate-callback error (exit 1 via index.ts); multi-job records it as a failed job (exit 2 on partial failure). A synchronous throw from constructing the abort signal therefore reads to the user as a model failure, not a usage error.
- `parsePositiveInt` accepts any digit string (`007` -> 7, 30 nines -> 1e30). It bounds nothing from above; every consumer that feeds a timer or allocator must add its own ceiling.

## Gate-miss ledger

| date | finding | which gate missed | why | what closed it |
|---|---|---|---|---|
| 2026-07-27 | `--timeout` has no upper bound; > 2147483 s aborts instantly under Node, > 4294967 s throws RangeError | `gate.sh timings` | the check looks for wait ceilings the diff *adds* as constants; here the ceiling is user-supplied at runtime, so the diff adds no constant | manual Node repro through `timeoutMs()`; candidate new gate: "a diff that routes user input into a timer/allocator must bound it" |
| 2026-08-15 | Encoded docs paths could escape the docs directory through decoded `..`, slash, or backslash segments | Review Gate subsystem model and input-boundary lenses | the gate traced canonical route parity but did not rank the authority difference between pathname formatting and filesystem lookup, and no invariant required validation before every `getDoc` consumer | shared decoded-segment guard, handler-level force-red regression, and the subsystem invariant above |
