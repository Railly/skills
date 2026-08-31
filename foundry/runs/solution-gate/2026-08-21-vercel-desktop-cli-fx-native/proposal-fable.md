# Fable 5 shaping pass

Runtime: Claude Code 2.1.238

Model: Fable 5, xhigh

Repository head supplied: `1c3d4c76dd47043945ae3362cc7f7dc05533d84e`

## Requirements

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
| D1 | Setup follows preview, explicit consent, then apply, with writes performed by Vercel CLI. | Derived |
| D2 | The managed-key association changes only after successful apply and otherwise remains intact. | Derived |
| D3 | No new bulk-removal behavior is introduced. | Derived |
| D4 | Desktop tolerates optional `fx status --json` fields and treats the status JSON as its observable. | Derived |
| D5 | An installed but incapable Vercel CLI gets an actionable update state. | Derived |
| U1 | Preview/apply agent-set drift policy. | Undecided |
| U2 | Legacy per-agent review/remove retention. | Undecided |
| U3 | Exact `fx` state labels. | Undecided |
| U4 | `fx` installation mechanism. | Undecided |
| U5 | `fx login` launch strategy without a TTY. | Undecided |

## Shapes

### A: Aggregate CLI delegation

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Replace the hard-coded picker with one coding-agent setup action and Skip. | |
| A2 | Run agentless `setup --dry-run --non-interactive --key …`; the CLI detects supported agents. | ⚠️ |
| A3 | Render `changes`, `migrations`, `skipped`, and `warnings`, then require confirmation. | ⚠️ |
| A4 | Apply the same aggregate setup after consent; only persist the key association after success. | ⚠️ |
| A5 | Keep legacy cleanup/read behavior until migration coverage is proven. | ⚠️ |
| A6 | Detect `fx` by executable plus `fx status --json`; classify Gateway and direct providers separately. | |
| A7 | Invoke `fx login`; never inspect or store OAuth material. | ⚠️ |
| A8 | Install a pinned, checksum-verified release without shell startup mutation, with instructions-only fallback. | ⚠️ |

### B: Desktop picker, CLI writer

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Keep Desktop's per-agent rows and IDs. | |
| B2 | Pass selected explicit `--agent` flags to CLI dry-run/apply. | |
| B3 | Add `fx` beside the existing picker. | ⚠️ |

### C: Mirrored CLI catalog

| Part | Mechanism | Flag |
|---|---|:---:|
| C1 | Derive and persist a dynamic list from CLI output. | ⚠️ |
| C2 | Render per-agent rows from the mirror and invoke explicit IDs. | ⚠️ |
| C3 | Add the same `fx` flow as A. | ⚠️ |

### D: Preserve Desktop ownership

| Part | Mechanism | Flag |
|---|---|:---:|
| D1 | Keep transforms, config matching, diffs, shell writes, and removal in Desktop. | |
| D2 | Add integrations through Desktop releases. | |
| D3 | Add the same `fx` flow as A. | ⚠️ |

## Fit check

| Req | Requirement | Status | A | B | C | D |
|---|---|---|:---:|:---:|:---:|:---:|
| R0 | New CLI agents require no Desktop release or copied registry. | Core goal | ✅ | ❌ | ❌ | ❌ |
| R1 | CLI owns detection and compatibility work. | Must-have | ✅ | ❌ | ❌ | ❌ |
| R2 | Explicit consent before writes. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R3 | No help parsing, CSV copy, or Desktop ID source of truth. | Must-have | ✅ | ❌ | ❌ | ❌ |
| R4 | Recoverable CLI failure states. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R5 | Preserve legacy configs and key association. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R6 | Usable, skippable onboarding. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R7 | Detect `fx` without token-file reads. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R8 | Distinguish Gateway and direct provider auth. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R9 | `fx login` owns OAuth. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R10 | Explicit, non-remote-shell, no-rc install. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R11 | No new secret exposure. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R12 | `fx` owns upgrades. | Must-have | ✅ | ✅ | ✅ | ✅ |
| R13 | Spend remains unchanged. | Must-have | ✅ | ✅ | ✅ | ✅ |

Notes: B keeps Desktop's IDs and detection. C is still a copied, stale registry. D is the current coupling.

## Recommendation

Select A after probes resolve every flag. Use a pinned, checksummed `fx` artifact only if the release channel exposes a checksum; otherwise show instructions rather than executing `setup.sh`.

Required probes: aggregate dry-run on the installed CLI, inspect machine JSON and secret behavior, change detection between preview and apply, inspect release checksums, run non-TTY `fx login`, and test legacy Desktop configs against CLI dry-run.
