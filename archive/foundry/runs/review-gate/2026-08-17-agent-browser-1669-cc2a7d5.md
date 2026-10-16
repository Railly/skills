# Review Gate: agent-browser #1669 CA trust continuity

Date: 2026-08-17
Base: `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`
Head: `cc2a7d52c77b58ae01ad5e85a2d3a621636b2b75`
Status: **complete**

Same-family warning: the implementation and final exact-head review use the GPT-5 family. The preceding Solution Gate used blind GPT-5 and Claude shaping proposals, but the final review still carries shared-prior risk.

## Outcome

No confirmed defect remains in the reviewed diff.

The fix moves effective CA ownership into `DaemonState`. Omitting `--ca-cert` on a later command now preserves the daemon, Chromium target, URL, page, and trust. Repeating equivalent certificate content reuses Chromium, including when supplied from a different path. Selecting different certificate content or using `--no-ca-cert` replaces only Chromium.

The replacement NSS home is prepared before the active browser is closed, and sticky state is committed only after a successful launch.

## Contract

No separate Issue Contract or Spec review result was supplied, so Spec status remains `not_provided`.

The completed Solution Gate packet and blind proposals define the implementation oracle:

`foundry/runs/solution-gate/2026-08-17-agent-browser-1669-ca-trust-stickiness/`

Reviewed acceptance includes sticky omission, same-content reuse, content-based replacement, explicit clear, safe replacement ordering, source precedence, surface parity, and continued separation from the CLI TLS work in #1670.

## Subsystem model

- The CLI resolves set, omit, and clear requests from CLI, config, environment, MCP, and Eve.
- The daemon owns the effective CA across commands.
- Browser reuse is based on normalized certificate DER content, not path, input order, or duplicate certificates.
- `prepare_nss_home` constructs replacement trust before browser teardown.
- `BrowserManager` launches or replaces Chromium and only then updates sticky daemon state.
- The daemon fingerprint covers daemon-owned options and no longer treats CA presence as daemon identity.

The adjacent layers reviewed were input precedence, all effective-CA consumers, launch hashing, failed replacement, NSS ownership, CLI and MCP command construction, Eve propagation, schemas, help, README, web docs, and skill docs.

## Findings resolved

1. Mixed set and clear inputs had inconsistent precedence across config, MCP, and Eve. The contract is now uniform: an explicit CA selection wins over a simultaneous clear, while sequential CLI flags use the last flag.
2. Bundle identity depended on certificate order and duplicates. Identity now uses sorted, deduplicated normalized DER certificates.
3. The original fingerprint contract treated omission as removal and restarted the daemon. CA was removed from daemon identity and omission now resolves to the effective daemon state.

## Verification

- Rust: 1,135 passed, 101 ignored.
- `cargo clippy --all-targets -- -D warnings`: pass.
- `cargo fmt`: pass.
- Eve: 42 tests passed.
- Eve typecheck: pass.
- `git diff --check`: pass.
- `style`: pass.
- `surfaces`: pass.
- stale `ignore-certificate-errors-spki-list`: zero hits.
- callers of `prepare_nss_home`: pass.
- callers of `resolve_effective_ca_cert`: pass.
- callers of `apply_effective_ca_cert`: pass.

Test-strength proof:

- Removing the sticky omission fallback made `test_effective_ca_cert_transitions_distinguish_omission_and_clear` fail.
- Returning launch identity to path-based comparison made `test_launch_hash_uses_ca_content_not_path` fail.
- Restoring both fixes returned the suite to green.

## Platform gap

The exact-head NSS Linux end-to-end matrix was not rerun on this macOS machine. This is an explicit unverified gap, not a refutation. The prior Linux ARM64 matrix for the NSS implementation remains recorded at:

`foundry/runs/review-gate/2026-08-13-agent-browser-1669-nss-working-tree.md`

The exact multi-command defect was previously reproduced on Linux and recorded at:

`foundry/runs/review-gate/2026-08-17-agent-browser-1669-daemon-ca-stickiness-0329596.md`

## Radius

The exact-head rerun indexed 282 files, 4,471 symbols, and 7,978 edges, but returned empty changed and impacted sets with 2,456 unresolved calls, 81 SCIP-unmapped entries, and duplicate-symbol errors from rust-analyzer. The map is strongly under-covering and was used only for orientation.

## Lenses

Triggered and run: new-domain matrix, resolution-rule consistency, deliberate-default check, fresh-seam scan, new-failure-outcome propagation, flag-propagation dispatch sweep, error-path forcing, non-destructive recovery, cancellation and timeout hygiene, substrate verification, dogfood of the command lifecycle through regression tests, newly asserted invariant ownership, docs-behavior parity, and complexity budget.

Skipped because their triggers are absent: inverse source replacement, shell re-parse, emission latch, shim hermeticity, substrate differential corpus, reference-implementation oracle, boundary extension, demonstrative example, and choice audit. The untracked `.decisions.tsv` is unrelated to this exact-head fix and was not used or modified.

## Exemptions claimed

- `.decisions.tsv` is an unrelated local review artifact and remains untracked and untouched.
- `cli/src/ca_bundle.rs`, `cli/src/native/browser.rs`, and `cli/src/native/cdp/chrome.rs` contain internal implementation comments, not public flag inventories requiring `--no-ca-cert`.
- `docs/src/app/webgpu/page.mdx` and `skill-data/core/references/webgpu.md` mention the Debian package `ca-certificates`, not the public CA flag.
- No GitHub comment is required; the PR body is the maintained review surface.

## Issue candidates

None.
