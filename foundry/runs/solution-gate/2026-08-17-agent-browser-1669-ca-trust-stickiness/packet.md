# Frozen packet: scoped browser CA trust with session continuity

Mode: candidate audit

Base repository: `vercel-labs/agent-browser`

Base commit: `548b159b30eef119ccf6846c8bc807d0eaa3f6f8`

## Frame

### Violated property

A long-running `agent-browser` session cannot selectively trust a user-supplied private CA for locally launched Chromium while preserving normal certificate verification and ordinary multi-command session continuity.

### Desired outcome

A user can configure one private CA for a local Chromium session, navigate through an HTTPS interception proxy, and continue issuing later commands without repeating that configuration. Trust remains scoped to that CA and session. Unrelated authorities, hostname mismatches, and invalid validity periods remain rejected.

## Evidence-only facts

| ID | Status | Fact | Source handle |
|---|---|---|---|
| F1 | observed | Without additional trust, Chromium rejects a leaf signed by a private CA with `ERR_CERT_AUTHORITY_INVALID`. | `vercel-labs/agent-browser#1022`, Problem and Current workaround |
| F2 | specified | `--ignore-https-errors` is an existing explicit bypass that disables certificate verification broadly. The requested capability is narrower. | Base `README.md:955-957`; `vercel-labs/agent-browser#1022`, Current workaround and Desired behavior |
| F3 | observed | A valid leaf signed by the selected CA must load when the server omits that CA from the presented TLS chain. | `cases/agent-browser/1669-spki-bypass-is-not-ca-trust.md`, Outcome |
| F4 | observed | Wrong-hostname, unrelated-authority, expired, and not-yet-valid leaves must remain rejected. | `cases/agent-browser/1669-spki-bypass-is-not-ca-trust.md`, Outcome and Transferable lesson |
| F5 | observed | A normal two-command workflow supplies the CA on `open` and omits it on `snapshot`. Treating omission as removal restarts the daemon and browser, loses the target and URL, and returns a fresh page. | `foundry/runs/review-gate/2026-08-17-agent-browser-1669-daemon-ca-stickiness-0329596.md`, Reproduction |
| F6 | observed | Repeating the same CA on the second command preserves daemon PID, target, URL, trust, and page state. | Same as F5, Control |
| F7 | inferred | Base `main` already distinguishes daemon-owned process configuration from browser launch configuration. The daemon fingerprint hashes a narrow daemon subset, while the launch hash decides browser reuse for launch-time inputs. | Base `cli/src/connection.rs:430-471,591-624`; base `cli/src/native/actions.rs:257-304,4219-4261` |
| F8 | inferred | Base launch-command construction sends local launch configuration only when a relevant option is present. Later commands without such options can reuse the existing browser. | Base `cli/src/main.rs:166-190`; base `cli/src/native/actions.rs:4232-4261` |
| F9 | specified | CLI feature changes must keep CLI, config, environment, MCP, help, README, core skill, references, docs, schema, and tests aligned. | Base `AGENTS.md`, Documentation and CLI/MCP Parity |
| F10 | unknown | The complete portable mechanism for macOS and Windows is not established by current evidence. | `cases/agent-browser/1669-spki-bypass-is-not-ca-trust.md`, Outcome and Exceptions |
| F11 | specified | The first implementation may support only locally launched Chromium on Linux if the limitation and dependency behavior are explicit. | Settled product constraint from the contributor handoff |

## Settled requirements

| Req | Requirement | Status |
|---|---|---|
| R0 | A locally launched Chromium session on Linux can trust certificates issued by one user-supplied private CA without disabling ordinary verification. | Core goal |
| R1 | A correct-hostname leaf signed by the selected CA is accepted even when the server omits the CA from the presented chain. | Must-have |
| R2 | A wrong-hostname leaf remains rejected. | Must-have |
| R3 | A leaf signed by an unrelated CA remains rejected. | Must-have |
| R4 | Expired and not-yet-valid leaves remain rejected. | Must-have |
| R5 | A run without CA configuration retains current behavior. | Must-have |
| R6 | Trust material and process state are isolated between concurrent sessions using different CAs. | Must-have |
| R7 | A missing or failing external prerequisite produces an actionable error before Chromium launches and does not leak created state. | Must-have |
| R8 | Normal close, browser crash, daemon shutdown, and unrecoverable termination have an explicit, observable lifecycle and cleanup contract. | Must-have |
| R9 | After `open` sets a CA, a later `snapshot` that omits the option preserves the effective CA, daemon PID, browser target, URL, trust, and page state. | Must-have |
| R10 | Repeating the same effective CA reuses the live session. | Must-have |
| R11 | Selecting a different CA changes effective trust deliberately and replaces the browser safely. | Must-have |
| R12 | Removing a previously effective CA requires an explicit clear representation, removes trust deliberately, and replaces the browser safely. | Must-have |
| R13 | `--ignore-https-errors` remains a separate explicit bypass and is not silently combined with selective CA trust. | Must-have |
| R14 | Remote CDP, auto-connect, providers, non-Chromium engines, profiles, and unsupported operating systems either preserve their current behavior or reject the new option clearly before partial work. | Must-have |
| R15 | The CLI flag, environment variable, config field, MCP surface, help, README, docs, schemas, core skill, and tests describe one consistent contract. | Must-have |
| R16 | The CLI's own outbound TLS trust is outside this change and remains a separate connection boundary. | Must-not-change |
| R17 | Existing sessions without the new option and unrelated launch configuration continue to reuse or relaunch under their current contracts. | Must-not-change |
| R18 | The design preserves useful contributor work and attribution when compatible with the selected contract. | Must-have |

## Unknowns

| ID | Question | Status |
|---|---|---|
| U1 | Which Linux Chromium trust integration gives a per-session trust anchor without changing global user state? | Investigate |
| U2 | Which component should own effective CA state so omission, repetition, change, and explicit clear are distinguishable across invocations? | Investigate |
| U3 | What exact syntax should represent explicit clear across CLI, config, environment, and MCP without creating ambiguous omission semantics? | Investigate |
| U4 | What prerequisite and cleanup behavior can be proven before and after process launch? | Investigate |
| U5 | Which existing launch modes cannot safely support the feature in the first implementation? | Investigate |

## Temporal transition contract

| State | Scope and owner | Initial default | `unset → set` | `set → omitted` | `set → same` | `set → changed` | `set → explicit clear` | Reuse, restart, or migrate | Continuity observables |
|---|---|---|---|---|---|---|---|---|---|
| Effective browser CA trust | One named `agent-browser` session; owner must be selected by the shape | No additional private CA | Validate and establish trust before navigation | Keep prior effective CA | Keep prior effective CA | Validate replacement, then replace browser safely | Remove prior effective CA, then replace browser safely | Set may launch; omitted and same reuse; changed and clear replace | Daemon PID, browser target, URL, page state, trust result, effective CA identity |

## Mandatory discriminator matrix

| Case | Required result |
|---|---|
| Selected CA, separately keyed leaf, correct hostname, CA omitted from served chain | Accept |
| Selected CA, wrong hostname | Reject |
| Unrelated CA | Reject |
| Expired leaf | Reject |
| Not-yet-valid leaf | Reject |
| No CA configured | Existing behavior |
| Two concurrent sessions with different CAs | Both work and remain isolated |
| Required prerequisite absent | Actionable pre-launch error, no leaked state |
| Required prerequisite fails | Actionable pre-launch error, no leaked state |
| Normal close | Declared cleanup result observed |
| Browser crash | Declared cleanup result observed |
| Daemon graceful termination | Declared cleanup result observed |
| Daemon unrecoverable termination | Declared residual-state behavior observed and bounded |
| `open` with CA, then `snapshot` omitting option | Same daemon, target, URL, page, and trust |
| Same CA repeated | Reuse |
| Different CA selected | Deliberate safe replacement |
| Explicit clear | Deliberate safe replacement without private CA trust |

## Reviewer output contract

Use the Shaping methodology. Produce:

1. The complete R table, preserving settled requirements and labelling any additions as derived or undecided.
2. Materially distinct shapes with mechanism parts and flagged unknowns.
3. A binary R × Shape fit check with failure notes.
4. A recommended survivor, rejected alternatives, and required spikes.
5. No breadboard, slicing, candidate inspection, or implementation.
