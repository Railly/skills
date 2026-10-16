# Crafter Research portfolio observatory review gate

Status: pass

Exact head: `eeb30b195a14ce4c6821262af229c76f3ae1f19e`

The observatory renders exactly 20 audited projects on EN, ES, PT, and ZH routes. Every record exposes activity, consistency, real output, evidence, current limitations, dates, and public source links. Portuguese and Chinese disclose their temporary English project-copy fallback.

`bun run check` and `bun run build` pass. The validator checked 5 featured records, 20 audited projects, and 33 public URLs. Browser QA covered desktop EN, mobile ES, dark and light themes, search, combined filters, empty state, reset, horizontal overflow, console output, and Axe. A forced out-of-range score failed closed before Astro.

The Radius map under-covers this Astro surface because it reports 138 unresolved calls against 100 edges, so it was used only for orientation. The same model family authored and reviewed the diff, so shared-prior risk remains recorded. No product defect was found.

## Exemptions claimed

- Four `noImportantStyles` warnings are pre-existing reduced-motion declarations that intentionally override animation cascade.
- Empty blog collection warnings predate this diff and do not prevent any of the 20 pages from building.
- `src/data/projects.ts` uses “observatory” to describe LatamBench, not the portfolio audit contract, so it is unaffected by this sibling sweep.

## Issue candidates

None.
