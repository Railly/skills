# 444: self-daemon handoff adopted a foreign listener

- PR: vercel-labs/portless#444. Audited head 123d78d, fix 8b1d6b9.
- Gate run: none before review request; post-hoc audit found it.

## Defect
`findSelfDaemonizedListener` returned any pid listening on the app port at exit, before checking the command's process group. A command that failed to bind (port held by an old server) handed its route to that foreign process; `--force` would later SIGTERM it.

## Fix
Snapshot the listener pid before spawning (`findPreexistingListener`) and never transfer to it. Process-group ownership was rejected as the check: a real daemon that calls `setsid` leaves the group, which is the Astro case the PR exists for.

## Evidence
- New e2e (`self-daemon.test.ts`): foreign server on the port + `sh -c 'exit 1'` leaves 1 route before the fix, 0 after. Existing daemon and foreground cases still pass.
- Dogfood: routes.json `[]`; proxy 404 after its ~1s reload.

## Lesson
A "the command left something listening" heuristic must exclude what was listening before the command. Lens: new-domain matrix (pre-existing occupant is an input class).
