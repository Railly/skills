You are an independent code reviewer. Review `git diff origin/main` in this repo (vercel-labs/portless; changes are uncommitted in the working tree). Do not modify files. Do not start a proxy on ports 443/1355/80.
Change: with --wildcard, findRoute in packages/portless/src/proxy.ts now resolves an unregistered subdomain to the longest registered parent hostname (findMostSpecificParent) instead of the first match in storage order (issue #380). README.md and skills/portless/SKILL.md gain one sentence.
Contract: A1 on origin/main, admin.api.acme.localhost reaches acme when acme is registered first; A2 with the fix it reaches api.acme in both orders; A3 tenant.acme -> acme and exact matches unchanged; A4 strict mode still 404s unregistered subdomains. Must not change: Tailscale tiers, exact-tier precedence.
Check adversarially, verify by running code/tests where possible:
1. Correctness: case-insensitivity (route hostnames with uppercase; length comparison on raw vs lowercased), hosts with port or trailing dot, multi-TLD routes, a route hostname that is a suffix but not a label boundary (e.g. cme.localhost vs acme.localhost).
2. Any other consumer that resolves a parent route (404 suggestions, error pages, workspace/service) that now disagrees with findRoute.
3. Does the new test fail on origin/main and pin the ordering mechanism?
Known pre-existing local failure to ignore: proxy.test.ts "refuses a canonical loopback authority from a non-loopback peer".
Output JSON: {"verdict":"pass|findings","findings":[{"severity":"blocker|major|minor|note","file":"","line":0,"claim":"","evidence":""}]}
