# Review gate: agent-browser #1068

Status: complete for committed HEAD `ee68b3c88072559fb6be7737f7a8ddaa5da9f948`. No unresolved code finding remains.

Warning: the author and reviewer are from the same GPT-5 Codex model family, so they may share priors and blind spots.

## Contract

Issue: `vercel-labs/agent-browser#1068`

Reviewed behavior:

- Two named sessions sharing one Chrome can opt into separate cookies, storage, cache, and targets.
- Context ownership applies to discovery, events, target creation, state operations, recording, restart, shutdown, and close.
- Internal daemon exits preserve the persisted primary context and clean non-persisted child contexts.
- Explicit `close` disposes only the session's owned contexts.
- A Chrome restart creates a clean replacement context and reapplies configured restore state.
- Existing non-isolated workflows remain unchanged.

Spec review: not provided. The Solution Gate contract was used as the implementation oracle.

## Findings fixed during the gate

1. `docs/src/app/commands/page.mdx` omitted `--isolate-context`. The commands page now lists it and the docs build passes.
2. Signal and idle shutdown could orphan a recording child BrowserContext and autosave from the wrong context. Every internal exit now stops recording, disposes registered child contexts, preserves the primary context, then autosaves.
3. A late `isolateContext` request on an already-open non-isolated connection could set sticky state without reconnecting. It now fails with reconnect guidance before mutation and leaves isolation disabled.

## Verification

- `cargo fmt --manifest-path cli/Cargo.toml -- --check`: passed.
- `cargo clippy --manifest-path cli/Cargo.toml -- -D warnings`: passed.
- Full serial suite: 1,117 passed, 0 failed, 104 ignored.
- Doctor tests: 2 passed.
- All three isolated Chrome E2Es together: passed.
- Docs build: passed.
- `git diff --check`: passed.
- `style`, `surfaces`, and `siblings isolate-context`: passed after fixing the commands-page omission.
- Force-red: moving the sticky isolation mutation before validation makes the E2E fail.
- Force-red: removing child-context disposal makes the shutdown E2E fail.
- Seven earlier Test Strength mutations independently failed as intended.

## Radius

The map contains 127 changed symbols, the top 200 impacted items, and 8,019 edges. It also reports 2,402 unresolved calls and 74 unmapped SCIP entries. Rust-analyzer duplicate-symbol errors further reduce coverage, so the map was used for orientation only. All three findings came from free exploration outside map-ranked paths.

## Exemptions claimed

- The changelog is intentionally unchanged because the release PR owns changelog entries. The feature itself is covered by README, CLI help, web docs, schemas, MCP, and skill data.

## Issue candidates

None.
