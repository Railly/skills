import { createRequire } from 'node:module';
const repo = '/Users/raillyhugo/Programming/vercel/json-render-334-review';
const require = createRequire(repo + '/packages/tanstack-start/package.json');
const { createRootRoute, createRoute, createRouter, createMemoryHistory, HeadContent, RouterProvider } = require('@tanstack/react-router');
const React = require('react');
const { renderToString } = require('react-dom/server');
const { matchRoute, createStartApp, collectStaticPaths, metadataToHead } = await import(repo + '/packages/tanstack-start/dist/server.mjs');
const page = { root: 'root', elements: { root: { type: 'Text', props: { value: 'x' }, children: [] } } };
for (const pattern of ['/about/', '/blog/$slug/', '/café', '/hello world']) {
  const root = createRootRoute();
  const route = createRoute({ getParentRoute: () => root, path: pattern });
  const router = createRouter({ routeTree: root.addChildren([route]), history: createMemoryHistory({ initialEntries: ['/'] }) });
  const spec = { routes: { [pattern]: { page } } };
  const pathname = pattern.replace('$slug', 'hello');
  const paths = [pathname, pathname.replace(/\/$/, ''), encodeURI(pathname)];
  for (const path of new Set(paths)) {
    const matches = router.matchRoutes(path);
    console.log(JSON.stringify({ kind: 'route', pattern, path, adapter: matchRoute(spec, path)?.pattern ?? null, tanstack: matches.at(-1)?.routeId, tsParams: matches.at(-1)?.params, prerender: collectStaticPaths(spec) }));
  }
}
const descriptors = metadataToHead({ openGraph: { images: ['https://example.com/primary.png', 'https://example.com/secondary.png'] }, twitter: { images: ['https://example.com/primary.png', 'https://example.com/secondary.png'] } });
const root = createRootRoute({ head: () => descriptors, component: () => React.createElement(HeadContent) });
const router = createRouter({ routeTree: root, history: createMemoryHistory({ initialEntries: ['/'] }) });
await router.load();
console.log(JSON.stringify({ kind: 'head', descriptors, html: renderToString(React.createElement(RouterProvider, { router })) }));
