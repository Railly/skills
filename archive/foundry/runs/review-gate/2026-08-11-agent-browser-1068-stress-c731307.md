# Review gate: agent-browser #1068 real-world stress

Status: complete for committed HEAD `c731307100e2d488d1911ffe1a21fd339b531664`. No product defect was found.

Warning: the author and reviewer are from the same GPT-5 Codex model family.

## Scenario

The new ignored integration test drives the compiled CLI through three real daemons and one real Chrome:

- Two isolated agents use the same application origin with different identities.
- Both alternate `tab new` and `window new`.
- Both create page-owned popups on a second origin.
- Cookies, localStorage, sessionStorage, IndexedDB, and Cache API are mutated and read independently.
- Both save state concurrently and verify that each JSON file contains both owned origins but no foreign values.
- Agent A receives SIGTERM and reconnects while agent B continues working.
- Closing A removes its binding and Chrome targets while B remains healthy.
- Closing B removes the remaining isolated targets.

`AGENT_BROWSER_ISOLATION_STRESS_ROUNDS` controls the campaign length. The default is six rounds.

## Results

- 144 total stress rounds passed across several fresh-Chrome campaigns.
- One five-campaign run completed 100 rounds without an intermittent failure.
- Final 20-round campaign passed.
- Full serial suite: 1,117 passed, 0 failed, 104 ignored.
- Doctor integration tests: 2 passed.
- `cargo fmt`, `cargo clippy -D warnings`, `style`, `surfaces`, `siblings isolate-context`, and `git diff --check`: passed.

## Test strength

Three independent production mutations made the integration test fail at the user-visible layer:

1. Removing `browserContextId` from `tab new` failed in round 0 because the session lost ownership of the popup flow.
2. Accepting every discovered target failed in round 0 because the two sessions shared a `targetId`.
3. Omitting owned-context disposal during `close` failed because A's targets remained visible in Chrome.

Restoring each implementation path returned the campaign to green.

## Radius

The map contains 128 changed symbols, 1,146 impacted items, and 8,020 edges. It also reports 2,460 unresolved calls and 138 unmapped SCIP entries. Rust-analyzer duplicate-symbol errors make it under-covering, so it was used for orientation only.

## Exemptions claimed

- The stress test is ignored by default because it launches Chrome and multiple daemons. It is intended for explicit PR, scheduled, or local dogfood runs.
- No documentation changes are required because this commit adds coverage only.

## Issue candidates

None.
