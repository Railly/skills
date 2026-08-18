---
name: xref
description: Snapshot the reference graph of a GitHub PR or issue and trace every linked PR, cross-referenced issue, and mention across repos. Use before working an issue/PR to see its whole graph first (the review-full-pr-issue-graph rule); to find orphan, superseded, competing, or duplicate PRs; to see who mentioned or linked it; to survey a backlog by root-cause cluster; to rank a backlog by discussion heat (comments, participants, reactions, inbound links, time open) and pick the most impactful issue to fix next; to spot two PRs that touch the same files; to catch a PR that says "fixes #N" but won't auto-close; or to re-check what changed since the last snapshot. Trigger words include xref, map this PR/issue, trace references, what links to this, who mentioned this, find orphans, duplicate PRs, survey backlog, prioritize backlog, what to fix first, most impactful issues.
compatibility: Requires the `xref` command on PATH. Not published to a registry: install from source with `gh repo clone vercel-labs/xref && cd xref && bun install && bun link` (repo is internal to the Vercel org). Also needs `gh` (authenticated), `bun`, and network access for the GitHub API. Snapshots persist under ~/.xref/. Clustering runs in the calling agent's context, or shells out to `claude`/`codex` with --cluster-run.
---

# xref

Take a **snapshot** of everything a GitHub PR/issue connects to, so no **orphan** gets left behind: and so you never open a PR that duplicates work already in flight. The CLI is the hands (crawls, guards, classifies, attributes, persists); you are the brain (read the graph, run the one semantic step it hands back). `xref` is a globally-installed command (if it is missing, install it per compatibility above).

## Steps

1. **Crawl the seed.**
   ```bash
   xref <url|number> --repo owner/repo [--depth N] [--cluster] [--prioritize]
   ```
   Multi-seed / backlog survey: `--seeds 1,2,3` or `--label <label>`. Add `--prioritize` when the ask is "what should I fix first". `xref --help` lists every flag.
   Done when the CLI has printed the Nodes list and the orphan checklist.

   Map the ask onto the invocation:

   | The user asks | Run |
   | --- | --- |
   | "what's attached to this issue/PR", "check before I fix it" | `xref <n> --repo <o/r> --depth 2` |
   | "what should I fix first", "most impactful issues" | `xref --label <label> --repo <o/r> --prioritize` |
   | "which PRs are duplicating each other" | `xref --seeds <n,n,n> --repo <o/r>` and read the overlap section |
   | "which issues have no PR" / "which have competing PRs" | `xref --label <label> --repo <o/r>` and read the orphan checklist and flags |
   | "cluster my backlog by root cause" | `xref --seeds <n,n,n> --repo <o/r> --cluster` |
   | "what changed since last time" | re-run the same seeds; the snapshot diff is automatic |

2. **Surface the orphans and hazards.** Relay the orphan checklist to the user, most-actionable first:
   - ⚠️ **SUPERSEDED** PRs: a merged PR already shipped this work; candidate to close *with credit*.
   - ⚠ **competing** PRs: two open PRs close the same issue; pick one, credit both.
   - ⚠ **claims-close-no-link**: a PR says `fixes #N` (often in the title) but has no structural closing link, so merging it silently won't auto-close the issue.
   - Then the remaining open related issues/PRs.
   Done when every open, superseded, competing, and flagged node is named: silence on a node is a miss.

3. **Read the overlap section.** If a "Possible duplicate / overlapping PRs (shared files)" section is present, relay it: each pair of open PRs that touch the same files is a likely duplicate or merge conflict, and a pair that also closes the same issue is a near-certain duplicate. This is the objective duplication signal: trust it over title similarity.

4. **Relay the triage priority.** With `--prioritize`, the output ends with a "Triage priority" ranking of every open node by discussion heat: `comments×3 + participants×2 + reactions×2 + inbound refs×2 + min(12, daysOpen/30)`. This encodes "fix the most impactful issues, not inbox zero": lots of discussion and/or obvious frustration first. Relay the top of the ranking with each node's raw signals (they are printed next to the score) so the user can override the order; the score is a sort key, not a verdict.

5. **Run the cluster step.** With `--cluster`, the CLI prints a fenced `cluster-prompt` block listing each node's edges in `[brackets]`. That block is a sub-task addressed to you: cluster by the edge structure and shared defect (not title keywords), then present the root-cause clusters. This step is done only once the clusters exist in your reply: showing the CLI output is not doing it. (For unattended runs, pass `--cluster-run claude|codex` so the CLI shells out instead.)

6. **Offer the hub re-seeds.** If the output has a "Hubs not expanded" section, give the user the exact re-seed command it printed for each hub: that is how the neighborhood behind a tracking issue gets explored without pulling the whole tracker.

7. **Report what changed.** If a "Since last snapshot" diff is present, relay the new nodes, state changes, and new mentions/links with who made them.

## Flags

- `--repo owner/repo`: required for bare numbers, `--seeds`, `--label`.
- `--depth N` (default 2): same-repo recursion; cross-repo refs are fetched one hop, not expanded.
- `--seeds a,b,c` / `--label L`: backlog mode; output adds connected components.
- `--max-nodes N` (80), `--hub-threshold N` (12): crawl guards.
- `--prioritize`: rank open nodes by discussion heat (comments, participants, reactions, inbound refs, time open); the ranking is also always present in `--json` output as `priorities`.
- `--cluster` emits the prompt for you; `--cluster-run claude|codex` shells out.
- `--json out.json` writes the machine-readable graph (now includes `components` and `overlaps`); `--no-snapshot` skips persistence.
- `--html out.html` writes a self-contained master–detail explorer (Geist-styled, no server: `open` it). `--clusters clusters.json` groups the explorer by agent-named clusters and pins a **Cleanup** checklist as the default view. The file is either `[{label, root_cause?, members:[{key, verdict?}]}]` or `{clusters:[…], cleanup:[{key?, text}]}`: the same shape the `--cluster` step produces, so feed your whole triage (clusters + the close/credit cleanup list) back into the UI.

## How it reads the graph

- **Two edge sources.** Text mentions (body + comments) and structural links (timeline cross-references, connected events, closing refs) via GraphQL. Structural links catch attached PRs that never appear in the body text: the reason a text grep alone misses orphans.
- **PR triage metadata.** Each PR node carries `review`, draft/mergeable state, `+adds/-dels across Nf`, `updated <date>` (staleness), and the file paths it touches: all in the one node query, no extra requests.
- **Heat signals.** Every node also carries comment count, distinct participants, reactions, and createdAt in the same query: the inputs to `--prioritize`.
- **File-overlap detection.** Open PRs whose changed-file sets intersect are paired as possible duplicates/conflicts; a shared closing issue promotes the pair to a likely duplicate.
- **Derived flags.** `competing` (>1 open PR closes an issue) and `claims-close-no-link` (a `fixes #N` that won't auto-close) are computed and attached per node.
- **Attribution.** Each node carries its author and who mentioned it; each edge carries the actor and date.
- **State is fetched live per node** (OPEN/CLOSED/MERGED), never trusted from a cross-reference event, which can be stale.
- **Snapshot + diff.** Every run persists to `~/.xref/`; the next run diffs against the last one.

## Guardrails

- Report the graph to the user; they act on it. Never post a comment, review, or edit to GitHub (the no-public-github-comments rule).
- Before opening a PR for an issue, run xref on it first: an existing open PR, a superseded one, or a file-overlap pair means the work may already be done: coordinate and credit instead of duplicating.
- Cross-repo refs are fetched one hop and shown; external non-GitHub links are collected, with loopback/example/CI hosts filtered as noise.
