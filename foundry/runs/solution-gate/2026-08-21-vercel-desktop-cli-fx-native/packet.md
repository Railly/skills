# Frozen packet: Vercel Desktop coding agents and fx

Date: 2026-08-21

Mode: greenfield solution selection

Repository snapshot: `vercel-labs/vercel-desktop` at `1c3d4c76dd47043945ae3362cc7f7dc05533d84e`

## Frame

Vercel Desktop currently exposes four named coding agents and retains agent-specific configuration ownership even though Vercel CLI is the product team's compatibility authority. New CLI integrations therefore do not become available in Desktop automatically. Separately, users of `fx` need a clear path to install it and sign in through its Vercel OAuth flow. The desired outcome is that Desktop supports the CLI's current and future native coding-agent integrations without copying its registry or config recipes, while representing `fx` honestly as a separate OAuth-capable tool.

This change must not implement AI Gateway reporting, actor attribution, `scope=user`, or AIG-17.

## Settled requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | A new coding-agent integration shipped by Vercel CLI becomes usable from Desktop without a Desktop release or copied registry entry. | Core goal |
| R1 | Vercel CLI owns agent detection, compatibility recipes, warnings, config writes, backups, migrations, secret placement, and shell integration. | Must-have |
| R2 | Desktop obtains explicit user consent before any coding-agent config or migration write. | Must-have |
| R3 | Desktop does not parse CLI help, copy the internal CSV, or maintain agent identifiers as its source of truth. | Must-have |
| R4 | Missing, old, failing, or agent-empty CLI states are clear and recoverable. | Must-have |
| R5 | Existing Desktop-managed configurations and their persisted key association are not silently destroyed during migration. | Must-have |
| R6 | Onboarding remains usable and lets the user skip coding-agent setup. | Must-have |
| R7 | Desktop detects whether `fx` is installed without reading its token or OAuth files. | Must-have |
| R8 | Desktop reports `fx` Gateway authentication separately from Codex or Grok provider sessions and does not claim all `fx` traffic is Gateway spend. | Must-have |
| R9 | Desktop invokes `fx login` for Vercel OAuth and never handles the OAuth token itself. | Must-have |
| R10 | Installing `fx` requires explicit consent and does not silently execute mutable remote shell or change shell startup files. | Must-have |
| R11 | Desktop does not expose keys or tokens in UI, logs, persisted Desktop state, or command-line arguments beyond the existing Vercel CLI key handoff. | Must-have |
| R12 | `fx` owns its upgrades. Desktop does not duplicate update logic. | Must-have |
| R13 | Spend and budget reporting remain unchanged until upstream identity and reporting work ships. | Must-have |

## Must not change

- Vercel CLI sign-in, team selection, API-key creation, key inventory, budgets, and spend UI.
- Finder-safe Vercel CLI discovery and its no-startup-file trust boundary.
- Persistence decoding for users with the current five configuration flags and `agents_key_id`.
- The dirty primary checkout. Implementation will occur in a clean worktree.
- No release, Gateway API, IAM, or `fx` source change.

## Temporal contract

| State | Owner | `unset → set` | `set → omitted` | `set → same` | `set → changed` | explicit clear | Continuity observable |
|---|---|---|---|---|---|---|---|
| Desktop managed-key association | Desktop vault | Save the key used after successful setup | Preserve | Preserve | Replace only after successful setup with the new key | Existing key deletion flow | Key inventory still marks the active agent key |
| Coding-agent configuration | Vercel CLI and agent files | Preview, consent, then CLI writes | Preserve files | Idempotent/no-op unless reconfigure was chosen | CLI previews and applies the new key | No new bulk-removal behavior in this change | Existing configs remain present and usable |
| `fx` executable | fx installer/user filesystem | Install after explicit consent | Preserve | Detect installed | `fx upgrade` remains user/fx-owned | No uninstall in this change | `fx status --json` remains callable |
| `fx` Gateway OAuth session | fx | `fx login` owns creation | Preserve | Status refresh only | `fx login` owns team/session change | No logout in this change | `auth`, `team`, `auth_expired` from `fx status --json` |

## Unknowns to resolve

- U1: Whether aggregate non-interactive CLI detection can preview and apply the same agent set without explicit IDs, including consent-gated agents.
- U2: Whether the CLI dry-run JSON is sufficient for a useful Desktop confirmation surface.
- U3: Whether the agent set changing between preview and apply needs pinning, re-preview, or can be accepted as CLI-owned revalidation.
- U4: Whether passing Desktop's existing managed key to the CLI can remain within current exposure constraints.
- U5: What legacy per-agent review/remove behavior must remain during migration.
- U6: Whether `fx login` can be launched reliably without a controlling terminal from the Native SDK process effect.
- U7: The smallest safe installation UX that satisfies R10.
- U8: How Desktop should label missing, signed-out, expired, Gateway-connected, and non-Gateway `fx` states.

## Evidence handles

- E1: Desktop hard-codes four agent IDs in `src/app.zig:4077-4111` and renders rows from `src/setup.native:425-499`.
- E2: Desktop still owns transforms, matching, shell blocks, review diffs, and removal in `src/agents.zig` and config lifecycle code after `src/app.zig:3950`.
- E3: Installed Vercel CLI `59.1.4` exposes `ai-gateway coding-agents setup --dry-run --non-interactive`, `--key`, `--reconfigure`, `--all`, and repeated `--agent`. Command: `vercel ai-gateway coding-agents setup --help`.
- E4: Latest internal CLI checkout `90543c219748ca8d1f9ba9236ddf95789d76914d` detects `DEFAULT_AGENTS` when neither `--agent` nor `--all` is supplied, and returns an error when none are detected: `packages/cli/src/util/ai-gateway/coding-agents/resolve.ts:55-70`.
- E5: The CLI machine dry-run returns `status`, `reason=dry_run`, `changes`, `migrations`, `skipped`, and `warnings`, then exits before writes: `packages/cli/src/util/ai-gateway/coding-agents/machine.ts:55-90`.
- E6: Desktop already passes the managed key to Vercel CLI through an argv item and delegates writes: `src/app.zig:4087-4111`. This is existing exposure, not a new security claim.
- E7: `fx` `0.0.4` documents `fx status --json` and `fx login`; its status JSON emits `model_source` and `connected_providers` for non-Gateway models, `auth`, `auth_refreshable`, optional `auth_expired`, and `team`: `/tmp/fx-latest.EWdd9D/src/core/output/output_contracts.zig:494-540`.
- E8: `fx` docs distinguish `fx login`, `fx login codex`, and `fx login grok`; Codex/Grok tokens do not go through Gateway: `/tmp/fx-latest.EWdd9D/README.md:22-54`.
- E9: Official installer `https://fx.sh/setup.sh` downloads the latest release from `releases.fx.sh`, writes `~/.local/bin/fx`, and appends PATH to shell rc when its bin directory is absent. Observed with `curl -fsSL https://fx.sh/setup.sh` on 2026-08-21.
- E10: Desktop's process runner collects output and has no controlling-terminal contract visible in `src/app.zig:1795-1820`; Native SDK argv is bounded.
- E11: AIG-17 is backlog owner-team work for IAM caller principal propagation and is explicitly outside this change.

## Reviewer task

Use the Shaping methodology. Produce a complete requirements table preserving settled status and clearly label any derived or undecided requirements. Explore materially distinct shapes. For each shape, list concrete mechanism parts and flagged unknowns, then run a binary R × Shape fit check with failure notes. Recommend one survivor, reject alternatives explicitly, and name the cheapest probes required before implementation. Do not edit any repository or packet. Do not assume a proposed implementation from this packet.
