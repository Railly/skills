# Case: A fix codifies its own over-generalization

Status: observed
Validation: independently-validated
Human review: maintainer-reviewed (2026-07-20, two findings, both fixed)
Maintainer acceptance: pending
Delivery: PR pushed (head `06f8e07`, rebased onto main `e0c2af5` 2026-07-22)
Upstream status checked: 2026-07-22
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/365 (issue #260); commits `e13ff81`, `f991a40`, `8d9fcbf`, `8ecf74f` on `refs/pull/365/head`
Issue or PR: https://github.com/vercel-labs/portless/pull/365
Date: 2026-07-17

## 2026-07-22 update — round 3, maintainer finding: 404 suggestion ignores longest-match

The maintainer (ctate) raised a third finding, distinct from both prior rounds and confirmed by reading the resolution paths at head `1593007`:

- **404 suggestion does not apply longest-match ordering for overlapping TLDs.** With `example.com` and `dev.example.com` both registered, a request to unregistered `missing.dev.example.com` matches `.example.com` first, so the 404 page suggests `portless missing.dev your-command`. That registers the wrong hostname set (`missing.dev.example.com` would need `portless missing` under the `dev.example.com` TLD). The primary resolver applies longest-match; the suggestion builder re-split the host with a naive rule. Root cause is a resolution rule implemented in one consumer and not mirrored in another.

Not yet fixed on the branch as of 2026-07-22 (no commits since 07-21). This finding was **caught by a blind review-gate run** (codex, gpt-5.6-sol, hint-free) before being harvested — the run independently landed on `proxy.ts:206` with the exact overlapping-TLD failure scenario. New transferable lesson recorded in the catalog: **Resolution-rule consistency across consumers** lens, plus the same-named subsystem invariant in `conventions.md`. This is a harvest-loop validation (finding encoded as a general lens → blind different-family reviewer relocated it in the diff), not a proof the gate catches unseen bugs.

**Fix (pushed 2026-07-22, commit in `06f8e07`).** `proxy.ts` now selects the longest matching TLD suffix — `tldSuffixes.filter((s) => host.endsWith(s)).sort((a, b) => b.length - a.length)[0]` — with a guard (`matchedSuffix.length < host.length`) so a full-host match never slices to an empty string. Regression test `suggests the longest matching overlapping TLD in 404 page (issue #260)` in `proxy.test.ts` went red against the prior head (suggested `missing.dev`) and green after. Build/typecheck clean. Issue candidate left open: `findRoute`'s wildcard tier (`proxy.ts` `routes.find((r) => hostname.endsWith("." + r.hostname))`) has the same first-match-not-longest risk for overlapping *registered* routes, out of scope for this 404-suggestion fix.

## 2026-07-20 update — maintainer review, two new findings, both fixed and pushed

The maintainer reviewed #365 and raised two findings, both distinct from this case's suffix-over-generalization lesson and both confirmed by repro against the branch head:

- **Cert filename exceeds `NAME_MAX`.** A 248–253 char hostname is valid DNS (the widened validator accepts it) but its sanitized cert cache filename (`${host}-key.pem`) exceeds the 255-byte filesystem per-component limit, so generation fails with `ENAMETOOLONG`. The new-domain-matrix pass had enumerated the parsing and routing consumers but stopped at the DNS-length invariant, never reaching the cert consumer's own substrate limit. Fixed in commit `78c2f00`: bound the sanitized base to `255 - "-key.pem".length` and append a SHA-256 slice on overflow (deterministic, collision-resistant). Regression test force-red: naive body composes to 259 bytes, bounded body to 255.
- **Stale doc claim.** README asserted custom TLDs are reachable across LAN/tailnet via wildcard DNS, but outside LAN mode the proxy binds loopback only, and `--lan` forces the `.local` TLD and ignores a custom `--tld`, so the combination is unreachable. The claim was true when written and falsified by the loopback-binding hardening that landed later. Fixed in commit `1593007`; swept all surfaces, README was the only one that claimed it.

New transferable lessons recorded in the review-gate catalog, not here: new-domain-matrix substrate-not-semantics clause, and docs-behavior-parity inverse-direction clause. A cold agnostic re-gate against the committed tip returned PASS. Delivery advanced observed → PR pushed; maintainer acceptance still pending.

> Agent-authored during the review session. Implementation by a separate coding agent; findings verified by review subagents on a different model and re-verified at source level by the orchestrator. The contributor approved the narrowing direction and scope decisions in-session; the case artifact itself is pending human review.

## Observed condition or claim

PR #365 admits multi-segment custom TLDs (`dev.example.com`). Round-1 review (new-domain matrix lens) found the risky-TLD warning unreachable for the newly admitted input class: the lookup was an exact `RISKY_TLDS.get(configuredTld)` (cli.ts:3042 at `e13ff81`), so `--tld example.dev` produced no HSTS warning while `--tld dev` did, even though the `.dev` HSTS preload covers subdomains.

The fix (`f991a40`) generalized to suffix matching over the ENTIRE risky map and added a test asserting `getRiskyTldReason("dev.example.com")` matches `/public TLD/`. Suite green, the new tests satisfy force-red, every deterministic gate passes. Yet the product now warned "public TLD; DNS requests will leak to the internet" on every proxy start for `--tld dev.example.com`, which is the exact flagship example in the PR's own README section, the cli.ts help examples, and the docs site addition, with no way to silence it and no surface documenting it.

## Red signal

- Setup: worktree at `f991a40`, review pass over the fix delta only.
- Check: evaluate the changed trigger against the repo's own documented examples, then grep every doc surface for a mention of the resulting warning.
- Expected: recommended workflows run clean, or the warning is documented where the workflow is recommended.
- Actual: the fix's own committed test asserts the recommended example warns (`getRiskyTldReason("dev.example.com")` matches `/public TLD/`); zero doc surfaces mention it.
- Why this signal was trustworthy: the contradiction is internal to the repo (its docs recommend what its binary warns against), so it does not depend on reviewer taste. No test-teeth check can catch it, because the test faithfully codifies the wrong decision.

## Method used

1. Action: matrix lens enumerated consumers of the newly widened TLD domain. Evidence obtained: `RISKY_TLDS.get("example.dev")` returns undefined while `RISKY_TLDS.get("dev")` returns the HSTS reason. Result: real gap, confirmed.
2. Action: coding agent fixed the gap by suffix-matching every map entry and codified it in a test. Evidence obtained: `f991a40` diff and its `getRiskyTldReason` test block. Result: gap closed, over-generalization introduced.
3. Action: review of the fix delta read the full `RISKY_TLDS` map and classified entries by risk mechanism: tree-wide technical risk (`local` via mDNS, `dev`/`app` via HSTS preload with includeSubDomains) versus ownership-class entries (`com`, `org`, `net`, `io`, `edu`, `gov`, `mil`, `int`) that only matter for a bare TLD. Evidence obtained: map contents at `f991a40`; the map's own reason string for `app` named the wrong failure mode ("public TLD" instead of HSTS). Result: the suffix rule is correct for one class and wrong for the other.
4. Action: follow-up narrowed matching to `SUFFIX_RISKY_TLDS = {local, dev, app}`, kept ownership-class exact-only, corrected the `app` reason. Evidence obtained: `8d9fcbf` diff; assertions flipped (`dev.example.com` now expects undefined). Result: recommended workflow runs clean; tree-wide warnings retained.
5. Action: verified the flip has teeth without a revert run, by prior observation: the same input observably returned `/public TLD/` at `f991a40`, so the flipped assertion is red against the prior head by record. Core suites 277/277 green at `8d9fcbf`.

## Outcome

Delivered on the PR branch (`8d9fcbf`, later `8ecf74f` for docs parity). The warning now fires for `example.dev`, `myapp.app`, and `foo.local` with mechanism-accurate reasons, and stays silent for `dev.example.com`, matching what README, SKILL.md, help, and the docs site recommend. Maintainer review pending; PR not merged.

## Evidence

### Source

- `packages/portless/src/cli-utils.ts` at `8d9fcbf`: `RISKY_TLDS` map, `SUFFIX_RISKY_TLDS` set, `getRiskyTldReason`.
- `packages/portless/src/cli.ts:3042` region: single call site, previously the exact-match lookup.

### Runtime

- Probe at `e13ff81`: `RISKY_TLDS.get("example.dev")` → undefined; `RISKY_TLDS.get("dev")` → HSTS reason.
- At `f991a40`: committed test asserts `getRiskyTldReason("dev.example.com")` → `/public TLD/` (the over-generalization, codified).

### Tests

- `packages/portless/src/cli-utils.test.ts`, `getRiskyTldReason` block at `8d9fcbf`: exact matches, tree-wide suffix matches (`example.dev`, `myapp.app`, `foo.local`), ownership-class negatives (`dev.example.com`, `internal.example.org`), safe negatives (`devx`, `dev.internal`).

### Review

- Review-gate run with three lens subagents (new-domain matrix, error-path forcing plus force-red, docs-behavior parity); implementation agent distinct from reviewers.
- Contributor approved the narrowing direction over the document-the-warning alternative before the follow-up was sent.

### Artifact

- Docs site (`apps/docs`) builds and prerenders at `8ecf74f`.

### Inferences

- `.dev` and `.app` HSTS preload with includeSubDomains, and mDNS claiming `*.local`, are cited from public knowledge; the preload list was not re-fetched in-session.

### Unknowns

- Current draft/ready state of the PR via the GitHub API (org SSO blocked `gh`); branch head `8ecf74f` verified via `git fetch` on 2026-07-17.

## Transferable lesson

> A test added by a fix codifies the fix's decision, so force-red only proves that test and code agree. When a diff adds or widens a warning or error trigger, run the repo's own documented examples through the new trigger: a documented flagship workflow that now warns or errors is a decision-layer finding that no test-teeth check can catch.

- Why it transfers: any trigger-widening fix (warnings, lint rules, validators, deprecations) can silently capture the project's recommended path, and the codifying test will defend the capture.
- Where it does not apply: when the documented example is itself what the change deprecates, the new warning on it is the intended behavior.
- Known exceptions: repos without documented examples give this check no oracle; fall back to enumerating the feature's selling-point inputs from the PR description.

## Candidate changes

### Skill method

- None.

### Reference rule

- Selected destination. Candidate lens for the review-gate catalog: **Documented-example trigger check.** Trigger: the diff adds or widens a warning or error trigger. Pass question: every input the repo's own docs recommend is evaluated against the new trigger; a recommended input that now warns or errors is a finding unless the change deprecates it. Provenance: this case.

### Exemplar

- None.

### Deterministic check

- None (the doc-example inventory is judgment; the evaluation of each example is mechanical but the inventory is not).

### Behavior eval

- None.

### Coverage gap

- None.

### No change

- None.

## Confidentiality review

Public repository, public PR, public commit SHAs. No maintainer identity, no employer-internal context, no private review text, no local machine paths. Agent roles named only by their public definitions in this repository.
