# Case: Session isolation is a persisted binding contract

Status: reviewed
Validation: independently-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-10
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1589

## Observed condition or claim

`--session` isolated daemon processes but did not isolate their active Chrome tabs when multiple sessions shared one browser over `--cdp`. Re-attaching selected the most-recently-active tab, and event-discovered targets could replace the active slot. The result was cross-session navigation and state leakage.

PR #1589 made tab identity persistent per session, added opt-in `--pin-tab` strictness, made CDP target ids valid tab references, and exposed structured recovery data for a destroyed pinned tab.

## Red signal

The literal reproduction from issue #1530 against npm version 0.31.2 sent ten named sessions to ten URLs through one Chrome. All ten later read the same final `location.href`.

The same literal script remains intentionally colliding without `--pin-tab`. On the merged branch it writes ten unpinned bindings, but all point to the same shared target. This preserves legacy `open` behavior and makes the retest instruction part of the product contract: each shared-browser session must use `--pin-tab` from its first command.

## Method used

1. Traced tab selection across fresh launch, preliminary `--cdp` and `--auto-connect` launch, existing-daemon reuse, daemon restart, explicit tab creation, CDP target discovery, CLI, batch, MCP, schema, skill, and documentation surfaces.
2. Persisted a session-to-target binding and restored it during re-attach instead of selecting tab index zero.
3. Registered event-discovered targets for listing without activating them.
4. Added `--pin-tab` strict mode. A missing pinned target produces `code: "tab_gone"` instead of adopting another tab.
5. Added `data.targetId` and optional sanitized `data.lastUrl` to single-command output. Batch carries the same recovery object as `result`, and MCP preserves the CLI response.
6. Restricted persisted diagnostics to sanitized HTTP(S) URLs and `about:blank`; opaque URLs such as `data:` are omitted.
7. Re-ran the issue reproduction and failure paths against real Chrome, including killing all daemons, activating an unrelated target through raw CDP, externally closing bound tabs, and exercising safe and opaque URLs.
8. Forced the recovery tests red by removing both response-enrichment calls. The real CLI/batch test and opaque-URL E2E failed on missing `data.targetId`; restoring the calls returned them to green.

## Outcome

PR #1589 merged on 2026-08-10 as merge commit `861e76ddf48ea48f4ce5fe0e79dc725b084d0e8b`, from head `6555ee855e4f0a78d77a317b1b45afc52d0f8f49`.

Against Chrome 151.0.7922.109:

- Ten `--pin-tab` sessions kept ten distinct tabs.
- After killing all ten daemons and activating an unrelated tab, every session restored its original target id and URL.
- An unpinned session created with `tab new` restored its target after daemon restart.
- Externally closing an unpinned bound tab retained legacy silent fallback.
- Externally closing a pinned bound tab returned `tab_gone` with structured target id and safe last URL.
- Batch returned the same recovery fields under `result`.
- HTTP diagnostics dropped query strings and fragments.
- A `data:` URL exposed neither its payload nor `lastUrl`.

The full suite passed 1,077 tests with one pre-existing screenshot parity timeout excluded after it reproduced on the exact base commit. `cargo fmt --check` and clippy were clean.

## Evidence

- Source: PR #1589; issues #1530, #214, and #1265; absorbed PRs #1426, #1531, and #883.
- Runtime: npm 0.31.2 negative control and head `6555ee8` against Chrome 151.0.7922.109 with isolated socket namespaces.
- Tests: ten-session collision and pinning repro; daemon restart re-binding; explicit `tab new` restoration; pinned and unpinned external-close behavior; safe and opaque `tab_gone` metadata; CLI, batch, and MCP propagation; existing-daemon `--cdp --pin-tab` regression.
- Review: approved by ShacktarMalacky and ctate. Independent real-browser retesting confirmed isolation and recovery behavior.
- Artifact: merge commit `861e76ddf48ea48f4ce5fe0e79dc725b084d0e8b`; post-merge xref snapshot captured 2026-08-10.

## Transferable lesson

Session isolation is a cross-process identity contract, not merely a process boundary. The selected resource must have a durable identity, every attach and event path must preserve it, and strict mode must fail instead of silently adopting a neighbor.

Machine recovery data is also an end-to-end contract. It must pass through every public output adapter as structured fields, while diagnostics are sanitized before persistence so later error paths cannot leak opaque payloads.

## Exceptions

- `--pin-tab` is opt-in to preserve legacy `open` behavior. The original #1530 script still collides unless the flag is present on the first command for every shared-browser session.
- Unpinned bindings restore when possible but intentionally retain silent fallback after external tab destruction.
- Shared-profile Chrome process ownership, external browser restart, persistent-profile active-page behavior, and BrowserContext cookie isolation remain separate mechanisms.

## Candidate changes

- Exemplar: use this case when a feature calls process separation "isolation" but the selected resource identity is not persisted across attach, restart, event discovery, and wrapper boundaries.

## Confidentiality review

All evidence comes from the public repository, public PR and issue graph, public review state, source code, and reproducible test results. Private chat context, secrets, and local absolute paths are omitted.
