# Frozen shaping packet: coding-agent reliability

Mode: greenfield defect shaping.

Repository baseline: `vercel-labs/vercel-desktop` release `v0.0.21`, exact commit `c8ee1bcc441cdbaa0e213c5b0d26270945eb7642`.

## Frame

The Coding Agents settings surface violates a reliability property: after an agent reports configured and the application relaunches, a fresh check can report that agent or a peer as needing repair even though the user made no intentional configuration change. The desired outcome is that status and repair remain stable, truthful, and mutually compatible across checks, repairs, and application relaunches.

## Settled requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | Repeated checks with no external configuration change report the same effective status for every supported agent. | Core goal |
| R1 | Repairing one supported agent must not make another previously configured supported agent require repair. | Must-have |
| R2 | Closing and reopening Vercel Desktop must not change effective agent configuration or status by itself. | Must-have |
| R3 | A green status must mean the agent's required configuration is currently usable, not merely that an earlier repair command exited successfully. | Must-have |
| R4 | A red status must identify an actionable configuration defect owned by that row; optional work or unrelated shared state must not masquerade as that agent being broken. | Must-have |
| R5 | Credentials remain out of Desktop source, logs, UI, and plaintext diagnostic artifacts; existing Keychain-backed behavior remains available. | Must-have |
| R6 | The supported set remains fx, Claude Code, Codex, OpenCode, and Pi, and already-working agent-specific config files remain preserved. | Must-have |
| R7 | Standalone Vercel CLI coding-agent setup remains able to configure one selected agent or several selected agents. | Must-have |
| R8 | The solution must handle shared shell-environment state as one persistent resource across invocations; omission of an export by one agent-specific invocation does not imply an explicit request to clear a peer's required export. | Must-have |
| R9 | A repair is idempotent: repeating the same repair without external change produces no further effective configuration change. | Must-have |

## Must-not-change workflows

- Vercel Desktop continues to use the installed authenticated Vercel CLI rather than reimplementing each agent's config schema.
- Existing agent-specific config outside the fields owned by Vercel coding-agent setup remains intact.
- Existing session-migration safety guarantees remain intact: originals are not overwritten or deleted.
- fx continues to use its native Keychain contract and does not require the Vercel CLI setup path.
- A user can still inspect and repair agents from Settings without repeating onboarding.
- No proposed shape may edit the dirty legacy worktrees, historical recovery snapshot, existing stashes, or PR #23.

## Unknowns

| ID | Unknown fact or policy choice |
|---|---|
| U1 | Whether per-row `Fix` must remain the exact UI interaction, or may become a coordinated repair while preserving row-level status. |
| U2 | Whether the canonical fix should ship in Vercel CLI, Vercel Desktop, or both, given different ownership and release cadence. |
| U3 | Whether a Vercel CLI version containing the semantic shared-block correction is already planned or available beyond installed version `59.1.4`. |
| U4 | Whether optional session migrations and warnings should be separate UI states rather than red configuration failures. |
| U5 | Whether Desktop may require a minimum Vercel CLI version for reliable agent status, or must degrade safely with older compatible CLIs. |

## Temporal transition contract

Persistent input: the Vercel-managed shell environment block in the user's shell rc file.

| State | Scope and owner | Initial default | `unset → set` | `set → omitted` | `set → same` | `set → changed` | `set → explicit clear` | Reuse, restart, or migrate | Continuity observables |
|---|---|---|---|---|---|---|---|---|---|
| Managed exports required by selected agents | Persistent shell rc resource written by Vercel CLI and consumed by multiple agents | No managed block or an existing user file without it | Add only the required managed exports while preserving unrelated content | Preserve exports required by previously configured peers; omission in one selected-agent invocation is not clear | No file rewrite and stable status | Update the affected managed value while retaining peer requirements | Only an explicit remove/reset operation may remove the managed block or an export | New terminal may be needed for environment activation, but Desktop relaunch alone must not reorder or erase effective requirements | Shell-block semantic export set; per-agent dry-run actions; file hash/mtime; per-agent effective status before and after repair/relaunch |
| Per-agent status in Desktop | Ephemeral UI state derived from durable config on each inspection | Idle before inspection | Check derives status from current effective config | Relaunch may discard cached UI state but must derive the same result | Recheck remains stable | External config change may change only affected or genuinely shared statuses | Explicit reset may return affected agents to needs-attention | Status is recomputed after relaunch, not trusted from cache | Row status and actionable reason for all five agents across repeated checks |

## Evidence handles

| Handle | Observation |
|---|---|
| E1 | `gh release view v0.0.21` and GitHub ref API: release/tag points to exact commit `c8ee1bc`. |
| E2 | `AppModel.swift:477-523` at `c8ee1bc`: Desktop launches one check task per row, previews one agent at a time, and repairs one agent at a time before rechecking it. |
| E3 | `VercelService.swift:179-220` at `c8ee1bc`: non-fx status and repair delegate to `vercel ai-gateway coding-agents setup`; any pending change or warning makes the row not configured. |
| E4 | Installed Vercel CLI `59.1.4`, `commands-bulk.js:6036-6185`: selected agents contribute exports to one managed shell block; omitted export names are preserved, but generated export order follows the selected invocation before preserved peer exports. File equality is textual. |
| E5 | Three sequential dry-run rounds on the live configuration: Claude Code always reports `.zshrc would_update`; Codex and OpenCode report `.zshrc unchanged`; Pi reports its auth config unchanged. Results are stable across rounds. No apply command was run. |
| E6 | Selection probe: Claude-only and all-four previews report `.zshrc would_update`; Codex-only and OpenCode-only previews report `.zshrc unchanged`. |
| E7 | Redacted structural inspection of `.zshrc`: the managed Vercel block contains both `AI_GATEWAY_API_KEY` and `ANTHROPIC_AUTH_TOKEN`; no credential values were captured. |
| E8 | User-observed sequence: a red row turns green after `Fix`; after application relaunch, a different peer can be red. Screenshots show changing row status on the same Settings surface. |
| E9 | `CodingAgentsTests.swift` at `c8ee1bc`: coverage asserts command construction, plan-to-status mapping, and presence of fix/recheck calls; it does not exercise sequential peer repairs against the same shell block or relaunch continuity. |

## Inspection and mutation boundary

Shaping and probes are read-only against Vercel Desktop source, user configuration, Keychain, Git refs, GitHub state, and installed Vercel CLI. Dry-run commands are allowed. Do not run coding-agent setup without `--dry-run`, and do not expose credential values.
