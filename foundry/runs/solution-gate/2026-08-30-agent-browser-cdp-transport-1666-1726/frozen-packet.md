# Frozen Solution Gate packet

Date: 2026-08-30

Repository: `vercel-labs/agent-browser`

Base: `fbd046c23a2c1156891bda294aaaee715c23b3f1`

Mode: candidate audit for PRs #1667 and #1727

## Frame

The CDP transport can leave work or resources alive after it can no longer
deliver a usable response. A text frame that cannot be represented as the
typed CDP message is silently skipped, and closing a manager connected to an
external browser does not terminate the underlying socket and transport tasks.

Each CDP connection needs a bounded, explicit lifecycle. An unrepresentable
response or event must not silently stall the workflow, and replacing or
closing a connection must release it without shutting down an externally owned
browser.

## Requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | A command response containing JSON string escapes that Rust cannot directly represent must not leave the matching command waiting for the production timeout. | Core goal |
| R1 | An event containing the same unrepresentable string class must remain usable by existing event-driven workflows instead of being silently dropped. | Core goal, derived from the `Fetch.requestPaused` reproduction added to issue #1666 |
| R2 | Payloads containing a valid UTF-16 surrogate pair and ordinary Unicode must preserve their meaning. | Must-have |
| R3 | A malformed or unsupported frame must not resolve an unrelated pending command. | Must-have |
| R4 | Events and inspect-proxy frames without a supported positive command id must remain available to their existing consumers or be rejected without corrupting the pending-command map. | Must-have |
| R5 | Closing or replacing an external CDP connection must terminate its socket and background transport tasks. | Core goal |
| R6 | Closing an external CDP connection must not issue `Browser.close` or otherwise shut down the externally owned browser. | Must-have |
| R7 | Closing a locally launched browser must preserve the existing browser-process shutdown behavior while also releasing transport resources. | Must-have |
| R8 | Transport shutdown must not strand pending callers, accept new work after closure, or allow keepalive writes to race indefinitely with shutdown. | Must-have |
| R9 | The fix must remain internal, independently mergeable, and reversible, limited to the CDP client lifecycle and its `BrowserManager::close` integration. | Must-have |
| R10 | Tests must independently fail when lenient frame handling is removed and when explicit connection shutdown is removed. | Must-have |

## Must not change

- Successful CDP commands retain their result and error semantics.
- Valid CDP events continue reaching event subscribers.
- Raw inspect traffic continues reaching raw subscribers, including frames not
  representable as `CdpMessage`.
- External browsers remain running after agent-browser disconnects.
- Locally owned browsers retain the existing `Browser.close` and process-reaping
  treatment.
- The existing 30-second CDP command timeout remains unchanged.
- No daemon-wide deadline, target recycling, new flag, command, environment
  variable, output schema, or persistent state is added.
- #1713 may be mitigated but is not closed by this work.

## Discriminator cells

1. Ordinary response with positive top-level id.
2. Response with one lone high surrogate escape.
3. Event without id containing one lone surrogate escape.
4. Valid surrogate pair plus ordinary multibyte Unicode.
5. Unparseable frame with a nested id but no valid top-level command id.
6. Inspect frame with a negative id.
7. Explicit close while idle against a cooperative peer.
8. Explicit close while a command is pending.
9. Repeated and concurrent close.
10. External manager close leaves the browser alive but closes the socket.
11. Local manager close preserves `Browser.close` and process reaping.
12. Keepalive or inspect write concurrent with close.
13. New command and raw writes after close fail before adding pending work.
14. Plain WebSocket and Rustls WebSocket both terminate.
15. Unix and Windows socket duplication and shutdown both terminate.
