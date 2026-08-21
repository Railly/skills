# Kai review conventions

Project overlay for the Review Gate skill. Compiled from `AGENTS.md`,
`CLAUDE.md` and the Crafter Public Systems Observatory documentation.

## Surface map

The Observatory's current state is summarized in four coupled documents. A
slice-state change updates all four so the direction, slice definition and
evidence ledger cannot drift.

```surfaces
04_Projects/_shaping/crafter-public-systems-observatory/NORTH.md :: 04_Projects/_shaping/crafter-public-systems-observatory/big-picture.md, 04_Projects/_shaping/crafter-public-systems-observatory/slices.md, 04_Projects/_shaping/crafter-public-systems-observatory/evidence/status-ledger-v1.md
04_Projects/_shaping/crafter-public-systems-observatory/big-picture.md :: 04_Projects/_shaping/crafter-public-systems-observatory/NORTH.md, 04_Projects/_shaping/crafter-public-systems-observatory/slices.md, 04_Projects/_shaping/crafter-public-systems-observatory/evidence/status-ledger-v1.md
04_Projects/_shaping/crafter-public-systems-observatory/slices.md :: 04_Projects/_shaping/crafter-public-systems-observatory/NORTH.md, 04_Projects/_shaping/crafter-public-systems-observatory/big-picture.md, 04_Projects/_shaping/crafter-public-systems-observatory/evidence/status-ledger-v1.md
04_Projects/_shaping/crafter-public-systems-observatory/evidence/status-ledger-v1.md :: 04_Projects/_shaping/crafter-public-systems-observatory/NORTH.md, 04_Projects/_shaping/crafter-public-systems-observatory/big-picture.md, 04_Projects/_shaping/crafter-public-systems-observatory/slices.md
```

## House norms

- Do not use em dashes in prose.
- Do not add AI coauthor trailers to git history.
- Do not read, edit or stage anything under `00_Personal/`.
- Preserve unrelated local changes and stage only the named task files.
- Keep the primary checkout on `main`; create branches only in isolated worktrees.
- Prefer durable filesystem artifacts over chat-only summaries.

## Subsystem invariants

- Observatory scores are bounded technical observations. They are not claims
  about compliance, institutional quality, ownership or uptime.
- A project explorer and its Crafter Research log are distinct public surfaces:
  the explorer exposes the instrument, while the log preserves reasoning,
  failures, claim changes and limitations.
- A slice marked complete names a durable artifact and evidence that its gate
  passed. A merged implementation alone does not establish completion.

## Gate-miss ledger

None recorded.
