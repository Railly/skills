# Case: agent-browser #1594: a drop-stale guarantee is void below the layer that enforces it

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-26
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: PR #1594, branch `feat/stream-input-priority-latest-frame`, head `866f312`; merge base `origin/main` after #1605 merged 2026-07-24; related #633, #995, #1358, #1476

> Contributor-validated only. At the dated check the PR was open with zero reviews, so no human or maintainer has assessed it. The three review rounds behind this case were the author's own gate plus two agent passes on a different model, which is not independent human review.

## Observed condition or claim

The stream server delivers screencast frames to WebSocket clients. Two requirements arrived from a remote-preview use case: input should dispatch immediately even while frames are being written, and a client that falls behind should receive only the newest frame at a configurable rate instead of draining a backlog.

The change moved frames from an ordered 64-deep broadcast channel to a latest-value channel and added a per-client `maxFps` cap. The claim documented alongside it was that a client which falls behind "always receives the newest frame instead of draining a backlog".

## Red signal

The claim held in the application and failed in the transport. A raw WebSocket client that stopped reading for three seconds and then resumed drained **1 MB in 700 ms**: frames the writer had already handed to the socket were delivered in order, exactly the backlog the change claimed to eliminate. The application-level channel can only skip a frame it has not yet written; once written, the frame belongs to the kernel and the guarantee is void.

The size of that backlog scaled with the configured rate rather than being bounded: after a three-second stall a client received 176 stale frames uncapped, 39 at `maxFps: 10`, and 8 at `maxFps: 2`.

An attempt to bound it below the application, capping `SO_SNDBUF` on the accepted socket, produced no measurable change (1.1 MB drained before and after) because the bytes in flight are the sum of the server's send buffer and the client's receive buffer, and the second is not the server's to set. That attempt was reverted rather than shipped.

## Method used

The mechanism that fixes this already existed one layer up, in the substrate being consumed: Chrome paces its own screencast with `Page.screencastFrameAck` and will not send the next frame until the previous one is acknowledged. This implementation acknowledged every CDP frame immediately, which is correct for decoupling clients from each other, but it left the daemon-to-client hop with no flow control at all.

The fix reintroduces acknowledgement at the client edge, opt-in:

- every frame carries a monotonic `seq`, process-wide so it survives a browser relaunch
- a client sends `{"type":"config","pacing":"ack"}` and the writer keeps at most one frame in flight, waiting for `{"type":"ack","seq":N}`
- frames produced while an acknowledgement is outstanding replace each other in the latest-value channel and never reach the socket
- push remains the default, because acknowledgement requires cooperation an existing client cannot give and its failure mode is a blank screen rather than a stale one

Two edges of that contract were found by pressuring the fix itself rather than the original defect:

- A mutation that removed the monotonic guard on the acknowledged watermark survived the whole test suite. Investigating why surfaced a reachable defect: a client that acknowledges an id ahead of anything sent banks a high watermark, every later acknowledgement fails to advance it, no notification fires, and that client's stream stops permanently. The writer now settles a newly sent frame against the value already banked.
- Acknowledgement declared in a `config` message cannot cover the connection's opening frame, because the cached frame is written before the message can arrive. A client that opted in immediately still received two frames without acknowledging either. Pacing and `maxFps` can now be declared on the URL, which applies before the first frame.

## Outcome

With a 400 KB/s metered link and an eight-second client stall, push draws **436 stale frames (7.7 MB)** and acknowledged pacing draws **1 (0.02 MB)**. Steady-state throughput is unchanged when the client keeps up: 181 frames over three seconds uncapped in both modes.

A separate pre-existing defect surfaced while trying to measure staleness at all: frame metadata timestamps were always 0, because CDP sends the capture time as a float in seconds and the code read it as an integer. No client could tell how old a frame was. That is the metric the use case most needs, and it was dead on arrival.

## Evidence

- Source: PR #1594 head `866f312`; open, `MERGEABLE`, zero reviews at the 2026-07-26 check. Merge base includes #1605, merged 2026-07-24, whose idle-activity marking collided with this change's reader and writer split.
- Runtime: release binary driven against local Chrome. `maxFps` 0/2/10/30 delivered 181/6/30/87 frames over three seconds. A raw client that paused reads for three seconds drained 1 MB in 700 ms before the fix. With `?pacing=ack` and no acknowledgement ever sent, a client receives exactly 1 frame where the default receives 280 over the same window. Input reached the DOM while frames were mid-flight, including through a proxy that stopped reading server output.
- Tests: 1048 unit tests pass. Seven mutations were applied one at a time to force each new regression test red against the defect it guards; six turned red, one survived and produced the premature-acknowledgement finding above. End-to-end: 95 of 95 pass from a short checkout path. Two failures observed from a 73-character checkout path trace to `e2e_tests.rs` building a Unix socket path from `CARGO_MANIFEST_DIR` instead of the system temp dir, exceeding `SUN_LEN`; the second failure was cascade from a mutex poisoned by the first panic. Unknown whether this affects the project's CI runners, which use a shorter path.
- Review: three rounds, all pre-human. The author's own gate, then two agent passes on a different model family. The second and third rounds each produced findings the earlier rounds missed, including the two contract edges above and two false claims in the author's own documentation. End-to-end tests do not run on pull requests in this repository, so they were run locally rather than by CI.
- Artifact: `agent-browser skills get core --full` serves the new streaming reference at runtime, verified by fetching it from the built binary rather than reading the file on disk.

## Transferable lesson

A guarantee about discarding stale data is only as strong as the layer that enforces it. When the fix is "keep the newest and drop the rest", the question to ask next is where the data can still queue *below* the code that made the choice: an application buffer, a socket, a kernel queue, a proxy, a client's own event loop. A latest-value channel in the process is not a freshness guarantee end to end; it is a freshness guarantee up to the first place the process hands the data away.

The enforcement point has to be somewhere that knows the consumer made progress, which in practice means an acknowledgement from the consumer. Before designing one, check the substrate already being consumed: a protocol that solves this upstream (here, acknowledged screencast frames) is both a working reference and evidence that the problem is real.

Two secondary observations, from pressuring the fix rather than the original defect:

- A surviving mutation is a design signal, not only a coverage gap. The mutation that no test noticed pointed at a reachable state where a client could wedge its own stream permanently.
- A setting a client sends after connecting cannot govern what the server already sent on connect. Any per-connection contract that must hold from the first byte belongs in the handshake, not in a message.

## Exceptions

The measured cost of the unfixed behavior is a function of the link. On loopback the stale backlog drains in tens of milliseconds and is invisible; the wasted bandwidth is the durable harm, and it only becomes latency on a constrained link. A local dashboard would not notice this defect, which is why it survived.

Acknowledged pacing bounds frames in flight and therefore caps throughput at roughly one frame per round trip. On loopback that ceiling is not reachable; over a real link it is, and no measurement here establishes where. That limit is reasoned, not observed.

The end-to-end result is bounded to one machine and one checkout path. The socket-path failure is a property of the checkout location, so the same commit passes or fails depending on where it is cloned.

## Candidate changes

- Reference rule: add a subsystem invariant to the project's review conventions. When a change introduces or relies on a drop-stale, latest-wins, coalescing, or debouncing rule, enumerate every buffer between the decision point and the consumer, and name which one still preserves order. The guarantee holds only to the first hand-off; verify at the consumer, not at the channel.

## Confidentiality review

Public repository, public pull request, author's own contribution. The requirement's origin is described as a remote-preview use case with no organization, product, or person named. Excluded: private discussion, quoted review text, participant names, schedule commitments, filesystem paths, and any neighboring project. Measurements were reproduced on public code with a binary built from the branch.
