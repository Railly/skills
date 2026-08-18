# ai-cli agent-discovery review gate

Status: complete. Working tree, not a commit. Author Cursor Grok 4.6; lens reviewer Claude Opus 5 (occam). Different family.

No Issue Contract. Spec status `not_provided`.

## Result

The first pass was not clean. Occam drove `next build && next start` and found six confirmed defects. The four that would fail public review are fixed and re-driven. Remaining items are exemptions or out of scope.

## Fixed this round (driven on `next start :3222`)

- **Internal registry in `bun.lock`.** `bun add` on this laptop rewrote 407 tarball URLs to `registry.k8s.vercel-security.com`. Restored `origin/main` lockfile and re-added `@vercel/agent-readability@0.5.0` from npmjs. Diff is now +3 lockfile lines. Zero internal URLs.
- **Docs pages dropped OG images.** Page-level `openGraph` replaced the layout object. `/docs/installation` now emits `og:image`, `og:type=website`, `og:site_name`.
- **Slackbot and Discordbot received markdown on `/`.** Layer-3 heuristic treats them as agents. They now get HTML with OG tags. ClaudeBot still gets markdown. `/og` stays `image/png` for ClaudeBot.
- **Two canonicals per negotiated response.** Middleware now returns `canonicalUrl: null`; the route owns `Link`. `/docs/index` header and frontmatter both say `https://ai-cli.dev/docs`.
- **Home `last_updated` frozen in production.** `app/page.tsx` was missing from the API route trace. It is now in `outputFileTracingIncludes`. nft.json lists `app/page.tsx`; home markdown reports `last_updated: 2026-07-27`, not the 2026-08-13 fallback.

## Deterministic

- `style` pass. `surfaces` pass after compiling `cases/ai-cli/conventions.md` to ` :: ` form and adding discovery surfaces.
- `siblings canonical` finding on `packages/ai-cli/src/lib/command.ts` acknowledged: that `canonical` is the long flag name of the CLI parser, not SEO.
- `callers markdownForPathname` and `canonicalUrlFor` pass.
- Exact-HEAD coverage acknowledged: artifact is uncommitted (`working-tree:093a362`).
- Radius: 39 changed, 11 impacted, 536 edges, 1657 unresolved calls. Map under-covers. The OG regression was the cochange-inferred `app/og/og-image.tsx` item.

## Exemptions claimed

- No CLI README, landing, or CHANGELOG update. AGENTS.md's user-facing rule is CLI behavior, flags, and website copy. This PR adds discovery routes; CHANGELOG stays release-prep per conventions.
- JSON-LD still absent. Owner deferred it from Wave 0; the audit's structured-data check remains the known leftover.
- Matcher negatives are prefix-anchored (`og`, `api`, `status`). Latent: a future `/ogre` or `/statusboard` would skip markdown. No colliding route today.
- HTML `Vary: Accept` / `Vary: User-Agent` on the prerendered homepage is unverified on Vercel. Local `next start` HTML has a year-long `s-maxage` without `Accept`. Middleware rewrite may make this moot on the platform; confirm on preview.

## Issue candidates

- Next 16.2.1 deprecates `middleware.ts` in favor of `proxy`. The 0.5.0 adapter is still middleware-shaped. Build succeeds with a warning.
- `/og/[...slug]` is unreferenced except the root `/og` image.
- `PAGE_TITLES` omits `troubleshooting`.
- `fromsrc` `resolveSource` joins URL slugs into `.mdx` paths without normalization. Pre-existing; `.md` widens who can hit it, not what it exposes.
