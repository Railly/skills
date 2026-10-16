import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { alias: {
    "@json-render/core/store-utils": process.env.CORE_REVIEW_UTILS || "/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/store-utils.mjs",
    "@json-render/core": process.env.CORE_REVIEW_ENTRY || "/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/core/dist/index.mjs",
    react: "/Users/raillyhugo/Programming/vercel/json-render-336-review/node_modules/react",
    "react-dom": "/Users/raillyhugo/Programming/vercel/json-render-336-review/node_modules/react-dom"
  } },
  test: { environment: "jsdom", include: ["**/hook-proof.test.ts"], server: {deps: {inline: [/@json-render/]}} }
});
