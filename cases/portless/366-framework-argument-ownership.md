# Case: PR #366 follow-up: nested CLIs need explicit argument ownership

Status: evaluated
Validation: contributor-validated
Human review: pending
Maintainer acceptance: pending
Delivery: local
Upstream status checked: 2026-08-12
Visibility: public
Repository: vercel-labs/portless
Role: contributor
Source: https://github.com/vercel-labs/portless/pull/366; `foundry/runs/solution-gate/2026-08-11-portless-366-374-60394ae-10dc32d.md`; `foundry/runs/review-gate/2026-08-11-portless-366-60394ae.md`

> The validated implementation exists only as an uncommitted working-tree diff based on `60394ae95c98bb8e142db9d0860cd14a50146643`. PR #366 still points to that SHA, so its green CI does not validate this follow-up.

## Observed condition or claim

Three valid command families remained broken after the server-subcommand classifier:

- Vite invocations with a positional project root were classified as unknown, so generated server flags were omitted.
- Package-runner separators could receive generated flags on the runner-owned side, preventing the framework from receiving them.
- Expo connection modes such as `--localhost`, `--lan`, and `--tunnel` conflicted with a generated host flag.

Implementation exposed a fourth member of the same family: Portless's global-option pass could consume an Expo child `--lan` before framework injection ran.

## Red signal

The command is governed by three nested grammars: Portless, the package runner, and the framework. Flat scans over argv assigned tokens to the wrong grammar. A separator, option value, positional root, or connection mode could therefore change meaning depending on which layer owned it.

## Method used

The solution gate reproduced all three reported failures and compared a minimal patch with a parsed-invocation design. The selected shape records framework identity, framework-owned argv, server classification, and the insertion point for generated options.

The implementation then:

- recognized Vite's positional project root as its default server grammar
- consumed package-runner option values before locating the framework
- preserved runner-owned separators
- treated Expo connection modes as explicit host choices while keeping port injection independent
- bounded Portless's global-option scan at the start of the child command

The review gate drove direct, package-runner, and package-script paths, then independently removed the root, separator, Expo-mode, and runner-option mechanisms to prove distinct regressions.

## Outcome

The local implementation preserves the framework-owned argument region across the reproduced command families. The review gate reported:

- build passed
- 204 focused tests passed with one intentional skip
- lint, typecheck, and diff checks passed
- four independent test-strength mutations failed for the intended reason and passed after restoration

Delivery remains local. The exact validated diff has no commit SHA and has not reached PR CI.

## Evidence

- Source: PR #366 at public head `60394ae`; solution-gate decision record; review-gate report and structured run record.
- Runtime: the solution gate executed Vite project-root, npm separator, and Expo mode probes; the review gate observed child argv through the differential corpus.
- Tests: 204 focused tests, one skip, plus four mechanism-specific mutations in the review-gate record.
- Review: solution gate selected the parsed-invocation shape; review gate completed with no remaining blocking findings.
- Artifact: uncommitted working-tree implementation; public PR remains unchanged.

## Transferable lesson

When one argv crosses nested CLIs, parse and retain token ownership before injecting, moving, or removing flags. A separator is not globally meaningful, a positional token is not necessarily a subcommand, and equivalent user modes must suppress only the generated option they replace.

## Exceptions

- The public PR's green Linux and Windows checks predate this follow-up.
- The exact implementation cannot be reconstructed from a commit until the working tree is committed.
- Existing package-script and multi-app gaps outside the touched parser remain separate work.

## Candidate changes

- Reference rule: nested CLI transformations must produce an ownership map and test every crossed separator, value-taking option, positional default, and equivalent user mode.

## Confidentiality review

Public repository and public PR metadata only. Private review wording, identities, local paths, and employer-internal context are omitted.
