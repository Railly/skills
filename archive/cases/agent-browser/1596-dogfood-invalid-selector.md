# Case: Driving the feature as a user found the bug that tests and code-reading missed

Status: candidate
Validation: independently-driven
Human review: n/a (finding raised by the reviewer, not against the reviewer)
Maintainer acceptance: pending
Delivery: PR #1604 open (fix pushed 2026-07-23)
Visibility: public
Repository: vercel-labs/agent-browser
Role: contributor
Source: https://github.com/vercel-labs/agent-browser/pull/1596 (reviewed), https://github.com/vercel-labs/agent-browser/pull/1604 (fix)
Upstream status checked: 2026-07-23

> A review that passed every deterministic check and every lens, on the author's green test suite, produced zero findings and one false claim. Building the binary and driving the feature as a user killed the false claim and surfaced a real one. This is the provenance for the dogfood step (SKILL.md step 5).

## Observed condition or claim

PR #1596 added an `a11y` command (embedded axe-core accessibility audits, cross-frame merge, CLI + MCP). The review gate came back clean: style/surfaces pass, 978 unit + 86 e2e green on real Chrome, all five doc surfaces and MCP parity present, no confirmed findings.

Two things only appeared once the feature was driven as a user, not reasoned about:

- **False claim, from code-reading.** A code-only pass hypothesized that `handle_requests` enables `Network` on the top session only (while `handle_har_start` loops iframe sessions), so the `requests` command would miss cross-origin iframe traffic. Driving it against a real out-of-process iframe disproved it: with tracking enabled before the fetch fired, `requests` captured the OOPIF's requests. An independent auto-attach path enables `Network` on iframe sessions; the code-reading was incomplete.
- **Real finding, from adversarial input.** Passing an *invalid* CSS selector (`a11y --selector "div::bogus("`) leaked a raw JS error with isolated-world line numbers, and embedded the stack in the `error` field under `--json`. A valid-but-missing selector already returned a clean message. The author's tests only exercised valid selectors (`#main`), and the code-reading missed it because the null-check looked complete.

## Red signal

- `agent-browser a11y --selector "div::bogus("` printed `Evaluation error: SyntaxError: Failed to execute 'querySelector' ... at <anonymous>:49:38`, versus the clean `No element matches selector: #nope` for a valid-but-missing selector. Re-verified twice against a freshly built PR binary on `example.com`.
- The false `requests` claim: first repro used same-site cross-port iframes (`localhost:8800` vs `:8802`), which are same-site and run in-process, so no OOPIF path was exercised. Forcing a real OOPIF (`--args "--host-resolver-rules=MAP *.test 127.0.0.1,--site-per-process"`, cross-site iframe) and firing fetches after tracking was enabled showed `requests` captured them. Claim dropped, never sent.

## Method used

1. Ran the full review gate on #1596: deterministic layer, subsystem model, lenses, and the a11y/full e2e on real Chrome. Result: clean, one code-reading hypothesis about `requests`.
2. Drove the built PR binary as a user against a hand-built page (8 real violations + cross-origin iframe), then an adversarial battery: page-owned `window.axe` (unchanged after audit), strict `default-src 'none'` CSP (audit still ran), shadow DOM (`#host >>> button`), node truncation (`… and N more`), a nested cross-site OOPIF chain (`iframe -> iframe -> button`), selector injection (neutralized), invalid selector (the finding), and bogus tag.
3. Forced the OOPIF network path with host-resolver-rules + site-per-process to test the `requests` claim empirically; it disproved the claim.
4. Fixed the invalid-selector case at the source: wrapped `document.querySelector(selector)` in try/catch in both expression builders, returning `Invalid selector: <sel>` on throw while keeping the distinct `No element matches selector` for a missing one.
5. Verified the fix: unit test over both builders, `fmt`/`clippy` clean, 3 a11y e2e on real Chrome, and driven by hand (invalid → `Invalid selector: div::bogus(` in text and JSON; missing → clean; match → audits).

## Outcome

- Fix shipped as PR #1604 (follow-up to #1596), after ctate merged #1596 in 0.33.0 and flagged the follow-up.
- Reinforces the **dogfood step** (SKILL.md step 5): for a non-authored change, drive the shipped surface with real and adversarial inputs before trusting tests or reasoning. The author's suite tests what the author thought to check; the finding lived in the input class it did not (malformed selector).
- Reinforces **error-path forcing**: the invalid-input cell, not just the missing-input cell, must be driven. A clean handler for the null case does not imply a clean handler for the throw case.
