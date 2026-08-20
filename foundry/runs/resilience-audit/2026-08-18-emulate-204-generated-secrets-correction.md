# Resilience audit: emulate PR #204 correction

Date: 2026-08-18
Verdict: pass with two documented residuals

## Failure boundaries

| Boundary | Forced fault | Expected invariant | Result |
|---|---|---|---|
| filesystem ACL | inherited macOS ACL | published file has no extended ACL and mode `0600` | preserved |
| ACL tooling | command unavailable | fail closed and leave no probe | preserved |
| publication ownership | destination replaced | rollback does not delete replacement | preserved |
| Portless verification | binary unavailable after publication | primary error returned, artifact removed, retry succeeds | preserved |
| alias registration | second alias fails | first alias removed, artifact removed | preserved |
| cleanup | alias removal fails | warning emitted, primary error preserved, later cleanup continues | preserved |
| store lifecycle | seeding throws after store creation | store reset, no listener, artifact removed | preserved |
| listener lifecycle | second port occupied | first listener closed, active connections terminated, artifact removed, retry succeeds | preserved |

## Recovery behavior

Rollback runs in reverse ownership order: listeners, stores, Portless aliases, generated-secret artifact. Cleanup failures are isolated and reported without hiding the primary startup error.

The no-flag path stays on the prior startup behavior. The generated-secret schema remains version 1.

## Repetition and strength

- full suite: pass
- focused suite: 41 tests pass
- mutation removing ACL sanitation: red
- mutation removing inode identity check: red
- mutation removing listener readiness await: red
- built CLI dogfood: inherited ACL and failed-start retry pass
- Linux ACL probe with Debian `acl`: pass

## Residuals

- A privileged concurrent replacement during the narrow `lstat` to `unlink` window cannot be atomically excluded with Node's portable APIs.
- `SIGKILL` bypasses cleanup and can leave a complete private artifact; manual recovery is documented.

