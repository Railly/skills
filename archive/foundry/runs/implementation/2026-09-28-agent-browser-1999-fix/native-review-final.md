Native independent reviewer /root/fix_independent_review, returned in collaboration message on 2026-09-28. This artifact preserves the response; the reviewer did not write its requested file.

REVIEW MEMORY USED
Both configured memory files were absent.

TASK SHAPE
Select usable auth controls while binding credentials to the exact chosen DOM nodes.

BLOCKING
None.

WARNING
- Gate bookkeeping is stale: bin/fixed hashes to c860acef…, while bin/sha256.txt records 2939ff63….
- Refresh the manifest's dirty digest, changed paths, and stage receipts before promotion.
- Explicitly disposition the sibling-gate findings.

NOTE
- Chrome and Lightpanda A/B, replacement races, React controlled forms, textarea, and contenteditable paths pass.
- Full suite: 1,393 passed, 146 ignored. Auth E2E: 9/9.
- Formatting, strict Clippy, diff checks, and ordinary fill pass.
- Previous review findings are resolved.

KNOWN / DEFERRED
Task cancellation or CDP disconnect can prevent best-effort remote-object release.

MEMORY CANDIDATE
Cross-engine fallbacks require proof on the actual secondary engine; primary-engine monkeypatches are insufficient.

LGTM with notes.

Scope note at close: this LGTM covers C3 before the final exception-handle cleanup delta. The narrow follow-up did not return a verdict and was stopped. Final cleanup was audited sequentially against normative V8 source (evidence/v8-injected-script.cc) and force-red/restored-green CDP regression. Do not represent it as a fresh independent-model approval of the final cleanup.
