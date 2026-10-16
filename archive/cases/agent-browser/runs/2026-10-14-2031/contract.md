# Issue Contract: agent-browser #2031

Source: https://github.com/vercel-labs/agent-browser/issues/2031 (open, 2026-09-30). Related: #1651 / PR #1655 (different error, `Session with given id not found`).

## Reproduced claim (user-visible layer, main 1d1f... see manifest base)
- `--allowed-domains 127.0.0.1` + `open` of a page that embeds a cross-origin iframe fails: `Failed to install browser network controls: CDP error (Runtime.evaluate): Cannot find default execution context`, and the browser is closed.
- The issue's literal repro (`open https://example.com --allowed-domains example.com` on a fresh session) does NOT reproduce on main today (3/3 success, isolated namespace, serving pid verified).
- Cause: iframe/OOPIF targets attach paused (`waitForDebuggerOnStart`) before any document; `install_domain_filter_runtime_script` (network.rs) evaluates without a context and the error is treated as a containment failure.

## Acceptance
- A1: navigating an allowed page with a cross-origin iframe to a blocked host succeeds; the blocked iframe receives the filter's block page and the blocked host gets zero requests.
- A2: inside an allowed cross-origin iframe, the domain filter runtime is active (fetch to a blocked host throws SecurityError; RTCPeerConnection blocked).
- A3: an e2e test fails on base and passes on the fix.

## Must not change
- M1: any other `Runtime.evaluate` failure, and any failure of `Page.addScriptToEvaluateOnNewDocument`, `Fetch.enable`, or `Page.enable`, still fails closed and closes the browser.
- M2: a target that already has a default context still gets the runtime script applied to its current document.
- M3: allowed-domain behavior for pages without iframes (example.com fresh launch) unchanged.

## Non-goals
- #1651 stale-session handling (PR #1655). WebDriver backend. Blocked-iframe navigation reporting.

## Risks
- R1: swallowing the error on a target whose context exists but is transiently missing would leave the current document unpatched (containment gap). Mitigation claim: the error string is only returned when no default context exists, and the new-document script is registered before resume.
- R2: string-matching a CDP error message is brittle across Chrome versions (fails closed if the text changes, i.e. regresses to current behavior, not to a leak).

## Proof commands
- `cargo test e2e_domain_filter -- --ignored --test-threads=1`
- `cargo test network`
- CLI repro with `AGENT_BROWSER_NAMESPACE` isolation against `/tmp/ab2021/server.mjs` routes `/iframe`, `/probe-parent`.
