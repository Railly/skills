# Review gate: agent-browser v0.34.0

Status: pass for `02825ecbd7cec6ed95a9f8978a003307ea86e6b1`.

Warning: author and reviewer are from the GPT-5 model family, so this review shares some priors with the implementation. The deterministic checks and prior real-browser verification are the primary evidence.

## Outcome

No findings. The diff matches the established nine-file release pattern from PR #1628 and prepares v0.34.0 for the three commits after v0.33.2:

- #1589 session-to-tab binding and `--pin-tab`
- #1641 bounded Chrome version detection in `doctor`
- #1648 Remote Agent Browser provider guide

## Deterministic evidence

- Version sync: all package and crate surfaces report `0.34.0`.
- Release extraction: exactly one `release:start` and `release:end` marker.
- Extracted notes: #1589 appears twice, #1641 once, and #1648 once.
- `cargo fmt --check`: pass.
- `cargo clippy -D warnings`: pass.
- Rust: 1,111 passed, 101 ignored; doctor integration: 2 passed.
- Sandbox: 17 passed.
- Eve: typecheck pass, 40 tests passed.
- Docs production build: pass.
- Style and conventions surface gates: pass.

The radius map found the sandbox version constant flowing into install-spec resolution and Vercel sandbox helpers. It also emitted duplicate SCIP symbol warnings from `rust-analyzer`, and it does not model manifest or prose changes. The map is orientation only; version sync and the test suites are the load-bearing checks.

## Subsystem model

The release PR changes metadata consumed by three paths:

1. Package and crate manifests define the published version.
2. `AGENT_BROWSER_SANDBOX_VERSION` defines the default install spec used by sandbox helpers.
3. The release workflow extracts the single marked section of `CHANGELOG.md`, builds seven binaries, publishes the three npm packages, then creates the tag and GitHub Release.

The adjacent-layer assumption is that main's executable code is already releasable. That assumption is supported by the full suite, docs build, and earlier real-Chrome verification of #1589.

## Exemptions claimed

- No extra release surface is required. PR #1628 used the same nine files, version sync passes, and the workflow reads the marked changelog slice.
- No new binary dogfood is required for the release commit itself. It changes metadata only; the code at origin/main was already driven through the relevant real-Chrome cases.

## Issue candidates

None.
