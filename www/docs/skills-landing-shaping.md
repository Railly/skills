# Railly Skills landing page shaping

## Requirements

| ID | Requirement | Status |
|---|---|---|
| R0 | Explain why the collection is evidence-backed without overstating validation | Core goal |
| R1 | Browse every registered skill from repository-owned data | Must-have |
| R2 | Distinguish distribution channel from evidence maturity | Must-have |
| R3 | Copy an exact install command for the collection or an individual skill | Must-have |
| R4 | Preserve catalog filters in a shareable URL | Must-have |
| R5 | Expose source, evidence limits, release, and repository links | Must-have |
| R6 | Work responsively with keyboard access, visible focus, and reduced-motion support | Must-have |
| R7 | Keep the Astro application isolated under `www/` | Must-have |
| R8 | Deploy through a Vercel project rooted at `www/` | Must-have |
| R9 | Serve production at `skills.railly.dev` | Must-have |
| R10 | Require no runtime backend or GitHub API availability | Must-have |

## Shapes

### A: Manually maintained marketing page

| Part | Mechanism | Flag |
|---|---|:---:|
| A1 | Handwritten hero and workflow explanation | |
| A2 | Duplicate skill names, summaries, and maturity labels inside page components | |
| A3 | Static install snippets | |

### B: Build-time repository catalog

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Astro imports `foundry/maturity.json` during the static build | |
| B2 | Catalog components render channel, maturity, type, summary, source, and install command from the generated model | |
| B3 | Lightweight browser script filters generated cards and synchronizes query parameters | |
| B4 | Clipboard handler copies collection and per-skill commands with an accessible confirmation | |
| B5 | Static workflow graph and evidence key explain relationships and limits | |
| B6 | Isolated `www/` package, CI checks, and Vercel root-directory configuration | |

### C: Runtime GitHub-backed catalog

| Part | Mechanism | Flag |
|---|---|:---:|
| C1 | Browser or server fetches current GitHub metadata on each visit | |
| C2 | Runtime cache and error states protect GitHub rate limits and outages | ⚠️ |
| C3 | Client catalog renders remote repository responses | |

## Fit check

| Req | Requirement | Status | A | B | C |
|---|---|---|:---:|:---:|:---:|
| R0 | Explain why the collection is evidence-backed without overstating validation | Core goal | ✅ | ✅ | ✅ |
| R1 | Browse every registered skill from repository-owned data | Must-have | ❌ | ✅ | ✅ |
| R2 | Distinguish distribution channel from evidence maturity | Must-have | ✅ | ✅ | ✅ |
| R3 | Copy an exact install command for the collection or an individual skill | Must-have | ✅ | ✅ | ✅ |
| R4 | Preserve catalog filters in a shareable URL | Must-have | ❌ | ✅ | ✅ |
| R5 | Expose source, evidence limits, release, and repository links | Must-have | ✅ | ✅ | ✅ |
| R6 | Work responsively with keyboard access, visible focus, and reduced-motion support | Must-have | ✅ | ✅ | ✅ |
| R7 | Keep the Astro application isolated under `www/` | Must-have | ✅ | ✅ | ✅ |
| R8 | Deploy through a Vercel project rooted at `www/` | Must-have | ✅ | ✅ | ✅ |
| R9 | Serve production at `skills.railly.dev` | Must-have | ✅ | ✅ | ✅ |
| R10 | Require no runtime backend or GitHub API availability | Must-have | ✅ | ✅ | ❌ |

Notes:

- A fails R1 because duplicated catalog data can drift from the maturity registry.
- A fails R4 because it has no catalog state model.
- C fails R10 because page completeness would depend on runtime GitHub access.
- C2 is unresolved and therefore cannot support a selected shape.

## Selected shape

Shape B. The site is a static projection of the repository's own registry. It keeps evidence labels current at build time, avoids a runtime service, and preserves the existing repository boundary.

The information architecture follows the evidence-led principles in `vercel.com/design.md`: the first viewport carries the argument, the catalog supports executive and audit reading paths, and the page uses one continuous canvas. The visual identity remains Railly: the official Railly mark, Figtree plus monospace, and the Flexoki palette from `Railly/dev`.

## Detail B

| Part | Mechanism | Flag |
|---|---|:---:|
| B1 | Typed build-time adapter imports the maturity registry and derives source paths and install commands | |
| B2 | Hero presents the current release, skill count, evaluated count, repository source, and collection install command | |
| B3 | Catalog exposes search, channel, and type controls backed by URL query parameters | |
| B4 | Each skill row shows distinct channel, maturity, type, evidence summary, source link, and copy action | |
| B5 | CSS/SVG workflow trace connects intake, contract, shaping, implementation, proof, review, case, and handoff | |
| B6 | Evidence key names the maturity ladder and explicitly states that only one skill is evaluated in release 0.0.5 | |
| B7 | Astro package, Biome, Astro Check, build, and repository CI are contained under `www/` | |
| B8 | Vercel uses team slug `crafter-station`, project root `www`, production branch `main`, and domain `skills.railly.dev` | |

No flagged unknown remains in the selected shape. DNS publication is a delivery dependency, not a product-shape uncertainty: `railly.dev` currently delegates DNS to Cloudflare.
