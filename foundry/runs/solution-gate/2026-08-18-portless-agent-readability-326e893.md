# Solution gate: Portless agent-readable documentation

- Date: 2026-08-18
- Neutral base: `326e8933e419496beb18422e3711e082e282d35f`
- Production baseline: 53/100 Fair
- Proposer A: Claude Fable 5
- Proposer B: Cursor Grok 4.6 High
- Synthesizer: Codex root runtime, which proposed neither candidate
- Proposal record: `2026-08-18-portless-agent-readability-326e893-proposals.md`
- Mode: greenfield solution gate

## 0. Trigger

The gate fires because the change creates a public representation contract across routing, content negotiation, metadata, caching, filesystem-backed sources, missing pages, and existing API and OG routes. Several plausible ownership shapes exist.

## 1. Defect contract

### Violated property

Portless canonical documentation is not exposed through one consistent public contract for agent discovery, content negotiation, direct Markdown URLs, and canonical attribution.

### Observable that must change

The production `@vercel/agent-readability@0.5.0` audit must improve materially from 53/100 Fair. The implementation must directly drive `llms.txt`, `sitemap.md`, structured data, agent User-Agent negotiation, `Accept: text/markdown`, `.md` mirrors, Markdown alternate links, agent-readable missing pages, and HTML canonical links.

### Must not change

- Browser HTML remains normal for `/`, `/why`, `/commands`, `/https`, `/configuration`, and `/changelog`.
- Browser requests to unknown canonical paths remain HTTP 404.
- Slackbot, Discordbot, and other social previews remain HTML with OG metadata.
- `/og` and `/og/*` remain image responses.
- `POST /api/docs-chat` and `GET /api/search` remain outside Markdown negotiation.
- `robots.txt` remains permissive and continues naming `sitemap.xml`.
- `sitemap.xml` keeps the same six canonical URL entries.
- No synthetic freshness from build time or deployment filesystem `mtime`.
- No public route moves.
- No raw MDX module syntax or custom JSX leaks into public Markdown.
- Decoded traversal, slash, and backslash segments never reach filesystem lookup.

### Evidence

- The six canonical pages already live in one inventory: `apps/docs/src/lib/docs-navigation.ts:6-13`.
- Search duplicates MDX path resolution and cleaning: `apps/docs/src/lib/search-index.ts:26-59`.
- Docs chat duplicates the same source resolution: `apps/docs/src/app/api/docs-chat/route.ts:33-57`.
- The current cleaner strips MDX modules and styled div blocks: `apps/docs/src/lib/mdx-to-markdown.ts:7-42`.
- The sitemap fabricates freshness on every build: `apps/docs/src/app/sitemap.ts:6-10`.
- Root metadata has no canonical or Markdown alternate: `apps/docs/src/app/layout.tsx:14-36`.
- Child metadata has no canonical or Markdown alternate: `apps/docs/src/lib/page-metadata.ts:7-38`.
- Robots already passes and should be preserved: `apps/docs/src/app/robots.ts:3-7`.

## 2. Current observed behavior

```text
allDocsPages
  ├─ sitemap.xml                         works, but synthetic lastModified
  ├─ search index                        private Markdown consumer
  └─ docs-chat                           private Markdown consumer

Public HTML pages
  ├─ browser HTML                        pass
  ├─ robots.txt                          pass
  ├─ sitemap.xml                         pass in audit
  ├─ llms.txt                            404
  ├─ sitemap.md                          404
  ├─ agent UA                            HTML
  ├─ Accept: text/markdown               HTML
  ├─ page.md                             404
  ├─ canonical link                      absent
  └─ agent missing page                  HTML 404
```

## 3. Forward chains

### Proposal A: broad custom routing policy

1. Add a shared document loader and custom middleware policy. **Proposed.**
2. All public Markdown surfaces derive from the existing inventory. **Inferred from code ownership.**
3. Search, chat, public Markdown, discovery, and metadata stop resolving pages independently. **Inferred if existing consumers are refactored.**
4. A custom Accept parser and broad preview-bot list become new policy owned by Portless. **Inferred harmful branch.**
5. That policy can drift from the installed agent-readability package and its auditor. **Inferred harmful outcome.**

Helpful branch:

- Allowlist lookup removes traversal by construction. **Inferred and probeable.**

### Proposal B: inventory-first delivery with thin negotiation

1. Centralize page lookup and Markdown rendering behind `allDocsPages`. **Proposed.**
2. Use one internal Markdown route for negotiated canonical URLs, `.md` rewrites, sitemap Markdown, and agent missing pages. **Inferred.**
3. Use the installed agent-readability adapter for detection, Accept behavior, canonical response headers, and cache variation. **Observed available primitive.**
4. Keep only observed social false positives as an explicit bypass before the adapter. **Inferred from User-Agent probe.**
5. Public behavior mirrors the ai-cli production pattern while retaining Portless's existing MDX inventory and cleaner. **Observed precedent plus inferred fit.**

Harmful branches:

- The public contract raises the blast radius of future cleaner regressions. **Inferred.**
- Middleware matching `/` can intercept reserved routes if exclusions regress. **Inferred.**
- Agent missing pages must return 200 to satisfy the current agent contract, while browser misses remain 404. **Observed tool behavior.**

## 4. Probe log

| ID | Weak link or prediction | Command or observation | Result |
|---|---|---|---|
| P1 | Production baseline | `bunx @vercel/agent-readability audit https://portless.sh --json` | 53/100 Fair |
| P2 | Local production build reproduces baseline | `pnpm --filter @portless/docs build`, `next start`, then local audit | Build passed; local audit also 53/100 |
| P3 | Existing Markdown cleaner is usable for all six pages | Run `mdxToCleanMarkdown` across every `page.mdx` | All six render; no import/export or custom component syntax observed |
| P4 | Cleaner produces pure CommonMark only | Inspect cleaned output | Refuted. Commands and configuration retain standard HTML tables inside Markdown |
| P5 | Portless needs a new docs framework | Inspect `fromsrc@0.0.31` source resolution | Refuted. It expects `docs/foo.mdx` or `docs/foo/index.mdx`, while Portless already owns `app/foo/page.mdx`, navigation, search, chat, and cleaning |
| P6 | Latest agent-readability dependency | `npm view @vercel/agent-readability version` | 0.5.0 |
| P7 | Social bots are all safely ignored by package detection | Call `shouldServeMarkdown` for preview User-Agents | Refuted for Slackbot and Discordbot, which hit the heuristic; Twitter, Facebook, LinkedIn, and WhatsApp remain HTML |
| P8 | Portless should implement its own Accept q-value parser | Call package negotiation with representative Accept values | Refuted. The package already owns the contract and detects explicit Markdown media types; reuse it |
| P9 | Missing-page Markdown should preserve 404 | Read and run auditor 0.5.0 behavior | Refuted. The current check requires an OK Markdown response; agent misses must return 200 while browser misses stay 404 |
| P10 | Reliable per-page dates are unavailable in source history | `git log -1 --format=%cI -- <page.mdx>` | Refuted locally; dates exist, but availability in a Vercel build remains unverified |
| P11 | Synthetic dates are needed to keep a Good score | Recompute current weighted checks with proposed passes | Refuted. Expected score is about 92 without sitemap `lastmod` and frontmatter `last_updated` |
| P12 | JSON-LD can be omitted without material loss | Recompute weights | It can be omitted for about 88, but one sitewide WebSite JSON-LD object raises the expected result to about 92 with little semantic cost |
| P13 | Existing routes are already safe under browser and social requests | Local curl matrix | HTML pages 200, unknown page HTML 404, `/og` image, docs-chat not a GET surface |
| P14 | ai-cli pattern is relevant precedent | Inspect merged ai-cli implementation | Survived. It uses agent-readability middleware, `.md` rewrites, one internal route, canonical headers, alternates, allowlist validation, and 200 agent missing pages |

## 5. Failure-shape scoring

S1 and S2 receive the highest weight because the solution changes routing for the entire docs site.

| Shape | Proposal A | Proposal B and synthesized guard |
|---|---|---|
| S1 over-reach | Hit risk from custom sitewide policy and broad UA list | Designed down with exact reserved-route matcher and only observed Slack/Discord bypass |
| S2 under-reach | Risk from separate `sitemap.md`, `.md`, and negotiated handlers | Designed down with one internal route and one inventory |
| S3 direction inheritance | Clear if browser and agent missing behavior are tested separately | Clear with explicit HTML 404 versus agent Markdown 200 contract |
| S4 proxy property | Hit if audit score substitutes for direct route checks | Designed down with a behavior matrix plus audit |
| S5 unregistered peer | Clear, no persistent state | Clear |
| S6 peer-version blindness | Clear, no cross-process contract | Clear |
| S7 wrong layer | Risk if search/chat remain duplicated while only public routes centralize | Designed down by refactoring both consumers to shared loader |
| S8 guard-derived cells | Hit if tests follow middleware branches only | Test matrix derives from request classes, reserved routes, encoded segments, and all six inventory entries |
| S9 test pins wrong thing | Risk if only aggregate score is asserted | Mechanism-specific route tests plus force-red mutations required |
| S10 claim from prose | Risk in assumed UA and Accept behavior | Package source and executable probes observed both |
| S11 asymmetric validation | Risk if internal route validates less than public lookup | Shared allowlist and decoded-segment validator for every consumer |
| S12 primitive mismatch | Risk from a custom negotiation implementation | Use the package adapter according to its actual semantics; explicitly compensate only observed social false positives |

## 6. Synthesis

**Kind: graft, dominated by Proposal B.**

Use Proposal B's inventory-first ownership and thin internal route. Take Proposal A's explicit canonical metadata, JSON-LD, social-preview protection, and no-fabricated-dates rule. Reject Proposal A's custom Accept parser, large homegrown User-Agent taxonomy, separate public Markdown handlers, and git-date requirement.

### Chosen shape

1. Add `@vercel/agent-readability@0.5.0` to the docs app.
2. Create one shared docs-source module based on `allDocsPages`:
   - exact href-to-file mapping;
   - cached MDX reads;
   - `mdxToCleanMarkdown`;
   - title, canonical URL, Markdown URL, and optional description;
   - allowlist lookup only.
3. Refactor search and docs-chat to consume the shared loader, removing duplicated filesystem path composition.
4. Create one `page-markdown` renderer:
   - frontmatter with title, description, and canonical URL;
   - no fabricated `last_updated`;
   - home and six doc representations;
   - `sitemap.md`;
   - agent missing-page body from `generateNotFoundMarkdown`;
   - intentional standard HTML tables are allowed, while MDX modules and custom JSX are forbidden.
5. Add `app/api/docs-md/[[...slug]]/route.ts`:
   - validate decoded segments before lookup;
   - return `text/markdown`;
   - apply canonical and `Vary: Accept` headers using the package helper;
   - return HTTP 200 for agent or explicit Markdown misses.
6. Add `.md` rewrites:
   - `/index.md` to the internal home representation;
   - `/:path*.md` to the internal Markdown route.
7. Add sitewide agent middleware:
   - `docsPrefix: "/"`;
   - rewrite canonical paths to the internal Markdown route;
   - bypass Slackbot and Discordbot before package detection;
   - exclude `_next`, `api`, `og`, static extensions, favicon, manifest, robots, health, and status;
   - let explicit `.md` rewrites handle dotted Markdown URLs.
8. Add `/llms.txt` from the same inventory, linking canonical HTML URLs that negotiate Markdown for agents.
9. Add canonical and Markdown alternate metadata:
   - root canonical `/`, alternate `/index.md`;
   - child canonical `/<slug>`, alternate `/<slug>.md`.
10. Add one sitewide `WebSite` JSON-LD object in the root layout. It appears on every sampled HTML page and uses existing site metadata.
11. Remove `lastModified: new Date()` from `sitemap.xml`. Do not replace it until a reliable deployment-time source is proven.
12. Keep `robots.ts`, all MDX page content, OG routes, CLI docs, README, and public route names unchanged.

### Expected score

The weighted projection is approximately:

| Outcome | Expected score |
|---|---:|
| Chosen shape, JSON-LD, no fabricated dates | 92/100 |
| Same shape without JSON-LD | 88/100 |
| If reliable per-page dates are later proven for sitemap and Markdown | up to 100/100 |

The target for this implementation is **Good, approximately 90 to 92**, verified on a Vercel preview and then production. The score is not the contract. Direct behavior checks remain authoritative.

### Excluded from this change

- No `fromsrc` migration.
- No README rewrite.
- No CLI behavior or help changes.
- No docs route moves.
- No `llms-full.txt` unless a later use case demands it.
- No Markdown URLs in `sitemap.xml`.
- No file `mtime`, build time, or copied changelog date presented as page freshness.
- No conversion of existing standard HTML tables unless readability probes show a real defect.

## 7. Proposed structure

```text
allDocsPages
  └─ docs-source.ts
      ├─ search-index.ts
      ├─ api/docs-chat
      ├─ llms.txt
      ├─ page-markdown.ts
      │   ├─ sitemap.md
      │   ├─ known page Markdown
      │   └─ agent missing-page Markdown
      └─ metadata helpers

canonical request
  ├─ browser or social preview -> existing HTML page
  └─ agent or Accept: text/markdown
      -> agent-readability middleware
      -> /api/docs-md/*
      -> shared loader
      -> Markdown 200 + canonical Link + Vary: Accept

explicit *.md
  -> next.config rewrite
  -> /api/docs-md/*
```

## 8. Verification handoff

### Deterministic checks

- `pnpm install --frozen-lockfile`
- `pnpm --filter @portless/docs test`
- `pnpm --filter @portless/docs build`

### Route matrix

Drive every canonical page under:

- browser User-Agent;
- `ClaudeBot/1.0`;
- `Accept: text/markdown`;
- Slackbot;
- Discordbot;
- direct `.md`.

Drive reserved paths:

- `/og` and `/og/why`;
- `/api/docs-chat`;
- `/api/search`;
- `/robots.txt`;
- `/sitemap.xml`;
- `/llms.txt`;
- `/sitemap.md`;
- `/_next/*`.

Drive negative paths:

- unknown browser canonical path returns HTML 404;
- unknown agent canonical path returns Markdown 200;
- unknown `.md` returns readable Markdown without source details;
- decoded `..`, slash, backslash, encoded slash, `.mdx`, and API-shaped paths never resolve a doc;
- Markdown contains no `import`, `export`, `className`, or custom component tags;
- all six `.md` responses have the right canonical URL.

### Force-red tests

- Remove the Slackbot bypass and prove the social test fails.
- Remove one reserved matcher exclusion and prove its route test fails.
- Remove decoded-segment validation and prove traversal cases fail.
- Remove one `allDocsPages` entry from generated discovery and prove inventory parity fails.
- Return 404 for agent missing pages and prove the auditor-specific test fails.
- Remove canonical alternates and prove HTML metadata tests fail.

### Deployment checks

1. Deploy a Vercel preview.
2. Run the curl matrix against the preview.
3. Run `bunx @vercel/agent-readability@0.5.0 audit <preview> --json`.
4. Confirm CDN requests do not cross-serve HTML and Markdown.
5. After merge, repeat against `https://portless.sh`.

## Carried assumptions

- Next.js 16.1.6 continues supporting the package's Next middleware adapter in this app. Verify with the preview build and runtime.
- Vercel output tracing includes the six MDX sources after centralization. Verify every page in the preview, not only local build.
- Standard HTML tables inside Markdown are acceptable to target agents. If actual output is materially harder to read, address table conversion separately.
- One sitewide `WebSite` JSON-LD object is semantically sufficient and passes the auditor's sampled pages.
- The current package's Slackbot and Discordbot heuristic behavior remains as observed in 0.5.0.
