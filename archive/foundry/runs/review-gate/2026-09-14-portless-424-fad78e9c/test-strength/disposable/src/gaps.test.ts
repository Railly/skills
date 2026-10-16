import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({ readFileSync: vi.fn(), writeFileSync: vi.fn() }));
import { readFileSync, writeFileSync } from "node:fs";
import { cleanHostsFile, syncHostsFile } from "./hosts.js";

const before = "127.0.0.1 localhost\n";
const after = "192.0.2.10 keep.test\n";
const stale = before + "\n# portless-start\n127.0.0.1 stale.test\n# portless-end\n\n" + after;

beforeEach(() => {
  vi.mocked(readFileSync).mockReset();
  vi.mocked(writeFileSync).mockReset();
});

describe("review gap helper", () => {
  it("rejects empty sync when a successful write leaves readable stale entries", () => {
    vi.mocked(readFileSync).mockReturnValue(stale);
    expect(syncHostsFile([])).toBe(false);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    expect(readFileSync).toHaveBeenCalledTimes(2);
  });

  it("cleanup succeeds without a write when no block exists", () => {
    vi.mocked(readFileSync).mockReturnValue(before + after);
    expect(cleanHostsFile()).toBe(true);
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it("cleanup removes stale entries and preserves unrelated records", () => {
    vi.mocked(readFileSync).mockReturnValue(stale);
    expect(cleanHostsFile()).toBe(true);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const written = String(vi.mocked(writeFileSync).mock.calls[0][1]);
    expect(written).toContain(before);
    expect(written).toContain(after);
    expect(written).not.toContain("stale.test");
    expect(written).not.toContain("portless-start");
  });

  it("cleanup reports write failure", () => {
    vi.mocked(readFileSync).mockReturnValue(stale);
    vi.mocked(writeFileSync).mockImplementation(() => { throw new Error("EACCES"); });
    expect(cleanHostsFile()).toBe(false);
    expect(writeFileSync).toHaveBeenCalledTimes(1);
  });
});
