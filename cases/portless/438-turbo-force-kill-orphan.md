# 438: turbo mode left orphans after force-kill on Windows

- PR: vercel-labs/portless#438. Audited head 83f6f24, fix 06591a6.

## Defect
The Windows parent watcher only started in `spawnCommand`. Turbo mode spawns turbo with inherited stdio and no watcher, so `taskkill /F` on portless left turbo and its dev server attached to the console.

## Fix
`guardWindowsOrphans(child, spawnedAt)` shared helper, used for turbo. Lineage logic extracted as `ownedProcessIds` (embedded via `toString()`), with 4 unit tests and a standalone-eval test. PowerShell/taskkill calls got the 5s timeout.

## Evidence (windows-latest, cuse typing into the real console, run 36759025344)
PR head turbo: turbo.exe and dev alive, port held, shell got no keystrokes. Fix: all gone, shell ran. Single, multi and graceful unchanged.

## Disproved
The multi-app orphan from the audit did not reproduce (bun workspace); that guard was dropped per the necessity rule.

## Found, out of scope (no issue filed, per Hunter)
Workspace mode on Windows cannot spawn `pnpm`/`npm` (`.cmd` shims, no shell): `spawn pnpm ENOENT`, also on main.
