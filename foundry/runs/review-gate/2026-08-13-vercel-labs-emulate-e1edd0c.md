# Review Gate: vercel-labs/emulate e1edd0c

Status: pass

Base: `c39777943ec879dc75102d3cd741d8c961d61b06`

Head: `e1edd0ceafcdaf6392844d63a108b57351446fc6`

Warning: author and reviewer use the same GPT-5 Codex model family, so shared blind spots remain possible.

## Scope

Add `--generated-secrets-file` to the CLI so omitted GitHub App keys can be delivered as a private JSON artifact before any Portless or listener side effects.

No separate Issue Contract or Spec review result was supplied. The approved Solution Gate report defines the implementation contract.

## Deterministic checks

- Style: pass.
- Surface map: pass.
- New flag sweep: fixed the missing general docs and general emulate skill.
- Example OAuth README: exempted because it is a fixed example runbook and delegates complete CLI options to the root README.
- Caller sweep: pass after reading both existing `prepareSeed` consumers.
- Test strength: pass. Permission, secret collection, and hard-link publication mutations each made the intended tests fail, then the implementation was restored green.
- Resilience audit: pass across partial visibility, cleanup, permission refusal, unsupported filesystems, destination races, and failure ordering.
- Type-check: 34 of 34 tasks passed.
- Tests: 33 of 33 tasks passed; emulate has 32 passing tests.
- Build: 26 of 26 tasks passed.
- Format check: pass.
- Lint: 42 of 42 tasks passed with pre-existing warnings only.
- Diff check: pass.

## Subsystem model

The CLI reads seed input and selects services. With the new flag, it first validates the destination filesystem, then loads selected services and invokes their existing `prepareSeed` hooks. It collects only generated values, publishes complete JSON through a same-directory `0600` temporary inode and exclusive hard link, then proceeds to Portless checks, alias registration, server creation, and banner output.

Without the flag, preparation and Portless ordering remain unchanged. The adjacent layers reviewed were filesystem permission semantics, hard-link identity, destination races, cleanup ownership, service ordering, error propagation, CLI output, and HTTP exposure.

## Lens results

- New-domain matrix: pass across generated, explicit, empty, multi-service, unsupported, permission, and race cells.
- Error-path forcing: pass. Every material failure path was forced.
- Non-destructive recovery: pass. Existing paths and race winners remain untouched.
- Boundary pipeline trace: pass from seed input to JWT-authenticated HTTP.
- Substrate verification and built-artifact dogfood: pass. The built CLI produced mode `0600`, schema v1 JSON, and a usable RSA key; the JWT returned HTTP 200.
- Docs-behavior parity: pass, including Windows refusal and unchanged behavior without the flag.
- Choice audit: pass for all five `github-app-cli-secrets` decisions.
- Radius map: orientation only. Its 20,678 unresolved calls exceed 4,887 edges, so it was not used as safety evidence.

## Findings

No open findings.

One finding was fixed before commit: the general docs page and general emulate skill initially omitted the new flag.

## Exemptions claimed

- `examples/oauth/README.md` does not list the new global flag because it documents one fixed example workflow and explicitly delegates complete options to the root README.
- Radius is not safety evidence because its unresolved-call boundary substantially exceeds its edge count.

## Issue candidates

None.
