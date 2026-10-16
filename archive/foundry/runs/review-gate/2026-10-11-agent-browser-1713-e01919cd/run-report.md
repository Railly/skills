# Review Gate: vercel-labs/agent-browser

Date: 2026-10-11
Repository: vercel-labs/agent-browser
Base: `d9570915`
Head: `e01919cd`
Profile: high-risk
Skill revision: `git:0567ddf`
Verdict: incomplete

## Execution

- Mode: native_subagent
- Runtime receipt: none
- Degraded from: fx_worker
- Schema failures: 0
- Independence gap: reviewer is a native subagent, model family not confirmed different from the author

## Contract

- Path: ~/Programming/vercel/agent-browser-1713-shaping/packet.md
- Spec status: not_written
- Acceptance reviewed: S1, S2, S3, M1, M2, M3

## Stage receipts

- Test Strength: unavailable. not run in this cycle
- Resilience Audit: unavailable. not run in this cycle
- Security Review: missing

## Verified properties

- P1: A wedged tab in a launched browser is replaced and the session works after e2e_wedged_page_is_replaced_and_session_recovers red on base, green on head; CLI dogfood: get url 3s after wedge, navigate ok
- P2: Attached browsers keep their tab --cdp dogfood: targets before and after identical, page_wedged at 36s
- P3: Replacement tab keeps session headers/network controls e2e_wedged_page_replacement_keeps_session_network_controls red before a40027dc, green after
- P4: Dialog-blocked tabs are not replaced e2e_dialog_blocked_tab_is_not_treated_as_wedged red at a40027dc (tab replaced), green at e01919cd

## Deterministic checks

- `style`: pass
- `surfaces`: acknowledged. docs/src/app no longer exists; docs/content commands.mdx and skill commands.md have no error-code section; README and SKILL.md troubleshooting updated
- `siblings tab_gone`: acknowledged. every hit is pin-tab specific; MCP passes code and data through generically (tool_result_from_run)
- `producers`: acknowledged. client.rs:519 is the only producer and matches contains()
- `timings`: pass
- `cargo fmt`: pass
- `cargo clippy -D warnings`: acknowledged. 3 errors at browser.rs:4427, cdp/client.rs:1108, e2e_tests.rs:9649, same lines fail on origin/main
- `cargo test`: pass. 1447 pass; 17 related e2e pass

## Judgment lenses

- probe false positives: run
- daemon dispatch state on active-target change: run
- error conventions: run
- surfaces: run
- security: skipped. Security Review not run; recorded as gap

## Findings

- F1: confirmed, fixed. replacement tab missed session setup and network controls Evidence: e2e red
- F2: confirmed, fixed. human output dropped warning for most actions Evidence: dogfood: get url printed no warning
- F3: confirmed, fixed. dialog opened by the command classified as wedge Evidence: e2e red: confirm() tab replaced
- F4: confirmed, fixed. tab binding persisted before swap Evidence: code order
- F5: confirmed, fixed. old session WebMCP state not cleared Evidence: targetDestroyed lookup by rewritten target
- F6: confirmed, fixed. pending report dropped by early returns and warnings overwritten Evidence: code paths
- F7: confirmed, fixed. delivery ack cleared another request's report Evidence: daemon.rs re-lock gap
- F8: unverified, open. heavy finite script (>30s) tab gets replaced Evidence: static: probe cannot tell slow from stuck
- F9: unverified, open. wedged OOPIF under frame scope not detected; non-active-session timeouts can trigger the probe Evidence: static

## Gaps

- Test Strength receipt not run (state-machine change: replay/warning delivery)
- Resilience Audit receipt not run (failure-path change: replace, adopt, fallback)
- Security Review receipt not run (replacement tab re-installs domain filter and proxy auth)
- FX worker unavailable: missing Keychain item Vercel AI Gateway; degraded to native subagent
- Windows TCP delivery of the wedge report not exercised
- no Issue Contract file under foundry/missions; packet used

## Limits and provenance

- Author model: claude-opus-5.5
- Reviewer model: occam subagent (unconfirmed)
- Same family: yes
- Independent challenge: not satisfied. Static review found 7 items; 5 fixed, 2 kept as owner decisions.
