# 1589: pin-tab shipped without the dispatch-path sweep

Status: candidate
Validation: contributor-validated
Human review: pending
Maintainer acceptance: changes-requested (ctate round 1, 4 lens-class defects)
Delivery: PR open
Visibility: public
Repository: vercel-labs/agent-browser
Role: maintainer
Source: https://github.com/vercel-labs/agent-browser/pull/1589
Upstream status checked: 2026-07-22

**Repo:** vercel-labs/agent-browser · **PR:** #1589 (session tab binding + `--pin-tab`) · **Date:** 2026-07-21 · **Status:** round 1, maintainer-confirmed misses

## What happened

PR #1589 absorbed community PRs #1426 + #1531 (tab binding, pin-tab strict mode) into a maintainer batch. Pre-push verification ran the deterministic layer only: 994 unit tests, fmt, clippy, radius impact, 2 e2e (happy paths), live check of #1265. No lens pass, no adversarial verification, no run report. The run was presented as "verified" when it was `incomplete` by the gate's own definition.

ctate's review round 1 found 4 defects, all in the judgment-lens class:

- A. Pinning applied too late or without binding the active tab (local launch paths never call `set_pin_tab`; `--pin-tab` on a running browser flips the bool without `bind_active_target`; CDP launch envelopes omit `pinTab`).
- B. Missing bound tab silently recovers instead of `tab_gone` (`ensure_page` on empty set clears the gone state and binds a replacement).
- C. Auto-attached tabs still steal the binding (`Target.attachedToTarget` handler uses `add_page`, which activates and binds; only the `targetCreated` drain was fixed).
- D. Batch mode propagates neither the pin flag nor machine-readable error codes (`run_batch` omits `pinTab`; batch JSON drops `Response::code`; `daemon_config_fingerprint` excludes pin, so an unpinned daemon is reused).

## Replication experiment (blind Codex runs on the same diff)

- Guided run (lenses steered by ctate's findings, findings themselves withheld): reached 4/4 plus 2 extra mediums. Contaminated as evidence; useful as bug inventory.
- Clean run (generic catalog lenses only, zero domain hints): reached B and D (D deeper than ctate: the fingerprint exclusion), missed A and C, and found real defects nobody had: `tab_gone` errors print the runtime URL unsanitized (credential/token leak; the persistence path sanitizes, the error path does not), `tab_switch` persists the new binding even when `enable_domains` fails, `tab_close` discards the CDP result and can report `closed:true` with the tab alive.

Conclusion: A and C are reachable agnostically only with a dispatch-path enumeration lens; B and D fall to the generic catalog. Notably, "Error-path forcing" was already promoted in the catalog when this shipped: B was catchable by the existing method, unrun. The union of reviewers (maintainer, guided, clean) strictly beat every individual reviewer.

## Lessons

1. **Flag-propagation dispatch sweep** (new lens, see catalog): a new flag/mode must be traced through every dispatch path that reaches its subsystem: fresh launch, auto-launch, connect/attach, re-attach/restore, wrapper frontends (batch, MCP), and event handlers. Wrappers that rebuild command envelopes independently are exactly where the flag silently drops (both `run_batch` and the preliminary CDP launch envelope did).
2. **Absorption is authorship.** A branch that absorbs external PRs is new code; the original author's green tests count as verification of their happy paths, never as a lens pass. Anchoring on inherited tests is how A-D survived.
3. **Cross-machine handoff carries the gate.** The handoff prompt to the second machine listed tests and signing but not the gate; the pre-push trigger fell into the seam between machines. Any handoff prompt that ends in push/PR names review-gate as an explicit step.
4. **Sanitize at the choke point, not per path.** Sanitizing on persistence while the error formatter prints raw runtime state means every new error path re-decides the question. One sanitizer at the boundary makes the leak structurally impossible.
