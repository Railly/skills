# Frozen problem packet: isolated shared-browser credentials

Mode: greenfield correction of a reproduced defect on existing baseline, high-risk. No corrective candidate exists. The original isolation feature is baseline, not a candidate to reconstruct or approve. Reviewers receive identical source archives without Git history, branch names, reviews, prior solution artifacts, or each other's output.

## Frame
An agent session sharing a browser must keep its credentials and network policy within its owned BrowserContexts. Another session's pages must remain independently usable. The concrete observed violation is authentication of a default-context page using an isolated agent's credentials.

## Settled requirements
R0: In isolation mode, no configured credential may reach targets outside agent-owned BrowserContexts (specified task and observed P1).
R1: Foreign pages/targets continue execution and navigation without being left debugger-paused by the agent (specified task).
R2: The agent's owned pages continue authenticating and applying configured network controls, including newly created targets and relevant descendants (must-not-change).
R3: Omission of isolation configuration during ordinary follow-up commands preserves effective isolation, target, URL and page state (must-not-change; observed P1).
R4: Closing an isolated agent must leave the shared browser and foreign contexts alive (must-not-change; baseline isolated close contract).
R5: Non-isolated mode, direct-page connections, recorder sessions, and owned recorder contexts preserve their supported behavior (must-not-change; source needs inspection).
R6: Isolation applies to all existing consumers of per-agent request policy, including route/header/domain decisions, not just the reported credential case (derived from desired property; verify scope against source).

## Evidence
P1: repro-resumed-before.log, script repro.py, baseline HEAD f5b28b3b9a190ecaeade8df75f37a17d4b4eefb5. CLI host opens an ephemeral browser; isolated agent connects using browser CDP URL with dummy credentials alice:secret from launch environment. Agent navigates /auth/owned, which authenticates (200). Host creates /foreign-ready; after agent follow-up and 1 second host navigates /auth/foreign. Server observes Basic YWxpY2U6c2VjcmV0 on that foreign request (200). Agent eval window.continuity returns 1683 before and after; target and URL unchanged. Host ordinary navigation works. Both sessions close. These are test credentials only.
P0: earlier immediate new-tab navigation did not leak. This is not evidence of safety: a settled target then navigation reproduces P1. set credentials uses another path and did not activate the reported path.
Source handles: cli/src/native/browser.rs owns_target and isolated_context_id define existing ownership; enable_browser_auto_attach_pub and prepare_domains define attachment behavior; cli/src/native/actions.rs start_fetch_handler and install_network_controls* define request handling; cli/tests/isolate_context_cli.rs and cli/src/native/e2e_tests.rs define existing continuity/close/recording behavior. Source is baseline code, not a proposed fix.

## Temporal contract
| State | Scope/owner | Default | unset to set | set to omitted | set to same | set to changed | explicit clear | reuse/restart | observable |
|---|---|---|---|---|---|---|---|---|---|
| Isolation | daemon session and remote owned context | shared | create/select isolated context | preserve | preserve | context identity changed only by supported lifecycle | explicit close resets current session; no new clearing syntax | reconnect reuses persisted context if alive, recreate if gone | target, URL, page JS state; context identity |
| Credentials | daemon request policy, owned context targets | none | configured at launch | ordinary command preserves effective state | preserves | existing credential setter behavior is baseline; launch-option change semantics need source spike | setter/close behavior needs source spike, do not invent CLI syntax | no additional restart due to this fix | owned auth succeeds, foreign sees no secret |
| Owned-context membership | browser manager, includes temporary recorder contexts | primary on isolated connect | registration adds owned context | preserve | preserve | unregister removes authority | teardown removes owned context | no stale authority across reconnect | policy behavior in recorder/foreign targets |
| Target session attachment | CDP connection generation | no attached session | discovered/attached target gets policy only if owned | same workflow maintains authority | duplicate attachments must not bypass ownership | detach/re-attach must not retain stale authority | detach/close invalidates | connection replacement invalidates old associations | network results and foreign liveness |

## Unknowns / required spikes
Protocol availability of server-side context attachment filters; BrowserContext metadata completeness on worker/iframe and missing metadata events; lifecycle updates visible to background handlers; races and duplicate attachment/recording behavior; transient detach/resume errors; credential explicit-clear syntax. Unresolved facts are not settled requirements.

## Output request
Apply SHAPING.md. Produce complete R table with settled/derived/undecided status, materially distinct shapes and mechanism parts, flags, binary R x Shape fit check with failure notes, recommended survivor and required spikes. Include discriminator matrix and ownership/lifetime rules. Do not implement, breadboard, or slice yet. Read only this working directory. Cite inspected baseline source lines; label observations/inferences/unknowns honestly. Return your full artifact in final output, no file writes.
