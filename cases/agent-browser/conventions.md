# agent-browser review conventions

Project overlay for the [review-gate](../../skills/.experimental/review-gate/SKILL.md) candidate skill. Every entry is harvested from maintainer review rounds or recorded cases in this directory; entries carry no authority beyond that provenance. Paths verified against the repository on 2026-07-17.

## Surface map

A behavior change to a command, action, or locator is not done until every surface that advertises it agrees. The eval harness (eve) is an external surface; sync it separately; it is not checkable from this repository.

```surfaces
cli/src/native/actions.rs :: README.md, docs/src/app/commands/*, skill-data/core/references/commands.md
cli/src/native/browser.rs :: README.md, docs/src/app/commands/*, skill-data/core/references/commands.md
cli/src/commands.rs :: README.md, skill-data/core/SKILL.md
cli/src/mcp.rs :: skill-data/core/references/commands.md
```

Provenance: round-1 misses on #1552 (CLI help and MCP descriptions not updated for new `--exact` semantics) and #1553 (README and eval harness advertising `find` actions the CLI rejects). The `browser.rs` line is from #1532 round 2 (reload risk and `revived` result needed full CLI, skill, and docs coverage; only README and skill-data were flagged). Most `browser.rs` changes are internal; "internal-only, no observable behavior delta" is the expected one-line acknowledgment, and a behavior delta makes the required surfaces load-bearing.

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

## Probe norms

- A liveness heuristic that infers death from non-response is checked against every renderer-blocking state the product itself supports before it ships: JS modal dialogs (`alert`/`confirm`/`prompt`, `beforeunload`), debugger pauses, and attach-time pauses (`waitForDebuggerOnStart: true` since #1546). Each of these blocks `Runtime.evaluate` on a live tab. The enumeration source is the repo's own command surface (`dialog accept/dismiss` exists, so dialog-blocked is an input class). Provenance: #1532 round 2, probe misclassified dialog-blocked live tabs as discarded, reproduced in Chrome by the maintainer.
- A fix that turns a hang into a returnable error re-verifies every caller of the failable function at the daemon dispatch layer, not only the `BrowserManager` layer: handlers in `actions.rs` mutate `DaemonState` (ref map, iframe sessions, active frame) before delegating, and those mutations execute even when the delegate now fails. Provenance: #1532 round 2, failed switch preserved the old tab but wiped its refs and frame context.

## Verification norms

- One machine-wide daemon: isolate every verification run with its own `AGENT_BROWSER_NAMESPACE`, or the daemon answers for whichever build started it. Provenance: [shared-daemon case](shared-daemon-cross-worktree-contamination.md).
- Reproduce against a build of the exact commit a report cites before writing any fix; a report's code reading is a hypothesis until the binary reproduces it. Provenance: [#1552 case](1552-getbyrole-implicit-roles-regression.md).
- A drift test asserts the invariant (dispatch succeeded), not the failure message previously observed, and is forced red once before it counts. Provenance: [#1553 case](1553-error-detail-and-help-drift.md).
- CI resolves rust stable at run time (unpinned), so a stale local toolchain produces false clippy green. Before push: `rustup update stable`, then CI's exact invocation, `cargo clippy --manifest-path cli/Cargo.toml -- -D warnings`. Provenance: #1553 round-2 push, needless_borrow on clippy 1.97 that a stale local stable missed.

## Gate-miss ledger

- **2026-07-18, #1532 round 2 (three maintainer findings; the same-day gate run had caught one partially, grazed one, and clean-missed one):**
  - *Probe misclassifies dialog-blocked live tabs as discarded.* New-domain matrix lens ran but enumerated tab lifecycle states only (responsive/slow/discarded/dead); the blocked-but-alive class was missed even though the same failure family (paused renderer post-#1546 merge) was flagged as a merge interaction in the same report, and the class was discoverable from the repo's own `dialog` commands. Closed by: matrix-lens pass question extended (enumerate blocking states from the product's feature list) + Probe norms entry above.
  - *Failed switch preserves the old tab but wipes refs/frame context.* Error-path forcing verified the fail path at the `BrowserManager` layer (`active_page_index` only); the wipe lives one layer up in `handle_tab_switch` (`actions.rs`), pre-existing code outside the diff that became reachable when the fix turned a hang into a returnable error. Closed by: new lens "New-failure-outcome propagation" in the catalog + Probe norms entry above.
  - *Reload risk and `revived` needed full CLI, skill, and docs coverage.* Surface sweep could not fire because `browser.rs` was not keyed in the map; the gate report flagged skill-data by judgment but under-enumerated (README and skill only). Judgment enumerated a subset of what a check would have listed, the same failure portless #363 recorded. Closed by: `browser.rs` surfaces line above.
