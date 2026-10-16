Fixes #1790. A second session could `tab <targetId>` onto a tab another session had pinned with `--pin-tab` and drive it, while the pinning session kept reporting it as active.

`tab <ref>` now reads the other sessions' tab bindings and fails with `tab_locked`, naming the owner, when a live session holds a pin on that target. An explicit `close` releases the session's pin before it replies.

Limitations:
- Any next command for the closed session can still hit the old daemon for ~0.15s and fail with EOF: #2134.
