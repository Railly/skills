# Updated native Shaping verdict — Composite C

**Candidate disposition: Amend.** Retain the V4 repair and selected ownership/receipt architecture.

**Full fit: NO. R8’s ✅ is not justified by the shaped mechanism.** C is not yet passed to detail. The remaining issue is the lifecycle budget boundary—not the absence of implementation tests or hosted credentials.

## C parts

| Part | Selected mechanism |
|---|---|
| **C1 — Bounded V4 acquisition** | Preserve Browser Use aliases, credentials and existing environment-to-option mapping. Use the V4 API base, disable redirects, and impose a **10s create deadline through response-body consumption**. Perform one create attempt; never automatically replay an ambiguous allocation. Unknown/no-valid-ID outcomes use fixed inspection-before-retry guidance. |
| **C2 — Identity and recovery receipt** | Validate and canonicalize the resource UUID before using it in a stop URL or receipt filename. Preflight receipt storage before allocation; write the per-resource receipt before attachment. Store only provider, validated identity and fixed manual-stop instructions. A known-ID setup or receipt failure attempts bounded rollback; unresolved cleanup returns actionable identity. Receipt preflight does not eliminate the possibility of a later write failure. |
| **C3 — Acknowledged stop** | Browser Use stop returns `Result` and has a **4s full request/body deadline**. Send the explicit stop action. Clear ownership only after a successful response containing the matching UUID and `status: stopped`; the official response is **200 BrowserSessionView**. HTTP success without that acknowledgment, 404, missing credentials, malformed bodies, disconnects and timeouts are failures. Retain ownership and receipt on failure. Receipt-removal failure after acknowledgment is a local artifact problem, not a remote-stop failure. Preserve other providers’ cleanup behavior. |
| **C4 — Retained lifecycle ownership** | Register Browser Use ownership before either attachment path. Apply a Browser Use-only **8s attachment deadline**. Failed attachment uses retained-state cleanup and safe combined errors. Failed Browser Use cleanup must prevent replacement in automatic relaunch, explicit relaunch and restore-key transitions. Distinguish pending cleanup from a healthy active session so ordinary reuse remains unchanged. **The boundary between attachment and setup-required page/restore work remains unresolved below.** |
| **C5 — Shutdown and compatibility** | Route explicit, internal, idle and signal cleanup through the existing close functions. The prewritten receipt is the operator handoff when detached-daemon errors are invisible. No automatic receipt replay, startup reconciler, worker, queue, launch-hash change or forced-death guarantee. Local/external CDP and other providers retain their current ownership rules. |
| **C6 — Safe delivery** | New Browser Use failures expose fixed categories/instructions, numeric HTTP status and validated identity—not response bodies, keys, credential-bearing URLs or raw transport/CDP errors. Document deadlines, retrying close, unknown-allocation inspection, and receipt location/retention on the required usage surfaces. CLI and MCP must expose the same close failure. |

## Official-schema corrections

- Use `POST /api/v4/browsers` and `PATCH /api/v4/browsers/{session_id}`. Legacy v2 references in descriptive prose do not select the endpoint.
- Creation is documented as **201 BrowserSessionItemView**. Resource IDs are UUIDs; `cdpUrl` may be absent or null. A valid ID must therefore be recovered independently of endpoint usability.
- `profileId` is UUID-or-null; `proxyCountryCode` is an enumerated country-or-null; `enableRecording` is boolean. Existing mapping remains reusable, but `profile-123` and `browser-123` are **not schema-conforming success fixtures**. Replace them with valid UUIDs and add invalid-ID cases.
- Stop is explicit provider lifecycle control, not CDP disconnection. Neither the schema nor the supplied probes establish 404-as-stopped or hosted repeated-stop behavior.

## Full binary fit

These cells assess **architectural fit**, not implemented correctness.

| R | Fit | Basis |
|---|---|---|
| **R0** | ✅ | C1/C3/C4 provide finite provider create/read/attach/stop waits; no scheduler redesign or immediate preemption is required. |
| **R1** | ✅ | C2–C5 retain known identity or provide actionable recovery; unsuccessful stop cannot become success. |
| **R2** | ✅ | C4/C5 preserve ordinary active-session reuse and existing effective configuration. Continuity proof remains owed. |
| **R3** | ✅ | C2/C4/C5 cover failed acquisition, both attach paths, replacement transitions and orderly shutdown. |
| **R4** | ✅ | New error propagation and deadlines are Browser Use-specific. External CDP remains detach-only. |
| **R5** | ✅ | C1 preserves aliases, credentials and supported V4 options; schema-correct fixtures are required. |
| **R6** | ✅ | Validated UUID authority plus fixed error/receipt content excludes raw hostile IDs and echoed secrets. |
| **R7** | ✅ | C5 limits the repair to bounded orderly cleanup and operator recovery. |
| **R8** | **❌** | The stated 26s/29s sum does not account for the complete lifecycle response path. Receipt work and any setup-required work outside the 8s attachment boundary have no allocated budget. Retaining separate page/restore timeouts does not establish composition within 30s. |
| **R9** | ✅ | C1/C6 select one create and a terminal application-level failure, including Cloud inspection guidance for unknown outcomes. Wire-level replay discrimination remains owed. |
| **R10** | ✅ | Known-ID unusable endpoints trigger cleanup/recovery; failed active stop retains the same UUID and blocks replacement. |
| **R11** | ✅ | C4/C5 leave omission, same-value, changed-value and explicit-clear semantics untouched. |

## Unresolved shaping flag

### F1 — Close the lifecycle budget, without inventing a whole-command deadline

The current arithmetic reserves:

`previous stop 4s + create/read 10s + attach 8s + rollback 4s + liveness 3s = 29s`

That is not a complete bound merely because it is below 30s. It leaves receipt operations and response overhead unallocated, and expressly excludes page/restore operations without distinguishing **user-requested work** from **setup needed to finish acquisition**.

**Required correction before pass-to-detail:**

1. Specify the lifecycle boundary for both attachment callers and replacement/restore paths.
2. Put all setup-required CDP initialization inside the attachment allowance, or assign it a separate allowance and reduce other allowances accordingly.
3. Allocate receipt/preflight work and response margin. Any deadline applied after allocation must preserve ownership and leave time for bounded rollback; cancellation must not drop the only known ID.
4. Publish a complete worst-path total strictly below the normal 30s response budget. Independent user-requested navigation/page work may retain its existing timeout; setup cannot be relabeled as user work to escape the accounting.

This is a missing architectural allocation, not a demand to execute tests during Shaping.

## Downstream evidence and carried limits

Once F1 is closed, detail the single provider→ownership→attachment→close/replacement→CLI/MCP slice. Implementation evidence remains mandatory: real-byte HTTP stall/acknowledgment cases; same-ID close retry and replacement blocking through `execute_command`; silent-shutdown receipt retrieval and write failure; secret exclusion; real Chrome continuity and external-browser survival; built-CLI finite outcomes; full fixed-tree checks and discriminating mutations.

The source probes support feasibility, including reqwest’s full request timeout. They do not prove the fixed implementation.

**No hosted behavior is claimed.** Hosted latency, repeated-stop behavior, billing/refunds, profile persistence and recording remain carried verification limits.

**Final verdict: C retained; candidate Amend; R8 unresolved; no pass-to-detail yet.**