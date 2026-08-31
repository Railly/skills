# Vercel Desktop: CLI-native coding agents and fx

Date: 2026-08-21

Mode: candidate audit

Base: `vercel-labs/vercel-desktop@1c3d4c76dd47043945ae3362cc7f7dc05533d84e`

Candidate branch: `feat/cli-agents-fx`

## Frame

Vercel Desktop must support every installed coding agent known by the installed Vercel CLI without carrying a second catalog or write recipe. Users must preview CLI-owned changes and warnings before apply. fx remains a separate integration because it owns OAuth and direct-provider sessions.

## Frozen contract

- Vercel CLI owns coding-agent detection, writes, warnings, migrations, backups, Keychain behavior, and compatibility.
- Desktop previews with machine output and does not persist `agents_key_id` until every approved apply phase succeeds.
- Consent-bearing agents are applied only with IDs returned by CLI warning and skip records.
- Existing Desktop-managed configs retain their restore and delete path, but are not a catalog for new writes.
- fx is inspected only through `fx status --json`.
- fx install is pinned to v0.0.4, verifies official arm64 and x86_64 checksums, writes `~/.local/bin/fx`, does not edit shell rc files, and remains visible in Terminal.
- Direct Codex and Grok sessions are not described as Gateway spend. Gateway OAuth and API-key status remain distinct.
- Gateway, IAM, spend reporting, release metadata, and versioning are out of scope.

Full evidence packet: `/private/tmp/vercel-desktop-native-gate.bfS4nZ/fable/evidence-packet.md`.

## Independent blind shaping

| Reviewer | Family | Artifact | Result |
|---|---|---|---|
| Fable 5 | Anthropic | `/private/tmp/vercel-desktop-native-gate.bfS4nZ/fable/shaping.md` | Selected CLI-owned preview/apply plus separate Terminal fx integration |
| Grok 4.6 xhigh | xAI via Cursor | `/private/tmp/vercel-desktop-native-gate.bfS4nZ/grok/shaping-retry.md` | Selected the same ownership shape |

Both rejected a Desktop catalog, synthesized agent IDs, `--all`, and silent in-app fx installation. The surviving shape uses detection without `--agent`, then serial consent applies using only CLI-returned IDs. Serial applies are a safe variant because explicit IDs replace automatic detection.

## Probes

| Probe | Evidence | Outcome |
|---|---|---|
| CLI dry-run contract | CLI snapshot `90543c219748ca8d1f9ba9236ddf95789d76914d`, `coding-agents-setup.ts`, `machine.ts`, `resolve.ts` | `dry_run` is preview success; explicit agent flags replace detection; normal changes do not expose stable IDs |
| Apply terminal reasons | CLI `machine.ts` | Only `coding_agents_configured` and `already_configured` are accepted |
| fx status contract | fx snapshot `83a059c643cfe911db470a7c6c1dbc8fdb61de8a`, `output_contracts.zig`; installed fx v0.0.4 | `kind=status` distinguishes expiry, Gateway auth, direct source, and connected providers |
| fx release assets | GitHub release v0.0.4 and downloaded assets | arm64 SHA-256 `395ac3832f6f6c231f6ba7a46ba6ec70eefaddb68662e6fd6c4fb8e0d6d72f59`; x86_64 SHA-256 `41d3c2cd78bdb53aa9df16fbd5ae9415c8a2e3e8851ebe6423db0cc32128bf7c`; root `fx` member confirmed |
| Partial apply | `failed consent follow-up stays unassociated and restarts from preview` | Base phase may be durable, but association stays empty; retry begins with a new dry-run |
| Association timing force-red | `/private/tmp/vercel-desktop-force-red.r5lTPB` | Tests rejected association after base phase and during replacement-key resolution |

## Candidate reveal

Grok candidate audit: `/private/tmp/vercel-desktop-native-gate.bfS4nZ/grok/candidate-audit.md`.

Fable candidate audit failed to produce an artifact after two network-bound attempts. This is a recorded review gap, not a pass. Both Fable blind shaping and the complete Grok candidate audit remain available.

The initial candidate matched the selected shape but required amendments:

1. A settings key-replacement path still persisted `agents_key_id` before verified CLI apply.
2. Old configure, retry, and review messages could repair the association before preview.
3. fx parsed Gateway OAuth and API-key status separately, then collapsed both into one UI state.

The candidate was amended by removing all early association repair, making replacement-key resolution leave the association empty, and preserving OAuth versus API-key states through the UI. Legacy cleanup remains available only for `config_managed` rows.

## Failure-shape score

| Shape | Final disposition |
|---|---|
| S1 over-reach | Designed out: existing cleanup is preserved; no release or spend changes |
| S2 under-reach | Designed out by removing every early association write and adding replacement and partial-phase regression tests |
| S3 direction inheritance | Both success and later-failure directions are covered; later failure cannot create association |
| S4 proxy property | Exact JSON reasons and final association state are direct oracles |
| S5 unregistered peer | No new persistent catalog or lifecycle file |
| S6 peer-version blindness | Old or malformed machine output fails closed |
| S7 wrong layer | fx auth distinction reaches the displayed state; Terminal remains the visible install and login layer |
| S8 guard-derived cells | Warning-only, missing-warning, malformed, truncated, base-plus-consent, consent-only, and multi-consent classes are represented |
| S9 wrong test | Three mechanism mutations went red and restored green |
| S10 prose claim | CLI and fx source snapshots plus real fx v0.0.4 artifacts were checked |
| S11 asymmetric validation | Preview and mutating apply both validate terminal status and reason; consent IDs are stricter at the mutating boundary |
| S12 primitive mismatch | Desktop does not treat osascript completion as fx installation completion; Check Again is required |
| S13 invocation-state collapse | Existing successful association survives ordinary omission; replacement explicitly clears it; preview cancellation does not create it |

## Final fit

The amended candidate satisfies R0 through R18 from the reconciled shaping artifact. One accepted product cost remains: Apply consents to every warning visible in the reviewed plan rather than offering per-warning opt-out. Consent is still explicit and no warning-bearing agent is written before Apply.

## Verdict

**Amend, then pass to detail.**

The selected shape is CLI-owned preview and apply, serial CLI-returned consent IDs, legacy cleanup-only rows, and a separate Terminal-visible fx integration. The amended candidate implements that shape. Review Gate receives the complete must-not-change set and the association, machine-output, cleanup, fx auth, and terminal-install invariants above.

Visualization choice: inline tables only. The disputed ownership and phase ordering do not require a larger diagram.
