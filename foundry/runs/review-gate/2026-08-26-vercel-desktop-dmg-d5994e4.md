# Review Gate: Vercel Desktop DMG presentation

Base: `c77537352ec3b1afee0a0c8e53ac8d1052248fa8`

Head: `d5994e4f111a917f451a46fba5a4e7d9a845fb86`

Status: pass

## Outcome

No actionable findings. The final DMG is Finder-authored before signing and visually verified after signing or notarization. The visual gate directly rejects the published broken artifact and accepts fixed artifacts across macOS 14, 15, and the local host, including transferred quarantined bytes at a suffixed mount.

## Checks

- `pnpm check`: pass
- `pnpm build`: pass
- `pnpm --dir apps/swift package`: pass
- focused DMG Swift test: pass
- shell syntax and Swift comparator typecheck: pass
- `hdiutil verify`: pass
- fixed DMGs: 100.0% visual match
- published v0.0.18: expected rejection, 24.2% match and mean difference 108.4
- cross-machine run `33000899153`: pass at 100.0%
- forced style and visual failures: cleanup pass, immediate retry pass at 100.0%
- exact-head AI Gateway review: no actionable defects

`pnpm test` runs 71 Swift tests and fails only `geistFontsResolveAfterBundleRegistration`. The same focused test fails on base `c775373`, so this is a preexisting machine-specific AppKit issue, not a finding against this diff. The new DMG test passes inside the full run.

## Exemptions claimed

- General DMG references in AGENTS, README files, CHANGELOG, and `create-dmg.mjs` remain accurate because commands, artifacts, release behavior, and the first-stage generator are unchanged.
- The Geist Mono test failure is exempt because it reproduces unchanged on the exact base and no typography code changed.

## Issue candidates

- Geist Mono fixed-pitch assertion fails on this machine. Evidence: identical focused failure on `c775373` and `d5994e4`. Out of scope because the diff only changes DMG packaging.
