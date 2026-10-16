# Shape C: bounded Browser Use ownership with a recovery receipt

C composes the existing-state ownership of both blind A proposals with OpenAI A4's receipt-before-attach. This is a new checked shape, not an unexamined graft.

## Probe return and corrections
P0: frozen official V4 schema has POST /browsers, PATCH /browsers/{session_id}, UUID IDs, nullable cdpUrl, status active/stopped and a 200 BrowserSessionView stop response. Source URL and candidate-independent official document are provider-openapi.json. Correct Claude A1's v2 endpoint to the V4 API base; legacy v2 strings in descriptive schema prose do not change the V4 endpoint. Fields profileId, proxyCountryCode (nullable), enableRecording are specified. OpenAI R5/R6 flags are resolved by this supplied schema, which was inadvertently absent from its second prompt, and UUID validation.
P1: installed reqwest 0.12 exposes a request deadline covering response-body consumption. Source command/output recorded in source-probes-and-candidate-reveal.json. Existing CDP client can wait 30s per command, so request timeouts alone fail R8: use a Browser Use-only attachment deadline too.
P2: no authoritative 404-as-stopped guarantee. Treat 404 as failure. A successful HTTP response alone is an insufficient acknowledgment: validate returned id and status=stopped. No hosted billing claim is made.
P3: callsite sweep identifies auto and explicit attach rollback, restore-key close, auto relaunch, explicit relaunch and all daemon close paths. External BrowserManager::close at browser.rs:1278 does not send Browser.close or await a provider request. Therefore provider cleanup can be bounded without rewriting local/browser manager shutdown.
P4: detached daemon stderr is invisible. Claude A5 writing only at failed shutdown creates a late filesystem failure boundary. Use a receipt written before attachment; no automatic stop replay or startup reconciler. A documented file is the operator handoff on silent shutdown. Failed write is handled immediately by bounded stop plus direct actionable failure.

## Parts
| Part | Mechanism |
|---|---|
| C1 | Keep the candidate V4 HTTP creation, aliases and environment mapping. Browser Use requests disable redirects and use a 10s full create/read deadline and 4s stop deadline. Never automatically replay create. Transport/read/invalid no-ID outcomes state that Cloud may have allocated a browser and require inspection before retry. |
| C2 | Validate UUID resource ID, create a per-resource recovery receipt under the socket directory before attaching. It contains provider, validated ID and fixed manual stop guidance only, with no API key/CDP URL/server body. Receipt storage is preflighted before allocation. Known-ID parse or receipt failure attempts bounded rollback and returns ID on unresolved cleanup. |
| C3 | Browser Use stop returns Result and validates 2xx + matching UUID + stopped status. Error, body stall, missing key, malformed/contradictory response and 404 retain ownership/receipt. Other provider/plugin cleanup behavior remains unchanged. Remove the receipt only after acknowledgment; stale file removal failure cannot be misreported as remote stop failure. |
| C4 | Keep active provider session until successful stop. Both attach paths remember ownership before their Browser Use-only 8s CDP attachment. Failed attach calls retained-state cleanup and combines safe errors. Relaunch and restore paths propagate Browser Use cleanup failure before replacement; existing non-Browser-Use behavior remains intact. |
| C5 | Use existing close functions for explicit, internal, idle and signal shutdown. On stop failure the receipt remains retrievable after exit. No persistence-driven retries, new process, queue, session settings, or launch hash semantics. |
| C6 | New Browser Use errors contain fixed categories, numeric HTTP status and validated ID only. Never forward response bodies or raw CDP/transport errors. Document deadlines, close retry, unknown-create inspection and recovery receipt paths on all required documentation surfaces. MCP delegates to the same close result and retains error parity. |

## Full binary fit check
| R | C | Mechanism |
|---|---|---|
| R0 | ✅ | C1/C3/C4 bound provider lifecycle I/O and release existing lock |
| R1 | ✅ | C2/C3/C4 preserve identity, error truthful, receipt/direct recovery |
| R2 | ✅ | C5 leaves effective configuration and target reuse unchanged |
| R3 | ✅ | C2 receipt precedes attach; C4 caller sweep; C5 shutdown |
| R4 | ✅ | C3 preserves non-Browser-Use outcome behavior; C4 conditionally propagates only new errors |
| R5 | ✅ | C1 retains candidate-independent specified fields and aliases |
| R6 | ✅ | UUID identity, no remote body/URL interpolation, C6 |
| R7 | ✅ | C5 has no automatic durable retries or forced-death guarantee |
| R8 | ✅ | previous stop4 + create10 + attach8 + rollback4 = 26s; ordinary existing browser liveness max3 gives 29s. Existing optional page/restore operations retain their own user-facing timeouts; no new whole-command deadline is promised. |
| R9 | ✅ | C1 performs one create, terminal classified error prevents CLI transport retry |
| R10 | ✅ | C2/C4 handle known-ID malformed response/attach error and block replacement |
| R11 | ✅ | C5 preserves current omission semantics |

## Forward risk chains and verification targets
1. C1 request deadline (source-supported) → task resolves and releases daemon mutex (inferred from caller) → concurrent close/idle regain progress (to execute on fixed binary). Harm: too short provisioning budget rejects slow Cloud; accepted 10s limit, live latency unverified, truthfully reported.
2. C3 result plus C4 retention (mechanism) → failed stop preserves same UUID (to test) → close retry targets same browser, relaunch cannot overwrite it (to test at execute_command). Harm: expired/404 session blocks automatic replacement; accepted conservative operator recovery, no false acknowledgment.
3. C2 pre-attach receipt (mechanism) → shutdown failure has previously saved identity (to test) → manual Cloud stop possible despite lost stderr (inferred from API contract). Harm: stale receipts after removal failure and storage outage; remove only on ack, no automatic replay, test write failure and secret exclusion.
4. C5 unchanged launch identity (observed source scope) → omitted flags reuse manager (to drive) → same target/URL/DOM persists (real Chrome proof owed). Harm: accidental pending-state guard catches active sessions; test plain second command explicitly.

## Failure catalog
| Case | Disposition |
|---|---|
| S1 overreach | Designed out: Browser Use-only deadlines/errors; no scheduler, other-provider cleanup or hash rewrite. |
| S2 underreach | CONNECT/header/body, both attach callers, failed stop retry/relaunch, nullable endpoint and shutdown included. |
| S3 direction | Both acquisition failure and stop failure retain accounting; start after failed stop blocked. |
| S4 proxy property | Require matching ID and stopped response, not merely HTTP success. |
| S5 unregistered state | Receipt is independent manual recovery artifact, created before attachment, removed on ack, documented intentional retention. |
| S6 peer versions | No new CLI/daemon wire requirement, automatic receipt reader or mixed-version retry protocol. |
| S7 delivery | Direct error for commands; prewritten receipt for invisible shutdown, not stderr. |
| S8 guard-derived tests | Matrix came from independent contract/spec before shape. |
| S9 weak tests | Mutate timeout, acknowledgment, retention and launch guard; require intended assertions. |
| S10 prose | Local wire plus real Chrome proof owed; hosted profile/recording/billing explicitly unverified. |
| S11 asymmetric authority | UUID validation before stop URL and file path; no raw hostile ID authority. |
| S12 wrong primitive | Explicit stop acknowledgment, not CDP disconnect; full request deadline, not socket read retry. |
| S13 omission | Existing effective settings untouched; multi-invocation continuity proof required. |

## Candidate reveal and verdict
Candidate da4c99f implements V4 creation, option mapping, ownership return and lifecycle integration. Reuse that work. Its unbounded create and swallowed stop fail D0/D1; missing endpoint loses known ID. Existing tests cover mapping but do not discriminate these lifecycle errors. Reviewed probes independently established both failures. The selected C shape amends those gaps without recreating the contributor's work.

**Pass to detail. Candidate disposition: Amend.** Preserve all four original contributor commits; add signed fix commit with Co-authored-by: Magnus Müller <mamagnus00@gmail.com>. No merge/release. This is architectural permission to implement and probe, not a final correctness pass.

Carried limits: no live Browser Use credential; hosted latency, repeated-stop implementation, billing, actual profile persistence and recording remain unverified. Mock schema conformance cannot erase these. Exact fixed-tree Test Strength, Resilience and built-artifact proof are mandatory downstream; not claimed here.

## Detailing / breadboard / slice
Single independently reviewable fix slice: provider create/stop/receipt methods → active provider state → both attachment callers → close and replacement transitions → existing CLI/MCP response mapping. Document recovery alongside provider usage.
Validation before promotion: Cargo fmt/clippy/full serial suite; local HTTP response matrix with real bytes; execute_command failed close/retry/relaunch; real Chrome same-session continuity and external browser survival; built CLI stalled proxy and finite close; independent reduction/hardening and mutation pass. Complexity threshold: no new daemon worker, dependencies, generic lifecycle framework, or automatic recovery subsystem; at most one small provider helper module and bounded conditionals at existing ownership sites.
