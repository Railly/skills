# Auth duplicate-control correction contract

Base d01253d9db28d75080e36da3c1c31ef89454731e. Recreate PR #1999 (1b4cacd0) and fix verified wrong-field delivery. Authorize edits, tests, signed commit, upstream branch, replacement PR; no merge or original PR mutation.

R1: hidden/disabled/readonly-first matches must yield a usable visible username/password/submit, including explicit CSS selectors. Unusable twins stay untouched.
R2: each credential reaches only the selected DOM field. Detachment or focus redirection before insertion returns error without delivery elsewhere. No submit after fill rejection.
R3: ordinary fill remains unchanged. Auth retains native input events, controlled React state, Unicode, replacement of existing values, explicit CSS, delayed SPA and no-navigate origin binding.
R4: bounded selector polling; no credential-level retries after selecting an exact node. A caller may retry after restoring the form. Remote objects acquired by the new auth fill are released after both success and rejection.
R5: preserve Jony's human coauthor trailer. No new public flags, storage schema or protocol changes. MCP auth delegates the existing parser/action path.

Evidence: original before/after and pressure results in /Users/raillyhugo/Programming/vercel/agent-browser-1999-evidence. Original review report remains preserved.

Factory thresholds fixed before edits: cargo fmt --check; cargo clippy -- -D warnings; full cargo test without AGENT_BROWSER_NAMESPACE; serial auth E2E; representative ordinary form E2E. Reduction threshold: at most one auth-specific fill helper, no change to interaction::fill, no new polling budget, document listeners, state storage or dependency. Strength: new real-browser stale/focus regressions red at source PR, green with correction; guard and action-wiring mutants must die at intended behavioral assertions. Resilience: selection/focus/select/input detachment, redirection, script exception, timeout and immediate caller retry; record CDP disconnect/cancellation cleanup limitations honestly. Proof: built CLI hidden-first matrix plus replacement races, React 19.2 controlled form and ordinary fill.

C3 acceptance refinement (2026-09-28): R3 preserves Chrome trusted native input and controlled-state updates on both exercised engines. Actual Lightpanda nightly9842 has no execCommand and its original auth events are untrusted; a direct native value setter plus input event is accepted only for that absent capability. A present native-edit function returning false or throwing must still reject. R4 claims release attempts for observed remote handles on ordinary completion, JS rejection and CDP errors while transport remains usable; it does not promise cleanup after arbitrary future cancellation or renderer/transport destruction. These are measured substrate and ownership limits, not automatic retry permissions.
