# Review gate: crafter-tracker PR #4 at 7ece4d3

Status: complete with two confirmed findings. No GitHub review or comment was submitted.

The pin renders correctly, its direct URL focuses the card, and VER SHIP reaches the intended public repository. The exact head passes its production build, TypeScript checks, changed-file Biome, surfaces, and diff check.

## Confirmed findings

- F1: The SHIPPED card says people and AI agents draw live, but the linked artifact had no agents at the PR timestamp and is currently human-only.
- F2: If PR #3 lands, this location resolves to Chile because `Santiago de Surco` appears before `Lima, Perú`; the pin needs `country: PE`.

Radius found no changed symbols because this is a JSON-only diff. Review therefore relied on rendered-card dogfood, the public linked repository, and cross-PR integration.

## Exemptions claimed

- The title's em dash matches existing pin-title style.
- The repository-wide Biome failures are outside this data-only diff.

## Issue candidates

- None.

Dogfood evidence: `/tmp/crafter-tracker-review.UGr9ua/dogfood-pr4/report.md`.
