# Crafter Tracker review conventions

## Surface map

```surfaces
app/page.tsx :: README.md
components/stats-panel.tsx :: README.md
lib/tracker.ts :: data/main.json, app/api/luma/route.ts
lib/stats.ts :: components/stats-panel.tsx, app/api/luma/route.ts
```

## House norms

- Use Bun and Biome.
- Read the installed Next.js documentation before changing framework behavior.
- A SHIPPED pin needs a verifiable deploy, PR, demo, or public repository.
- Em dashes inside pin titles are an established data-content convention and are exempt from the prose punctuation gate.

## Subsystem invariants

- Census totals and map filters must either describe the same visible pin set or label their scopes explicitly.
- Explicit ISO country codes outrank free-text inference.
- Free-text city fallback must use whole-place matching and must not classify substrings such as Colima as Lima.
- Every newly added pin must remain correctly classified when the pending census schema lands.

## Gate-miss ledger

- Empty.
