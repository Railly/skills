You are reviewing a diff in the agent-browser repo (Rust CLI + daemon driving Chrome over CDP). Repo checkout: the current working directory, HEAD a40027dc, base origin/main d9570915. The diff is `git diff origin/main..HEAD` (also at /tmp/rg1713/diff.patch). Read the surrounding code, not just the hunks.

Stated intent (issue #1713): when a page's renderer stops yielding (e.g. `eval 'while(true){}'`), today every later command on the session times out and the session never recovers without killing the daemon. The diff: after a command fails with the CDP timeout, probe the renderer; if it does not answer, in a daemon-launched browser replace the tab with a blank one and fail the command with code `page_wedged`; in attached browsers (--cdp/--auto-connect) leave the tab and only report. A retry of the same request id gets the report again; a different later command carries it once as `warning`. The daemon clears the pending report when the socket write of a page_wedged response succeeds.

Find correctness bugs, regressions, and contract breaks. For each finding give: file:line, a concrete scenario (inputs/state -> wrong result), and severity (P0 blocker, P1 should fix, P2 minor). Check in particular, without assuming any is a bug:
- false positives of the wedge detection (live tabs that legitimately do not answer Runtime.evaluate: dialogs, debugger/attach pauses, heavy but finite scripts, navigation in progress), and what state is lost
- every DaemonState / BrowserManager invariant touched when the active target changes (compare with tab_new / tab_switch / tab_close handlers in actions.rs)
- the replay/warning delivery logic: request id reuse, batch commands, concurrent sessions, the mutex in daemon.rs, Windows TCP transport
- pages vector / target events after the swap (targetCreated/targetDestroyed handling), stream server, persisted tab binding
- whether the CDP timeout classifier `contains("CDP command timed out")` can be triggered by commands not on the active page (e.g. other tabs, iframe sessions, browser-level calls)
Do not modify files. Output findings as a numbered list; say "no findings" for a checked area that is clean.
