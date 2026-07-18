# Case: Relaxing a validator widens the input domain of every consumer

Status: observed
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open (ready for review since 2026-07-17)
Upstream status checked: 2026-07-18
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/issues/260 and https://github.com/vercel-labs/portless/pull/365
Issue or PR: https://github.com/vercel-labs/portless/pull/365 (closes #260; supersedes #277 with credit; related #58, #319, #348)
Date: 2026-07-16 (updated 2026-07-18)

> Contributor-side validation in four passes: author pass, adversarial gate (2 bugs), review-gate skill (2 bugs + docs silence, 2026-07-17), and a human-review follow-up that corrected the third pass's over-reach. No maintainer response yet.

## Observed failure

`--tld` / `PORTLESS_TLD` rejected any value containing a dot, so teams running production at `*.example.com` could not use `dev.example.com` locally (OAuth redirect URIs #58, cross-subdomain cookies, production parity). Frustration signal: a fork published to npm (`@abumalick/portless 0.15.0-multi-tld.1`) carrying only the validation patch. Existing PR #277 (2 community approvals) implemented the fix but went CONFLICTING: main's multi-TLD list refactor rewrote its surface.

## Red signal

- Setup: clean worktree on `origin/main` (`74c9868`, v0.15.4), repro written before reading #277's diff.
- 11 tests across validation, hostname construction, routing, SNI cert SANs, HTTPS e2e. Exactly the 4 validation tests failed (`validateTld` was `/^[a-z0-9]+$/`); everything downstream was already label-agnostic.
- Decisive experiment: swapping only the `validateTld` body for #277's version turned the repro 11/11 green.

## Method used

1. Graph survey (issue, competing PRs, npm fork README via registry API) before touching code; requirements taken from user words, not PR titles.
2. Re-applied #277's core on main with `Co-Authored-By` credit to its author; left out its run-mode `--tld` (needs new semantics under TLD lists, separable).
3. Adversarial gate (pass 2) found 2 bugs the author pass missed:
   - Overlapping configured TLDs duplicated segments (`app.dev.example.com` with `["example.com", "dev.example.com"]` stripped the first match → `app.dev.dev.example.com`). Fix: sort by length descending before the single strip.
   - A valid 252-char TLD composed a 256-char hostname; the 253 limit lived on the TLD alone. Fix: check the composed hostname in `parseHostname`.
4. Review-gate skill (pass 3, 2026-07-17) found 2 more bugs plus a docs silence:
   - `RISKY_TLDS.get()` exact lookup never warned for multi-segment TLDs — `--tld example.dev` hit the `.dev` HSTS preload with no warning. Previously written off in this case's exceptions as "product decision, not a bug"; empirical evidence reclassified it.
   - One invalid persisted entry in `proxy.tlds` silently reset the whole list to `localhost` (all-or-nothing catch in `readTldsFromDir`). Fix: per-entry skip with warning.
   - Longest-match resolution for overlapping TLDs existed only in a test name; added one sentence to the contract surface (SKILL.md).
5. Human-review follow-up (pass 4) corrected pass 3's over-reach: suffix-matching every risky TLD made the flagship documented workflow (`--tld dev.example.com`) warn about DNS leaks. Narrowed to tree-wide risks only (`local` mDNS, `dev`/`app` HSTS preload with includeSubDomains; `.app`'s reason string was misclassified and fixed), ownership-class TLDs stay exact-match. Also applied the same all-or-nothing fix to `parseHostnames` at runtime (skip an overlong TLD, throw only if none survives; test proven red with the fix stashed), merged main (#363) and added the WS-over-H2 × multi-segment routing test, and mirrored the contract on the three docs-site pages.

## Outcome

PR #365 ready for review. `validateTld` multi-label (63/label, 253 total), longest-match strip, composed-hostname limit, suffix-scoped risky-TLD warnings, resilient TLD config reads, regression tests in 4 modules, docs on 4 surfaces plus the docs site. Branch head `8ecf74f` (history `4889a48 → e13ff81 → f991a40 → merge e0c2af5 → 8d9fcbf → 8ecf74f`).

## Evidence

- Runtime: repro 4-failed/11 on unpatched main; 195 utils/cli-utils tests green at head; proxy.test 61/62 (the 1 failure is a pre-existing environmental 502, identical on clean head); tsc clean; docs build green.
- Teeth: pass-4 `parseHostnames` test executed red with the source fix stashed, green restored. Pass-2 revert-proof is a gate report, not re-executed.
- Review: 2 community approvals on #277 for the original approach; #365 unreviewed.

## Transferable lesson

Relaxing an input validator widens the input domain of every downstream consumer. The verification question is not "does the new case work?" but "which previously-impossible inputs now reach each consumer, and which new ambiguities do they enable?" The bugs across passes 2-4 all live in uncrossed matrix cells: multi-label × TLD lists (overlap), multi-label × composed limits (253), multi-label × exact-match lookups (`RISKY_TLDS`, keyed on the old single-label domain), multi-label × persisted state written under the old validator.

Second-order lessons:

- An exception written as "product decision" without empirical evidence is an unverified finding disguised as scope (the RISKY_TLDS entry survived two passes that way).
- A gate fix can over-reach: suffix-matching all risky TLDs traded a false negative for a false positive on the recommended workflow. Warning classes need the same domain analysis as the code they guard (tree-wide risk vs bare-TLD risk).

## Method assertion

Scenario: a diff relaxes a validator or widens a trigger.
Required behavior: enumerate consumers of the widened value (grep the symbol, not the feature); exercise the new input class against every list/collection feature it now interacts with, including self-overlap; verify composed invariants (limits after concatenation); check exact-match lookups keyed on the old domain; check persisted state written under the old validator.
Observable pass signal: at least one test per newly-reachable input class, each proven red against the pre-fix source.

## Promotion recommendation

Provisional only. Do not promote before human review.

The verification norm ("regenerate the verification matrix from the new input domain") is already in `conventions.md`; this case is its provenance. Candidate addition: the exception-without-evidence lesson as a reference rule for case authoring.

## Missing evidence

- Maintainer review and merge.
- Real OAuth callback flow against a multi-segment TLD (the #58 use case) — covered by unit/routing tests only.
