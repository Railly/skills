# Resilience receipt evidence

Thirty-two forced failure partitions cover username and password entry on Chrome and Lightpanda: detach during focus, focus redirection, selection redirection, readonly transition, detach during input, script exception, native edit returning false, and native edit throwing. Every case prevented submission and an immediate caller retry succeeded after restoring the form. Unit checks verify remote-object release after success, JavaScript rejection, and CDP errors while the transport remains usable.

Known limit: cancellation or destruction of the renderer or CDP transport can prevent best-effort release. The contract does not claim cleanup after the cleanup transport itself is gone.

Evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/lifecycle-final.log, /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/post-cleanup-checks.log, /Users/raillyhugo/Programming/railly/skills/foundry/runs/implementation/2026-09-28-agent-browser-1999-fix/fill-exception-red.log, and /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence/lifecycle-final-results.json.
