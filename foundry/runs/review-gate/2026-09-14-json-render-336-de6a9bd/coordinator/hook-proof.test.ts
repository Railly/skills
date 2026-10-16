import { test, expect } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useUIStream } from "/Users/raillyhugo/Programming/vercel/json-render-336-review/packages/react/dist/index.mjs";
import { writeFileSync } from "node:fs";

test("built useUIStream compound patch behavior", async () => {
  const cases = [
    { name: "malformed_move_destination", state: { source: "keep", items: ["zero", "one"] }, patch: { op: "move", from: "/state/source", path: "/state/items/01" } },
    { name: "malformed_copy_source", state: { source: "keep", items: ["zero", "one"] }, patch: { op: "copy", from: "/state/items/01", path: "/state/copied" } },
    { name: "malformed_move_source", state: { items: ["zero", "one"] }, patch: { op: "move", from: "/state/items/01", path: "/state/moved" } },
    { name: "valid_move", state: { source: "keep", items: ["zero", "one"] }, patch: { op: "move", from: "/state/source", path: "/state/items/1" } }
  ];
  const observations = [];
  for (const c of cases) {
    const lines = [{ op: "add", path: "/state", value: c.state }, c.patch, { op: "add", path: "/state/later", value: "accepted" }].map(JSON.stringify).join("\n") + "\n";
    const original = globalThis.fetch;
    globalThis.fetch = async () => new Response(lines, { headers: { "Content-Type": "application/jsonl" } });
    const { result, unmount } = renderHook(() => useUIStream({ api: "/local-proof" }));
    try {
      await act(async () => { await result.current.send("apply patches"); });
      expect(result.current.error).toBeNull();
      expect(result.current.spec.state.later).toBe("accepted");
      observations.push({ name: c.name, state: result.current.spec.state, keys: Object.keys(result.current.spec.state), copiedIsUndefined: Object.hasOwn(result.current.spec.state, "copied") && result.current.spec.state.copied === undefined, movedIsUndefined: Object.hasOwn(result.current.spec.state, "moved") && result.current.spec.state.moved === undefined });
    } finally { globalThis.fetch = original; unmount(); cleanup(); }
  }
  writeFileSync(process.env.HOOK_PROOF_OUTPUT!, JSON.stringify(observations,null,2)+"\n");
});
