## Verdict

One compile-level blocker as frozen; on the actual test-selection question (lost invariants, false positives, oracle strength, scaffolding) the reduction is sound and I traced every dropped row to equivalent or stronger coverage.

## Blocker

1. Merged unit test does not compile as supplied. The diff deletes use serde_json::{json, Value}; from the test and replaces super::super::cdp::client::CdpClient::connect(&url) with bare CdpClient::connect(&url), yet the merged function imports only futures_util and tokio_tungstenite. The hunk context shows mod tests { immediately followed by this test, so there is no module-level import preamble, and the deleted sibling test (test_auth_login_fill_releases_remote_object) used its own fn-local imports — establishing that this module's convention is per-fn imports, i.e., no module-level use existed before this change, and the diff adds none. Unqualified json!, Value (Value::Null, let request: Value), and CdpClient therefore do not resolve. Fix: restore use serde_json::{json, Value}; and either qualify super::super::cdp::client::CdpClient or import it in the test body. If a module-level import exists later in mod tests outside the supplied hunks, disregard — but per the packet's completeness claim, this fails cargo test before any assertion runs.

## Test-selection assessment (the asked question)

No real lost invariant. Traced each dropped row against the preserved contract:

- non-node (subtype array): release owners were {rejected result, retry node}. The new "selection" row returns a result with no subtype: "node" and exceptionDetails, so it exercises the non-node shape and the exception path simultaneously; the expected multiset [exception, rejected-result, node-2, login-node] fails if either rejected handle leaks. Superset coverage in one row.
- missing-node-id (malformed describe): identical release owners to the describe-error row ({node-1, node-2}); the retry invariant is still pinned by attempts == 2. Branch-level exercise is lost, invariant-level coverage is not. Acceptable given frozen production.
- fill rejected (false return): release owners identical to the fill-success and fill-protocol rows ({login-node}), same code path (boolean result carries no handle). The false→Err mapping is guarded end-to-end by the focus-redirect / select-redirect / focus-readonly e2e rows, which cannot throw — login["success"] == false there proves false-return rejection propagates.
- Duplicate-control e2e tests: the contract (usable twin used, hidden twin untouched) is now asserted in all 26 rows via hiddenUser/hiddenPass/hiddenClicked, plus the positive case in the normal row (filled, submitted, twins empty, hidden not clicked). The hidden attribute is visibility-equivalent to the deleted server's display:none wrapper, and the DOM-order trap (hidden submit first, autocomplete="username" before "username webauthn") is preserved verbatim. This is broader coverage, not narrower.

Oracle strength is intact: exact sorted release multisets (not subsets), attempts counts pin retry behavior and prove fill failures don't re-run selection, the mock panics on any unexpected CDP method, and the e2e per-event assertion (panic on any event targeting a non-credential element, exact credential value, isTrusted tied to execCommand availability) fully guards "never deliver a credential to another focused field" and "no submit after rejection."

Scaffolding: net removal (one HTTP server, one enum, three wrappers, one ws mock), stateful-server reuse matches neighboring tests. Nothing unnecessary added.

## Non-blocking observation

The deleted duplicate-submit test asserted visibleClicked == true (the visible submit's own onclick). The merged fixture leaves the visible submit unmarked; submitted && !hiddenClicked would also pass under a future programmatic submission (e.g., requestSubmit()) that clicks nothing. The anti-honeypot invariant (hidden submit never clicked) is fully preserved, so this only narrows future-regression detection, not current coverage. If you want parity for one line each: add onclick="window.visibleClicked = true" to the visible submit and assert it in the normal row.

## Bottom line

Fix the imports (finding 1); the 80/20 selection itself is correct and the stated contract is preserved. With finding 1 confirmed resolved, LGTM.