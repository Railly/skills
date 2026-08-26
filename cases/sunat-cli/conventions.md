# sunat-cli review conventions

Bootstrapped 2026-08-26 from CONTRIBUTING.md, README.md, package manifests,
the release workflow, and the repository source.

## Surface map

```surfaces
packages/cli/src/commands/** :: packages/cli/bin/sunat.ts, README.md, packages/cli/README.md, packages/cli/src/skills/core.md, packages/cli/skills/sunat-cli/SKILL.md, skills/sunat-cli/SKILL.md, packages/cli/tests/e2e/**
packages/cli/src/buzon/** :: packages/cli/src/commands/buzon/**, packages/cli/src/schemas/buzon.json, packages/cli/LIMITATIONS.md, README.md, packages/cli/README.md, packages/cli/src/skills/endpoints.md, packages/cli/skills/sunat-cli/SKILL.md, skills/sunat-cli/SKILL.md, packages/website/src/lib/content.ts, packages/cli/tests/unit/buzon-*.test.ts, packages/cli/tests/e2e/buzon-cli.test.ts
packages/cli/src/browser/** :: packages/cli/tests/unit/**, packages/cli/tests/e2e/**
packages/cli/src/schemas/** :: packages/cli/src/commands/schema.ts, packages/cli/tests/e2e/**
packages/cli/package.json :: package-lock.json
```

## Norms

- Never commit real Clave SOL credentials, certificates, tokens, taxpayer
  records, audit logs, or production tax documents.
- Use offline fixtures, public read-only endpoints, mocks, or explicitly scoped
  live checks. Live checks record only sanitized structural evidence.
- Preserve dry-run, confirmation, intent-token, idempotency, and audit behavior
  for commands that can mutate external state.
- Document portal assumptions and failure modes because SUNAT interfaces can
  change without notice.
- Published behavior updates the root README and package README or limitations
  where relevant.
- Unit and end-to-end tests run with Bun. Release installation, audit, packing,
  trusted publishing, and registry verification run with the pinned npm client.
- A package version change updates package-lock.json and is released only from
  main through the release workflow.
- Pull requests list verification commands, live surfaces exercised, and known
  limitations.

## Subsystem invariants

- Browser-backed commands use the authenticated local `agent-browser` session.
  Browser state and local snapshots remain private under `SUNAT_HOME`.
- Read-only commands do not call filing, payment, acknowledgement, or document
  mutation endpoints.
- Buzón SOL metadata collection blocks the detail endpoint before opening the
  visor, serializes metadata requests, and preserves upstream counts and status
  values without legal interpretation.
- The built artifact runs under Node without Bun and includes every registered
  command, schema, bundled skill, and documentation file promised by the package.
- A release is complete only when the registry tarball, GitHub release asset,
  tag, provenance attestation, and main commit agree.

## Gate-miss ledger

| date | finding | which gate missed | why | what closed it |
|---|---|---|---|---|
