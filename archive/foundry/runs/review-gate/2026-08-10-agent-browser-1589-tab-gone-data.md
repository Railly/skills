# Review gate: agent-browser #1589 structured `tab_gone` data

Date: 2026-08-10
Repository: `vercel-labs/agent-browser`
Base: `21667e987212ae9a601b39974d768c2537eb4080`
Reviewed state: uncommitted follow-up diff for PR #1589
Status: complete

## Outcome

No change-specific findings remain. The structured error contract is driven through the real CLI and batch boundaries, MCP preserves it, opaque URLs remain absent, and the tests turn red when response enrichment is removed.

## Contract

No separate Issue Contract or Spec review was provided. The review contract was Nathan's PR feedback:

- `tab_gone` must expose the dead target id and last safe URL as structured fields.
- Existing `code`, exit status, prose, recovery behavior, and URL sanitization must remain stable.
- CLI, batch, MCP, help, README, docs, and the core skill must agree.

## Subsystem model

`BrowserManager` owns the dead binding tuple and stores only `sanitize_url` output. `execute_command` converts action errors into the daemon JSON envelope. `connection::Response` carries its existing `data` value unchanged to single-command JSON. Batch renames that value to `result`. MCP parses the CLI JSON and embeds it at `structuredContent.response`.

Adjacent layers inspected:

- Both writers of `bound_target_gone` sanitize the URL.
- The normal response path and the second event-drain replacement both attach recovery data.
- Batch and MCP preserve the existing nested value without new adapter fields.
- Recovery commands bypass the bound-page check and keep their existing semantics.

## Deterministic checks

- `style`: pass.
- `surfaces`: pass.
- `callers bound_target_gone_details`: pass.
- `siblings tab_gone`: acknowledged. Untouched hits in `connection.rs`, `main.rs`, `tab_binding.rs`, and internal comments describe the unchanged code, batch mapping, sanitization, and state semantics. The one untouched README options-table line is a terse flag listing, not the canonical response contract.
- `radius impact`: under-covering and not used as evidence. The Rust SCIP build reported duplicate-symbol bugs, `0` changed symbols, `0` edges, and `2384` unresolved calls.
- `git diff --check`: pass.

## Focused lenses

- Error-path forcing: pass. Externally closing a pinned tab produces exit 1, unchanged `code` and prose, plus structured recovery data.
- New failure outcome propagation: pass. The change adds data to an existing failure, and both response-construction paths attach it.
- Docs-behavior parity: pass. CLI help, MCP description, README, MDX, and core skill describe the same shape and sanitization.
- Boundary pipeline trace: pass. Daemon JSON reaches single CLI, batch, and MCP.
- Substrate verification: pass. The real built binary was driven against Chrome, not inferred from unit tests.
- Test strength: pass. Removing both `attach_tab_gone_data` calls makes the real CLI/batch test and the opaque-URL E2E fail on missing `data.targetId`; restoring the calls makes both pass.
- Security and privacy: pass. Safe HTTP(S) strips credentials, query, and fragment. `data:` omits `lastUrl`.
- Complexity, timing, cleanup, concurrency, and migration lenses: skipped because the diff adds no loops, timing, persistent artifact, concurrency behavior, or stored schema.

## Verification

- `cargo fmt --manifest-path cli/Cargo.toml -- --check`: pass on Rust 1.97.1 stable.
- `cargo clippy --manifest-path cli/Cargo.toml --all-targets --all-features -- -D warnings`: pass.
- Focused `tab_gone` and MCP tests: pass.
- Real Chrome `e2e_pin_tab_gone_error_and_recovery`: pass.
- Real CLI `tab_gone_exposes_safe_recovery_data_in_cli_and_batch`: pass.
- Full suite excluding one pre-existing parity timeout: 1,077 pass, 100 ignored, 1 filtered.

## Exemptions claimed

- `native::parity_tests::test_all_documented_actions_are_handled` times out on the `screenshot` action on both the patch and the exact base commit `21667e9`. This is a pre-existing test/environment failure and is unrelated to the response-only diff.
- Untouched `tab_gone` mentions are exempted where they describe unchanged semantics rather than the newly structured payload.

## Issue candidates

- Stabilize `test_all_documented_actions_are_handled` so its screenshot probe does not depend on a 10-second shared action loop state. It fails identically on the base commit in this environment.
