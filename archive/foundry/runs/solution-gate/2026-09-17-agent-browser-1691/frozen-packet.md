# Frozen problem packet

## Frame
An automation CLI connects to provider-owned remote browsers. A provider request that stalls can prevent the session daemon from processing commands or cleanup. A failed stop can be reported as successful while losing the information needed to stop the remote browser. Restore truthful, bounded lifecycle behavior without disrupting ordinary browser workflows.

## Settled requirements
R0 (settled, core): Provider setup or cleanup failures must produce finite, truthful command outcomes and must not permanently block the session daemon.
R1 (settled, must-have): A known owned browser must not be forgotten as successfully stopped until stop is acknowledged, or explicit actionable recovery information has been returned to the operator.
R2 (settled, must-have): Commands can reuse one remote browser across invocations. An ordinary command with omitted provider settings must preserve that browser, target and page state.
R3 (settled, must-have): Failed attachment after successful provisioning, explicit close, relaunch and orderly daemon shutdown all account for owned provider resources.
R4 (settled, must-have): Preserve existing local browser, user-attached CDP browser, other provider and plugin workflows. A user-attached browser is not owned and must not be remotely stopped.
R5 (settled, must-have): Preserve documented provider aliases, required API credential behavior, and supported profile/proxy/recording settings.
R6 (settled, must-have): Credential values must not enter errors, persisted recovery files or review artifacts.
R7 (derived, undecided): Whether recovery across forced daemon death must be automatic/durable, or bounded best-effort plus explicit session-ID/operator recovery is sufficient. Do not invent a background platform to resolve this.

## Evidence and constraints
- Observed: with a dummy credential and loopback HTTP CONNECT proxy that accepts but never answers, an actual built CLI open remained blocked past 36 seconds; concurrent close past 5 seconds; daemon remained alive despite explicit 1-second idle configuration. Closing the proxy allowed recovery. Source E1: observed-failures.json, transport case.
- Observed: a caller-level fixture seeded an owned remote session then forced stop transport failure. Two production close calls returned success, session information was lost, and only one stop attempt reached the proxy. Source E2: observed-failures.json, cleanup case.
- Specified: official provider API creates a browser and returns id/cdpUrl; CDP disconnect does not itself stop the cloud browser or billing; explicit stop is required. Wire schema in provider-openapi.json.
- Specified: creation is not assumed idempotent; if no resource identifier is received, remote outcome may be unknown. Never blindly replay a non-idempotent create after ambiguity.
- Base-source: daemon.rs holds session state lock around execute_command; shutdown and idle paths take the same lock. CLI socket read timeout is 30 seconds minimum with transient retry. Read the base source for exact mechanisms.
- Base-source: ProviderSession and provider lifecycle already exist for multiple providers. Scope any shared change against all current callers, not just one branch.

## Temporal contract
| State | Owner/lifetime | Default | unset → set | set → omitted | same | changed | explicit clear | restart/reuse | continuity oracle |
|---|---|---|---|---|---|---|---|---|---|
| Provider-owned session | daemon for ongoing workflow | none | acquire ownership after remote allocation | retain ownership | reuse while existing contract permits | current explicit relaunch semantics | close stops or surfaces recovery | preserve current reuse; forced-death recovery undecided | session ID, target, URL and page state |
| User-attached CDP browser | external owner | unattached | attach without taking ownership | keep attachment | reuse | current reconnect semantics | detach only | no remote stop | browser process and target remain alive |
| Provider profile/proxy/recording environment | launching operator and daemon environment | API-defined defaults | apply on creation | existing running session unchanged | unchanged workflow | no new mid-session config behavior in scope | existing stop/new session behavior | do not infer clear from omission | same remote browser on subsequent plain commands |
| Failed owned stop | cleanup owner | no pending stop | retain enough recovery identity | preserve pending identity | retry same stop safely | block replacing unknown live ownership unless explicitly accounted | acknowledged stop clears | restart rules require explicit shape | visible error/recovery info and subsequent stop attempt |

## Unknowns
No live provider credential is available. Mock wire behavior can follow the normative API schema and use real local Chrome as CDP producer. Establish which facts require the actual hosted service and keep them as limits. Timeout budget should cover full request response and fit the caller lifecycle budget, but no exact new deadline is settled. HTTP 404 stop semantics and idempotency need explicit evidence. Preserve the distinction between recovering a known ID and an ambiguous create with no ID.

## Assignment, first pass only
Read the included Shaping skill. Reconstruct the complete requirements table and a discriminator matrix from this frozen packet and clean base snapshot. Do not design solutions yet. Label requirements settled, derived, or undecided. Identify irreducible product ambiguities and the minimum independent evidence needed. Output one Markdown artifact as your final response, no file edits, network calls, git history exploration outside the base, or subagents. Candidate code and other reviewers are intentionally unavailable.
