# agent-browser #1666 and #1726 Solution Gate

Date: 2026-08-30

Base: `fbd046c23a2c1156891bda294aaaee715c23b3f1`

Mode: candidate audit

Candidates:

- PR #1667 at `577909505dac1ea81768dad6c6efb51130cd11d2`,
  by `@melon95`
- PR #1727 at `2be217a0d2d99be9b0087cdf660dfeb9db53d80b`,
  by `@riesvriend`

## Decision

**Verdict: Pass to detail. Candidate disposition: absorb and recreate.**

Build one internal, independently mergeable transport change from the current
base:

1. Repair lone UTF-16 surrogate escapes to U+FFFD before typed deserialization,
   preserving valid pairs and ordinary Unicode.
2. If typed parsing still fails, use a minimal Serde envelope with
   `IgnoredAny` fields to extract only a supported top-level positive command
   id. Fail that pending caller promptly. Never search text for nested ids.
3. Give `CdpClient` an idempotent closed state. Commands and inspect writes
   fail before adding or sending new work after close starts.
4. Before splitting the WebSocket, duplicate the underlying TCP socket with
   `socket2::SockRef::try_clone` for both plain and Rustls streams.
5. Close in bounded order: mark closed, stop keepalive, attempt a bounded
   WebSocket Close frame, call `shutdown(Both)` on the socket duplicate, stop
   the reader, and clear pending senders.
6. Call the transport close from every `BrowserManager::close` path. Preserve
   the existing ownership gate around `Browser.close` and process reaping.

The U+FFFD repair is required, not optional. Issue #1666 now includes an
independent `Fetch.requestPaused` reproduction where the invalid frame is an
event without an id. Failing only command responses would leave uploads stalled
because the event handler never receives the request to continue.

## Reviewer isolation

| Reviewer | Family | Checkout | Base | Result |
|---|---|---|---|---|
| A | Anthropic Claude Sonnet | `/tmp/agent-browser-sg-review-a.JL9rFn` | `fbd046c` | Selected bounded frame recovery plus explicit transport close |
| B | GLM 5.3 Flash through fx | `/tmp/agent-browser-sg-review-b.n4Sx04` | `fbd046c` | Selected bounded frame recovery plus explicit transport close |

Both reviewers received the same frozen packet, clean detached worktrees, no
candidate artifacts, and no GitHub access. The first open-ended passes were
stopped because they continued exploring without producing the requested
artifact. Closed-input passes produced complete artifacts. An attempted Codex
CLI pass failed authentication before producing content.

The reviewers initially converged on a custom top-level id scanner and
explicit socket shutdown. Probe P1 replaced the scanner with the smaller Serde
envelope. Probe P2 proved the socket shutdown was load-bearing.

## Probe evidence

### P1: Serde envelope

Temporary harness: `/tmp/agent-browser-sg-probe`

Observed:

- `{"id":7,"result":{"value":"\ud800"}}` parsed as top-level id `7`
  when payload values used `IgnoredAny`.
- An id-less event containing the same surrogate parsed with no id.
- `{"result":{"id":42,"value":"\ud800"}}` did not promote nested id
  `42`.
- A negative top-level id was rejected as outside `u64`.
- Normal `serde_json::Value` parsing preserved `\ud83d\ude00 café` as
  `😀 café`.

Mechanism: `serde_json::deserialize_ignored_any` calls its skip path instead of
materializing the unrepresentable string.

Result: the custom byte scanner proposed by both blind reviewers is rejected.

### P2: Close frame versus socket shutdown

A local tokio-tungstenite 0.24 peer held a live `Arc` clone of the split sink to
represent an inspect handle.

Observed:

| Mechanism | Close returned | Peer observed TCP EOF while inspect handle lived |
|---|---:|---:|
| `SplitSink::close()` only | Yes | No |
| `SplitSink::close()` plus duplicated socket `shutdown(Both)` | Yes | Yes |

Result: a Close-frame assertion is not a transport-lifecycle oracle. The socket
duplicate and explicit shutdown are required unless the connection is refactored
to single-task ownership.

### P3: base lifecycle behavior

Base reader exit already clears `pending`, dropping oneshot senders so waiting
commands receive the existing `CDP response channel closed` error. The new
explicit close may clear pending directly and retain reader cleanup as a
backstop.

## Selected shape F: lenient envelope plus owned socket shutdown

| Part | Mechanism | Flag |
|---|---|:---:|
| F1 | On typed parse failure, repair only unpaired UTF-16 surrogate escapes to U+FFFD; leave valid pairs and ordinary bytes unchanged. | |
| F2 | Retry the normal typed `CdpMessage` parse so both responses and events remain available to existing consumers. | |
| F3 | If typed parsing still fails, deserialize a minimal envelope containing `id: Option<u64>` and `IgnoredAny` payload fields. Resolve only a matching positive top-level pending id with a bounded parse error. | |
| F4 | Preserve the existing pre-parse raw broadcast exactly. Frames without a supported positive id never mutate `pending`. | |
| F5 | Duplicate the underlying TCP socket before WebSocket split using `socket2`; support both `Plain` and `Rustls` variants through the same underlying `TcpStream` access already used for keepalive. | |
| F6 | Add an atomic idempotent closed guard checked by all command and raw write paths before insertion or write. | |
| F7 | Close in bounded order: transition to closed, stop keepalive, best-effort bounded Close frame, unconditional socket `shutdown(Both)`, terminate reader, clear pending, and await or abort handles within a fixed internal bound. | |
| F8 | Integrate F7 into `BrowserManager::close` without changing the existing local-versus-external `Browser.close` ownership decision or process reaping. | |
| F9 | Add independent response/event and lifecycle regressions, including mechanism-specific force-red mutations. | |

## Fit check

| Req | Requirement | Status | F |
|---|---|---|:---:|
| R0 | A command response containing JSON string escapes that Rust cannot directly represent must not leave the matching command waiting for the production timeout. | Core goal | ✅ |
| R1 | An event containing the same unrepresentable string class must remain usable by existing event-driven workflows instead of being silently dropped. | Core goal | ✅ |
| R2 | Payloads containing a valid UTF-16 surrogate pair and ordinary Unicode must preserve their meaning. | Must-have | ✅ |
| R3 | A malformed or unsupported frame must not resolve an unrelated pending command. | Must-have | ✅ |
| R4 | Events and inspect-proxy frames without a supported positive command id must remain available to their existing consumers or be rejected without corrupting the pending-command map. | Must-have | ✅ |
| R5 | Closing or replacing an external CDP connection must terminate its socket and background transport tasks. | Core goal | ✅ |
| R6 | Closing an external CDP connection must not issue `Browser.close` or otherwise shut down the externally owned browser. | Must-have | ✅ |
| R7 | Closing a locally launched browser must preserve the existing browser-process shutdown behavior while also releasing transport resources. | Must-have | ✅ |
| R8 | Transport shutdown must not strand pending callers, accept new work after closure, or allow keepalive writes to race indefinitely with shutdown. | Must-have | ✅ |
| R9 | The fix must remain internal, independently mergeable, and reversible, limited to the CDP client lifecycle and its `BrowserManager::close` integration. | Must-have | ✅ |
| R10 | Tests must independently fail when lenient frame handling is removed and when explicit connection shutdown is removed. | Must-have | ✅ |

## Candidate comparison

| Dimension | Selected shape | PR #1667 | PR #1727 |
|---|---|---|---|
| Unrepresentable responses | Repair, then bounded correlated error | Repairs and returns usable payload | No handling |
| Unrepresentable events | Repairs so existing handlers run | Repairs so existing handlers run | No handling |
| Fallback correlation | Serde top-level envelope with `IgnoredAny` | Generic `Value` parse after repair; cannot recover an id if generic parsing still fails | None |
| Nested and negative ids | Structural top-level `u64` only | Structural after repair | None |
| Explicit close | Idempotent and bounded | None | Sends Close frame and aborts handles |
| Peer-independent TCP termination | Duplicated socket `shutdown(Both)` | None | Not present |
| Post-close writes | Closed guard, fail fast | Unchanged | Unchanged |
| Pending callers during close | Explicit clear plus reader backstop | Unchanged | Reader abort clears them asynchronously |
| Lifecycle test oracle | Close frame plus TCP EOF with live inspect handle | None | Asserts only receipt of a Close frame |
| Base drift | Recreated from current base | 13 commits behind and diverged | 2 commits behind and diverged |

### PR #1667

Reusable:

- The surrogate repair algorithm and its Unicode regression cases.
- The live AX-tree reproduction.
- The independent `Fetch.requestPaused` event reproduction.

Rejected:

- Treating U+FFFD repair as sufficient lifecycle work.
- The 330-line in-file patch as the final shape.
- Relying on a generic `Value` parse as the only fallback after the typed parse
  has already failed.

### PR #1727

Reusable:

- The correct `BrowserManager::close` integration point.
- Stop-keepalive-before-close ordering.
- The production reconnect reproduction and socket census.

Rejected:

- Treating a received WebSocket Close frame as proof that the socket and tasks
  terminated.
- Reader abort without a peer-independent underlying socket shutdown.
- No idempotent close state or guard against new writes.

Credit in the replacement PR and changelog must name `@melon95` for the
surrogate repair and reproductions, and `@riesvriend` for the external
connection lifecycle finding and reconnect proof.

## Failure-shape score

- S1 over-reach: designed out by running repair only after the existing typed
  parse fails and preserving the current path for valid traffic.
- S2 under-reach: candidate #1727 misses frame handling; response-only bounded
  error misses the event reproduction. F1 and F2 cover both responses and
  events.
- S3 direction inheritance: response and event directions are both explicit.
- S4 proxy property: a Close frame is rejected as a proxy for socket
  termination; TCP EOF and task completion are the required properties.
- S5 unregistered peer: all current transport producers, consumers, pending
  callers, keepalive, reader, and inspect handles are included in shutdown.
- S6 peer-version blindness: no new cross-process protocol is introduced.
- S7 wrong layer: `BrowserManager::close` calls the transport owner; browser
  ownership remains at the manager layer.
- S8 guard-derived cells: discriminator cases include nested ids, negative ids,
  invalid events, inspect clones, pending work, and concurrent writes.
- S9 test pins wrong thing: separate tests and force-red mutations are required
  for repair, fallback correlation, socket shutdown, and manager ownership.
- S10 claim from prose: Serde skipping and socket termination were executed in
  local probes.
- S11 asymmetric validation: command and inspect write paths share the same
  closed state.
- S12 primitive-contract mismatch: U+FFFD is an explicit lossy recovery
  contract; Close-frame semantics are not mistaken for TCP teardown.
- S13 invocation-state collapse: not applicable; no persistent invocation
  option or state transition is added.

## Required implementation evidence

1. Unit cells for lone high and low surrogates, valid pairs, escaped
   backslashes, multibyte text, nested ids, negative ids, and id-less events.
2. A flow test proving a surrogate-bearing response completes promptly and a
   subsequent valid command succeeds on the same connection.
3. A flow test proving a surrogate-bearing `Fetch.requestPaused` event reaches
   its subscriber and the intercepted request resumes.
4. Cooperative and uncooperative WebSocket peers, with an inspect handle held
   alive, proving Close frame delivery where possible and TCP EOF regardless.
5. Pending command, repeated close, concurrent close, keepalive contention,
   inspect write, and post-close command cells.
6. External manager close proves browser alive and socket closed.
7. Local manager close proves `Browser.close`, process reaping, and socket
   closure.
8. Plain and Rustls coverage.
9. Windows coverage for socket duplication and `shutdown(Both)`.
10. Force-red mutations independently removing F1/F2 and F5/F7.

## Carried assumptions

- `socket2::SockRef::try_clone` and `shutdown(Both)` behave equivalently on
  Windows. This requires execution on the Windows matrix before merge.
- Shutting down the duplicated underlying TCP socket is acceptable for Rustls
  teardown after a best-effort WebSocket Close frame. This requires a local
  Rustls peer test.
- U+FFFD replacement is acceptable for the affected CDP payload class. The
  issue reporter and both candidate authors support this behavior, and the
  event reproduction requires a usable event, but maintainer acceptance remains
  the final product judgment.

No implementation, branch, PR, issue comment, or GitHub mutation occurred in
this gate.
