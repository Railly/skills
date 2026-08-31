# Shaping pass A

Runtime: Claude Code 2.1.246, Anthropic Sonnet family.

Baseline: `vercel-labs/vercel-desktop` `v0.0.21`, `c8ee1bcc441cdbaa0e213c5b0d26270945eb7642`.

Input: only `../frozen-packet.md`.

## Requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | Repeated checks with no external configuration change report the same effective status for every supported agent. | Settled, core goal |
| R1 | Repairing one supported agent must not make another previously configured supported agent require repair. | Settled, must-have |
| R2 | Closing and reopening Vercel Desktop must not change effective agent configuration or status by itself. | Settled, must-have |
| R3 | A green status must mean the agent's required configuration is currently usable, not merely that an earlier repair command exited successfully. | Settled, must-have |
| R4 | A red status must identify an actionable configuration defect owned by that row; optional work or unrelated shared state must not masquerade as that agent being broken. | Settled, must-have |
| R5 | Credentials remain out of Desktop source, logs, UI, and plaintext diagnostic artifacts; existing Keychain-backed behavior remains available. | Settled, must-have |
| R6 | The supported set remains fx, Claude Code, Codex, OpenCode, and Pi, and already-working agent-specific config files remain preserved. | Settled, must-have |
| R7 | Standalone Vercel CLI coding-agent setup remains able to configure one selected agent or several selected agents. | Settled, must-have |
| R8 | Shared shell-environment state is one persistent resource; omission by one agent-specific invocation does not clear a peer export. | Settled, must-have |
| R9 | Repeating the same repair without external change produces no further effective configuration change. | Settled, must-have |
| RA1 | An order-only shell-block difference must not become an agent configuration failure. | Derived from E3-E7 and R0/R4 |

## Shapes

### A: CLI-owned semantic idempotence

| Part | Mechanism | Flagged |
|---|---|---|
| A1 | CLI compares managed exports by effective names and values, independent of order. | Yes: parser semantics and duplicates need probing |
| A2 | CLI emits stable output for one effective export set. | Yes: migration impact |
| A3 | Apply skips a write when effective state is unchanged. | No |
| A4 | Desktop continues consuming CLI status. | Yes: old CLI compatibility |

### B: Desktop reconciliation shim

| Part | Mechanism | Flagged |
|---|---|---|
| B1 | Desktop parses the shell block and models each agent's exports. | Yes: violates CLI authority and adds credential risk |
| B2 | Desktop serializes repairs and rechecks all rows. | Yes: interaction policy U1 |
| B3 | Desktop ignores order-only CLI changes. | Yes: leaves standalone CLI non-idempotent |

### C: Explicit CLI status contract

| Part | Mechanism | Flagged |
|---|---|---|
| C1 | CLI owns an explicit machine-readable semantic status primitive. | Yes: new API surface |
| C2 | Desktop consumes the primitive and handles old CLI versions. | Yes: version policy U5 |
| C3 | Existing setup remains the repair path. | No |

## Fit check

| Req | Requirement | Status | A | B | C |
|---|---|---|---|---|---|
| R0 | Repeated checks with no external configuration change report the same effective status for every supported agent. | Core goal | ✅ | ✅ | ✅ |
| R1 | Repairing one supported agent must not make another previously configured supported agent require repair. | Must-have | ✅ | ✅ | ✅ |
| R2 | Closing and reopening Vercel Desktop must not change effective agent configuration or status by itself. | Must-have | ✅ | ✅ | ✅ |
| R3 | A green status must mean the agent's required configuration is currently usable. | Must-have | ✅ | ❌ | ✅ |
| R4 | A red status must identify an actionable defect owned by that row. | Must-have | ✅ | ❌ | ✅ |
| R5 | Credentials remain out of Desktop diagnostics and existing Keychain behavior remains. | Must-have | ✅ | ❌ | ✅ |
| R6 | Supported agents and working agent files remain preserved. | Must-have | ✅ | ✅ | ✅ |
| R7 | Standalone CLI setup still supports one or several agents. | Must-have | ✅ | ✅ | ✅ |
| R8 | Omission does not clear peer exports. | Must-have | ✅ | ✅ | ✅ |
| R9 | Repair is idempotent. | Must-have | ✅ | ❌ | ✅ |
| RA1 | Order-only differences do not become failures. | Derived | ✅ | ✅ | ✅ |

Failure notes: B reimplements CLI-owned schema, can expose credential values, and masks rather than fixes standalone CLI churn.

Recommendation before probes: A. C is the fallback if Desktop requires an explicit compatibility contract. Reject B.

Required spikes: exact CLI comparison/writer; warning mapping; multi-agent temporal behavior; newer CLI behavior; old CLI compatibility policy.
