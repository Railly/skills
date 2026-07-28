# Case: Check who calls the function before accepting a "reset the counter" fix

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: not-applicable
Delivery: local
Upstream status checked: 2026-07-28
Visibility: public
Repository: vercel-labs/wterm
Role: maintainer
Source: https://github.com/vercel-labs/wterm/pull/67

> Contributor-validated by reading the call graph in the file under change. The regression it would have introduced was not executed, only traced. Closed without merging, so nothing was delivered.

## Observed condition or claim

An external contributor's pull request, one line, titled as fixing a WebSocket reconnect delay that did not reset on a new `connect()`. It added `this._reconnectDelay = 1000;` at the top of `connect()`. It sat unreviewed for 84 days alongside three other pull requests from the same author, all of which were correct.

The change looked like the safest kind: one line, plausible title, no API surface, and the author had a good track record in the same review batch. It was on a list of low-risk merges.

## Red signal

The reset was placed in a function that the retry path itself calls. `_scheduleReconnect()` sets a timer whose callback is `this.connect()`. So every automatic retry would re-enter `connect()`, reset the delay to its floor, and only then let the backoff double it again. The exponential backoff would never grow past one step: a server that stays down would be retried once per second indefinitely.

The second signal was in the same file, thirty lines up. The `onopen` handler already contained `this._reconnectDelay = 1000;`. The reset the title claimed was missing was present, in the one place where it is correct, because that is the point at which a connection is actually established rather than merely attempted.

## Method used

1. Read the full file rather than the diff. A one-line diff shows the inserted line and its neighbors, not the caller that makes the line wrong.
2. Traced the call graph of the function being modified, specifically looking for whether anything in the retry path calls it. It did.
3. Checked whether the behavior the title claimed was missing already existed elsewhere in the same file. It did, in the correct handler.
4. Separated "this is wrong" from "this author is wrong." The same author's three other pull requests in the batch were verified correct and recreated with credit, and the rejection was delivered alongside those three merges rather than on its own.
5. Wrote the rejection as the traced mechanism, naming the caller and the file position of the existing correct reset, so the author could check the reasoning instead of taking a verdict. Offered the narrower version that would be defensible: resetting only on a manual `connect()` with an explicit argument, not on the retry path.

## Outcome

- Closed without merging, with the mechanism stated and the existing correct reset cited by file and line.
- The author's other three pull requests were recreated and merged the same day with co-author credit, so the four decisions arrived together.
- No code delivered. The defect this prevented, a retry loop pinned to its floor delay against a down server, was traced rather than executed.

## Evidence

- Source: PR #67, one line added to `packages/@wterm/core/src/transport.ts`. The relevant facts are all in that file: `connect()` assigns the `onclose` handler that calls `_scheduleReconnect()`, whose `setTimeout` callback calls `this.connect()`; `onopen` already resets the delay.
- Runtime: none. The regression was traced through the call graph, not reproduced. This is the weakest part of the case: a live check would have been cheap, and was not run.
- Tests: none. No test covered the backoff growth curve, which is why nothing in the repository would have caught this had it merged.
- Review: contributor-side judgment, delivered as a close with the traced mechanism. No second reviewer.
- Artifact: not applicable, nothing was built or shipped.

## Transferable lesson

> Before accepting a fix that resets a counter, timer, or retry state, find every caller of the function it is placed in. A reset is only correct at the point where the condition it tracks has actually changed. If the retry path calls that same function, the reset runs on every attempt and the state it guards can never grow, which converts a backoff into a fixed-interval hammer.

Secondary: a one-line diff hides its own blast radius. The line was correct in isolation and wrong in context, and the context was thirty lines up in the same file. Small diffs invite reading the diff instead of the file, which is precisely the case where reading the file is cheap.

Third: batch the rejection with the acceptances. Three of this author's four pull requests were correct. Delivering the one rejection at the same time as the three merges, with the mechanism traced rather than asserted, is a different message than delivering it alone after 84 days of silence.

## Exceptions

The claim that the backoff would be pinned to its floor is an inference from the call graph, not an observed run. It is a strong inference, the callback is a direct `this.connect()`, but it was not executed. A narrower version of the author's change, scoped to a manual reconnect with an explicit argument, was not evaluated and may well be correct.

## Candidate changes

- Skill method: no change
- Reference rule: for any diff that resets retry, timer, or counter state, enumerate the callers of the enclosing function before judging the line
- Exemplar: no change
- Deterministic check: no change
- Eval: no change
- Coverage gap: no test covers the reconnect backoff growth curve, so this class of regression is invisible to the repository's CI
- No change: not selected

## Confidentiality review

Public repository, public pull request, public author. The rejection text posted on the pull request is public. No local paths, no private review text, no internal discussion referenced.
