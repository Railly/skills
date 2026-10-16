# Implement receipt: Browser Use V4 lifecycle repair (shape C)

Worktree: /Users/raillyhugo/Programming/vercel/agent-browser-1691-fix (branch fix/browser-use-v4-lifecycle-1691, uncommitted per instructions)

## Changes
- cli/src/native/providers.rs
  - connect_browser_use delegates to private connect_browser_use_at(base, create_deadline, stop_deadline); production wrappers hardcode https://api.browser-use.com/api/v4 with 10s create and 4s stop consts; client disables redirects; request timeout covers body read.
  - Safe error categories: numeric HTTP status and validated UUID only; bodies, keys and raw transport errors never forwarded; transport/read/no-ID failures state the outcome is unknown and direct the operator to inspect Browser Use Cloud (no automatic create replay).
  - UUID validation of the returned id; recovery receipt written to <socket dir>/browser-use-<id>.receipt before attachment (provider, id, fixed manual stop guidance; no API key/cdpUrl/body); receipt directory preflighted before the create POST; receipt-write failure and absent/null cdpUrl trigger a bounded rollback stop, returning the id and receipt path if rollback fails.
  - stop_browser_use_session_at validates UUID before URL/path use, requires 2xx plus matching id plus status=stopped as acknowledgment (404 is failure), and removes the receipt only after acknowledgment; receipt removal failure is never reported as a stop failure. Missing API key is a stop error carrying the id.
  - close_provider_session(_with_plugins) now returns Result<(), String>; only Browser Use returns errors, all other providers/plugins keep fire-and-forget Ok semantics.
- cli/src/native/actions.rs
  - close_active_provider_session returns Result and restores the session on stop failure (failed-close retention; same UUID retried).
  - close_current_browser combines browser close and provider stop errors.
  - Restore-key transition and auto-relaunch (needs_launch) now propagate Browser Use cleanup errors instead of discarding them; explicit relaunch already propagated.
  - Both provider attach callers (auto_launch and handle_launch) remember ownership before CDP attachment; Browser Use attachment is bounded at 8s (BROWSER_USE_ATTACH_DEADLINE); failed attach runs retained-state cleanup and combines safe errors; direct-page rejection paths combine cleanup errors.
  - Local/external CDP, other providers, plugins, launch-hash and reuse semantics untouched; existing external BrowserManager::close (no network wait) unchanged; daemon idle/signal shutdown keeps existing discard behavior, receipt covers invisible shutdown.
- Docs: README.md Browser Use section, docs/src/app/providers/browser-use/page.mdx (new Close and recovery section), skill-data/core/references/commands.md lifecycle note, cli/src/output.rs help env section (deadlines, retryable close, receipt path).
- MCP: close already delegates through the CLI parser to execute_command; daemon only exits on data.closed=true, so failed stop keeps the daemon alive and retryable in both surfaces. No MCP code change; no new parity test needed (close is already in the parity list and no new tool/flag was added).

## Tests added
- providers.rs: real loopback HTTP via std TcpListener threads (no env endpoint seam, production base stays hardcoded): create success + receipt lifecycle + stop ack removal; create 500/invalid JSON/missing id/hostile non-UUID id (secret and body never echoed, no receipt left); body stall bounded (short parameterized deadline, elapsed asserted); null cdpUrl bounded rollback (ack removes receipt; failed rollback retains receipt and reports id); stop ack matrix (wrong id, status active, non-JSON, 404, 500 hostile body); stop preconditions (invalid UUID refuses wire without echoing it, missing key names the id); deadline consts asserted (10s/4s/base URL) plus 8s attach const in actions tests.
- actions.rs: execute_command close failure retains ownership and errors, repeated close retries deterministically (missing BROWSER_USE_API_KEY as failure); launch cannot overwrite pending Browser Use ownership.

## Commands and results (CARGO_TARGET_DIR=/Users/raillyhugo/Programming/vercel/agent-browser-1691-probe-build, cwd cli/)
- cargo fmt / cargo fmt -- --check: clean
- cargo test -- --test-threads=1: ok. 1168 passed; 0 failed; 105 ignored (lib) + 2 passed (doctor_cli) + 2 ignored (pin_tab_cli)
- cargo clippy: Finished, no warnings

## Diff summary (git diff --stat)
 README.md                                   |   6 +-
 cli/src/native/actions.rs                   | 218 +++++++--
 cli/src/native/providers.rs                 | 666 +++++++++++++++++++++++++---
 cli/src/output.rs                           |   4 +
 docs/src/app/providers/browser-use/page.mdx |   8 +-
 skill-data/core/references/commands.md      |   2 +
 6 files changed, 805 insertions(+), 99 deletions(-)

## Gaps (carried, not hidden)
- No positive wire-level coverage of a successful stop through execute_command/close: the stop base URL is intentionally hardcoded, so caller-level tests use missing-API-key deterministic failure. Client conformance to the stop wire contract is covered at provider level.
- No live Browser Use credential: hosted latency, repeated-stop semantics, billing, profile persistence and recording remain unverified (carried limits from the contract).
- Real-Chrome e2e continuity tests (#[ignore]) not run here; owed downstream per shape validation list. Built-CLI stalled-proxy proof also owed downstream.
- Timeout-path tests exercise short parameterized deadlines; production 10s/8s/4s values are pinned by const assertions, not wall-clock tests.
