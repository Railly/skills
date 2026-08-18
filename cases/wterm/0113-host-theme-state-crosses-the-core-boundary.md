# Case: Host theme state crosses the terminal-core boundary

Status: reviewed
Validation: contributor-validated
Human review: independent-complete
Maintainer acceptance: approved
Delivery: merged
Upstream status checked: 2026-08-11
Visibility: public
Repository: vercel-labs/wterm
Role: contributor
Source: https://github.com/vercel-labs/wterm/pull/113, head `869093aebc88ea48222fd7ff5baf24a461f237ee`, merge commit `d25f7011c90d49696072d719428a31aee91421e1`

> Technical validation, human review, maintainer approval, and merge are complete. No release newer than 0.3.3 contains this change yet.

## Observed condition or claim

Ghostty answered cursor and mode queries after PR #109 but did not answer OSC 10 and OSC 11 foreground and background queries. A terminal application therefore could not discover the colors that the browser host actually rendered.

The color is host-owned state. A core default alone is insufficient when CSS uses a different theme.

## Red signal

The live parity checkpoint attributed 132 of 134 Ghostty response differences to OSC 11. The deterministic probe also received no Ghostty theme response.

A reply using a fixed color would make the protocol test pass while lying whenever the host supplied a custom CSS theme.

## Method used

1. Added foreground and background options to `GhosttyCore.load()`.
2. Validated both inputs as `#RRGGBB`.
3. Passed the colors through the TypeScript, WASM, and Zig initialization boundary.
4. Let Ghostty remain authoritative for later OSC color changes and resets.
5. Answered OSC 10 and OSC 11 queries from current terminal state.
6. Preserved the request's BEL or ST terminator.
7. Tested defaults, custom colors, set, reset, query ordering, and invalid configuration against the committed WASM.
8. Documented that custom CSS themes must pass matching values.

## Outcome

PR #113 merged on 2026-08-11 as `d25f701`.

- OSC 10 and OSC 11 return the current configured foreground and background.
- Later set and reset operations affect subsequent replies.
- BEL and ST terminators are preserved.
- The public API documents how the host supplies its rendered theme.
- CI, Vercel deployment, Socket checks, and Vercel Agent Review are green.

The PR received human approval before merge.

## Evidence

- Source: PR #113, final head `869093aebc88ea48222fd7ff5baf24a461f237ee`, merge commit `d25f7011c90d49696072d719428a31aee91421e1`.
- Runtime: real committed `ghostty-vt.wasm`.
- Tests: PR description reports 40 Ghostty tests plus build, type-check, lint, format, docs build, and reproducible WASM verification.
- Review: every required GitHub check passed on the final head, ctate approved it, and the PR merged on 2026-08-11.
- Artifact: committed WASM changed with the Zig implementation.

## Transferable lesson

When a protocol query reports presentation state owned by the host, the adapter contract must carry that state into the core. Test the full lifecycle, not only the query: configured default, runtime mutation, reset, response order, and framing terminator.

## Exceptions

This covers foreground and background dynamic colors only. It does not cover the full palette, cursor color, OSC 8 links, or synchronized-output scheduling.

## Candidate changes

- Reference rule: host-owned protocol state must cross every adapter boundary and be tested through configure, mutate, reset, and query operations.

## Confidentiality review

The case contains only public repository, PR, commit, checks, aggregate checkpoint results, and public protocol behavior. It excludes local paths, private discussion, and internal environment identifiers.
