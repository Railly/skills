# Shaping pass B

Runtime: Claude Code 2.1.246 transport, Z.ai GLM-5.2 family.

Baseline: `vercel-labs/vercel-desktop` `v0.0.21`, `c8ee1bcc441cdbaa0e213c5b0d26270945eb7642`.

Input: only `../frozen-packet.md`.

## Requirements

Pass B preserved settled R0-R9 verbatim. It derived one standalone requirement: an order-only rewrite is not a configuration defect and must not be interpreted as red. U1-U5 remained undecided.

## Shapes

| Shape | Mechanism | Flags |
|---|---|---|
| A: CLI semantic dry-run | Parse current and proposed managed exports, compare names and values independent of order, and skip semantically empty writes. | Parser scope, existing consumers, old CLI behavior |
| B: Coordinated all-agent Desktop call | Always check and repair all CLI agents together to force one order. | Changes per-row Fix, broad mutation, requires per-agent combined output |
| C: Canonical CLI ordering | Sort exports before text comparison and writing. | One-time migration red; formatting can regress it |
| D: Desktop shell parser | Desktop models required exports and derives status itself. | Violates CLI authority, credential exposure risk |
| E: New CLI status command | CLI exposes structured semantic per-agent status; Desktop consumes it. | New cross-version API and coordinated release |

## Fit check

| Req | Requirement | Status | A | B | C | D | E |
|---|---|---|---|---|---|---|---|
| R0 | Stable repeated checks. | Core goal | ✅ | ✅ | ✅ | ✅ | ✅ |
| R1 | A repair cannot break a peer. | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ |
| R2 | Relaunch cannot change effective status. | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ |
| R3 | Green means currently usable. | Must-have | ✅ | ✅ | ✅ | ❌ | ✅ |
| R4 | Red is a row-owned actionable defect. | Must-have | ✅ | ❌ | ❌ | ❌ | ✅ |
| R5 | Credential and Keychain guarantees remain. | Must-have | ✅ | ✅ | ✅ | ❌ | ✅ |
| R6 | Supported set and working files remain. | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ |
| R7 | Standalone CLI supports one or several agents. | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ |
| R8 | Omission preserves peer exports. | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ |
| R9 | Repair is idempotent. | Must-have | ✅ | ✅ | ✅ | ✅ | ✅ |
| RB1 | Order-only changes are not configuration failures. | Derived | ✅ | ✅ | ❌ | ✅ | ✅ |

Failure notes: B and C create migration or shared-state red; D cannot prove full agent usability and violates CLI authority.

Recommendation before probes: A. Retain E only if an explicit Desktop/CLI compatibility contract is required. Reject B-D.

Required spikes: current and latest CLI mechanics; dry-run warning structure; old CLI degradation; both export orders; all-agent scope.
