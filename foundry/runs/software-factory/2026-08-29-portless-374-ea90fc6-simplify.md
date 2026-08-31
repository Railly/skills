# Portless PR #374 simplified Software Factory

Status: pass

Base: `8eb6a33779b452ee56626c8e17d4eee6308c8a82`

Exact tree: `ea90fc6a1b3f6e47475e07beea5e9c49cfd4f592`

## Stage evidence

| Stage | Result |
|---|---|
| Implement | Authorization, proof, lifecycle, cleanup, compatibility, and timeout behavior retained |
| Reduce | Security diff reduced from `+900/-21` to `+599/-37` |
| Harden | Missing, stale, malformed, duplicate, delayed, failed-publication, and cleanup paths passed |
| Strengthen | Authorization bypass, destructive replacement, HMAC removal, and browser-rejection mutations were killed |
| Prove | Real loopback HTTP/HTTPS and temporary filesystem boundaries passed with stub callbacks |

## Reduction

- Deleted the isolated 226-line `security-repro.test.ts`.
- Moved its unique callback-boundary cases into parameterized proxy tests.
- Consolidated client negotiation and result-mapping tests.
- Removed duplicate `cli-utils.test.ts` cases.
- Removed an unused token-construction wrapper.
- Reused token generation for challenges.
- Removed the redundant protocol-version header.

Production is `+196/-9`; tests are `+403/-28`; total is `+599/-37`.
The successor removes 301 additions from the pushed security commit.

## Deterministic proof

- Type-check: pass.
- ESLint: pass.
- Build and declarations: pass.
- Prettier: pass after moving Radius-generated files outside the checkout.
- Working and cached diff checks: pass.
- Focused authorization/client/proxy suite: 39 passed.
- Neutral full suite: 933 passed, 1 skipped, 22 test files.
- Tests use only stub callbacks, temporary directories, and ephemeral
  loopback servers. No privileged system file is accessed.

No commit, push, PR comment, thread resolution, merge, or other PR mutation was
performed.
