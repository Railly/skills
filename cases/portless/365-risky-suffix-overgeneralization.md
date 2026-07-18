# Case: A fix codifies its own over-generalization

Status: observed
Validation: independently-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open
Upstream status checked: 2026-07-17
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/365 (issue #260); commits `e13ff81`, `f991a40`, `8d9fcbf`, `8ecf74f` on `refs/pull/365/head`
Issue or PR: https://github.com/vercel-labs/portless/pull/365
Date: 2026-07-17

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
