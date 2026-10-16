# Case: agent-browser #2021: a blocked redirect completes as a navigation

Status: observed
Validation: author-validated
Human review: pending
Maintainer acceptance: pending
Delivery: PR open (#2114), supersedes contributor PR #2048
Upstream status checked: 2026-10-14
Visibility: public
Repository: vercel-labs/agent-browser
Role: maintainer
Source: issue #2021, PR #2114, branch `railly/blocked-redirect-error`, commit `2558b7d1`. Run evidence: `runs/2026-10-14-2021/`.

## Observed condition or claim

With `--allowed-domains`, a 302 from an allowed host to a disallowed one returned `success: true` with the blocked URL. The domain filter fulfills blocked documents with a 403 page, so Chrome reports a completed navigation.

## Contributor PR

#2048 detected the block by `title == "Blocked"`. The block page has no `<title>`, so `document.title` is empty and the check never fires (observed: `"title":""` in the JSON result); an allowed page titled "Blocked" would also error.

## Method used

The fetch handler records blocked documents keyed by `frameId`; navigation clears the map, then fails when the main frame (`frameId == targetId`) landed on a blocked document. First attempt keyed by CDP session and failed: Fetch events arrive on a different session than the active page.

## Process gap

The PR was opened before contract, review gate, or receipts. A retroactive review found the PR body claimed "blocked iframes do not affect the result" without proof; on main any blocked-iframe page fails earlier through #2031. Verified only with the #2031 fix applied.

## Issue candidates

- `waitUntil: none` (provider launches) may check before the fetch handler records the block. Not reproduced on loopback, 3/3 correct.
- `tab new <url>`, click, back, forward, and reload still report a blocked redirect as success.
- Removing `clear()` before navigation survives the tests.

## Lessons

- Before trusting a signal on a page, read the page source that produces it.
- A PR body claim is a test obligation; claims made without evidence get verified or removed before opening.
