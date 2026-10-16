# Review Gate: vercel-labs/emulate PR #204 correction

Date: 2026-08-18
Branch: `feat/github-app-cli-generated-secrets`
Base: `c39777943ec879dc75102d3cd741d8c961d61b06`
HEAD: `e1edd0ceafcdaf6392844d63a108b57351446fc6` plus uncommitted correction
Frozen diff: `/tmp/emulate-204-final.diff`
SHA-256: `512f6880c5c00c29df84234b2e4123d4a0477ac7c52000e4dfc5ae974882a4d4`

## Verdict

Pass for the frozen working tree. No confirmed blocking findings remain.

The review found and fixed two in-scope gaps before the final pass:

- `packages/@emulators/github/README.md` still described the old permission guarantee.
- listener rollback could wait on accepted connections, so cleanup now closes active connections.

It also added a regression proving that cleanup errors do not replace the primary startup error or stop later cleanup.

## Subsystem model

The CLI process owns preparation, publication, Portless aliases, stores, HTTP listeners, banner output, and signal handlers. With `--generated-secrets-file`, publication happens before every later fallible startup stage. The invocation therefore owns a reverse-order startup transaction:

1. publish one complete private artifact
2. verify Portless
3. register aliases
4. create and seed stores
5. bind listeners and await readiness
6. expose successful startup

On failure, listeners, stores, aliases, and the exact invocation-owned artifact are released in reverse order. Without the flag, the prior path remains unchanged.

Adjacent layers inspected:

- ACL tools against the already-open inode, then mode and owner verification
- publication identity through the hard-link boundary
- rollback identity before deletion
- cleanup failure while preserving the primary error
- Portless alias partial registration
- store creation followed by seed failure
- listener partial startup and `EADDRINUSE`
- documentation claims against built CLI behavior

## Deterministic checks

- style: pass
- surfaces: pass
- ACL sibling sweep: pass
- owner-only sibling sweep: acknowledged after reading both untouched occurrences; they are a CLI option-table summary and a test name, not stale effective-access claims
- callers for `publishGeneratedSecretsFile`: pass
- callers for `ensurePortless`: pass
- callers for `registerAliases`: pass
- callers for `registerAlias`: pass
- callers for `removeAlias`: pass
- `git diff --check`: pass
- head coverage: unavailable until the correction is committed; this report covers the frozen working-tree SHA instead

Radius indexed 31 changed symbols and 19 impacted symbols. Its visibility boundary reports 20,793 unresolved calls against 4,927 edges, so the map was used for orientation only and treated as under-covering.

## Focused lenses

- new-failure-outcome propagation: pass; every call site is in reviewed files and caller state is rolled back
- error-path forcing: pass; ACL-tool absence, Portless failure, partial aliases, seed failure, cleanup failure, and second-listener bind failure are forced
- cancellation and timeout hygiene: pass for startup rollback; listener close now terminates accepted connections instead of waiting indefinitely
- substrate verification: pass on macOS filesystem ACLs and the built CLI
- dogfood built artifact: pass
- newly-asserted invariant ownership: pass; the generated-secret writer is centralized
- docs-behavior parity: pass after updating the GitHub package README
- inverse regression, new-domain, resolution consistency, shell reparse, emission latch, shim hermeticity, deliberate default, fresh seam, substrate differential corpus, reference oracle, flag dispatch, non-destructive heuristic recovery, boundary pipeline, demonstrative example, choice audit, and complexity budget: skipped because their triggers are absent

## Dogfood

Built CLI with an inherited macOS `group:everyone allow read,file_inherit` ACL:

- startup succeeded
- destination mode was `0600`
- destination ACL contained no extended entry
- schema version remained 1
- one generated GitHub App private key was present
- listener responded on the requested port

Built CLI with Portless unavailable after publication:

- first invocation exited 1 with the Portless guidance
- destination was absent after failure
- the same command without Portless retried immediately and started successfully

Linux ACL behavior was separately probed in `node:24-bookworm-slim` with Debian `acl`; `setfacl` and `getfacl` returned zero and reported only owner `rw-`, group `---`, other `---`.

## Verification

- `pnpm build`
- `pnpm test`
- `pnpm type-check`
- `pnpm lint`
- `pnpm format:check`
- focused generated-secrets suite: 41 tests
- Test Strength mutations:
  - remove ACL sanitation: red
  - remove rollback inode check: red
  - remove listener readiness await: red

## Exemptions claimed

- The untouched `owner-only` option-table text is a concise capability label; the canonical adjacent prose states ACL verification, Linux tooling, fail-closed behavior, rollback, and hard-termination recovery.
- The untouched `owner-only permissions` test name remains accurate because its assertions are supplemented by a separate inherited-ACL substrate test.
- Exact HEAD coverage is deferred because the requested state is intentionally uncommitted; the frozen diff hash identifies the reviewed tree.

## Issue candidates

- Atomic unlink-by-inode is not exposed by Node's portable filesystem API. Rollback verifies `dev` and `ino` immediately before `unlink`, which preserves normal replacements, but a privileged concurrent replacement inside that narrow check-to-unlink window remains a platform limitation.
- `SIGKILL` cannot run cleanup. Documentation explicitly requires manual removal of the complete residual artifact after confirming no invocation uses it.

