---
name: pick-an-issue
description: Choose what's worth fixing in someone else's issue backlog, verify it's real before investing, and ship it as a clean PR with credit. Use when landing in an unfamiliar or shared repo with a large open-issue list and needing to decide what to pick up, for example "what should I work on here" or "find a good issue to fix". Contributor-side selection (what to take FROM a repo), not maintainer-side tracker management.
---

# Pick an issue

You are a contributor landing in a backlog that is not yours. The scarce resource is your attention, and most open issues are not worth it. This skill is the quality gate that decides what to pick up and takes it to a clean PR with credit. It does not re-teach how to reproduce a bug or how to write the fix. It delegates those:

- **Reproduce or build the failing signal:** `diagnosing-bugs` (its Phase 1 "feedback loop" is the validation path).
- **Write the fix test-first:** `tdd`.
- **Learn the codebase while fixing** (optional): `guided-contribution`.

## The prime rule

Verify before you invest. Reading, filtering, and cross-referencing are cheap. Reproducing and fixing are expensive. Spend the cheap effort ruthlessly so you only ever reproduce an issue you have already decided is worth a PR. A confirmed repro makes both the fix and the PR far stronger.

## Phase 1: survey the backlog

List the open issues. You want a scannable map, not to read every body yet.

```bash
gh issue list --repo <owner>/<repo> --limit 500 \
  --json number,title,labels,createdAt,comments \
  --jq '.[] | "#\(.number) [\(.createdAt[0:10])] (\(.comments)c) \(.title)"'
```

Cluster by theme from the titles to see where the pain concentrates. Clustering by title is fine, but asserting equivalence by title is not. Titles lie. A "502 error" may be a feature request; a "Serve not found" title may be a UX ask, not the routing bug it sounds like. Meaning gets confirmed by reading the body, in Phase 4.

**Done when:** you have a theme-clustered map of the open issues, with no bodies read and no dupes asserted yet.

## Phase 2: quality filter

Drop anything that fails the rubric. In order of how fast it eliminates:

1. **Bug, not feature.** Bugs first. A feature or enhancement is a heavier conversation and rarely what a maintainer wants an unfamiliar contributor to start with.
2. **Reproducible on your machine.** No hardware, OS, or service you don't have (a Windows-only crash, a Tailscale/SSH/Docker-only repro) unless you can actually run it. No repro means no validation path means no pick.
3. **Deterministic validation path.** A signal that goes red on this bug and green when fixed: a test, a curl, a CLI diff. This is the `diagnosing-bugs` feedback loop. If you can't imagine one, skip the issue.
4. **Non-breaking fix.** Favor fixes that are additive or a surgical alignment of existing behavior. Anything that changes a contract, a default, or a privileged or security path is high-risk for an outsider's first PRs. Flag it and prefer something cleaner unless asked.
5. **Well-scoped.** A root cause the reporter already localized (with `file:line`) beats a vague "doesn't work".

**Done when:** every surviving candidate passes all five bars, and every dropped issue is recorded with its reason (see the deferral log).

## Phase 3: cross-reference against existing PRs

A large backlog usually has contributor PRs already attached to many issues. Find which candidates are **virgin** (untouched) and which already have a PR, in one pass:

```bash
gh api graphql -f query='
{
  repository(owner: "<owner>", name: "<repo>") {
    issues(first: 100, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes {
        number title
        timelineItems(first: 20, itemTypes: [CROSS_REFERENCED_EVENT]) {
          nodes { ... on CrossReferencedEvent { source { ... on PullRequest { number state } } } }
        }
      }
    }
  }
}' --jq '.data.repository.issues.nodes[] | {n: .number, t: .title, prs: [.timelineItems.nodes[].source | select(.number != null) | "\(.number)/\(.state)"]}'
```

Prefer virgin issues: cleaner signal, no friction. An issue with an attached PR is not disqualified, but know the repo's outside-PR policy first.

Repos differ on whether they merge outside contributions. Some (post-incident, or by culture) do not review external PRs and will close them, expecting the team to open its own. There, an issue with a contributor PR is fair to take, because that PR was never merging. When you do:

- **Never close anyone's PR.** You usually lack the permission, and it's the maintainer's call. Your PR closing the *issue* (`Fixes #N`) does not close their PR.
- **Give credit.** In your PR body: `Supersedes #<their-pr>, same approach, thanks @<author>`, plus what yours adds (compiles, covers a duplicate, fixes a flagged error). That is the line between superseding and stealing.

If you can't tell the policy, ask the maintainer in one line before opening a competing PR.

**Done when:** each candidate is tagged virgin or has-PR, and you know (or have asked) the repo's outside-PR policy.

## Phase 4: verify the claim

Now, and only now, read the full body and comments of your top pick. Then reproduce it: hand off to `diagnosing-bugs` to build the red-capable, deterministic, fast loop. Report which: **confirmed** (name the code path), **failed to reproduce** (a strong signal to skip or ask the reporter), or **insufficient detail**. If the repro dies, you spent minutes, not hours. That is the point of doing it before the fix.

**Done when:** the pick's claim is confirmed by a loop that goes red on it, or you have dropped it as unreproducible.

## Phase 5: ship

Fix it (`tdd`, or `guided-contribution` if you're learning the repo), then apply PR hygiene:

- **Branch from the base branch, independent.** `git checkout -b fix/<slug> main`. Each PR merges on its own, in any order. Stacking a fix on another unmerged fix's branch contaminates the diff and forces a merge order.
- **Falsify your own test.** Revert the fix, watch the test or repro go red, restore. A test you haven't watched fail has no teeth.
- **Structured PR body:** Bug (root cause), Fix (bullets), Verification (tests, falsification, any e2e against the built artifact). Close every issue with `Fixes #A. Fixes #B.`
- **Self-assign** the issues you take. In a low-process team, self-assignment is the "I'm on it" signal.
- **Match the repo's conventions:** commit style, formatter, test layout, sign-off. Read a recent merged PR.
- **Disclose AI-driven tracker comments** when the repo or team expects it (a one-line note).

**Done when:** an independent PR is open with a falsified test, a structured body closing every issue it fixes, and those issues self-assigned.

## Deferral log: don't silently drop coverage

When you filter a backlog down, the issues you dropped read as "not covered" to the next session, so you re-evaluate the same ones. Keep a short record of what you skipped and why (out-of-scope, needs-hardware, feature-not-bug, has-active-PR). It turns a one-shot filter into a resumable one.

## Failure modes

- **Serially superseding.** If every easy issue already has a PR, prefer virgin or harder issues where your value is unambiguous, rather than out-competing people on trivia. Better signal, less friction.
- **Silent truncation.** If you looked at the top N issues and stopped, say so. Don't imply you swept the whole backlog.
