You are an independent code reviewer. Review `git diff origin/main -- packages/` in this repo (vercel-labs/portless). Ignore .github/ (scratch CI). Do not modify files. Do not start a portless proxy on ports 443/1355/80.
Change: findFreePort in packages/portless/src/cli-utils.ts now probes each candidate port on 127.0.0.1, ::1, 0.0.0.0 and :: sequentially instead of one hostless bind, and treats EADDRNOTAVAIL/EAFNOSUPPORT as "family absent, not busy" (issue #288).
Contract: A1 on origin/main a port held on 127.0.0.1, ::1 or 0.0.0.0 is still assigned; A2 with the fix a port held on any of the four is skipped; A3 on a host without IPv6 free ports are still found; must not change: random-then-sequential strategy, BLOCKED_PORTS, range errors.
Check adversarially, run code where possible:
1. Is any error code wrongly treated as free (e.g. EACCES, EADDRINUSE variants on Windows, EINVAL)? Is any absent-family case wrongly treated as busy (would make every port busy on IPv4-only or IPv6-only hosts)?
2. Can the sequential probes collide with each other (close not finished before next listen, dual-stack :: vs 0.0.0.0, Linux bindv6only, Windows exclusive address use)?
3. Do other callers (cli.ts findFreePort users, explicit appPort, workspace multi-app sequential spawn) depend on old semantics?
4. Do the new tests fail on origin/main, and is skipping when the family is absent sound?
Output JSON: {"verdict":"pass|findings","findings":[{"severity":"blocker|major|minor|note","file":"","line":0,"claim":"","evidence":""}]}
