# Case: Response delivery is a continuation boundary, not a queue detail

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-09
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/105, merge commit `92976cd47e3a6764dfd7a1b114b6992560d6fa01`

## Observed condition or claim

The built-in terminal core stored only one pending host response. Consecutive terminal queries could overwrite one another before the browser host consumed them. Replacing the slot with a bounded FIFO fixed ordering, but moving response delivery between internal 8,192-byte write chunks introduced a second contract: application callbacks now ran inside the parser's continuation path.

## Red signal

The queue tests passed while two callback failures remained:

- an `onData` exception could exit the chunk loop before later PTY bytes were parsed or rendered
- `throw undefined` was swallowed because the thrown value doubled as the “no error” sentinel

The first regression test also claimed both parsing and render scheduling, but removing only `_scheduleRender()` left it green. The test observed one continuation and named two.

## Method used

1. Reproduced ordered delivery with multiple CPR replies from the committed WASM.
2. Forced more replies than the bounded FIFO can retain without per-chunk draining.
3. Put a response in chunk one and observable terminal input in chunk two, then threw from the response handler.
4. Enumerated JavaScript thrown-value classes instead of testing only `Error`.
5. Forced each named continuation independently: later parsing, response draining, render scheduling, and exact rethrow.
6. Kept the first thrown value with a separate presence boolean while continuing parser chunks and response delivery.

## Outcome

PR #105 merged on August 8, 2026.

- Consecutive terminal responses remain ordered.
- Responses drain between internal write chunks, so a 2,049-response write does not lose accepted replies.
- A callback failure no longer truncates later parser chunks.
- Rendering is scheduled before the first callback failure is rethrown.
- `throw undefined` is preserved exactly.
- The public write callback signatures and dequeue behavior are documented.

## Evidence

- Source: PR #105 at final head `0bd4045bbc863cfa41837f3f8509a69a3abaae47`; merged as `92976cd47e3a6764dfd7a1b114b6992560d6fa01`.
- Runtime: built DOM and committed WASM drives covered ordered replies, 10,000 replies, later-chunk parsing after callback failure, reentrant response delivery, and `throw undefined`.
- Tests: core queue/order/capacity coverage and DOM continuation assertions are present in the merged tree; the later combined repository run passed core 62 and DOM 112 tests.
- Review: ctate approved the final PR head; CI, Vercel Agent Review, Vercel deployment, and Socket checks passed.
- Artifact: the committed built-in WASM was rebuilt and byte-compared during the review cycle and again after integration with #106 and #107.

## Transferable lesson

When a user callback is inserted inside a parser, stream, or scheduler loop, it becomes part of that continuation boundary. The contract is no longer only “deliver every item.” It also includes what must finish if the callback throws, which thrown values are legal, and which visible state must be committed before the error escapes. A test name that claims several continuations creates one force-red obligation per continuation.

## Exceptions

The FIFO remains bounded. New responses are dropped when it is full so already accepted responses retain order. Per-chunk draining makes ordinary host usage stay below that bound; this case does not claim an unbounded response channel.

## Candidate changes

- Reference rule: treat every user callback inside an incremental loop as a failure boundary, enumerate all legal thrown-value classes, and force-red each continuation named by the test.

## Confidentiality review

All retrieval handles are public GitHub commits, checks, tests, and pull-request state. No private discussion, local path, customer data, or internal environment identifier is included.
