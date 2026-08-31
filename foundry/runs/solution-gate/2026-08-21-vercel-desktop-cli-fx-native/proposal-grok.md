# Grok 4.6 shaping pass

Runtime: Cursor Agent 2026.08.11-e8db854

Model: Cursor Grok 4.6

Repository head supplied: `1c3d4c76dd47043945ae3362cc7f7dc05533d84e`

## Requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | New CLI agents become usable without a Desktop release or copied registry. | Core goal |
| R1 | CLI owns detection, recipes, warnings, writes, backups, migrations, secrets, and shell integration. | Must-have |
| R2 | Desktop gets explicit consent before writes. | Must-have |
| R3 | No CLI-help parsing, copied CSV, or Desktop identifier source of truth. | Must-have |
| R4 | Missing, old, failing, and empty CLI states are recoverable. | Must-have |
| R5 | Existing configs and key association are not silently destroyed. | Must-have |
| R6 | Onboarding remains usable and skippable. | Must-have |
| R7 | Detect `fx` without reading token/OAuth files. | Must-have |
| R8 | Separate Gateway auth from Codex/Grok provider sessions. | Must-have |
| R9 | `fx login` owns Vercel OAuth. | Must-have |
| R10 | Explicit install consent, no silent mutable remote shell or rc changes. | Must-have |
| R11 | No new token/key exposure. | Must-have |
| R12 | `fx` owns upgrades. | Must-have |
| R13 | Spend and budgets remain unchanged. | Must-have |

No derived requirements were added. U1-U8 remain unknowns.

## Shapes

### S1: Opaque CLI transaction

Desktop never names agents. It runs an agentless machine dry-run, shows generic consent, and invokes the same agentless apply. `fx` is detected with `status --json`, logged into with `fx login`, and kept separate from spend. Installation is consent-gated and does not use unchecked `setup.sh`.

Flags: dry-run usefulness, preview/apply drift, legacy cleanup, non-TTY login, installation mechanism.

### S2: CLI-emitted preview UI

Desktop never persists IDs, but temporarily renders names and actions from CLI `changes`, `migrations`, `skipped`, and `warnings`. Confirmation re-previews if the detected set changed, then applies through the same CLI-owned contract. `fx` follows S1.

Flags: aggregate consent behavior, machine JSON sufficiency, drift detection, legacy cleanup, non-TTY login, safe installation.

### S3: Desktop rows and mapped IDs

Keep hard-coded Desktop rows, pass explicit `--agent` values, retain Desktop transforms/review/remove, and add a Desktop-owned `fx` session/install/update flow.

Flags: none can repair its structural conflicts with R0, R1, R3, R8, R9, R10, and R12.

## Fit check

| Req | Requirement | Status | S1 | S2 | S3 |
|---|---|---|:---:|:---:|:---:|
| R0 | New CLI agent without Desktop release. | Core goal | ✅ | ✅ | ❌ |
| R1 | CLI owns compatibility. | Must-have | ✅ | ✅ | ❌ |
| R2 | Explicit consent. | Must-have | ✅ | ✅ | ✅ |
| R3 | No copied IDs/catalog. | Must-have | ✅ | ✅ | ❌ |
| R4 | Recoverable errors. | Must-have | ✅ | ✅ | ✅ |
| R5 | Preserve legacy state. | Must-have | ✅ | ✅ | ❌ |
| R6 | Skippable onboarding. | Must-have | ✅ | ✅ | ✅ |
| R7 | `fx` status without token reads. | Must-have | ✅ | ✅ | ✅ |
| R8 | Honest provider labeling. | Must-have | ✅ | ✅ | ❌ |
| R9 | `fx login` owns OAuth. | Must-have | ✅ | ✅ | ❌ |
| R10 | Safe explicit install. | Must-have | ✅ | ✅ | ❌ |
| R11 | No new secret exposure. | Must-have | ✅ | ✅ | ❌ |
| R12 | `fx` owns upgrades. | Must-have | ✅ | ✅ | ❌ |
| R13 | Spend unchanged. | Must-have | ✅ | ✅ | ✅ |

S3 fails because Desktop remains the registry and config owner, and its proposed `fx` ownership crosses explicit boundaries.

## Recommendation

Select S2, with S1 as fallback if machine output cannot support a useful preview. Re-preview before apply instead of pinning IDs in Desktop. Keep `fx` a separate status/login surface and do not claim spend.

Required probes: aggregate dry-run on installed and latest CLI, machine JSON sufficiency, detected-set drift, current key handoff, legacy cleanup requirements, non-TTY `fx login`, safe installer mechanism, and state-label mapping.
