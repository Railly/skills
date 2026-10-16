# Case: agent-browser #2031: a paused cross-origin iframe has no context to patch

Status: observed
Validation: author-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open (#2116)
Upstream status checked: 2026-10-14
Visibility: public
Repository: vercel-labs/agent-browser
Role: maintainer
Source: issue #2031, PR #2116, branch `railly/allowed-domains-iframe-context`, commit `2eba5179`, base `518f6e5d`. Run evidence: `runs/2026-10-14-2031/`.

## Observed condition or claim

The issue reported `--allowed-domains` failing on every fresh launch with `Cannot find default execution context`. That literal repro no longer reproduced on main. The same error reproduced deterministically for any page that embeds a cross-origin iframe: the browser closed before the page could open.

## Red signal

Fresh `open https://example.com --allowed-domains example.com` succeeded 3/3 on main (isolated namespace, serving pid verified). `open` of a local page with a cross-origin iframe failed every time. Instrumentation showed launch install succeeded and the failure came from the auto-attach path in the fetch handler.

## Cause

Auto-attach uses `waitForDebuggerOnStart: true`, so an OOPIF attaches before any document. `install_domain_filter_script` registers `Page.addScriptToEvaluateOnNewDocument` and then runs `Runtime.evaluate` without a context; Chrome answers `Cannot find default execution context`, and the containment path treated it as a breach.

## Method used

Skip that one error only for targets the event reports as `waitingForDebugger: true`, threaded as `paused_before_document`. Live sessions and every other error stay fail closed.

## What the review caught

- The first fix had no test for its security edge: broadening the match to every error passed the whole suite. A mock-CDP unit test now kills that mutation.
- Independent review found the swallow also applied to live sessions (navigation-commit window), and then that the auto-attach handler hardcoded "paused" instead of reading `waitingForDebugger`. Both closed before the PR.
- The e2e's zero-request assertion was vacuous (blocked iframes are intercepted before connect); it now asserts the block page.
- Mutation over the three auto-attach paths showed only the fetch-handler path needs the flag; the drained iframe/page paths see already-resumed targets and stay fail closed.

## Lessons

- An issue whose literal repro is gone can still be live through a sibling trigger; reproduce the error class, not the command.
- Relaxing a fail-closed branch needs a test that fails when the relaxation widens. Fix-absent tests do not cover it.
- "Paused" is an event field, not a property of the code path.

## Gaps

FX reviewer unavailable on this machine; review ran on a same-family native subagent. No separate security-review receipt. Schema-v1 run report not materialized.
