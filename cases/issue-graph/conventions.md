# issue-graph conventions

Sources: CONTRIBUTING.md, package.json, .github/workflows/ci.yml, and the session machine instructions, read September 23, 2026.

- Canonical repository: vercel-labs/issue-graph; primary branch main.
- Use pinned pnpm source scripts, Biome, and Node-compatible builds.
- Keep CLI and canonical skill behavior unchanged for a docs-only change.
- Keep generated skill downloads and changelog aligned with their generators.
- Preserve published npm installation and repository access distinctions.
- Use direct US English, no em dashes in authored prose, and no added code comments or coauthor trailers.
- Require docs checks/build/HTTP routes for site changes. Root CI also covers packages on Node 20/22/24 and docs production/preview.
- A merge does not authorize npm publication, repository visibility changes, or a manual deployment.

## Surface map

```surfaces
apps/docs/src/lib/site.ts :: README.md, apps/docs/content/docs/agents.mdx, apps/docs/src/lib/discovery.ts, CONTRIBUTING.md
apps/docs/src/components/terminal-demo.css :: apps/docs/src/components/terminal-demo.tsx, apps/docs/tests/terminal-demo.test.ts
```

The terminal test need not change when its original examples and interactions are preserved.

## PR20 external-review lessons

Source: historical Vercel review threads rechecked September26,2026; frozen head24d9e7d. Evidence: `foundry/runs/review-gate/2026-09-26-issue-graph-20-24d9e7d/run-report-24d9e7d.json`.

- Free-text cross-project Jira key matches remain evidence but must not become fetch requests; ordinary hyphenated tokens are valid counterexamples. Structured relationship confidence and project identity are separate dimensions.
- Generic traversal must exclude both already-fetched nodes and same-layer nodes from re-enqueue. Boundary-depth jumps require minimum-known-depth admission before applying the node cap.
- Session instructions select Bun for this review, overriding the older source-development pnpm convention above. The full pinned-pnpm package harness remains unrun rather than silently reclassified as passed.

## Jira identity and evidence ownership

- Jira keys are site-scoped. Remote URLs must retain the site or remain external; a matching issue key on the selected site does not identify the remote issue.
- Batch item selection must scope comment and remote-link collection to that same item. Test an empty selected issue next to a sibling with references.
- Review evidence: `foundry/runs/review-gate/2026-09-26-issue-graph-20-24d9e7d/run-report-24d9e7d.json`, F1 and F2.
