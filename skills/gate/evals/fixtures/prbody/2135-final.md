## Problem

Fixes #1790. A second session can `tab <targetId>` onto a tab another session pinned with `--pin-tab` and drive it, while the pinning session still reports the tab as active.

## Changes

- `tab <ref>` fails with `tab_locked`, naming the owner, when another live session (its `.pid` exists and the process is alive) holds a pin on that target. Pins left by a dead daemon do not lock.
- An explicit `close` releases the session's pin before it replies, so another session can take the tab right away. If releasing fails, `close` still reports `closed: true` plus `pinReleaseError`.
- MCP tab switch goes through the same handler.
- README, the session-management reference, and the CDP mode and sessions docs describe the lock and the release on close; the CDP mode wording change is registered in `docs-edits.json`.

Limitations:

- Any next command for a session right after its `close` can still reach the exiting daemon for ~0.15s and fail with EOF. This predates the change and also happens on main: #2134.
- A dead owner's pid reused by another process keeps its pin locking.
- Only `tab <ref>` is guarded; `open`, `tab close` and `tab new` on a pinned tab are not.

## Visual proof

Two sessions on one headless Chrome (CDP port shown as 9222).

![Before: agent2 takes agent1's pinned tab and exits 0](https://github.com/user-attachments/assets/7279edb3-f12c-42b3-91f4-a02fc6891120)

![After: agent2 gets tab_locked naming agent1 and exits 1; after agent1 closes, the tab is free](https://github.com/user-attachments/assets/7c3eb95c-686d-4294-9e28-73a82ef0ada4)
