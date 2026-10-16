const target = '/Users/raillyhugo/Programming/vercel/json-render-336-review';
const out = new URL('.', import.meta.url).pathname;
const run = new URL('..', import.meta.url).pathname;
const core = process.env.AUDIT_VARIANT === 'base' ? `${run}/base-typecheck/packages/core/dist` : `${target}/packages/core/dist`;
export default {
  root: out,
  cacheDir: `${out}/vite-cache-${process.env.AUDIT_VARIANT || 'head'}`,
  resolve: {
    alias: [
      { find: /^zod$/, replacement: '/Users/raillyhugo/Programming/vercel/json-render/node_modules/.pnpm/zod@4.3.6/node_modules/zod/index.js' },
      { find: /^@json-render\/core\/store-utils$/, replacement: `${core}/store-utils.mjs` },
      { find: /^@json-render\/core$/, replacement: `${core}/index.mjs` },
      { find: `${target}/packages/core/dist/store-utils.mjs`, replacement: `${core}/store-utils.mjs` },
      { find: `${target}/packages/core/dist/index.mjs`, replacement: `${core}/index.mjs` },
      { find: 'react-dom', replacement: `${target}/node_modules/react-dom` },
      { find: 'react', replacement: `${target}/node_modules/react` },
      { find: '@testing-library/react', replacement: `${target}/node_modules/@testing-library/react/dist/index.js` },
      { find: 'vitest', replacement: `${target}/node_modules/vitest/dist/index.js` }
    ]
  },
  test: {
    environment: 'jsdom',
    include: ['pressure.test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 15000,
    cache: false,
    server: { deps: { inline: [/@json-render/, /consumer\/index/, /packages\/react\/dist/, /packages\/core\/dist/] } }
  }
};
