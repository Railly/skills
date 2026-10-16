# Reconciled contract, before any shape or candidate reveal

Base aff6125. Inputs: frozen-input.md plus independent contract-a.md and contract-b.md. Neither reviewer received a candidate. This contract supersedes their proposed additions where noted below.

| R | Requirement | Status |
|---|---|---|
| R0 | Log-output volume must not backpressure a managed Chrome launch before readiness or prevent commands after readiness | Settled core goal; A R0/R8 and B R0/R8 |
| R1 | Preserve DevToolsActivePort as primary readiness and the existing DevTools listening on stderr detection/fallback semantics; do not silently remove either | Settled must-have; current end-to-end stderr-only behavior still needs measurement |
| R2 | Failed startup preserves process status and useful bounded Chrome diagnostics; exact unlimited output is not promised | Settled must-have; preserve useful error/sandbox hints, explicitly account for truncation |
| R3 | Ordinary same-session commands retain PID, target, URL and application state; no new restart/clear semantics from omitted flags | Settled must-have |
| R4 | Logging handling has finite byte/storage and per-launch thread/descriptor costs; does not block lifecycle completion on an inherited writer staying open | Settled must-have plus derived resource discriminator |
| R5 | stdout/JSON schema remains clean; no default forwarding of unlimited browser logs to terminal or durable global storage | Settled must-have; not literal byte equality of nondeterministic IDs |
| R6 | Preserve owned-vs-attached distinction, group/Job Object and profile cleanup, existing retry and idle policy | Settled must-have |
| R7 | Scope is Chrome output/readiness, not original CPU spin, ffmpeg, Lightpanda, providers, general CDP timeout redesign or a new reaper | Settled must-have |
| R8 | Arbitrary chunks, long/no-newline diagnostics and invalid bytes do not cause the consumer to stop servicing output or grow without bound | Derived from R0/R4; diagnostic presentation may be lossy if explicit |
| R9 | Any new output wait/cleanup path respects the existing attempt deadline without waiting indefinitely for a line or EOF | Derived; do not broaden to unrelated Browser.close deadlines |
| R10 | Output handling follows browser/attempt lifetime, not a temporary Tokio launch worker, and does not mix retries or sessions | Derived from R3/R4/R6 |

## Reconciliation decisions

- A R9 and B R9 identify existing silent-stream fallback risks. They are mandatory discriminator cells for a proposed stream mechanism, but this gate does not add a general daemon/Browser.close deadline feature. Keep the existing 30-second attempt budget; do not extend it to hide a blocked reader.
- A R10 and B R10 become R8. Split valid marker lines must still parse. An unterminated URL cannot be assumed complete without a delimiter/EOF; bounded failure is acceptable when no complete readiness evidence exists. Long arbitrary diagnostics must still be consumed.
- Both drafts recognize the current unlimited Vec of diagnostics. R2 does not preserve infinite history. A proposed finite retention budget is an engineering choice that the shape must name, test and expose when truncation occurs, not a new user preference question.
- A's global close-timeout proposal is deferred as separate scope. Removing this backpressure should restore ordinary close in the observed workload; unrelated wedged-CDP close behavior is not silently claimed fixed.
- Windows needs an equivalent design that keeps its existing child/Job Object boundary. No Windows runtime pass will be claimed from this Mac. Platform verification remains a delivery gate, not permission to silently ship a Unix-only behavior change.
- Black-box fake executable wrappers are a valid existing CLI test seam. A new public testing API is not required.
- The already measured pipe-vs-file result is an observation, not selection of file logging as a shape.

## Discriminators, frozen before shapes

| ID | Cell | Observable |
|---|---|---|
| D1 | Ordinary real Chrome with logging beyond pipe capacity | open, marker, snapshot, marker read and close succeed without process/page replacement |
| D2 | Large stderr burst before any readiness artifact is produced, then real Chrome exec | Readiness/commands progress without waiting for the full launch timeout; distinguish early-lifecycle coverage |
| D3 | Large output after valid readiness | Later command remains responsive; distinguish read-until-ready from lifetime coverage |
| D4 | Failed startup with error/status and finite noisy output | Useful error/status retained; output bounded, no quiet-writer hang |
| D5 | Valid stderr readiness marker split across writes and no port file | Existing parser semantics preserved; record current orchestrated fallback behavior separately from intended support |
| D6 | Long unterminated diagnostics and invalid bytes | Continuous consumption, bounded retained bytes, no panic; partial readiness alone not treated as complete |
| D7 | Quiet inherited writer stays open after owned launch ends | New reader/waiter cannot indefinitely block close/drop or leak per relaunched browser |
| D8 | Same-session commands with args omitted, then close/relaunch | PID/target/URL/marker continuity and resource release beyond exit codes |
| D9 | Attached external Chrome and platform boundary | No kill/capture authority added; unchanged Windows Job Object interface supported by design and later platform verification |

## Blind shape request

Load Shaping and propose materially distinct shapes with parts/flags, full R×Shape binary fit check, recommendation and cheap falsifiable probes. Use only this contract, the original evidence packet and your isolated source. No candidate/sibling/environment/credential/network access. Keep unresolved mechanisms flagged; distinguish design fit from empirical validation. Do not implement or breadboard yet.
