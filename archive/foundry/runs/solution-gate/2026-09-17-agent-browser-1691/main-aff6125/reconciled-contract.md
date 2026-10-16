# Reconciled contract

Scope: amend the Browser Use V4 repair. Preserve all other providers' public behavior. This reconciles claude-contract.md and openai-contract.md before any proposals are revealed.

| R | Status | Observable requirement |
|---|---|---|
| R0 | settled | Browser Use create/read/attach/stop is finite, returns truthful failures, and releases the existing serialized daemon so commands and shutdown regain progress. Immediate preemption is not required. |
| R1 | settled | A known owned browser is retained until acknowledged stop, or explicit actionable provider/ID recovery information reaches the operator. Stop failure must not report success. |
| R2 | settled | Plain subsequent commands with omitted provider options preserve the same browser, target, URL and DOM state. |
| R3 | settled | Failed setup after allocation, explicit close, auto/explicit relaunch, restore-key changes, internal shutdown, idle and signal shutdown account for the Browser Use resource. |
| R4 | settled | Local and external CDP browsers, other built-in providers and plugins keep their existing ownership, behavior and options. External browsers are detached without remote stop. |
| R5 | settled | Browser Use aliases, required credentials and V4 profile/proxy/recording options remain supported. |
| R6 | settled | Keys, token URLs and echoed secrets never enter new errors or recovery artifacts. Recovery records must contain only validated resource identity and safe instructions. |
| R7 | scoped | This repair does not introduce automatic durable retries or guarantee cleanup after forced death. Bounded orderly cleanup plus operator recovery is sufficient. |
| R8 | derived accepted | Compose create, attachment and rollback deadlines inside the normal 30-second minimum CLI response budget, with margin. A response-body stall must be bounded. |
| R9 | settled | Do not automatically replay a non-idempotent create after unknown remote outcome. Clearly direct operator to inspect Cloud if no ID was received. |
| R10 | derived accepted | Missing/null/unusable cdpUrl after a known ID requires cleanup or actionable recovery. Failed active stop remains retryable with the same ID; new launch cannot overwrite pending ownership. |
| R11 | derived accepted | Preserve omission/same/changed/explicit-clear semantics. No new setting equality or relaunch behavior is introduced. |

## Reconciliation decisions and evidence
Claude's R0.2 could imply immediate nonblocking concurrency; OpenAI explicitly distinguished idle timeout from an in-flight deadline. Adopt the frozen packet's finite-outcome promise, not a scheduler redesign. Exact bounded waits are implementation choices within R8. An unacknowledged close is an error, consistent with R0 truthfulness and existing Result-based close callers. Scope is Browser Use; other provider lifecycle debts are compatibility constraints, not new repair targets. No promise of forced-death recovery exists in this PR repair, so R7 excludes automatic persistence/retry. Mechanisms for operator handoff are still to be shaped.

Source probe: connection.rs:889/910 pipes daemon stderr and returns at readiness, dropping the pipe. daemon.rs:333/350 discards shutdown cleanup errors. Therefore eprintln alone is not a visible recovery mechanism. Source probe: automatic relaunch and restore-key transitions discard close errors; explicit relaunch already propagates them. All must be considered if error contracts change.

## Discriminator matrix
| D | Cases | Required observation |
|---|---|---|
| D0 | CONNECT/header/body stalls; stalled CDP; concurrent close; idle/signal | finite error and restored daemon progress; full composite within budget |
| D1 | stop 2xx acknowledgment, 4xx including 404, 5xx, missing key, disconnect, timeout | only actual acknowledgment clears ID; failed close errors; same-ID retry reaches wire |
| D2 | open, set DOM sentinel, plain next command, close | same remote session/target/URL/state across invocations; one create, one stop |
| D3 | create with ID but invalid endpoint; attach failure; stop failure; relaunch/restore/internal shutdown | ownership retained or operator recovery provided, no replacement create while pending |
| D4 | idle and signal while stop fails | user-retrievable ID survives loss of daemon, not invisible stderr alone |
| D5 | other provider/plugin/local/external CDP paths | preserve existing contract and avoid remote stop of unowned browser |
| D6 | aliases/options plus hostile echoed body/credential-bearing endpoint | compatible request fields; no credential in errors/artifacts |
| D7 | ambiguous create with no ID | error says outcome unknown; one create attempt per command, no transport-triggered blind replay |

HTTP 404 is not assumed successful stop. Stop is an explicit requested terminal state, but hosted repeated-stop/billing semantics remain unverified. Tests can prove client conformance to the official schema; they cannot prove Cloud billing/profile/recording effects without a live key. No live Browser Use credential is available. These are carried evidence limits, not invented guarantees.
