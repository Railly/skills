# Focused source review

Input: frozen /tmp/badge-webmcp-review-20260918 snapshot and final diff. Independent reviewer runtime did not execute the requested review; this is sequential self-review. Browser-native registration/invocation behavior and upstream protocol are independent substrate evidence, not an independent model's judgment.

- Control wiring: every mutator delegates to existing reducers, participant provider, local store or renderer. Entry validation precedes mutation. Schema fetch is lazy. Full documents cannot inject code or remote asset URLs.
- State/locks: current revision comes from document, locks, identity, saved state and view. flushSync synchronizes receipts. Two real callsite faults were rejected by their respective checks.
- Lifecycle: one active mutator, independent reads and explicit operation-specific cancel. Leaving editor aborts registrations/work. Native signal omission was discovered and corrected with an explicit tool, not hidden behind a compatibility shim.
- Image/store: byte and raster decoding gates remain in place. Storage failures and image-preparation failures surface; post-commit response failure cannot promise rollback. Forced retry preserved one saved design ID. Profile writes remain best effort with visible and inspectable warning on failure.
- Product contract: manual controls remain, generation has no WebMCP entrypoint, browser default is local storage, existing Vercel guard keeps server generation disabled. Toolkit and skill explain external model usage and billing separately.
- Surfaces: README, native metadata, llms, Toolkit and skill agree. README count corrected from eight to nine. Existing void profile button callers are compatible with the new boolean return because profile state owns feedback.

No blocking defect found in this bounded source pass. Limits: same model family, no paid image generation run, no other browser engine or phone GPU evidence. Cancellation after a durable commit is explicitly not rollback.
