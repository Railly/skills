# Case: A path-scoped kill command missed the daemon that was actually answering

Status: observed
Validation: independently-validated
Human review: pending
Maintainer acceptance: not-applicable
Delivery: local
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1552 · https://github.com/vercel-labs/agent-browser/pull/1553
Upstream status checked: 2026-07-16

> Unvalidated by anyone outside this session's own tooling, but the false negative it produced was independently reproduced by a second, blind agent session working from a self-contained verification prompt, then independently corrected by that same session once it checked which process was actually answering.

## Observed failure

Two sibling fixes to the same CLI (#1552, #1553) each live in their own git worktree with their own compiled binary. A verification pass on the second worktree's error-message fix reported the fix as "still broken": the JSON error field showed the old, generic, unfixed string, even though the source in that worktree had the fix and a fresh build showed no changes needed.

## Red signal

`agent-browser session info --json` on the failing worktree's CLI, followed by `ps -p <backgroundPid> -o command`, showed the daemon that actually answered the request was the release binary from the *other* worktree (the first sibling fix, which does not touch the file the error-message fix changed). The CLI defaults to one machine-wide daemon socket under `~/.agent-browser` regardless of which worktree's binary launched it; a `pkill -9 -f "<worktree-path>/agent-browser"` run when switching from testing one worktree to the other only kills a daemon if it happens to be the one still alive at that exact path, and silently does nothing if a different worktree's daemon is the one actually serving. Killing the correct PID and re-running under an explicit `AGENT_BROWSER_NAMESPACE` immediately produced the fixed output; the same failure mode was independently reproduced and then independently corrected by a second agent session once it added the same `session info` plus `ps` check this session had already worked out.

## Method used

1. Treat an unexpected "still broken" result as a claim to verify, not a fact, given that the source and a fresh build both showed the fix present.
2. Check which process was actually serving the request (`session info --json` for the daemon's own reported PID, then `ps -p` on that PID for its binary path) instead of assuming the CLI binary invoked and the daemon answering it are the same build.
3. Kill the actual PID (not a path-scoped pattern) and re-verify with a fresh, isolated `AGENT_BROWSER_NAMESPACE` per worktree to make cross-worktree reuse structurally impossible rather than relying on remembering to kill the right thing each time.
4. Pass the same two verification steps forward to the second agent session's own retry, rather than only fixing the immediate result.

## Outcome

- Root cause: one shared, machine-wide daemon socket by default, with no per-worktree or per-build isolation unless a session name or namespace is explicitly set.
- Both affected verification passes (this session's and the independent second session's) were corrected once the actual serving PID was checked, and both then reproduced the same, now-consistent, fixed result.
- No product change proposed; the CLI already supports full isolation (`AGENT_BROWSER_NAMESPACE`, `--session`, and a `session id --scope worktree` helper documented in its own skill file) it simply is not the default.

## Evidence

- Source: `cli/src/connection.rs` (`AGENT_BROWSER_NAMESPACE` scoping), `cli/src/main.rs` (`session id --scope worktree`, the literal `"default"` session name used when nothing is set).
- Runtime: `session info --json` reporting a `backgroundPid` whose `ps -p <pid> -o command` resolved to the other worktree's binary path, not the one under test; the same request repeated under an isolated namespace, confirmed via the same two checks, showing the fixed output.
- Tests: none added; this is an operational finding about verification method, not a code defect in the CLI under test.
- Review: independently reproduced and independently corrected by a second, blind agent session using the same two-step check, without having seen this session's diagnosis.

## Transferable lesson

> When a live verification result contradicts what the source and a fresh build say should happen, check which running process actually answered the request before trusting either the "broken" or the "fixed" result. A daemon, server, or long-lived process that outlives the specific artifact you just built can silently answer on behalf of a different build, and a kill command scoped by path or name only works if it happens to match whatever is currently alive.

Secondary: any tool with a persistent background process and a shared default identity (a socket path, a session name, a cache key) that is not automatically scoped to the caller's own working copy will eventually get cross-contaminated by whichever copy started that process first. Isolating explicitly (a namespace, a session id derived from the working copy's own identity) is cheap; remembering to kill the right thing by hand is not reliable across repeated context switches.

## Exceptions

- Does not apply to tools that spawn a fresh subprocess per invocation with no persistent daemon; there is nothing to contaminate.
- Does not apply when only one build of the tool is ever in play on a given machine at a time.

## Candidate changes

- Reference rule (any skill that drives a CLI with a background daemon or long-lived server across multiple checkouts or builds): before trusting a live verification result, identify the actual serving process (PID, port, or socket owner) and confirm it matches the build under test.
- Coverage gap in the tool itself: the default session identity is a literal constant rather than derived from the caller's working directory or git worktree, even though the tool already ships the primitives (`session id --scope worktree`, `AGENT_BROWSER_NAMESPACE`) to do the latter. Making the derived form the default, opt-out rather than opt-in, would remove this failure mode by construction instead of relying on every caller remembering to set it.
- Eval: given a live test result that contradicts a fresh build's expected behavior, does the agent check which process actually served the request before concluding the fix is broken?

## Confidentiality review

Public. vercel-labs/agent-browser is a public repository; the CLI behavior described (session and namespace handling) is public source. The independent second agent session is referenced only by its role (a second, blind verification pass), not by any identifying detail. No local machine paths appear in this record.
