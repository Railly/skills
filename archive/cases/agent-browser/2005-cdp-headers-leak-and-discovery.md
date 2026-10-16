# 2005: CDP headers echoed in errors, skipped discovery and port targets

- PR: vercel-labs/agent-browser#2005. Audited head 6bc77885, fix d4b7d210.

## Defects
1. Security: `parse_cdp_headers` errors included the raw input, printing bearer tokens on a typo (text and --json).
2. HTTP discovery (`/json/version`, `/json/list`, ws fallback) sent no headers: 401 before upgrade on authenticated endpoints.
3. `--cdp <port>` attached headers to the command but the port branch ignored them (the silent-missing-header failure the PR claimed to fix).
4. Docs said the headers do not apply to port discovery; SKILL and commands reference lacked the flag.

## Fix
Errors report only the column; headers threaded through `discover_cdp_url_with_headers`; port branch uses `connect_cdp_with_headers`; all 7 doc passages updated.

## Evidence
Stub logging received headers: http URL and numeric port both carried `authorization` on discovery and upgrade. Two unit tests, each red under its mutant.

## Lesson
A secret-bearing flag needs an errors-never-echo test, like the existing curl-cookies one.

## Escaped from this fix (caught by a later session, 24729a2a)
Threading headers into discovery made them leak in plaintext: discovery hardcoded `http://`/`ws://`, so `--cdp https://host:port/...` sent `Authorization` unencrypted to `/json/version`. Fixed by carrying `secure` from the input scheme through every discovery request, with no plaintext fallback. Lesson: when a fix starts sending a secret on an existing path, check that path's transport, not only that the secret arrives. The stub in the dogfood was plain HTTP, so it could not see this.
