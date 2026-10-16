# Approved contract: MCP circuit images

User: "ok hagamoslo asi y crea PR" (September 27, 2026), accepting image output by default and separate optional exploration.

A1. show_circuit returns one PNG content block and structured connectivity for valid recipes/documents/source, regardless of UI advertisement. It has no UI resource metadata or widget payload.
A2. explore_circuit alone advertises the MCP Apps resource. It provides interactive exploration in a compatible host and PNG fallback when the HTML MIME type is absent.
A3. Both tools use existing inert-data validators; invalid or oversized input returns an error without stale images/payloads. PNG failure is an explicit error. Subsequent valid calls recover.
A4. Optional exploration selects components/modules on the drawing and recipe nets on wires or keyboard. Context/message actions retain the selected identity. Controls are limited to zoom, existing scenes and contextual actions.
A5. Default preview is a real server-produced image, and returning to it removes the iframe. Cancellation, invalid results and rejected host requests are handled visibly without stale selection.
A6. Build, typecheck, changed-file Biome, full tests, installed package and browser checks are verified before creating the PR. Existing unrelated lint findings may be acknowledged with exact base evidence. Native inline rendering in this current chat is outside the verified compatibility claim.
A7. Open a PR from codex/mcp-apps. Do not merge, publish a package, or deploy.
