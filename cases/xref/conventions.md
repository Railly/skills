# xref review conventions

Bootstrapped 2026-08-14 from README.md, CONTRIBUTING.md, package.json,
skills/xref/SKILL.md, and the repository source.

## Surface map

```surfaces
src/cli.ts :: README.md, skills/xref/SKILL.md, src/cli.test.ts
src/html.ts :: README.md, src/html.test.ts
src/refs.ts :: src/refs.test.ts
package.json :: README.md, CONTRIBUTING.md
skills/xref/SKILL.md :: README.md
```

## Norms

- Use Bun for install, scripts, tests, linking, and builds.
- Use Biome for lint and formatting.
- The package remains private until registry publishing is intentionally
  designed. Source installation is the supported public install path.
- Dependency changes in package.json require bun.lock updates. Metadata-only
  changes such as description, private, packageManager, scripts, and keywords
  do not.
- The main package entry stays runtime-agnostic. Filesystem and subprocess
  behavior remain CLI-only or in separate transport entry points.
- Public documentation and bundled skill metadata must not depend on personal,
  vault, workstation, or Vercel-internal context.
- A public release includes a license, contribution guidance, security
  reporting guidance, and CI.

## Subsystem invariants

- The shell transport is the CLI boundary and requires an authenticated `gh`.
  The HTTP transport is the server boundary and accepts a token.
- HTML output is a self-contained artifact. It must safely embed untrusted
  GitHub content and must not mutate GitHub.
- External-link filtering removes clear fixture and local-network noise. It
  must not discard an entire hosting vendor or documentation domain.
- Snapshot persistence is local CLI state under `~/.xref/`; library consumers
  own their own persistence.

## Gate-miss ledger

| date | finding | which gate missed | why | what closed it |
|---|---|---|---|---|
| 2026-08-14 | All `vercel.com` and `vercel.app` links were discarded as noise | no project conventions existed | the vendor-wide assumption was embedded in a generic URL filter and only surfaced during the public-agnostic audit | removed the vendor-wide filter and added keep-cases for deployment and documentation URLs |
