Read-only correctness review of vercel-labs/json-render PR #334.

Reviewed base: `ea3326046f57138671a238f7b1110ce5de015778`.
Reviewed head: `bfab0c4a6ce4d1a5a56ad2979577d28993dc1736`.
Target checkout: `/Users/raillyhugo/Programming/vercel/json-render-334-review`.
Target tracked and untracked state remained clean. No GitHub writes or target source edits.
Reviewer: native GPT-6 agent, same model family as orchestrator. The original author model is unknown. The TanStack reference implementation and built-artifact output below provide independently defined runtime oracles; no claim of cross-family model independence is made.

1. [P2] Retry the route loader when the default error view says “Try again”.

Location: `packages/tanstack-start/src/components/error-boundary.tsx:38-39`.

The default button invokes only React's boundary `reset`. When the error originated in a route loader, the TanStack match remains in `status: error`, so rendering immediately throws the cached error again. In the built browser fixture, a loader deliberately fails once and succeeds on its next call. Opening `/error` showed the transient error with attempt count 1. Clicking “Try again” left the error visible, the route in error status, and the attempt count at 1. Clicking the fixture's router invalidation control then reran the loader, raised the count to 2, and rendered “Recovered”. The default error component is wired directly as `errorComponent` in the README, so this affects the documented integration. Retry should trigger the router's loader retry/invalidation mechanism, in addition to resetting any render error boundary as needed.

Confidence: high. Concrete browser evidence: `independent-browser-retry.json`; real browser session `json-render-334-review-gate`, built package ESM imports served by the run's `browser/main.tsx`. Installed TanStack `src/Match.tsx` confirms that client matches in error status rethrow their stored error.

2. [P2] Normalize a route pattern consistently with incoming pathnames.

Location: `packages/tanstack-start/src/router.ts:18` and `packages/tanstack-start/src/router.ts:98-100`.

A route key ending in `/`, such as `/about/` or `/blog/$slug/`, is compiled with a mandatory trailing slash. `normalizePathname` removes that slash from every incoming non-root pathname before matching, making these routes unreachable with either slash convention. Built `matchRoute` returned null for `/about/` and `/about` against the `/about/` key, while the pinned native TanStack Router matched both to `/about/`. The same difference occurs for `/blog/$slug/`. `collectStaticPaths` nevertheless emits `/about/`, so the new package can generate a prerender path that its own page resolver rejects. TanStack supports trailing-slash index paths and the package has no documented prohibition or validation for them. Normalize keys while retaining their original lookup identity, or explicitly reject unsupported forms before advertising them as prerender paths.

Confidence: high. Evidence: `independent-oracles.mjs` and `independent-oracles.log`, executed against the built server entry point and pinned TanStack Router 1.170.32.

3. [P2] Preserve the advertised Open Graph image array through HeadContent.

Location: `packages/tanstack-start/src/metadata.ts:85-87`.

The public metadata type accepts an image array and the helper emits one `og:image` descriptor per entry, but TanStack's actual `HeadContent` deduplicates metadata by property/name while iterating backward. With `[primary.png, secondary.png]`, SSR output contains only `secondary.png`; the first image and the array itself are lost. The same occurs for the helper's `twitter:image` loop. The new unit test only checks the intermediate descriptor array, so it passes even though the installed downstream renderer drops the tested first image. The adapter needs a supported representation for this metadata capability or an explicit narrower contract; silently keeping the last image does not deliver its declared array conversion.

Confidence: high for observed loss; medium for merge priority because applications with a single image are unaffected. Evidence: `independent-oracles.log` includes both descriptors and the HTML from real `renderToString(<RouterProvider>)` with `HeadContent`; `@tanstack/react-router/src/headContentUtils.tsx` explains reverse deduplication.

Refuted hypotheses and checks:

- Same-path `router.invalidate()` does refresh PageRenderer state. The browser displayed value 2 after the loader returned value 2. The shared React state provider synchronizes changed initial-state pointers in an effect; the pathname key alone is not evidence of stale data.
- A Link `href` containing a query and hash preserved `/ok?sort=name#section` in the actual browser URL and TanStack location. Do not report a query/hash loss based only on passing the string through `to`.
- Empty-splat precedence for `/docs` versus `/docs/$`, `/blog/$slug` versus `/blog/$slug/$`, and `/` versus `/$` agrees with the pinned native TanStack oracle in `oracle.log`.
- Static percent-encoded route names were not elevated: direct native `matchRoutes` also rejected the percent-encoded static strings tested, so the helper-only difference is not independently established.
- Package tests passed: 7 files, 34 tests in `tests-current.log`.
- Package TypeScript check passed in `types-current.log`.
- `git diff --check` passed. The generic caller sweep found separate Next renderer functions with the same name; these are separate imports and not new TanStack callers.

Evidence ownership and runtime notes:

- Additional read-only artifacts: `xref-current.json`, `tests-current.log`, `types-current.log`, `callers-matchRoute.log`, `diff-check.log`, `covered-current.log`, `independent-oracles.mjs`, `independent-oracles.log`, `independent-browser-retry.json`, and this file.
- The FX wrapper rejected the installed runtime status schema with “unsupported auth mode: missing”. Its help was inspected once; the failed wrapper did not emit a JSON receipt. No key was logged.
- An attempted nested native reviewer returned no review; it supplies no review evidence and should not count as an independent pass.
- This file is a focused correctness review, not a Test Strength, Resilience, or Security Review receipt.
