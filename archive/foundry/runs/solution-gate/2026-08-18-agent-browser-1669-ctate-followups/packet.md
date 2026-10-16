# Frozen packet: selective CA trust on clean Linux installs and launch transitions

Mode: candidate audit

Repository: `vercel-labs/agent-browser`

Base commit: `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`

Candidate status: sealed and hidden from shaping reviewers

## Frame

### Violated property

A first-party `agent-browser` installation cannot reliably provide selective private-CA trust across the supported local and provider launch workflows. A clean supported Linux environment may lack a runtime prerequisite, and an explicit transition away from local CA trust may be lost before it reaches the long-lived session.

### Desired outcome

Selective CA trust works immediately after first-party Linux setup, persists only when omitted, and is removed only by an explicit clear. Every independently constructed launch path preserves that transition contract or rejects it before partial work.

## Evidence-only facts

| ID | Status | Fact | Source handle |
|---|---|---|---|
| F1 | specified | The product offers first-party Linux dependency installation through the CLI and through Eve sandbox bootstrap. A feature included by those installations must have its required runtime executables available afterward. | Base `cli/src/install.rs:526-716`; base `packages/@agent-browser/eve/extension/lib/sandbox.ts:54-114` |
| F2 | observed | On clean Debian Bookworm, the first-party dependency set installs the browser NSS runtime but does not make the executable required by selective CA setup resolvable. Installing the platform tools package does. | `cases/agent-browser/1669-certutil-missing-from-installers.md`, Method and Outcome |
| F3 | observed | On clean Amazon Linux 2023, the first-party dependency set and Eve bootstrap install the browser NSS runtime but do not make the executable required by selective CA setup resolvable. Installing the platform tools package does. | Same as F2 |
| F4 | specified | A clear runtime error is insufficient when a first-party setup path claims ownership of required system dependencies. | `cases/agent-browser/1669-certutil-missing-from-installers.md`, Red signal and Transferable lesson |
| F5 | inferred | Base maintains separate package maps for Debian-family and RPM-family setup, and Eve maintains an independent sandbox package map. | Base `cli/src/install.rs:526-716`; base `packages/@agent-browser/eve/extension/lib/sandbox.ts:54-114` |
| F6 | specified | Selective CA trust is sticky session state: omission preserves the prior effective CA, while removal requires an explicit clear representation. | `foundry/runs/solution-gate/2026-08-17-agent-browser-1669-ca-trust-stickiness/packet.md`, R9-R12 |
| F7 | inferred | Base constructs launch command envelopes independently for auto-connect, CDP, providers, and local launch configuration. | Base `cli/src/main.rs:1315-1518` |
| F8 | observed | In a continuing session with effective local CA trust, an explicit clear followed by a provider launch can arrive without the clear transition. The daemon then treats the request as omission, retains the prior CA, and rejects the provider launch as incompatible with effective local CA trust. | `cases/agent-browser/1669-provider-clear-ca-transition.md`, Method and Outcome |
| F9 | observed | Isolated tests for clear and provider incompatibility do not detect the failure. The missing cell crosses prior state, request state, and launch family. | Same as F8 |
| F10 | specified | CLI feature changes keep CLI, config, environment, MCP, help, README, core skill, references, docs, schema, tests, and wrapper launch paths aligned. | Base `AGENTS.md`, Documentation and CLI/MCP Parity |
| F11 | specified | The CLI's own outbound TLS trust remains a separate connection boundary and is outside this feature. | Prior settled contract, R16 |
| F12 | unknown | Whether the selected implementation can remove its external executable dependency without worsening the trust contract is not established by current evidence. | Open mechanism question |

## Settled requirements

| Req | Requirement | Status |
|---|---|---|
| R0 | A first-party-supported local Chromium session on Linux can trust certificates issued by one user-supplied private CA without disabling ordinary certificate verification. | Core goal |
| R1 | After the product's first-party dependency setup on each supported Linux package family and in the default Eve sandbox, selective CA trust works without a second manual package-install step. | Must-have |
| R2 | Every production external executable introduced by the feature is mapped to the package that provides it in every first-party installer and sandbox bootstrap that owns the feature. | Must-have |
| R3 | A missing or failing prerequisite produces an actionable error before Chromium launches and leaves no created trust or browser state behind. | Must-have |
| R4 | Without CA configuration, existing installation and launch behavior remains unchanged. | Must-not-change |
| R5 | In a continuing named session, omission preserves the prior effective CA. Explicit clear removes it. Set, omit, and clear remain distinct through every independently constructed launch envelope. | Must-have |
| R6 | After local CA trust is set, `provider + explicit clear` removes the local-only state before provider compatibility is evaluated, so the provider launch is not rejected because of stale CA state. | Must-have |
| R7 | After local CA trust is set, `provider + omitted CA input` retains the effective CA and is rejected clearly before provider work begins. | Must-have |
| R8 | A provider request that tries to set local-only CA trust is rejected clearly before provider work begins. | Must-have |
| R9 | Local, provider, CDP, auto-connect, MCP, config, environment, and Eve paths express one consistent set, omit, and clear contract or reject unsupported transitions before partial work. | Must-have |
| R10 | Repeating the same effective CA reuses the live local browser. Changing or explicitly clearing it replaces only the browser as declared, without collapsing omission into removal. | Must-have |
| R11 | Tests derive transition cells from the external state domain and all independent envelope constructors, not from only the implementation branch changed by the fix. | Must-have |
| R12 | The CLI's own outbound TLS trust remains outside the change. | Must-not-change |
| R13 | Useful candidate work and contributor attribution are preserved when compatible with the selected contract. | Must-have |

## Unknowns

| ID | Question | Status |
|---|---|---|
| U1 | What is the complete inventory of first-party setup paths that own the selective CA feature? | Investigate |
| U2 | What executable or library boundary does the selected trust mechanism require on each supported Linux family? | Investigate |
| U3 | Where should set, omit, and clear be represented so every launch family consumes the same transition semantics? | Investigate |
| U4 | Can independent launch envelopes be structurally coupled to one transition serializer, or must parity be enforced through exhaustive tests? | Investigate |
| U5 | Which transition cells are meaningful for local, provider, CDP, and auto-connect launches, and which must reject? | Investigate |

## Temporal transition contract

State under test: effective selective CA trust for one continuing named session.

| Prior state | Request | Local launch | Provider launch | CDP launch | Auto-connect launch |
|---|---|---|---|---|---|
| Unset | Set CA | Establish validated trust before browser launch | Reject before provider work | Reject before attach work | Reject before discovery/attach work |
| Unset | Omit | Preserve default behavior | Preserve default provider behavior | Preserve default CDP behavior | Preserve default auto-connect behavior |
| Unset | Explicit clear | Remain unset without unnecessary replacement | Remain unset and continue provider launch | Remain unset and continue CDP launch | Remain unset and continue auto-connect |
| Set | Set same CA | Reuse daemon, browser, target, URL, page state, and trust | Reject before provider work | Reject before attach work | Reject before discovery/attach work |
| Set | Set changed CA | Validate replacement first, then replace local browser deliberately | Reject before provider work | Reject before attach work | Reject before discovery/attach work |
| Set | Omit | Retain CA and reuse live local session | Retain CA, then reject as incompatible before provider work | Retain CA, then reject as incompatible before attach work | Retain CA, then reject as incompatible before discovery/attach work |
| Set | Explicit clear | Remove CA and replace local browser deliberately | Remove CA, then continue provider launch | Remove CA, then continue CDP launch | Remove CA, then continue auto-connect |

Continuity observables when reuse is expected: daemon PID, browser PID or generation, target identity, URL, page state, and effective CA identity.

## Mandatory discriminator matrix

| Case | Required result |
|---|---|
| Clean Debian-family environment after first-party setup | All feature runtime prerequisites available |
| Clean RPM-family environment after first-party setup | All feature runtime prerequisites available |
| Default Eve sandbox after bootstrap | All feature runtime prerequisites available |
| Required executable deliberately absent | Actionable pre-launch error and no leaked trust/browser state |
| Prior CA set, local request omits CA | Retain trust and continuity |
| Prior CA set, provider request omits CA | Retain trust, reject provider before provider work |
| Prior CA set, provider request explicitly clears CA | Clear trust, then permit ordinary provider launch |
| Prior CA unset, provider request explicitly clears CA | No-op clear, permit ordinary provider launch |
| Prior CA set, CDP or auto-connect explicitly clears CA | Clear trust, then permit ordinary attach behavior |
| Prior CA set, any independent wrapper drops explicit clear | Test must fail |
| Installer package mapping removed while runtime check remains | Clean-install test must fail |

## Reviewer task

Work only from this packet and the clean base checkout. Do not inspect GitHub PRs, candidate branches, candidate diffs, review comments, prior shaping outputs, or sibling worktrees.

Use the Shaping methodology and produce:

1. The complete R table, preserving settled requirements and labeling additions derived or undecided.
2. Materially distinct solution shapes with named mechanism parts and flagged unknowns.
3. A binary R × Shape fit check with failure notes.
4. A recommended survivor, rejected alternatives, and required spikes.
5. At least three forward effects for the recommended shape, including harmful branches.
6. The cheapest falsifying probes for the weakest load-bearing assumptions.

Do not implement or modify files.
