# crafter-research website review conventions

Bootstrapped 2026-08-21 from the repository structure and support-page implementation.

## Surface map

```surfaces
src/components/SupportPage.astro -> src/pages/support.astro src/pages/[lang]/support.astro src/components/SiteHeader.astro src/components/SiteFooter.astro src/i18n/ui.ts src/styles/global.css package.json
src/pages/support.astro -> src/pages/[lang]/support.astro src/components/SupportPage.astro
src/components/SystemsPage.astro -> src/data/public-systems.ts src/pages/systems.astro src/pages/[lang]/systems.astro src/components/SiteHeader.astro src/components/SiteFooter.astro src/i18n/ui.ts src/styles/global.css scripts/validate-projects.ts package.json
src/data/public-systems.ts -> src/components/SystemsPage.astro scripts/validate-projects.ts
src/pages/systems.astro -> src/pages/[lang]/systems.astro src/components/SystemsPage.astro
src/components/MuniscanPage.astro -> src/pages/muniscan.astro src/pages/[lang]/muniscan.astro src/components/SiteHeader.astro src/components/SiteFooter.astro src/data/projects.ts src/data/portfolio-audit.ts scripts/validate-projects.ts package.json
src/pages/muniscan.astro -> src/pages/[lang]/muniscan.astro src/components/MuniscanPage.astro
src/components/SiteHeader.astro -> src/components/SiteFooter.astro src/i18n/ui.ts
src/layouts/Layout.astro -> src/i18n/ui.ts src/styles/global.css
```

## Norms

- Use Bun and Biome. Do not use npm, ESLint, or Prettier.
- Keep Astro pages server-rendered unless interaction requires client JavaScript.
- English is the canonical default route. Spanish has native page copy. Portuguese and Chinese may fall back to English content, but their navigation labels and route generation must remain valid.
- New top-level pages appear in the header, footer, localized static paths, sitemap build output, and the `check` script.
- Public research claims must match inspectable repository evidence or an approved research brief.
- Proposed work must be labeled as proposed and kept visually distinct from shipped proof.
- Support contact routes to `railly@crafterstation.com`.
- Respect the side grecas: desktop content stays inside the centered 74rem content area and mobile hides the patterns.
- Validation set: `bun run check`, `bun run build`, `git diff --check`, then `agent-browser` at 1440, 768, and 390 pixels in light and dark modes plus axe WCAG audit.

## Gate-miss ledger

- None recorded.
