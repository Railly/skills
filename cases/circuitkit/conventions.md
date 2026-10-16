# CircuitKit repository conventions

Compiled from package.json, README.md and the current workspace instructions on 2026-09-27.

- Use Bun for package operations and Biome for TypeScript/JavaScript formatting.
- Build before the full test suite: package tests inspect emitted artifacts.
- Preserve the public core, React and Node export boundaries and the public npm registry lockfile policy.
- CircuitKit renders declared connectivity; illustrative flows are not electrical simulation.
- Test built/installed CLI executables when changing package distribution.
- Keep generated test artifacts, dependencies and local source paths out of the PR.
- No release or deployment is implied by a request to open a PR.

## MCP surfaces

```surfaces
src/mcp/server.ts :: src/mcp/cli.ts, docs/mcp-apps.md, README.md, tests/mcp.test.ts
src/mcp/view.tsx :: scripts/check-mcp-browser.ts, docs/mcp-apps.md
scripts/build-mcp.ts :: scripts/build.ts, package.json, tests/package-education-build.test.ts
```
