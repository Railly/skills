# Crafter Research website review gate

Status: pass

Exact head: `d97f34ba64483fe03a8943a6d4a3222dc45ab39a`

The evidence-first portfolio renders five projects on every locale route. English and Spanish carry localized project copy; Portuguese and Chinese use the documented English fallback. Each card exposes maturity, artifact types, linked evidence, verification date, links, and a current limitation.

`bun run check` and `bun run build` pass. The validator checked five records, five featured records, and sixteen public URLs. Astro reported zero errors, warnings, or hints. The built HTML contains exactly five project cards on EN, ES, PT, and ZH, and no empty research-note placeholders. Prior browser QA covered desktop/mobile EN/ES, no horizontal overflow, no console errors, and zero Axe violations.

The same model family authored and reviewed this change, so shared-prior risk remains recorded. Review Gate classifies the build-time public-link GETs as externally visible side effects; an independent URL corpus and a forced 503 then successful retry cover that boundary. The shipped site itself is static and read-only. No product defect was found.

## Exemptions claimed

- Four `noImportantStyles` warnings are pre-existing reduced-motion declarations that intentionally override animation cascade.
- Empty blog collection warnings predate this diff and do not prevent any of the sixteen routes from building.

## Issue candidates

None.
