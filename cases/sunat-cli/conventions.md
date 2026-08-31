# sunat-cli review conventions

Bootstrapped 2026-08-25 from `CONTRIBUTING.md`, the repository README, package metadata, and the project instructions supplied for this hardening cycle.

## Surface map

Published behavior changes must update the README or `packages/cli/LIMITATIONS.md` when relevant. Privacy-sensitive command, storage, browser, and workflow changes also keep the bundled agent skill aligned.

```surfaces
packages/cli/src/data/audit.ts :: README.md, packages/cli/LIMITATIONS.md, packages/cli/skills/sunat-cli/SKILL.md
packages/cli/src/data/config.ts :: README.md, packages/cli/LIMITATIONS.md, packages/cli/skills/sunat-cli/SKILL.md
packages/cli/src/data/keychain.ts :: README.md, packages/cli/LIMITATIONS.md, packages/cli/skills/sunat-cli/SKILL.md
packages/cli/src/browser/client.ts :: packages/cli/LIMITATIONS.md, packages/cli/skills/sunat-cli/SKILL.md
packages/cli/src/workflows/f616.ts :: packages/cli/LIMITATIONS.md, packages/cli/skills/sunat-cli/SKILL.md, packages/cli/skills/sunat-cli/references/schemas.md
packages/cli/src/workflows/rhe.ts :: packages/cli/LIMITATIONS.md, packages/cli/skills/sunat-cli/SKILL.md
packages/cli/package.json :: .github/workflows/test.yml, .github/workflows/release.yml
```

## House norms

- Use npm 11.6.4 for dependency installation, audit, lockfiles, package construction, and trusted publishing. Use Bun 1.3.11 only as the required runtime and test runner.
- Use Biome, never ESLint or Prettier.
- Never include real credentials, certificates, tokens, taxpayer records, portal screenshots, or audit logs in fixtures, commits, issues, or pull requests.
- Live SUNAT mutation requires explicit authorization and the existing dry-run, confirmation, intent-token, idempotency, and audit controls.
- No AI coauthor trailers and no prose em dashes.

## Subsystem invariants

- Secret values may enter through interactive prompts, environment variables, or OS credential storage, but never through child-process argv, CLI output, or reflected backend errors.
- Browser field values cross the `agent-browser` process boundary through stdin, never argv.
- Config and audit persistence are fail-closed allowlists. Unknown fields are discarded rather than preserved.
- Durable local state uses owner-only directories and files, atomic replacement, and removal of inherited macOS ACL access.
- Audit identifiers are keyed references. Raw taxpayer identifiers, free-form arguments, remote bodies, XML, screenshots, and errors are not durable audit data.
- Legacy data is re-sanitized when it changes after the privacy marker, including data recreated by a downgrade.
- Remote REST, TUS, SIRE, SOAP, browser, and portal failures do not reflect untrusted response bodies, URLs, filesystem paths, or secrets.
- The exact tarball tested and attested is the tarball published. Registry bytes, npm provenance, GitHub attestation, installed version, and CLI smoke behavior are verified after publication.
- Real SUNAT operations are excluded from repository validation. Tests use mocks, fixtures, public read-only surfaces, or beta-only smoke paths.

## Gate-miss ledger

- None recorded.
