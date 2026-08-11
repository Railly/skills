# vercel-labs/emulate review conventions

Bootstrapped 2026-08-11 from `AGENTS.md` during the Stripe webhook signature change.

## Surface map

```surfaces
packages/@emulators/stripe/src/** :: README.md, skills/stripe/SKILL.md, apps/web/app/docs/stripe/page.mdx, packages/@emulators/stripe/README.md, packages/emulate/src/index.ts
```

## Norms

- Use pnpm for repository package management.
- Do not add emojis.
- Do not use `--` as prose punctuation.
- User-visible behavior changes update the root README, service skill, docs site, CLI help, and package README.
- Preserve GitHub webhook header formats, subscription matching, delivery log shape, the 1000-delivery cap, and failure-path logging.
- Validation for webhook work includes focused tests, affected package suites, type checks, lint, formatting, and `git diff --check`.

## Subsystem invariants

- `createServer()` creates one `WebhookDispatcher` for one plugin and calls `plugin.register()` before routes can dispatch.
- The dispatcher owns subscription matching, serialization, transport, timeout, and delivery logging.
- A service plugin may install its wire-format header factory, while a bare dispatcher retains GitHub-compatible headers.
- GitHub wraps `dispatch()` but binds the original method to the same dispatcher instance.

## Gate-miss ledger

(empty)
