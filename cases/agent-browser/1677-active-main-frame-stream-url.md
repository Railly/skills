# Case: agent-browser #1677: an active-page event needs both owner and frame identity

Status: observed
Validation: contributor-validated
Human review: contributor-complete
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-08-11
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: issue #1677, PR #1682, branch `fix/1677-stream-url-navigation`, commit `c0f120047e0272226f3e30182bb306287cc0f8b5`, base `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`

> Contributor-validated and submitted for maintainer review. At the dated check PR #1682 was open with all required checks green, `REVIEW_REQUIRED`, and no maintainer review recorded.

## Observed condition or claim

The native WebSocket stream emitted URL messages after full-document navigation but not after Chrome same-document navigation. A client-side router, `history.pushState`, `history.replaceState`, or fragment change could update the browser and streamed frames while consumers retained the old URL.

The issue requested handling `Page.navigatedWithinDocument` for the main frame without adopting a child-frame URL. Live inspection expanded the actual failure family: a background tab's full-document `Page.frameNavigated` event could also overwrite the cached active URL because the existing path did not require active-session ownership.

## Red signal

On base `548b159`, a real Chrome stream emitted zero URL messages after main-frame History API and fragment navigation even though `get url` returned the new location.

A second real probe kept one tab active, navigated a background tab through CDP, and observed the stream emit the background URL and replace the cached active URL. Session identity alone was still insufficient because same-process child frames and the main frame share the page session. Frame identity alone was also insufficient because another page session has its own main frame.

The Review Gate then found a generation race: after a tab switch, a late event from the old session could arrive between tab-cache publication and event-loop rebinding and be attributed to the new active tab.

## Method used

A Solution Gate ran before implementation with two independent proposers on different model families. Live probes falsified the narrow shape of only adding `Page.navigatedWithinDocument` and selected a combined ownership predicate:

- bind the event loop to the active CDP session
- seed the top-frame identity with bounded `Page.getFrameTree`
- accept full and same-document events only for the active session and main frame
- normalize an empty stored session with an absent event session for direct-page connections
- update the cached active tab and publish the existing `url` message through one path

The implementation buffers same-document events while the frame-tree seed is unresolved, bounds that buffer, retries after a seed timeout, and makes shutdown cancel an unanswered seed. Session binding and cached-tab publication move together, and the live session is checked again immediately before publishing so an old generation cannot overwrite the new active URL.

The real-world Chrome stress test alternates two tabs while the previous tab schedules a delayed History API navigation and redirect. It also navigates an active child frame, stalls one WebSocket reader, reconnects clients, checks the cached bootstrap URL, and verifies the browser URL after every iteration.

Lightpanda 0.3.6 received a separate real-runtime E2E for active full-document navigation, child-frame rejection, reconnect bootstrap, another navigation, and process cleanup.

## Outcome

PR #1682 emits active main-frame URL changes for Chrome full-document, History API, and fragment navigation. Full-document navigation remains supported on Lightpanda. Child frames, background sessions, and late events from an old active session cannot replace the active URL.

The branch is pushed at `c0f1200` and the PR is ready for review. On 2026-08-11, Version Sync, Rust, Dashboard, Sandbox Package, Eve Package, Socket checks, Vercel Agent Review, and both Vercel previews were green. The PR remained blocked only by required human review.

## Evidence

- Source: issue #1677; PR #1682; commit `c0f120047e0272226f3e30182bb306287cc0f8b5`; nine changed files, 1,683 insertions, and 43 deletions.
- Runtime: real Chrome main-frame full, History API, and fragment navigation; child-frame and background-tab rejection; reconnect bootstrap; 100 stress iterations with seed `1677`; 20 iterations each with seeds `1677`, `42`, and `9001`.
- Tests: 1,122 regular tests passed with 106 ignored. The real Chrome stress E2E passed. The real Lightpanda stream E2E passed ten consecutive runs, and all three Lightpanda E2Es passed together. `cargo fmt`, `git diff --check`, and clippy with warnings denied passed.
- Review: [Solution Gate](../../foundry/runs/solution-gate/2026-08-10-agent-browser-1677-548b159b.md); [Review Gate](../../foundry/runs/review-gate/2026-08-11-agent-browser-1677-548b159.md). The Review Gate found and closed background-session filtering, atomic rebinding, and cross-engine documentation gaps. Contributor human review is complete; maintainer review is pending.
- Artifact: the committed README, streaming docs, CLI output, and bundled core skill describe the engine-specific URL contract. Both Vercel previews reached Ready.

Three fix-absent checks established test sensitivity:

- removing the live-session publish guard failed the stale-session regression
- removing the Chrome main-frame predicate made the real stress test emit the active child-frame URL
- removing Lightpanda's `is_main` predicate made the real runtime E2E emit the child URL

## Transferable lesson

An event that updates the public state of an active resource needs the identity of both the owner generation and the authoritative subresource. For a browser stream, session identity rejects other tabs but not same-process child frames; frame identity rejects children but not another tab's main frame. The acceptance predicate is their conjunction.

When owner changes and cached state are published concurrently with an event loop, checking identity only when the event is received is not enough. Bind the owner and cache atomically, then recheck the live generation at the publication boundary. Otherwise an event that was valid when read can become stale before it mutates public state.

The real-world stress case adds one further method lesson: race coverage should combine delayed events from the previous owner, forbidden subresource events from the current owner, slow consumers, reconnect bootstrap, and repeated owner switches. Each factor alone misses the interaction the public contract must survive.

## Exceptions

Chrome exposes same-document navigation through `Page.navigatedWithinDocument`; the documented History API and fragment guarantee is therefore Chrome-specific. Lightpanda's real runtime coverage proves full-document behavior only.

Lightpanda 0.3.6 cannot create a second page because `Target.createTarget` returns `TargetAlreadyLoaded`, consistent with `lightpanda-io/browser#1962`. Real Lightpanda background-tab coverage remains unavailable until that substrate supports multiple pages; deterministic CDP coverage guards the session predicate meanwhile.

The ordered non-frame stream channel remains bounded and non-durable. A slow receiver can lag, and replaying buffered initialization URL events can contribute to that existing condition. This change does not introduce a durability guarantee.

## Candidate changes

- Reference rule: when an asynchronous event updates active-resource state, require both owner-generation identity and authoritative subresource identity, publish owner binding with its cache atomically, and recheck the generation immediately before the external mutation.

## Confidentiality review

Public issue, public repository, public pull request, public upstream Lightpanda issue, and the author's own contribution. Excluded: private conversation text, local filesystem paths, employer-only context, participant identities not already public on GitHub, and temporary browser binary locations.
