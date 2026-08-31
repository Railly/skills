# Review Gate: agent-browser a7910f5

Status: pass

The post-merge Windows failure came from a test race, not the NSS implementation. The test temporarily set `AGENT_BROWSER_CONFIG` to a file in a `TempDir`; reverse drop order deleted the directory before restoring the environment. Parallel `parse_flags` tests could then read the missing explicit config, whose error path calls `process::exit(1)` and terminates the whole test harness without a normal failed-test report.

The fix preserves production precedence exactly, extracts it into `resolve_ca_cert`, and replaces the process-global test with a six-cell pure matrix. Fable 5 and Grok 4.6 independently confirmed the mechanism and approved the design.

Checks passed:

- Rust formatting and Clippy
- Focused CA precedence test
- Full Rust suite: 1,145 passed, 101 ignored
- CLI integration tests: 2 passed
- Force-red mutation and restored green
- Review Gate style and surfaces
- Cross-family review

`radius` was used for orientation but under-covers because rust-analyzer reported duplicate symbols, 2,445 unresolved calls and 81 unmapped entries.

## Exemptions claimed

- No docs or MCP updates are required because production behavior and user-facing semantics are unchanged.
- No Linux `cuse` run is required for this failure because the failed substrate and mechanism are Windows test-process concurrency, not Linux NSS behavior.

## Issue candidates

- The flags test module has other process-global environment mutations read by unguarded parallel tests. They can cause ordinary assertion flakes, but they cannot reproduce this missing-config `process::exit(1)` signature after this fix.
