# Issue Contract: Portless PR #365

Status: retrospective
Issue: https://github.com/vercel-labs/portless/issues/260
Delivery: https://github.com/vercel-labs/portless/pull/365

## Outcome

Portless accepts valid multi-segment custom TLDs while preserving correct routing, hostname limits, warnings, persistence, documentation, and existing single-segment behavior.

## Observed

`--tld` and `PORTLESS_TLD` rejected values containing a dot, preventing local domains such as `dev.example.com`.

## Expected

Each DNS label and the composed hostname are valid, overlapping configured TLDs resolve by longest match, every consumer applies the same rule, and warnings describe the actual risk without flagging the documented flagship workflow.

## Acceptance

- A1: valid multi-segment TLDs pass validation and invalid labels remain rejected.
- A2: overlapping configured TLDs strip and resolve using longest-match ordering.
- A3: composed hostnames remain within the DNS limit.
- A4: persisted lists skip invalid entries with a warning instead of resetting every value.
- A5: tree-wide risks such as `.dev`, `.app`, and `.local` warn on suffixes, while ownership-class TLDs remain exact-match only.
- A6: documented `dev.example.com` workflows run without a false DNS-leak warning.
- A7: the 404 suggestion uses the same longest-match rule as primary resolution.
- A8: generated certificate-cache filename components remain within `NAME_MAX`.
- A9: docs do not claim custom TLD reachability across LAN or tailnet when runtime binding makes it unavailable.
- A10: tests cover validation, hostname construction, routing, HTTPS, warnings, persistence, 404 suggestions, and filename bounds.

## Non-goals

- N1: no run-mode `--tld` promise without a tracked design and issue.
- N2: no unrelated wildcard-route precedence change.
- N3: no claim of real OAuth callback validation without an executed flow.
- N4: no change to LAN mode forcing `.local` inside this PR.

## Invariants

- I1: existing single-segment TLDs keep working.
- I2: every consumer that reconstructs a hostname applies the same resolution order.
- I3: widening the validator regenerates the input matrix for every downstream consumer.
- I4: repo-documented examples remain compatible with warnings and errors unless the change explicitly deprecates them.

## Change surface

Expected:

- TLD validation and persisted configuration.
- hostname parsing and construction.
- route and 404 suggestion resolution.
- risky-TLD warning classification.
- certificate-cache naming.
- CLI help, SKILL.md, README, docs site, and tests.

Must inspect:

- every consumer of configured TLDs.
- overlapping list behavior.
- composed DNS and filesystem limits.
- exact-match lookups keyed on the old single-label domain.
- docs claims in both directions: new behavior documented and old claims still true.

## Verification

- 11-case pre-fix matrix -> A1 through A3 and I1. Exact command was not retained in the case.
- `getRiskyTldReason` test matrix -> A5, A6, I4. Exact command was not retained in the case.
- overlapping 404 suggestion regression -> A7, I2. Exact command was not retained in the case.
- cert filename length regression -> A8. Exact command was not retained in the case.
- persisted-list tests -> A4.
- docs build -> A9.
- real OAuth callback -> N3 remains unverified.

## Risk

- tier: R2
- human gate: product semantics for warnings and public docs require human review.

## Promotion

- deterministic: each newly reachable input class has a red-capable test.
- spec: A1 through A10 and I1 through I4, including N1 through N4.
- standards: run widened-domain, documented-example, substrate-limit, docs-parity, and resolution-consumer lenses.
- delivery: do not merge until the final docs and built artifact match the contract.

## Retrospective note

The initial issue would not have predicted every later consumer. The contract becomes valuable when findings update A2 through A9 instead of remaining distributed across five review passes. Review still discovers the missing cells.
