# Cross-family review evidence

Target: `vercel-labs/agent-browser` commit `a7910f5abba53874842da046caef46c94b4fcf16`

## Claude Fable 5

Command:

`cursor-agent --print --mode ask --trust --model claude-fable-5-high`

Verdict: approve.

Findings:

- Confirmed the old test's reverse drop order deleted `TempDir` before `EnvGuard` restored `AGENT_BROWSER_CONFIG`.
- Confirmed `ENV_MUTEX` did not protect the many parallel `parse_flags` callers that did not construct an `EnvGuard`.
- Confirmed `parse_flags` calls `process::exit(1)` when the explicit config path is missing, matching a harness exit without a `FAILED` test.
- Approved extracting the unchanged precedence logic into a pure helper.
- Suggested extending the pure test to cover the complete precedence matrix. The final commit includes six cases.
- Noted that other environment-mutating flags tests can still produce ordinary assertion flakes. This is outside this post-merge failure's scope.

## Cursor Grok 4.6

Command:

`cursor-agent --print --mode ask --trust --model cursor-grok-4.6-high`

Verdict: ship.

Findings:

- Independently confirmed the same drop-order, unguarded-reader and `process::exit(1)` mechanism.
- Confirmed changing declaration order alone would remain racy because other tests could still observe the temporary config.
- Confirmed direct testing of the pure resolver is the minimal non-racy fix.
- Found no semantic regression in production CA precedence.

## Test-strength evidence

The pure test was forced red by changing the first resolver branch to prefer config over the environment. The focused test failed because it returned `None` instead of `Some("/env/ca.crt")`. After restoring production logic, the same test passed.

Final checks:

- `cargo fmt --manifest-path cli/Cargo.toml -- --check`
- `cargo clippy --manifest-path cli/Cargo.toml -- -D warnings`
- `cargo test --profile ci --manifest-path cli/Cargo.toml flags::tests::test_ca_cert_precedence -- --exact`
- `cargo test --profile ci --manifest-path cli/Cargo.toml`
- 1,145 unit tests passed, 101 ignored
- 2 CLI tests passed
- Review Gate `style` and `surfaces` passed

## Verification gap before push

The repository's dedicated Windows EC2 debugging instance was not provisioned on this machine. The exact branch will therefore be run through the fork's `workflow_dispatch` CI matrix, which includes `windows-latest`, before opening the upstream PR.
