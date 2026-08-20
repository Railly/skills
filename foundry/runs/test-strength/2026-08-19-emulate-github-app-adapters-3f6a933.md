# Test strength: embedded GitHub App identity

Date: 2026-08-19

HEAD: `3f6a9334ed89d2bb72478614f748e9757802be59`

Verdict: pass.

The shared Next and Nuxt contract protects generated identity durability, canonical recovery after ambiguous persistence outcomes, retry after rejected preparation, save-queue recovery, and HTTP non-exposure.

Four reversible production mutations were killed at the built-package boundary: arrays accepted as records, rejected preparation retained, failed saves poisoning the queue, and canonical seeded state not replacing stale preparation. Each failed at its intended assertion, then both adapter suites returned to 14/14 green after snapshot restoration.

The array mutation specifically made `store.collections: []` pass parsing; `rejects a malformed canonical identity snapshot` failed because the promise resolved. Restoring `isRecord()` made it green.

No survivors or verification gaps remain within the changed runtime contracts.
