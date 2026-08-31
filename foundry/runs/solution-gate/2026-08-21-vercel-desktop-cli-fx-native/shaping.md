# Shaping: CLI-owned coding agents and native fx

## Frame

Vercel Desktop must stop being the coding-agent compatibility registry. Vercel CLI should detect and configure installed agents, while Desktop provides preview and consent. `fx` is a separate OAuth-capable tool and must not be presented as a coding-agent recipe or as guaranteed Gateway spend.

## Requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | A coding agent added to Vercel CLI becomes usable from Desktop without a Desktop release. | Core goal |
| R1 | Vercel CLI owns detection, recipes, warnings, backups, migrations, writes, secrets, and shell integration. | Must-have |
| R2 | Desktop previews the CLI plan and gets explicit consent before writes. | Must-have |
| R3 | Desktop keeps no coding-agent IDs or copied catalog. | Must-have |
| R4 | Missing, old, failed, malformed, truncated, and empty CLI results are recoverable. | Must-have |
| R5 | Existing Desktop-managed config and persisted key association are not silently removed. | Must-have |
| R6 | Onboarding remains usable and skippable. | Must-have |
| R7 | Desktop reads `fx status --json`, not token files. | Must-have |
| R8 | `fx` Gateway OAuth and direct Codex or Grok sessions are labeled separately. | Must-have |
| R9 | A visible `fx login` terminal owns OAuth. | Must-have |
| R10 | `fx` installation is explicit, pinned, checksum-verified, and does not edit shell startup files. | Must-have |
| R11 | No new secret is persisted or rendered. | Must-have |
| R12 | `fx` owns upgrades. | Must-have |
| R13 | Spend and reporting remain unchanged. | Must-have |
| R14 | The managed-key association changes only after CLI apply succeeds. | Derived |
| R15 | Applying uses the same agentless CLI contract as preview, so Desktop never pins the detected set. | Derived |

## Selected shape E: CLI transaction plus separate fx surface

| Part | Mechanism | Flag |
|---|---|:---:|
| E1 | One Coding Agents card starts agentless `coding-agents setup --dry-run --non-interactive --key=…`. | |
| E2 | Desktop parses only machine fields and renders changes, migrations, skips, and warnings. | |
| E3 | Confirmation runs the same agentless command without `--dry-run`; only success persists `agents_key_id`. | |
| E4 | Legacy persisted settings and files remain untouched. No new bulk removal is added. | |
| E5 | Onboarding explains that setup is reviewed after key creation and remains skippable. | |
| E6 | A separate fx card runs `fx status --json` and classifies missing, OAuth, expired, API-key, and direct-provider states. | |
| E7 | Login opens a visible Terminal running `fx login`. | |
| E8 | Install opens a visible Terminal with a pinned archive, embedded release checksum, and `~/.local/bin/fx` destination. | |

## Fit check

| Req | Requirement | Status | E |
|---|---|---|:---:|
| R0 | New CLI agents need no Desktop release. | Core goal | ✅ |
| R1 | CLI owns compatibility and writes. | Must-have | ✅ |
| R2 | Preview and consent precede writes. | Must-have | ✅ |
| R3 | Desktop owns no IDs or catalog. | Must-have | ✅ |
| R4 | Dependency and output failures are recoverable. | Must-have | ✅ |
| R5 | Legacy state is not silently removed. | Must-have | ✅ |
| R6 | Onboarding is usable and skippable. | Must-have | ✅ |
| R7 | fx status does not read token files. | Must-have | ✅ |
| R8 | Gateway and direct providers are distinct. | Must-have | ✅ |
| R9 | fx owns OAuth in a visible terminal. | Must-have | ✅ |
| R10 | Installation is explicit, pinned, verified, and avoids rc edits. | Must-have | ✅ |
| R11 | No new secret exposure. | Must-have | ✅ |
| R12 | fx owns upgrades. | Must-have | ✅ |
| R13 | Spend remains unchanged. | Must-have | ✅ |
| R14 | Association changes only after success. | Derived | ✅ |
| R15 | Preview and apply stay agentless. | Derived | ✅ |

Rejected: Desktop picker plus CLI writer fails R0, R1, and R3. Mirrored CLI output fails R3 and eventually R0. Desktop-owned recipes fail the core goal.
