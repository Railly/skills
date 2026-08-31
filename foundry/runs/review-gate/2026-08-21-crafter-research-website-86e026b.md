# Review Gate: crafter-research website 86e026b

Status: pass

Same-family warning: GPT-5 Codex authored and reviewed this change. Deterministic gates, source fixtures, browser substrate checks, Axe, and force-red validation reduce but do not remove shared-prior risk.

The six-record public systems alpha passes its exact-head gate. The built site exposes six research records, source ledgers, missing-public-evidence fields, honest first-pass and not-contacted states, separate correction and agency-response routes, and no combined safety or performance score.

Validation:

- `bun run check`
- `bun run build`
- `git diff --check origin/main...HEAD`
- Review Gate style and surfaces
- Chromium at 1440, 768, and 390 in light and dark modes
- EN, ES, PT, and ZH routes
- Axe WCAG audit with zero violations
- Force-red missing-source mutation and restored green

Two findings were fixed before the gate: the 768px header clipped a secondary link, and the coverage legend needed an explicit group role for its accessible label.

## Exemptions claimed

- README, SupportPage, and home copy use “systems” generically and do not document the new route.
- Four pre-existing Biome warnings belong to the global reduced-motion rule outside this diff.

## Issue candidates

None.
