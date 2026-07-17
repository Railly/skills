# agent-browser review conventions

Project overlay for the [review-gate](../../skills/.experimental/review-gate/SKILL.md) candidate skill. Every entry is harvested from maintainer review rounds or recorded cases in this directory; entries carry no authority beyond that provenance. Paths verified against the repository on 2026-07-17.

## Surface map

A behavior change to a command, action, or locator is not done until every surface that advertises it agrees. The eval harness (eve) is an external surface; sync it separately; it is not checkable from this repository.

```surfaces
cli/src/native/actions.rs :: README.md, docs/src/app/commands/*, skill-data/core/references/commands.md
cli/src/commands.rs :: README.md, skill-data/core/SKILL.md
cli/src/mcp.rs :: skill-data/core/references/commands.md
```

Provenance: round-1 misses on #1552 (CLI help and MCP descriptions not updated for new `--exact` semantics) and #1553 (README and eval harness advertising `find` actions the CLI rejects).

## Oracles

- **Locator semantics → Playwright.** Any change to `getByRole`/`find role` behavior is checked against the full Playwright `getByRole` contract, not the cases a bug report cites: AX-role to ARIA-name normalization (`image` → `img`), ordered fallback role lists (`role="button none"` must not match `none`), `presentation`/`none` handling, accessible-name matching and its case rules under `--exact`, and first-match versus strict-mode behavior (a deliberate divergence is documented, not silent). Provenance: #1552 round-2 misses; each one already solved by the reference implementation the fix cited.
- **Implicit roles → ARIA in HTML.** The mapping from HTML elements to implicit ARIA roles follows the W3C ARIA-in-HTML spec.

## Error conventions

- Every error path surfaces the AI-friendly guidance, including wrapped and re-wrapped errors. A wrapper that drops the guidance is a regression. Provenance: #1553 round 2.
- Error-message classifiers are checked against every engine's producer set (Chrome CDP, WebDriver, Lightpanda), not only the default engine's. A string that reads as protocol noise in one engine can be the genuine locator-miss path in another, and a committed test that encodes the wrong assumption locks the regression in instead of guarding against it. Provenance: #1553 round 2, the WebDriver "No element ID in response" miss path.
- Validate inputs before expensive setup. An invalid action rejected only after browser launch and locator resolution reports "element not found", an error that names the wrong fault. Provenance: #1553 round 2.

## House norms

- Comments use prose punctuation: `,`, `;`, or a period, never ` -- ` and never an em dash. Checked by `gate.sh style`.
- External community PRs are not merged directly: recreate the approach on a fresh branch from `origin/main` with `Co-authored-by` credit to the original author, and cover strictly more than the original.
- PRs open ready-for-review, not draft. After review starts, append commits and merge main into the branch rather than rebasing.

## Verification norms

- One machine-wide daemon: isolate every verification run with its own `AGENT_BROWSER_NAMESPACE`, or the daemon answers for whichever build started it. Provenance: [shared-daemon case](shared-daemon-cross-worktree-contamination.md).
- Reproduce against a build of the exact commit a report cites before writing any fix; a report's code reading is a hypothesis until the binary reproduces it. Provenance: [#1552 case](1552-getbyrole-implicit-roles-regression.md).
- A drift test asserts the invariant (dispatch succeeded), not the failure message previously observed, and is forced red once before it counts. Provenance: [#1553 case](1553-error-detail-and-help-drift.md).
- CI resolves rust stable at run time (unpinned), so a stale local toolchain produces false clippy green. Before push: `rustup update stable`, then CI's exact invocation, `cargo clippy --manifest-path cli/Cargo.toml -- -D warnings`. Provenance: #1553 round-2 push, needless_borrow on clippy 1.97 that a stale local stable missed.
