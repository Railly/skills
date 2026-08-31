# Resilience Audit: emulate PR #205 canonical identity

Date: 2026-08-20

HEAD: `f07deb20f1ebbd339e73cc91551521055e4b7ccd`

Verdict: pass.

The shared 15-case generated GitHub App identity contract ran 10 times through the built Next adapter and 10 times through the built Nuxt adapter. It forced a persisted `seeded: false` canonical snapshot whose configured GitHub identity was replaced by another service, then retried through `load()`. Both attempts failed closed. Complete canonical snapshots, ambiguous initialize and save outcomes, queue recovery, malformed metadata, and eight concurrent cold starts remained green.

An earlier parallel harness attempt ran two `tsup --clean` processes against one `dist` directory and hit `ENOENT`. It was discarded as harness contention. The recorded matrix builds core once and runs adapter suites sequentially.
