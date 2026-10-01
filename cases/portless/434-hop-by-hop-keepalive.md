# 434: forwarded keep-alive left an agentless backend socket without an error listener

- PR: vercel-labs/portless#445 (recreates #440 by @Knat-Dev, credited via Co-Authored-By). Head ff02510 plus a test tweak.
- Gate run: `foundry/runs/review-gate/2026-10-01-portless-445/` (pass: cross-family FX review, Windows verified in run 36924262063).

## Defect
Plain requests copied the client's headers to the backend, including `Connection: keep-alive`. The backend request uses `createConnection` with no agent, so the kept-open socket had no owner and no `error` listener after the response. A backend restart reset it and crashed the proxy with an unhandled `ECONNRESET`. #127 only covered the TLS wrapper socket.

## Fix
Drop `connection`, `keep-alive`, `proxy-connection`, `upgrade` from plain forwarded requests; Node then sends `Connection: close`. `transfer-encoding` stays (frames streamed bodies). Upgrade paths unchanged.

## Evidence
- Unit test captures `read ECONNRESET` via uncaughtException on origin/main ef41e79, none on the fix.
- Built CLI, isolated proxy on 1399: main goes DOWN after backend reset, fix stays UP and serves the next request.
- Force-red per header: the `upgrade` entry was unpinned until an `upgrade: h2c` assertion was added.
- Independent pass (occam): `Expect: 100-continue` re-adds keep-alive inside Node but leaves no lingering socket.

## Lesson
A proxy that dials with `createConnection` and no agent owns socket lifetime itself; any client header that extends it (keep-alive) creates an orphan with no error handler. Issue candidate: headers named in `Connection` tokens are still forwarded (RFC 9110 7.6.1).
