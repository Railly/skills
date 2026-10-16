# Crafter Research Muniscan log review gate 8d1bc56

Status: pass.

The exact commit replaces the duplicate project landing with a research log and routes the portfolio and systems program to the live atlas. Project validation, Astro diagnostics, Biome, build, desktop/tablet/mobile browser drives and the final axe audit pass.

Same-family warning: author and reviewer are both GPT-5 Codex.

## Finding fixed

- The shared header navigation had no landmark name and collided semantically with the footer navigation. It now has `aria-label="Primary navigation"`; final axe violations: 0.

## Exemptions claimed

- Header and footer retain the project name “Muniscan” for the research-log route. The live atlas is clearly identified by the first CTA and canonical portfolio homepage.

## Issue candidates

None.
