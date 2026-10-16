# Badge Studio conventions

Source: target AGENTS.md, observed September 18, 2026.

Use Bun and Biome internally; public badgio uses Node.js 22 and npm/npx. Keep Event SDK and railly.dev independent. No comments or coauthor trailers. Preserve both faces, portrait alpha, QR validation and native material semantics. Browser checks use agent-browser. Production changes are authorized in this user session; the blog is not authorized for publication.

Agent contract surfaces: browser registration schemas, docs/webmcp-contract.md, skills/badge-studio/SKILL.md, README.md, apps/web/public/llms.txt, apps/web/src/app/docs/page.tsx. Shared header is used on home, gallery, editor and toolkit.

```surfaces
apps/web/src/app/design/use-studio-webmcp.ts :: docs/webmcp-contract.md, skills/badge-studio/SKILL.md, apps/web/public/llms.txt, apps/web/src/app/docs/page.tsx, README.md
```
