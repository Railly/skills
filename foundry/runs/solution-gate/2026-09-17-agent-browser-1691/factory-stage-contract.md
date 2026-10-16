# Factory stage contract (before source changes)

Implement: isolated Claude CLI context, owns fix worktree source/docs/tests. Run Cargo fmt, full serial suite and clippy; no commit/push. Parent owns external evidence and acceptance. No new runtime worker, queue, dependencies, automatic durable retry or setting hash behavior; at most one provider helper module. Reduction measures diff size and duplicated lifecycle logic rather than optimizing to an arbitrary LOC total.

Reduce: independent OpenAI direct Gateway pass over exact final diff and contract, no implementer reasoning. Identify removable ceremony/repeated mechanisms while preserving tests. Any change returns to validation.

Harden: parent separate pass reads final source as an independent implementer context, uses Resilience Audit matrix below. Execute one forced fault at a time. Receipt remains incomplete for any unexecuted required fault.

Strengthen: use final hardened source. Introduce reversible faults in isolated clone/worktree, run narrow tests, observe intended assertion failure, restore and run green. Required faults: absent create deadline, HTTP-only stop acknowledgment, discard pending ownership, bypass pending relaunch failure, lose known-ID cleanup. Report unexercised wiring separately from adapter coverage. Deterministic generated UUID/status/nullable/hostile body cells exercise parser boundaries.

Prove: built CLI CONNECT stall plus concurrent close and idle recovery, real local Chrome continuity and external CDP survival. Provider HTTP adapter exercises real localhost bytes according to saved official V4 schema. Live Cloud effects unavailable without BROWSER_USE_API_KEY; this never becomes a hosted pass.

## Behavioral dimensions and pressure matrix
| Boundary | Dimensions | Oracle / expected transition |
|---|---|---|
| Create HTTP | refused, CONNECT stall, header stall, truncated or delayed body, non2xx, invalid JSON, UUID id absent/invalid/valid, cdpUrl absent/null/empty/non-ws/valid | no automatic replay; finite error; no-ID outcome unknown; known ID recorded before any later fallible stage |
| Stop HTTP | missing key, timeout, transport error, 200 stopped matching id, 200 active, wrong id, malformed body, 204, 404, 429, 500 | only matching stopped acknowledgment releases ownership and receipt; failures actionable, one request per attempt |
| Ownership | none, active attached, allocated unattached, cleanup pending; action close/retry/auto-launch/explicit-launch/restore/internal-shutdown | no false success, same pending ID survives failed stop, no replacing unresolved session; owned resource accounted on every exit |
| Filesystem | directory preflight fails, post-create write fails, acknowledgment removal fails | no create before failed preflight; known-ID rollback on postcreate failure; removal failure cannot relabel acknowledged remote stop as failure |
| Lifecycle | ordinary command omitted options, same settings, changed settings, explicit close, idle, signal | normal commands keep browser/target/URL/DOM; detached external CDP browser survives; failed shutdown preserves operator-visible receipt |
| Secrets | key-like server body/id/endpoint; URL query, JSON fields | validate UUID for storage/path; fixed safe errors, no raw body/URL/key |
| Compatibility | aliases, profile/proxy/recording values; local/attached/other provider/plugin | existing options and non-Browser-Use ownership unchanged |

Stop semantics oracle: official V4 OpenAPI, status enum active/stopped and UUID resource id. Synthetic service only models those bytes. Chrome is the real CDP producer. No assumption that 404 acknowledges billing cessation. No blind replays of create; operator retry after inspecting Cloud is a new explicit action.
