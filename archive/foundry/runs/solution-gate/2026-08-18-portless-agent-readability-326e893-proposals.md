# Portless agent-readable docs: independent proposals

- Date: 2026-08-18
- Neutral base: `326e8933e419496beb18422e3711e082e282d35f`
- Proposer A: Claude Fable 5
- Proposer B: Cursor Grok 4.6 High
- Synthesizer: Codex root runtime, which proposed neither candidate

## Shared neutral contract

**Property violated:** Portless canonical documentation is not exposed through one consistent public contract for agent discovery, content negotiation, direct Markdown URLs, and canonical attribution, although the six canonical pages already share the `allDocsPages` inventory and existing consumers derive Markdown from those MDX sources.

**Observable success:** A production build and deployment must materially improve the current `@vercel/agent-readability` v0.5.0 audit from 53/100 Fair by making `llms.txt`, `sitemap.md`, structured data, agent-UA Markdown, Accept-header Markdown, `.md` URLs, Markdown alternates, readable missing-page Markdown, and canonical URLs measurable. No exact score is promised before probes.

**Must not change:** Normal HTML for `/`, `/why`, `/commands`, `/https`, `/configuration`, and `/changelog`; browser missing paths remain HTTP 404; social preview bots remain HTML with OG metadata; `/og` remains an image; `POST /api/docs-chat` remains unaffected; existing `robots.txt` and `sitemap.xml` URL inventory remain valid; sitemap must not claim synthetic freshness; public routes must not move; rendered Markdown must not leak raw MDX modules or custom JSX; decoded path segments must not enable filesystem traversal.

## Proposal A: Claude Fable 5

### Shape

One new source-of-truth module, `apps/docs/src/lib/markdown-docs.ts`, maps each `allDocsPages` entry to `{slug, title, canonicalUrl, markdown}` by reusing the exact `readFile` plus `mdxToCleanMarkdown` pipeline that search and docs-chat already trust. Slug resolution is allowlist-only, so user input never composes a filesystem path.

Thin delivery surfaces read from it: `app/llms.txt/route.ts`, `app/sitemap.md/route.ts`, and an internal Markdown route serving `text/markdown` with a canonical `Link` header. Unknown slugs return Markdown listing available pages.

A middleware matcher excludes `/api`, `/og`, `/_next`, robots, sitemaps, and static assets. It rewrites pretty `.md` URLs, requests preferring `text/markdown`, and detected agent User-Agents to the internal route. Social-preview bots always fall through to HTML and OG metadata.

Metadata gains canonical and `text/markdown` alternates. JSON-LD is rendered from existing site metadata. The sitemap stops using `new Date()` and uses reliable dates only when available, otherwise omitting them.

### Predictions

1. `npx @vercel/agent-readability@0.5.0 https://portless.sh` reports materially above 53/100, with discovery, Markdown delivery, alternates, JSON-LD, missing-page, and canonical checks passing.
2. `curl -s -H 'Accept: text/markdown' https://portless.sh/commands` returns Markdown beginning with a heading and no MDX module syntax.
3. Browser missing paths remain HTML 404 while agent missing paths receive readable Markdown.
4. `curl -s -A 'Twitterbot' https://portless.sh/why | grep 'og:image'` still finds HTML OG metadata.
5. Consecutive Markdown and browser requests do not cross-serve cached representations.
6. The docs production build succeeds and sitemap URLs remain unchanged without identical synthetic timestamps.

### Cost

About five new files, three edited files, 300 to 450 lines, and no dependency beyond the agent-readability package if its adapter is selected. Runtime cost is middleware on doc requests and cache variation.

### What it makes worse

Cache fragmentation, User-Agent lists that age, greater blast radius for the line-based MDX cleaner, middleware on the HTML hot path, more generated surfaces, and potentially no sitemap `lastmod`.

### Rejected alternatives

Static Markdown in `public`, `next.config` header-only rewrites, an App Router catch-all at the public root, HTML-to-Markdown conversion, a separate Markdown namespace, OG instead of JSON-LD, and synthetic build timestamps.

## Proposal B: Cursor Grok 4.6 High

### Shape

Treat `allDocsPages` as the only public inventory of the six canonical docs. Derive HTML href, Markdown href, MDX file, title, and sitemap entry from that list.

Add one Markdown loader used by search, docs-chat, and the public contract. It may read an MDX file only after the request maps to an allowlisted page. It never joins user path segments into `src/app`.

Public surface:

- `/llms.txt` generated from `allDocsPages`.
- `/index.md` for home and `/{slug}.md` for the other pages.
- Negotiation on the six HTML routes for explicit `Accept: text/markdown` or a known agent User-Agent.
- Social crawlers always receive HTML and OG metadata.
- Browser missing pages stay HTML 404. Agent or explicit Markdown misses receive a short Markdown response without filesystem details.
- Successful Markdown responses use `Content-Type: text/markdown`, `Vary: Accept`, and a canonical `Link` header.

Middleware only classifies and rewrites. A Node route handler serves allowlisted Markdown. The sitemap keeps only the six canonical HTML URLs and drops `lastModified: new Date()`.

### Predictions

1. `pnpm --filter @portless/docs build` followed by the agent-readability audit scores above 53/100.
2. `curl -sI -H 'Accept: text/markdown' http://127.0.0.1:3000/why`, `/why.md`, and `/index.md` return Markdown with canonical attribution.
3. Browser and social requests stay HTML, browser missing pages stay 404, `/og` stays an image, and `POST /api/docs-chat` is not intercepted.
4. `sitemap.xml` keeps exactly the six HTML URLs and robots keeps its existing allow and sitemap declarations.
5. `.mdx`, traversal-shaped, and API-shaped Markdown paths do not return source or filesystem details.

### Cost

One shared loader, one classifier, middleware, `llms.txt`, a Markdown route, metadata and sitemap edits, and tests. Runtime cost is one internal rewrite for negotiated requests and cache variation.

### What it makes worse

Cache fragmentation, imperfect User-Agent detection, HTML tables remaining inside Markdown, middleware as a routing footgun, raw Markdown when humans directly open `.md` URLs, loss of synthetic crawl-recency signals, and a new generated `llms.txt` surface.

### Rejected alternatives

Static Markdown files, serving raw MDX, a custom query or JSON API, repurposing docs-chat, replacing HTML for all users, adding Markdown URLs to XML sitemap, filesystem `mtime`, Edge filesystem reads, GitHub as canonical, a full-only `llms.txt`, and a public catch-all route.
