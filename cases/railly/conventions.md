# railly.dev review conventions

Bootstrapped 2026-08-25 from `CLAUDE.md`, `README.md`, `src/components/AGENTS.md`, and the agent-readiness implementation.

## Surface map

```surfaces
src/middleware.ts -> src/lib/content-negotiation.ts src/lib/agent-content.ts src/lib/agent-readiness.integration.test.ts
src/lib/content-negotiation.ts -> src/lib/content-negotiation.test.ts src/middleware.ts
src/lib/agent-content.ts -> src/lib/agent-content.test.ts src/middleware.ts src/pages/llms.txt.ts src/pages/agent-instructions.md.ts
src/lib/schema.ts -> src/lib/schema.test.ts src/components/seo/StructuredData.astro
src/pages/developers.astro -> src/components/layout/Navigation.astro src/components/layout/Footer.astro src/pages/llms.txt.ts src/pages/agent-instructions.md.ts
src/pages/contact.astro -> src/components/layout/Footer.astro src/pages/llms.txt.ts
src/pages/privacy.astro -> src/components/layout/Footer.astro src/pages/llms.txt.ts
src/lib/openapi.ts -> src/lib/openapi.test.ts src/pages/openapi.json.ts src/pages/developers.astro src/pages/llms.txt.ts src/pages/agent-instructions.md.ts
src/pages/openapi.json.ts -> src/lib/openapi.ts src/lib/agent-readiness.integration.test.ts src/pages/developers.astro
src/pages/api/projects.json.ts -> src/lib/openapi.ts src/lib/agent-readiness.integration.test.ts
```

## Norms

- Use Bun and Biome. Do not use npm, ESLint, or Prettier for repository work.
- Prefer Astro components and server-rendered HTML for static content; use React only when client-side interaction is required.
- Preserve the grayscale CSS-variable palette and existing layout hierarchy.
- Agent-facing document responses negotiate `text/html` and `text/markdown`, respect quality values and explicit exclusions, and vary caches on `Accept` and `Accept-Encoding`.
- Unknown document routes return HTTP 404 in both HTML and Markdown, with recovery links to `llms.txt` and the sitemap.
- Developer-resource claims remain honest. Do not advertise authentication, webhooks, OpenAPI, MCP, or API contracts the site does not provide.
- The OpenAPI contract describes only public endpoints that exist, declares authentication requirements explicitly, and keeps operation IDs and response schemas function-call compatible.
- Identity schema uses the canonical `www.railly.dev` URL and keeps Person and Organization relationships internally consistent.
- New top-level trust or developer pages are linked from discoverable navigation or footer surfaces and listed in `llms.txt`.
- Validation set: focused Biome on changed files, `bun test`, `bunx astro build`, `git diff --check`, HTTP endpoint matrix, then preview deployment inspection.
- Known-red on main as of 2026-08-25: `bun run lint` has formatting drift in `scripts/sync-project-stars.ts` and `src/lib/github-stars.ts`; `bun run check` has nullability errors in `src/components/layout/BackgroundDither.astro`. Treat these as pre-existing unless touched by the diff.

## Subsystem invariants

- Astro middleware owns document representation selection before page rendering; API and static asset routes keep their native content types.
- Unknown API routes return an HTTP 404 JSON error with code, message, resolution guidance, and the OpenAPI discovery link; existing endpoint-specific JSON errors retain ownership of their response bodies.
- Vercel CDN caches must not reuse HTML for Markdown requests or Markdown for HTML requests.
- The generated response status survives representation conversion, especially 404 and HEAD responses.
- Prerendered blog and newsletter entries preserve their current static generation behavior.

## Gate-miss ledger

- None recorded.
