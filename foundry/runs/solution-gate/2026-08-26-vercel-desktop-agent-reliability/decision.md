# Solution Gate decision: coding-agent reliability

Verdict: **Pass to detail**.

Mode: greenfield. The defect crosses persistent shell state, CLI/Desktop ownership, and version compatibility, so a mechanical Desktop patch was not justified.

## Reconciled requirements

The reviewers agreed on settled R0-R9. Their extra requirements were normalized into one evidence-backed derived requirement. No product-policy disagreement was averaged away.

| ID | Requirement | Status |
|---|---|---|
| R0 | Repeated checks with no external configuration change report the same effective status for every supported agent. | Settled, core goal |
| R1 | Repairing one supported agent must not make another previously configured supported agent require repair. | Settled, must-have |
| R2 | Closing and reopening Vercel Desktop must not change effective agent configuration or status by itself. | Settled, must-have |
| R3 | A green status must mean the agent's required configuration is currently usable. | Settled, must-have |
| R4 | A red status must identify an actionable defect owned by that row; optional or unrelated shared work is not red. | Settled, must-have |
| R5 | Credentials stay out of source, logs, UI, and plaintext diagnostics; Keychain behavior remains. | Settled, must-have |
| R6 | Desktop continues supporting fx, Claude Code, Codex, OpenCode, and Pi while preserving working agent files. | Settled, must-have |
| R7 | Standalone CLI setup continues configuring one selected agent or several selected agents. | Settled, must-have |
| R8 | The shell block is one persistent resource; omission does not clear peer exports. | Settled, must-have |
| R9 | Repeating a repair without external change causes no further effective change. | Settled, must-have |
| R10 | Reordering otherwise identical managed exports is not an agent configuration defect and must not become row red. | Derived from E3-E7 and P1-P3 |

U1-U5 remain policy or release questions. The selected shape avoids depending on U1 and U4. U3 and U5 are explicit admission checks.

## Selected shape G: CLI-owned merge with truthful Desktop compatibility

This reshapes Pass A Shape A and Pass B Shapes A/E after the semantic-comparator and `--all` probes.

| Part | Mechanism | Flagged |
|---|---|---|
| G1 | In Vercel CLI, merge selected managed exports by name into their existing positions, append only genuinely missing selected exports, and preserve omitted peer lines, their order, and all bytes outside the managed block. | No |
| G2 | Treat duplicate or malformed owned export declarations as ambiguous and actionable. Do not collapse the block into an unordered map whose equality could hide shell execution semantics. | No |
| G3 | Keep exact full-file equality as the final no-write check. With G1, an already-satisfied selected agent produces byte-identical output, `unchanged`, and no mtime churn. | No |
| G4 | Add temporal CLI tests for both peer orders, selected-agent permutations, repeated apply, missing and changed selected values, omitted peers, duplicate/malformed lines, zsh/bash/fish, and unrelated rc content. | No |
| G5 | CLI preview/apply JSON includes `capabilities: ["coding-agents-owned-env-merge-v1"]`. Desktop requires that marker before using Environment changes as per-row status. Absence means legacy CLI and yields one shared “update CLI, then recheck” compatibility state, never rotating per-row red/Fix states. | No |
| G6 | CLI warning JSON declares `blocksConfiguration` and its owning agent. Desktop renders non-blocking warnings as advisories and makes a row red only for explicit pending changes/errors or a row-owned blocking warning. It never infers severity from message text or parses credential values/agent schemas. | No |
| G7 | Desktop permits one CLI-agent repair at a time, disables peer Fix actions while it runs, then recomputes all explicit supported rows. Checks may remain concurrent because they are dry-run only. | No |

## Forward effects

1. `G1` receives selected-agent exports from the existing CLI planner (**observed**, P2).
2. It updates owned names in place and preserves omitted peers (**proposed**, seam requires tests).
3. A satisfied state transforms to identical bytes (**inferred**).
4. Existing textual equality returns `unchanged` and apply skips writing (**observed primitive**, P2).
5. Desktop no longer maps an order-only shared change to row red (**inferred**, P3).

Harmful branch: an unordered semantic parser could treat duplicate exports as equivalent even though the shell's last declaration wins. G2 explicitly designs this out.

1. `G5` identifies whether the installed CLI has G1 through the machine-readable capability returned by the same setup command (**proposed**, concrete insertion point: CLI `machine.ts` JSON payloads; concrete consumer: Desktop `parseAgentPlan`).
2. Fixed peers use normal row status; old peers get one compatibility state (**proposed**).
3. A Desktop update cannot silently assume an already-installed older CLI speaks the new contract (**inferred**).

Harmful branch: version-only detection can lie in internal or backported builds. The explicit capability marker designs this out; Desktop's existing `--version` probe remains launch validation, not feature inference.

1. `G6` retains CLI-owned configuration and Keychain behavior (**observed boundary**, P3/P6).
2. The CLI's explicit `blocksConfiguration` field prevents advisories from becoming red while preserving genuinely blocking warnings (**proposed**, concrete producer: `machine.ts`; consumer: `parseAgentPlan`).
3. `G7` serializes shared-resource repairs and refreshes all affected rows, preventing concurrent lost updates and stale green/red peers (**proposed**).

Harmful branch: `--all` would touch unsupported experimental agents. P4 refuted it; affected-row refresh uses Desktop's explicit supported IDs and dry-run checks, never CLI `--all`.

## Updated fit check

| Req | Requirement | Status | G |
|---|---|---|---|
| R0 | Stable repeated checks. | Core goal | ✅ |
| R1 | A repair cannot break a configured peer. | Must-have | ✅ |
| R2 | Relaunch cannot change effective state or status. | Must-have | ✅ |
| R3 | Green means currently usable. | Must-have | ✅ |
| R4 | Red is a row-owned actionable defect. | Must-have | ✅ |
| R5 | Credential and Keychain guarantees remain. | Must-have | ✅ |
| R6 | Supported set and working files remain. | Must-have | ✅ |
| R7 | Standalone CLI supports one or several agents. | Must-have | ✅ |
| R8 | Omission preserves peer exports. | Must-have | ✅ |
| R9 | Repair is idempotent. | Must-have | ✅ |
| R10 | Order-only changes never become row failures. | Derived | ✅ |

## Failure-shape score

| Case | Result | Design response |
|---|---|---|
| S1 Over-reach | Avoided | G1 fixes ordering at the owned merge, not shell semantics generally. |
| S2 Under-reach | Designed out | G4 covers both directions, permutations, missing/changed values, and malformed/duplicate variants. |
| S3 Direction inheritance | Designed out | Both Claude-first and AI-key-first sequences are required cells. |
| S4 Proxy property | Designed out | Status is based on a stable ownership-aware transformation, not arbitrary order. |
| S5 Unregistered peer | Not applicable | No new persistent state. |
| S6 Peer-version blindness | Designed out | G5 requires an explicit CLI capability and treats absence as legacy. |
| S7 Wrong layer | Designed out | CLI fixes resource ownership; Desktop fixes presentation/compatibility only. |
| S8 Guard-derived cells | Designed out | G4 derives cells from the temporal contract and shell grammar variants. |
| S9 Test pins wrong thing | Designed out | Each mechanism requires a distinct temporal and no-write assertion. |
| S10 Claim from prose | Carried admission check | Exact CLI `59.6.2` internal source/behavior must be inspected before implementation. |
| S11 Asymmetric validation | Not applicable | Desktop does not gain a credential parser. |
| S12 Primitive-contract mismatch | Designed out | Order-preserving merge makes textual no-op equality correspond to the owned change contract. |
| S13 Invocation-state collapse | Designed out | G1 and G4 preserve omitted peer exports; explicit clear remains separate. |

## Rejected shapes

- Full semantic block equality: too broad; it can hide meaningful duplicate/order semantics.
- Canonical sorting: creates a one-time migration diff and still treats formatting as configuration.
- Desktop shell parser: violates CLI authority and creates credential exposure risk.
- Desktop `--all`: P4 proved it includes unsupported experimental agents and unrelated files.
- CLI-only without compatibility handling: repeats S6 because installed CLI versions can lag Desktop.

## Detail handoff

Before implementation, inspect exact current internal CLI source or execute `59.6.2` read-only to resolve whether G1 already exists. The cross-version contract is the explicit `coding-agents-owned-env-merge-v1` capability in setup JSON, not a minimum version guess. Use the detailed breadboard and slices in this run. Do not implement from the gate artifact alone.
