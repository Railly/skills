# Round 011: Register workstream-reconcile

Status: accepted
Date: 2026-08-24
Scope: register cross-source workstream reconciliation as an experimental skill

## Decision question

Should reassessing stale handoffs and active engineering portfolios expand `xref`, expand `handoff`, or become a separate orchestration skill?

## Evidence considered

Two real Vercel Labs portfolio reassessments combined handoff discovery, live GitHub inventory, exact pull-request review state, local branch divergence, release state, and access-limit reporting. The second pass found several transitions that no single source represented:

- fixes validated locally but never pushed;
- new human review findings behind green checks;
- approved branches made conflicting by a newer release;
- merged release pull requests whose artifacts were not yet published;
- newer project handoffs that materially changed the portfolio queue.

Only the generalized method enters this repository. Private vault contents and internal coordination details remain outside it.

## Boundary

`xref` remains GitHub-native graph and snapshot infrastructure. `handoff` remains an end-of-cycle project artifact. `issue-radar` and `factory-radar` remain live and persisted GitHub queue tools. `workstream-reconcile` reads those signals alongside local Git and published artifacts, then resolves drift into a current operating queue without mutating any source.

## Decision

- Add `skills/.experimental/workstream-reconcile/`.
- Keep the workflow read-only and use `xref --no-snapshot` only when graph relationships change a verdict.
- Separate historical delta from current operating state so age alone cannot imply a stall.
- Use the experimental distribution channel.
- Record maturity as dogfooded because the method was applied twice on real portfolio work, with no baseline comparison yet.
- Add behavior and trigger evals for unpushed work, new review findings, release lag, false stall detection, and degraded GitHub access.

## Evidence gap

The workflow has not been compared against an agent using `handoff`, `issue-radar`, and `xref` ad hoc on a transfer portfolio. Promotion requires a baseline comparison, human review of priority quality, and evidence that the method scales without exhausting GitHub API budgets.
