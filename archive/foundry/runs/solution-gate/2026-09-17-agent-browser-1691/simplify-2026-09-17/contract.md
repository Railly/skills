# Simplification contract

User requests a much smaller PR and fewer tests. The previous recommendation was to keep V4, timeouts and safe close while separating wider recovery. Remove the added disk-receipt feature and its storage-only obligations; update all documentation. Keep the same environment options, V4 create/stop wire format, UUID validation, secret-safe errors, 10s create / 8s attach / 18s setup / 4s stop budgets, both launch paths, same-ID failed/canceled close retry, pending-session replacement guard, and existing local/external browser continuity. Preserve configuration rollback on failed setup.

Receipt write/preflight/deletion, disk permissions and cancellation while writing receipts leave scope with the feature. No ownership callback is needed once create returns an ID and endpoint without any subsequent await; callers must remember ownership before CDP attachment or validation can fail.

Tests will cover distinct boundaries with shared table cases: V4 create/stop bytes and options; malformed identity/secret-safe failures; effective request deadlines; failed/canceled close retention and replacement refusal; both setup caller rollback paths; invalid CDP credential sanitization; real Chrome continuity. Remove constants-only checks and consolidate repeated setup. Do not add dependencies, minify code, move tests outside the PR, or change unrelated providers.

Measurements count additions against main aff6125. Baseline is 1,481 additions: 561 runtime, 847 tests, 73 docs/help. Aim for a substantial reduction, with no numeric metric taking precedence over the preserved invariants. Publish an append-only signed commit to our existing PR #1879; Magnus #1691 stays restored.
