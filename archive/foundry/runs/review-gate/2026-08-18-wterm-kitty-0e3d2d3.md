# Review Gate: wterm Kitty keyboard protocol

- Date: 2026-08-18
- Repo: `vercel-labs/wterm`
- Branch: `feat/kitty-keyboard-protocol`
- Base: `cdff1c07890ab2c5ba2efbcc1091f790dfb8f931`
- Head: `0e3d2d30653b0f23c244c5585a735d7e373aad3c`
- Prior full review: `foundry/runs/review-gate/2026-08-17-wterm-kitty-4a73024.md`
- Author model: OpenAI GPT-5 Codex
- Reviewer models: OpenAI GPT-5 Codex and Anthropic Claude Sonnet 5 in the prior full review

## Verdict

Pass for push and review request. No open correctness findings remain.

This exact-head pass revalidated the previously reviewed Kitty feature after PR #119 landed on `main`. The prior merge-order assumption is now resolved: the combined DOM suite, package matrix, committed WASM artifacts, and browser E2E all pass with #119 present.

## Integration result

PR #119 changed `packages/@wterm/dom/src/wterm.ts`, its unit tests, and browser scrollback E2E. Kitty changes `InputHandler`, the pure keyboard encoder, both core adapters, both WASM artifacts, parser state, tests, and documentation. The merged code and Kitty feature have no textual conflicts and share only the DOM package runtime boundary.

The exact combined build passed:

- `zig fmt --check`, `zig build test`, release WASM rebuild, and byte comparison.
- Ghostty WASM Docker rebuild with byte comparison.
- `pnpm format:check`.
- `pnpm type-check`: 22/22 tasks.
- `pnpm lint`: pass with one pre-existing docs warning.
- `pnpm test`: 14/14 tasks, including core 75, DOM 168, and Ghostty 52 tests.
- `pnpm build`: 15/15 tasks.
- `pnpm test:e2e`: 17/17 Chromium tests, including PR #119 scroll ownership cases.
- `git diff --check`.

## Deterministic gates

- `style`: pass.
- `siblings "Kitty keyboard"`: pass.
- `callers kittyKeyboardFlags`: pass.
- `callers getKittyKeyboardFlags`: pass.
- `surfaces`: navigation and page-title findings exempted because the diff edits existing pages without adding or renaming any page.
- Head coverage: this report covers exact SHA `0e3d2d3`.

## Focused lens delta

- Substrate verification: rerun through rebuilt built-in and Ghostty WASM artifacts.
- Dogfood built artifact: real core negotiation drives the real DOM input handler in `kitty-cores.test.ts`.
- Boundary pipeline trace: parser, active-screen state, WASM export, TypeScript adapter, DOM encoder, and emitted bytes remain intact after #119.
- Docs-behavior parity: public documentation matches the negotiated flags, legacy fallback, screen lifecycle, and browser limitations exercised by the tests.
- Choice audit: the earlier assumption that Kitty could merge before or after #119 is confirmed by the exact combined matrix.

All other lens dispositions and refutations remain unchanged from the prior full review because the Kitty diff itself is byte-identical to the reviewed working tree.

## Exemptions claimed

- Docs navigation and page titles remain unchanged because no page was added or renamed.
- `.decisions.tsv` is retained as local review evidence and excluded from the public feature commit, matching prior wterm cleanup practice.

## Issue candidates

None.
