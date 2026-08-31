# Crafter Public Systems Observatory V11 review gate

Status: pass

Exact head: `8996d15190f11e201c6b80860e8a55f3e09deb89`

V11 correctly turns `/systems` into the umbrella program surface. Follow, Test, and Audit remain distinct, their shipped evidence and next gates are explicit, Muniscan stays integrated at `/muniscan`, and the completed V10 funding package becomes a concrete 90-day contract rather than a generic support pitch.

All material claims resolve to durable evidence. Follow remains a six-record first-pass alpha. Test has ten frozen fixtures and two persisted trajectories, with eight still pending. Audit has 1,871 scored municipalities and two public snapshots. The USD 25k, USD 5k, and 300-600 A100-equivalent asks match the approved funding package.

The built page was driven with agent-browser at 1440, 768, and 390 pixels in light and dark modes. EN and ES have no horizontal overflow, clear the side grecas, and preserve localized `/es/muniscan` and `/es/support` links. A too-dense 768px three-column layout was found and fixed by switching the program map to a full-width vertical sequence below 900px.

Axe initially found duplicate section landmark names. Exact HEAD adds a distinct localized label to the records list, and both EN and ES now report zero violations. Axe cannot automatically resolve contrast over the global gradient, so token colors were checked directly. Ratios range from 4.82:1 to 18.43:1.

`bun run check`, `bun run build`, `git diff --check`, Review Gate style, and Review Gate surfaces pass on the exact commit. Radius reported zero changed symbols and 156 unresolved calls, so it under-covers Astro and was not used as proof.

Warning: the same model family authored and reviewed the diff, so shared-prior risk remains recorded. This is standard-risk static content and layout with no runtime write or remote side effect.

## Exemptions claimed

- Axe contrast is incomplete because the global background is a gradient. Direct WCAG calculations for every used token pass at 4.82:1 or higher.
- Four Biome `noImportantStyles` warnings are pre-existing reduced-motion overrides in untouched global CSS.
- The empty blog collection warning predates V11 and does not prevent any of the 32 static routes from building.
- No formal Issue Contract or separate Spec result was supplied. The gate reviews the user request, merged program ledger, and approved funding package without inferring a Spec pass.

## Issue candidates

- Muniscan autopublication permission: run 32494601944 completed Scan, Score, and Diff, then failed to push a PR branch because the GitHub App token could not update workflows. PR #6 recovered and published the snapshot manually. Fix this in a separate Muniscan maintenance cycle.
