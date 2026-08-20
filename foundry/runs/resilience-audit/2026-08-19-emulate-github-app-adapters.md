# Resilience audit: embedded GitHub App identity

Date: 2026-08-19

Starting HEAD: `7e9a1ed88a5be51fdaf796a0c2164b3548e34f80`

Verdict: pass after a fresh fault-injection audit.

## Pressure matrix

| Fault | Invariant | Result |
|---|---|---|
| corrupt snapshot | generated identity never rotates silently | graceful rejection |
| first save fails | next request may retry initialization | preserved |
| first initialize fails | next preparation retries without recycling the process | preserved |
| initialize publishes, then response is lost | retry reloads the published identity | preserved |
| save publishes, then response is lost | retry restores the same identity and JWT | preserved |
| first load fails | next preparation retries | preserved |
| initialize returns malformed canonical data | initialization fails closed | graceful rejection |
| later mutating save fails | subsequent save leaves the rejected queue and runs | preserved |
| two cold starts | both instances select one identity | preserved |
| eight cold starts | all instances select and authenticate one identity | preserved |
| stale identity-only snapshot | later seeded state is restored, not overwritten | preserved |
| publication fails | no temporary file remains | preserved |
| old snapshot lacks metadata | Store identity and JWT auth still work | preserved |
| explicit key configured | key is never reported as generated | preserved |
| HTTP request | private key never appears in response | preserved |

File persistence writes private temporary files, fsyncs them, and publishes with atomic filesystem operations. Generated identity initialization requires compare-and-set semantics from custom persistence backends.

The save-failure retry preserves the original generated key and authenticates the retry with the original JWT. Rejected preparation promises clear only if they are still the current cached attempt. The later save queue also recovers after a failed background save.

The combined pressure matrix ran ten consecutive rounds with eight-way cold-start contention and every filesystem failure cell: 140 Next cases, 140 Nuxt cases, and 760 core cases in 54 seconds. No flake or temporary-file residue was observed.

## Gaps

- Cross-platform filesystem semantics remain represented by CI rather than a local multi-OS run.
- The custom persistence contract was driven with a deterministic compare-and-set implementation rather than a specific third-party Redis client.
- Timeout and cancellation cells are not applicable because these adapters define no timeout or cancellation policy; dependency rejection and retry are the owned failure boundaries.
