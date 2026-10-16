import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runWithHostsFileMock } from "./cli-fixture.js";

let stateDir: string;
const stale = "127.0.0.1 localhost\n\n# portless-start\n127.0.0.1 stale.test\n# portless-end\n\n192.0.2.10 keep.test\n";
beforeEach(() => {
  stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "review-cli-gap-"));
  fs.writeFileSync(path.join(stateDir, "routes.json"), "[]");
});
afterEach(() => fs.rmSync(stateDir, { recursive: true, force: true }));

describe("review gap CLI", () => {
  it("passes populated routes to the real writer instead of an empty list", () => {
    fs.writeFileSync(path.join(stateDir, "routes.json"), JSON.stringify([
      { hostname: "app.test", port: 3210, pid: process.pid },
      { hostname: "api.test", port: 3211, pid: process.pid },
    ]));
    const result = runWithHostsFileMock(["hosts", "sync"], { stateDir, content: stale, uid: 0 });
    expect(result.status).toBe(0);
    expect(result.capture.writes).toHaveLength(1);
    expect(result.capture.content).toContain("127.0.0.1 app.test");
    expect(result.capture.content).toContain("127.0.0.1 api.test");
    expect(result.capture.content).not.toContain("stale.test");
    expect(result.capture.content).toContain("127.0.0.1 localhost");
    expect(result.capture.content).toContain("192.0.2.10 keep.test");
  });

  it("returns failure when the stubbed sudo retry fails", () => {
    const result = runWithHostsFileMock(["hosts", "sync"], { stateDir, content: stale, uid: 1000, readMode: "initial-error", sudoStatus: 1 });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Failed to update");
    expect(result.capture.writes).toEqual([]);
    expect(result.capture.sudo).toMatchObject({ command: "sudo", args: expect.arrayContaining(["hosts", "sync"]) });
  });
});
