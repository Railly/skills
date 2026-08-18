# Solution gate: ai-cli PR #82 decoded docs segments

Date: 2026-08-17
Repository: `vercel-labs/ai-cli`
Baseline: `85b635a57bf995451556c5b650a4fd4b587eff26`
Mode: candidate amendment
Trigger: external review finding on the prior amendment
Verdict: **Pass to detail**

## Frozen contract

| Req | Requirement | Status |
|---|---|---|
| R0 | Reject a decoded segment equal to `..` or containing `/` or `\` before any URL-reachable `getDoc` call. | Core goal |
| R1 | Ordinary home, sitemap, docs, HTML, and Markdown routes retain their current output, status, and canonical behavior. | Must-have |
| R2 | Invalid negotiated Markdown paths retain HTTP 200 Markdown not-found guidance. | Must-have |
| R3 | Invalid HTML docs paths retain browser not-found behavior. | Must-have |
| R4 | Regression coverage fails if decoded segment boundaries are flattened before validation. | Must-have |

Must not change: docs inventory, MDX serialization, middleware negotiation, social bot HTML, `llms.txt`, `/og`, or public route identities.

## Mechanically determined shape

The external contract names the rejected segment classes and the required timing, before `getDoc`. Two independent shaping passes were not manufactured because only one mechanism satisfies the full contract without duplicating policy:

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Put one pure decoded-segment predicate beside the shared docs directory contract. | |
| A2 | Pass the original decoded API params to `markdownForPathname` instead of relying only on their joined pathname. | |
| A3 | Apply the same predicate before the HTML route's metadata and page `getDoc` calls. | |
| A4 | Preserve existing invalid-route handling: Markdown guidance with 200, HTML `notFound()`. | |
| A5 | Test `..`, embedded slash, embedded backslash, and an ordinary path at the handler boundary. | |

## Fit check

| Req | Requirement | Status | A |
|---|---|---|---|
| R0 | Reject a decoded segment equal to `..` or containing `/` or `\` before any URL-reachable `getDoc` call. | Core goal | ✅ |
| R1 | Ordinary home, sitemap, docs, HTML, and Markdown routes retain their current output, status, and canonical behavior. | Must-have | ✅ |
| R2 | Invalid negotiated Markdown paths retain HTTP 200 Markdown not-found guidance. | Must-have | ✅ |
| R3 | Invalid HTML docs paths retain browser not-found behavior. | Must-have | ✅ |
| R4 | Regression coverage fails if decoded segment boundaries are flattened before validation. | Must-have | ✅ |

## Probe evidence

- `fromsrc@0.0.23` builds candidate paths with `join(docsDir, slug.join("/") + ".mdx")` and has no containment validation.
- Removing only the decoded-segment check made both the resolver and route regressions serve `# Installation`; restoring it returned the suite to green.
- Handler probes returned 200 Markdown not-found output for all three rejected classes and served Installation for ordinary segments.
- Production build probes preserved `/index.md`, `/docs/installation.md`, unknown Markdown guidance, `/llms.txt`, and `/og`.

## Failure-shape score

- S1 over-reach: designed out by rejecting only the three classes requested by review.
- S2 under-reach: designed out by testing all three classes at the handler boundary.
- S8 guard-derived cells: designed out by deriving cells from decoded route params, not the joined pathname.
- S9 wrong test: designed out by force-red with the guard removed.
- S11 asymmetric validation: designed out by using one predicate for HTML and Markdown consumers.

No persistent state, peer-version, lifecycle, or protocol failure shapes apply.
