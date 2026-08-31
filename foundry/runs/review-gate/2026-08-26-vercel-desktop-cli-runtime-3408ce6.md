# Review Gate: Vercel Desktop CLI runtime resolution

Status: pass for `3408ce6` on base `c775373`.

Vercel Desktop now validates an executable together with a bounded runtime PATH, retries later installations, distinguishes runtime failure from signed-out state, and reuses the selected plan for every CLI command. Recheck invalidates in-flight resolution without blocking the UI. Launch failure re-resolves the plan but never replays a service command.

Exact-head checks passed for debug compilation, release build, whitespace, style, surfaces, state callers, and 25 focused Vercel CLI tests. The full suite passes 88 of 89 Swift tests plus 11 of 11 Node tests. Its only failure is the unchanged host-specific Geist fixed-pitch assertion already present on the base.

The review found and fixed two defects before this HEAD: weak non-empty version validation and a Recheck lock that could wait behind a process probe. Both received red and restored-green mutations.

Same-family warning: GPT-5 Codex authored and performed the final exact-head review. Independent design challenge came from an isolated Anthropic reviewer during Solution Gate, backed by a real sanitized-environment corpus on the installed Bun CLI and NVM runtime.

## Exemptions claimed

- The full-suite Geist failure is exempt because it reproduces on the base, touches Typography only, and the CLI-focused suite passes 25 of 25.
- README and changelog stay unchanged because the fix restores promised CLI recognition and releases are prepared separately.
- The packaged app was not launched into the user's authenticated account. The exact release binary was built, while the shipped process boundary was exercised with real `Foundation.Process` fixtures and the installed CLI under a Finder-like environment without exposing account data.

## Issue candidates

- Make the Geist fixed-pitch test independent of host AppKit font metadata. The unchanged test reports `GeistMono-Regular.isFixedPitch == false` on this Mac before and after the CLI change.
