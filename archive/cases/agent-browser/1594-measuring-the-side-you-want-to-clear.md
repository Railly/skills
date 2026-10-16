# Case: agent-browser #1594: a measurement that can only exonerate one side, read as clearing it

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: partial (the shipped fixes were approved and merged; the diagnostic errors below are self-reported)
Delivery: merged
Upstream status checked: 2026-07-30
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: PR #1594 (merged as `2158803`) and PR #1627 (merged as `723b452`); the WebSocket stream server in `cli/src/native/stream/`

> Contributor-validated. The fixes were reviewed and merged by the maintainer. The two diagnostic failures recorded here were found by the author, not by review, and are the reason this case exists.

## Observed condition or claim

A stream server delivers screencast frames to WebSocket clients and accepts input back. While gating a change to it, two separate defects were reported against the server, both from measurements taken with a purpose-built client harness:

1. Ack-paced connections intermittently deliver zero frames and never recover. Observed roughly six times across thirty-five connections, never on the push-mode control.
2. Ack-paced delivery collapses under input on the same socket: 3.7 fps at 200 input events per second against 60 fps idle.

Both were written up. The second shipped as a documented caveat on two doc surfaces, telling users that a client flooding input throttles its own stream above roughly 120 messages per second.

## Red signal

Neither defect was in the server.

The first was the harness. `connect()` resolved its promise and parsed the first TCP segment in the same tick, so when the server's seed frame shared that segment with the handshake response it was parsed before the caller could attach its `onMessage` handler. Under ack pacing that silently made the client owe an acknowledgement it never sent, and the server correctly stopped sending. Queueing pre-handler messages took the stall from one in ten to zero in twenty on the same daemon minutes later.

The second was real but attributed to the wrong side of the wire. The conclusion was client-side head-of-line blocking, resting on one number: the client's own socket write backlog measured zero bytes. That number shows the acknowledgement **left** the client. It says nothing about whether the server **read** it. The server's reader was blocked awaiting a CDP round trip per input event and was not reading. A later server-side change removed the symptom entirely, which is what disproved the diagnosis: ack-paced delivery went to 54 to 56 fps at every input rate from 30 to 250 per second.

## Method used

What eventually worked, in the order it mattered.

**Eliminate the order confound before spending anything expensive.** Every stall had been observed on the ack arm, and the ack arm ran first in every script. Re-running with push first on a daemon that had just stalled gave push 0 of 10 and ack 1 of 10 on its first trial. Only then was the finding trustworthy enough to justify instrumentation.

**Instrument the server, not the client.** Temporary trace lines in the writer's `select!` arms and in the reader's acknowledgement handling. The stalled connection produced `SEED sent seq=3294 ack_pacing=true awaiting=Some(3294)` followed by no reader line at all: the server had sent one frame and was waiting for an acknowledgement that never arrived. That single absent line located the fault in the client harness.

**Read the trace for what the server did between two events, not just how long it took.** In the degradation case the send-to-acknowledgement delay grew 33, 71, 116, 191, 317, 546, 908ms, which reads like a queue somewhere. The same trace showed the server's acknowledgement handling and its next send in the same millisecond. The growth was entirely in the interval where the server was not reading.

## Outcome

Both reports were withdrawn as server defects. The harness was fixed. The doc caveat was removed and replaced, and the replacement was itself wrong and flagged by the maintainer, which is recorded separately in the conventions gate-miss ledger.

The underlying cause of the second was fixed for real in #1627: input dispatch no longer awaits Chrome's reply, which took a click after a 300-event mouse sweep from 2471ms to 6ms and removed the ack-pacing degradation as a side effect.

## Evidence

- Source: PR #1594 merged as `2158803`, PR #1627 merged as `723b452`, both approved by the maintainer.
- Runtime: release binary against local Chrome. Stall reproduced ~6 times in ~35 ack connections and 0 times in ~20 push connections; 0 of 20 after the harness fix on the same daemon. Degradation 3.7 fps at 200 events per second before, 55.6 fps after the server fix. Click latency 2471ms before, 6ms after.
- Tests: 1055 unit tests pass. Two guards for the latency fix, both forced red against the defect: an ignored e2e that fails at 2493ms, and a unit test against a CDP endpoint that never replies, which fails on its 5s timeout.
- Review: an independent reviewer on a different model family confirmed no ordering or response-leak defect in the fix, and contributed the unit guard, since e2e does not run on pull requests in this repository.
- Artifact: daemon RSS held flat at 105808 KB across 20k input events, confirming no orphaned-response accumulation.

## Transferable lesson

**A measurement taken on one side of a boundary can only exonerate that side.** The client's write backlog reading zero proves the bytes left the client. Concluding from it that the client is not the bottleneck requires the additional claim that the server read them, which that measurement cannot support. Before assigning blame across a boundary, name the hops and pick an observable that distinguishes them; the cheapest one here was a single trace line in the receiver.

Two supporting habits, both of which cost real time when skipped:

- **When the harness is the instrument, prove the instrument before trusting a negative result.** A test client that attaches its handler after `connect()` resolves can drop the connection's first message, because the first frame often shares a TCP segment with the handshake response. Any protocol where the first message carries obligation, an acknowledgement, a sequence number, a session id, turns that into a server-looking stall.
- **Order is a confound whenever one arm always runs first.** Alternate the arms, or run the arm you expect to be healthy first. Six reproductions on the suspect arm meant nothing until push ran first and stayed clean.

The general shape underneath all three: each error had the property that the evidence supported the conclusion the author already preferred. The zero-byte backlog cleared the harness the author wrote. The ack-arm-only stalls indicted the feature under review rather than the tooling. Evidence that happens to exonerate the thing you own deserves a second observable before it is believed.

## Exceptions

The harness defect is specific to clients that attach handlers after connection setup, which is the common shape in Node and browser WebSocket code but not in a library that takes the handler as a constructor argument.

The degradation measurements are single-machine and loopback. The round-trip bound on acknowledged pacing is real but its magnitude is a property of the link, and nothing here establishes it for a remote one.

The claim that the server fix removed the degradation entirely rests on re-measurement at the same input rates on the same page, not on a proof that no input rate can reproduce it.

## Candidate changes

- Reference rule, recorded in the project conventions: when timing a round trip, name the hops before assigning blame, and pick evidence that discriminates between them.
- Reference rule: treat a client harness as an artifact under test when it is the measuring instrument, and queue anything parsed before a handler exists.

## Confidentiality review

Public repository, public pull requests, author's own contributions and own tooling output. The requirement's origin is described as a remote-preview use case with no organization, product, or person named. Excluded: private discussion, quoted review text, participant names, schedule commitments, filesystem paths, and any neighboring project. All measurements are reproducible against the public branches.
