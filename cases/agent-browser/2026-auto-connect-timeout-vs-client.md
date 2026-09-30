# 2026: auto-connect wait equal to the client ceiling, fallback reopened the prompt

- PR: vercel-labs/agent-browser#2026. Audited head 9ef6c1e5, fix 09bfb2c4.

## Defects
1. `AUTO_CONNECT_WS_VERIFY_TIMEOUT` = 30s, equal to the client's `read_timeout_for` floor (30s); the client times out first and retries (EAGAIN is transient).
2. A handshake timeout fell through to HTTP discovery (a second prompt) and deleted `DevToolsActivePort`, the exact #1365 symptom, delayed.

## Fix
`verify_ws_endpoint` returns Live / TimedOut / Failed. TimedOut returns "waiting for approval, approve and retry" without fallback, probing or deleting the file. Wait lowered to 20s; a test pins it below `read_timeout_for`.

## Evidence
Real binary against a fake Chrome that holds the handshake (temp HOME with DevToolsActivePort): before 4 connections, file deleted, "No running Chrome instance found", 37s; after 1 connection, file kept, approval message, 21s. Two mutants red.

## Gate change
`gate.sh timings` missed a `Duration` const; fixed in railly/skills 04391dd (normalize_durations + consumer-timeout NOTE).

## Gap
Real Chrome 144+ prompt not driven (needs a human click).
