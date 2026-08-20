# Review gate: crafter-tracker PR #3 at 9813a55

Status: complete with four confirmed findings. No GitHub review or comment was submitted.

The intended static counts, SHIPS filter, A-Z ordering, desktop layout, and mobile layout work. The exact head passes its production build, TypeScript checks, changed-file Biome, style, and diff check. The repository has no tests, and its three whole-repo Biome failures predate this PR.

## Confirmed findings

- F1: The Luma matcher classifies Colima, Mexico as Peru despite the PR promising whole-word matching.
- F2: Hiding SHIPPED reduces map markers from 20 to 16, but the census stays at 20.
- F3: Combined with PR #4, `Santiago de Surco, Lima, Perú` is classified as Chile because the new explicit country field remains optional.
- F4: README's product feature list does not mention the census.

The Radius map was used for orientation. It ranks `TrackerMap` as the top impacted consumer, but its 621 unresolved calls exceed 355 mapped edges. All findings came from route forcing, cross-PR integration, browser dogfood, or the surface gate.

## Exemptions claimed

- The three repository-wide Biome findings predate this PR; every changed file passes.

## Issue candidates

- None.

Dogfood evidence: `/tmp/crafter-tracker-review.UGr9ua/dogfood-pr3/report.md`.
