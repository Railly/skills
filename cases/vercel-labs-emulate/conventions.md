# vercel-labs/emulate review conventions

Bootstrapped 2026-08-11 from `AGENTS.md` during the Stripe webhook signature change.

## Surface map

```surfaces
packages/@emulators/stripe/src/** :: README.md, skills/stripe/SKILL.md, apps/web/app/docs/stripe/page.mdx, packages/@emulators/stripe/README.md, packages/emulate/src/index.ts
packages/@emulators/github/src/** :: README.md, skills/github/SKILL.md, apps/web/app/docs/github/page.mdx, packages/@emulators/github/README.md, packages/emulate/src/index.ts
packages/emulate/src/index.ts :: README.md, skills/emulate/SKILL.md, apps/web/app/docs/page.mdx
packages/emulate/src/commands/** :: README.md, skills/emulate/SKILL.md, apps/web/app/docs/page.mdx, packages/emulate/src/index.ts
packages/@emulators/adapter-next/src/** :: README.md, skills/next/SKILL.md, apps/web/app/docs/nextjs/page.mdx, packages/@emulators/adapter-next/README.md
packages/@emulators/adapter-nuxt/src/** :: README.md, skills/nuxt/SKILL.md, apps/web/app/docs/nuxt/page.mdx, packages/@emulators/adapter-nuxt/README.md
```

## Norms

- Use pnpm for repository package management.
- Do not add emojis.
- Do not use `--` as prose punctuation.
- User-visible behavior changes update the root README, service skill, docs site, CLI help, and package README.
- Preserve GitHub webhook header formats, subscription matching, delivery log shape, the 1000-delivery cap, and failure-path logging.
- Validation for webhook work includes focused tests, affected package suites, type checks, lint, formatting, and `git diff --check`.

## Subsystem invariants

- Releases use one version across `emulate` and every `@emulators/*` package.
- Exactly one changelog entry carries the release markers, and the release workflow publishes every package under `packages/@emulators`.
- `createServer()` creates one `WebhookDispatcher` for one plugin and calls `plugin.register()` before routes can dispatch.
- The dispatcher owns subscription matching, serialization, transport, timeout, and delivery logging.
- A service plugin may install its wire-format header factory, while a bare dispatcher retains GitHub-compatible headers.
- GitHub wraps `dispatch()` but binds the original method to the same dispatcher instance.
- GitHub repository access is resolved from repository visibility, user or organization membership, collaborators, or installation-token scope.
- GitHub App JWTs are signed with the seeded private key and verified with derived public key material; both documented PKCS#1 and supported PKCS#8 PEM inputs must work.
- GitHub content writes create blobs, trees, and commits before advancing the target branch ref.
- Catch-all commit routes register after narrower commit comment and check routes so they cannot shadow them.
- Requested generated-secret artifacts are fully and privately published before portless checks, alias registration, listener creation, or banner output.
- Secret-file confidentiality is an effective-access property. POSIX mode bits alone do not prove owner-only access on filesystems with ACLs.
- When startup publishes a durable artifact before later fallible stages, failure must either roll back that invocation-owned artifact or leave a directly retryable recovery path.
- CLI behavior without an opt-in secret-delivery flag remains unchanged.
- Embedded adapter persistence is one snapshot containing service Stores, token maps, and optional generated-secret provenance.
- GitHub App private keys remain in server Stores and private persistence backends; route handlers, response rewriting, logs, inspector UI, and client bundles must not expose them.
- Adapter seed preparation is lazy, memoized, and runs only after persistence has been checked so restored identity always wins over generation.

## Gate-miss ledger

- 2026-08-18, PR #204: Review Gate and resilience audit accepted `0600` mode bits as proof of owner-only access. On macOS, a parent ACL with `file_inherit` produced a `-rw-------` file that retained an inherited `everyone allow read` entry. The substrate check inspected `stat.mode` but not effective ACLs. Closed by requiring effective-access verification for confidentiality claims.
- 2026-08-18, PR #204: Review Gate claimed cleanup and repeated-failure coverage, but every forced failure happened before or inside publication. The destination is published before later fallible Portless, alias, seeding, and listener stages, with no caller-owned rollback. A later startup failure can therefore strand the destination and make the next invocation fail `already exists`. Closed by requiring a failure cell after every durable side effect and an immediate retry oracle.
