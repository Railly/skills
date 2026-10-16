# Case: Stress the ownership lifecycle, not only the isolation primitive

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-08-11
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/issues/1068, https://github.com/vercel-labs/agent-browser/pull/1683, commits `ee68b3c88072559fb6be7737f7a8ddaa5da9f948` and `c731307100e2d488d1911ffe1a21fd339b531664`

> Technical validation and automated review are complete. Independent human review and maintainer acceptance remain pending while PR #1683 is open.

## Observed condition or claim

Named agent-browser sessions sharing one Chrome over CDP had separate daemon and tab state but still used Chrome's default BrowserContext. Two agents using different accounts on the same origin could overwrite each other's cookies and browser storage.

PR #1683 adds opt-in `--isolate-context` ownership. Each session receives a persisted primary BrowserContext, target discovery and creation stay within the owned boundary, internal daemon restarts preserve that context, Chrome restarts create a clean replacement, and explicit `close` disposes only the session's owned contexts.

## Red signal

The pre-implementation Chrome probes showed that BrowserContexts directly partition cookies and storage, while browser-wide target discovery and auto-attach still observe targets across contexts. A foreign target could therefore be attached and paused unless ownership was checked before registration or preparation.

The final real-world test supplied three independent fix-absent signals:

1. Removing `browserContextId` from `tab new` failed in round zero because the session lost ownership of the popup flow.
2. Accepting every discovered target failed in round zero because both agents shared a `targetId`.
3. Omitting owned-context disposal during explicit close failed because the closed agent's targets remained in Chrome.

## Method used

1. Ran a Solution Gate against issue #1068 before implementation. Two proposer runtimes from different model families independently shaped the ownership contract, and real Chrome probes rejected `disposeOnDetach`, discovery-only filtering, legacy fail-open persistence, and reuse of the generic shutdown path.
2. Implemented one persisted primary BrowserContext per isolated session. The ownership predicate covers discovery, auto-attach, events, tab and window creation, state temporary targets, recording child contexts, restart, shutdown, and explicit close.
3. Ran Review Gate on implementation commit `ee68b3c`. It found and closed three gaps: missing command documentation, child-context leakage on internal shutdown, and sticky isolation mutation on a late invalid request.
4. Added an ignored integration test at commit `c731307` that drives the compiled CLI through three daemons and one real Chrome.
5. Exercised two agents on the same origin with concurrent tabs, windows, cross-origin page popups, cookies, localStorage, sessionStorage, IndexedDB, Cache API, parallel state saves, daemon SIGTERM and reconnect, and explicit close cleanup.
6. Repeated the campaign across fresh Chrome instances, then forced three distinct production regressions and required behavior-specific failures before restoring green.

## Outcome

PR #1683 is open, mergeable, and ready for maintainer review at head `c731307100e2d488d1911ffe1a21fd339b531664`.

The stress campaign completed 144 rounds across fresh-Chrome runs. One five-campaign run completed 100 rounds without an intermittent failure. No additional product defect was found.

The full serial Rust suite passed 1,117 tests with 104 ignored and no failures. Both doctor integration tests passed. Formatting, clippy with warnings denied, docs, deterministic gate checks, and `git diff --check` passed. GitHub CI, Vercel Agent Review, Socket checks, package checks, and previews were green on 2026-08-11.

## Evidence

- Source: [issue #1068](https://github.com/vercel-labs/agent-browser/issues/1068), [PR #1683](https://github.com/vercel-labs/agent-browser/pull/1683), implementation commit `ee68b3c`, stress commit `c731307`.
- Runtime: compiled PR-head CLI, three real daemons, one real Chrome, two isolated agents sharing the same application origin.
- Tests: 144 stress rounds; one 100-round repeated campaign; three independent fix-absent mutations; 1,117 serial tests passed; 104 ignored; 2 doctor tests passed.
- Review: [Solution Gate](../../foundry/runs/solution-gate/2026-08-11-agent-browser-1068-548b159.md), [implementation Review Gate](../../foundry/runs/review-gate/2026-08-11-agent-browser-1068-ee68b3c.md), and [stress Review Gate](../../foundry/runs/review-gate/2026-08-11-agent-browser-1068-stress-c731307.md). The Review Gate reports disclose that author and reviewer shared a model family. Human maintainer review is pending.
- Artifact: pushed branch `fix/1068-isolated-context`, open PR #1683, and ignored integration test `cli/tests/isolate_context_cli.rs`.

## Transferable lesson

Proving an isolation primitive partitions storage is not enough. The durable contract spans every producer, observer, persistence boundary, restart path, and destructor that can touch the owned resources.

A useful real-world regression test composes those seams in one lifecycle and then removes several independent enforcement points. Passing many rounds argues against intermittence; force-red failures show that the test is sensitive to the mechanisms it claims to protect.

## Exceptions

- The stress test is ignored by default because it launches Chrome and multiple daemons. It belongs in explicit PR, scheduled, or local dogfood runs.
- `--isolate-context` remains opt-in. Existing workflows that deliberately share Chrome's default login state must not be silently partitioned.
- `--pin-tab` and BrowserContext isolation protect different identities. Pinning selects one target inside a session; context isolation owns storage and the allowed target set.
- Passing this campaign does not constitute maintainer acceptance or prove behavior on every operating system.

## Candidate changes

- Deterministic check: for resource-isolation changes, run one lifecycle test that combines concurrent creation, same-origin private state, persistence, partial process restart, and owner-scoped cleanup, then force-red at least one producer, one ownership filter, and one destructor.

## Confidentiality review

All retrieval handles, source code, issue and PR state, automated review records, and test results are public-safe. Non-public conversations, secrets, employer-only context, and machine-specific paths are omitted.
