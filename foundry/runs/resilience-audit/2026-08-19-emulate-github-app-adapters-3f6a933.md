# Resilience audit: embedded GitHub App identity

Date: 2026-08-19

HEAD: `3f6a9334ed89d2bb72478614f748e9757802be59`

Verdict: pass.

Forced cells covered transient load failure, initialize failure, initialize publication with lost response, save publication with lost response, malformed canonical state including arrays in record positions, poisoned save-queue recovery, stale identity-only state, and eight-way cold starts.

Ten consecutive pressure rounds passed: 140 Next cases, 140 Nuxt cases, and 760 core cases. Identity remained canonical and authenticatable, failed operations remained retryable, and no flake was observed.

Gaps: multi-OS filesystem behavior remains delegated to CI, and custom compare-and-set persistence was exercised through deterministic adapters rather than a specific Redis client.
