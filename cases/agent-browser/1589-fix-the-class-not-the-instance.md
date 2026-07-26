# Case: Three review rounds, one lesson — fix the class, not the instance

Status: candidate
Validation: independently-validated
Human review: received 2026-07-25 (maintainer round 3, three findings, raised after the round-2 fixes)
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-26
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1589 (branch feat/session-tab-binding, round-3 fix commit c4fc782, base main 3cc7022)

> Independently validated: a second reviewer on a different model family (gpt-5.6-sol) ran the review-gate skill over the round-3 head c4fc782, confirmed no functional defect remained, and independently re-ran the class sweep (every `bind_active_target`, `enable_domains`/`prepare_domains`, and `state.browser = Some(...)` site inspected).

## Observed condition or claim

A `--pin-tab` session-to-tab binding PR drew three maintainer review rounds. After round 1 (four findings) and round 2 (three findings) were each fixed and pushed, round 3 raised three more. Every round-3 finding was the same defect *class* as a finding already fixed in an earlier round, living in a sibling code path the earlier fix never enumerated:

- **Attach recovery left `state.browser` alive** (`cli/src/native/actions.rs`). Same class as the round-2 torn-state finding (a fallible step in a state-mutating command that is not atomic on failure), but in the connect/attach flow instead of the runtime pin toggle. On a binding-recovery error the command returned an error while `state.browser` stayed set, so the next command skipped the attach path and acted on the wrong tab.
- **`ensure_page` created and bound a blank tab, clearing `tab_gone`** (`cli/src/native/browser.rs`). Same class as the round-2 silent-recovery finding (a path that clears `bound_target_gone` by binding a tab), but via `ensure_page → bind_active_target` instead of `register_discovered_page → add_page_with_activation`. When a pinned session's sole tab closed, the next command silently recovered onto a fresh blank page.
- **Pin restore called `enable_domains` on a discarded tab** (`cli/src/native/actions.rs` restore path). Same class as main's #1532/#1543 discarded-tab hang (`Page.enable` never answers on a Memory-Saver-discarded tab → 30s timeout), but in the restore path, which carried no merge-conflict marker so the earlier merge never reconciled it.

## Red signal

Each round-2 fix had a rule attached (round 2's own case: "cover every writer to a shared sink"). Round 3 proved the rule was applied to the instance, not the class:

- `grep bound_target_gone` clearers: `bind_active_target` has six call sites; the round-2 fix guarded one (`add_page_with_activation`). `ensure_page` was another, unguarded.
- `grep state.browser = Some`: every fallible `.await?` after the browser is set uses an `_or_close`/`_or_rollback` helper except `apply_tab_binding_on_attach` — the one the round-2 atomicity rule never swept to.
- `grep enable_domains`/`prepare_domains`: the restore path enabled domains directly on a re-selected (possibly discarded) tab; every other site either targets a freshly created tab or is already preceded by `ensure_renderer_alive`.

## Method used

1. Verified each round-3 finding at its own layer before fixing (read the exact line, confirmed the torn state by forcing a failed toggle then probing live state; confirmed `ensure_page` clears gone by construction).
2. Fixed each at the root: all attach sites route through `apply_tab_binding_on_attach_or_rollback` (calls `rollback_failed_launch`); a `pin_tab && bound_target_gone` guard inside `ensure_page`; `revive_and_enable_active` reuses `ensure_renderer_alive` before `enable_domains`.
3. **Ran the class sweep the earlier rounds skipped** — enumerated every call site of each invariant/operation and audited it in the same commit. The `state.browser` sweep surfaced a fourth site (`open_fresh_tab_for_auto_connect`) that also left a torn browser on failure; fixed it in the same commit rather than waiting for a round 4.
4. Added a deterministic regression (`test_ensure_page_skips_creation_for_gone_pinned_session`) that returns before any CDP call, so it passes fast only via the guard.
5. Ran an independent review-gate pass on a different model family over the pushed head; it confirmed no functional defect and re-ran the class sweep.

## Outcome

Three findings fixed plus one sweep-surfaced sibling, in one commit (c4fc782). Independent review confirmed clean. 1,068 unit + 2 integration tests, clippy `-D warnings`, fmt, and the pin-tab + a11y + foreign-tab + discarded-revival e2e all green. F-A (rollback) and F-B (gone-guard) dogfooded on the built CLI. PR open, maintainer acceptance pending.

## Evidence

- Source: PR #1589, round-3 commit c4fc782 on feat/session-tab-binding (base main 3cc7022). Retrievable.
- Runtime: failed `--no-pin-tab` toggle with an unwritable binding dir, then external tab close, returned `code=tab_gone` (still pinned in memory) after the fix; before the fix it returned `code=None` (torn). A failed connect with a corrupt binding left a fresh blank browser, not the stale CDP tab. Retrievable (dogfood scripts, ephemeral).
- Tests: `test_ensure_page_skips_creation_for_gone_pinned_session` passes in ~0.01s (returns before any CDP round-trip); full suite 1,068 unit + 2 integration green. Retrievable.
- Review: maintainer round 3 raised the three findings (unreviewed-report class for the chat itself; the findings are verified against the public diff). Independent gpt-5.6-sol review-gate pass over c4fc782 reported no functional defect and confirmed the class sweep. Retrievable (run report `foundry/runs/review-gate/2026-07-25-agent-browser-c4fc782-round3.json`).
- Artifact: built debug CLI drove real Chrome for the dogfood checks. Retrievable via `cargo build`.

## Transferable lesson

When a finding reveals a bug in an operation — clearing an invariant, mutating state before a fallible step, or touching a resource that can be in a bad state — the fix is not done until every call site of that operation is audited in the same commit. Patching the exact line the finding named leaves the same defect class alive in sibling paths, and a maintainer (or a later incident) finds them one round at a time. Attach a `grep` of the operation's call sites to every such fix. Three consecutive rounds on one PR were each a re-instance of a class the prior round's fix had left unswept.

## Exceptions

This covers defect classes with an enumerable sink (a named function that clears an invariant, a named mutation-before-fallible-step, a named blocking call). A class with no greppable common operation — a behavior spread across ad hoc inline code — is not closed by a call-site sweep and needs a behavior eval instead. One round-3 sibling (`install_active_network_controls` calling `prepare_domains` on a possibly-discarded tab) is pre-existing main code covered by #1543's live-tab selection; it was recorded as an issue candidate, not folded into this PR, because the PR neither introduced nor exposed it.

## Candidate changes

- Reference rule: "fix the class, not the instance" — after any finding, grep every call site of the operation and audit each in the same commit. (Added to `cases/agent-browser/conventions.md` House norms.)
- No change: the existing round-1 (dispatch-paths) and round-2 (sibling-sink/guardless-test) cases already carry the writer-sweep and force-red-the-test lessons; this case is the meta-observation across rounds, not a new lens.

## Confidentiality review

Public repository and public maintainer work. No internal chat quoted (findings stated as technical conditions verified against the public diff). No secrets, customer data, local absolute paths, or neighboring-project identity included.
