import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.resolve(__dirname, "../dist/cli.js");
/** Run the CLI with the given args and optional env/cwd overrides. */
function run(args: string[], options?: { env?: Record<string, string | undefined>; cwd?: string }) {
  const env: Record<string, string | undefined> = {
    ...process.env,
    ...options?.env,
    NO_COLOR: "1",
  };
  // Vitest runs under pnpm; strip parent-only vars so the CLI child does not look like pnpm dlx / npx.
  delete env.PNPM_SCRIPT_SRC_DIR;
  if (env.npm_command === "exec") {
    delete env.npm_command;
  }
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
    encoding: "utf-8",
    timeout: 10_000,
    env,
    cwd: options?.cwd,
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

type HostsFileMockOptions = {
  content: string;
  readMode?: "ok" | "initial-error" | "verification-error";
  writeMode?: "ok" | "error";
  uid?: number;
  sudoStatus?: number;
  stateDir: string;
};

type HostsFileMockCapture = {
  content: string;
  writes: string[];
  sudo: { command: string; args: string[] } | null;
};

/**
 * Run the built CLI with a preload that intercepts only hosts-file I/O. This
 * exercises the process boundary without reading, writing, or elevating against
 * the real system hosts file.
 */
export function runWithHostsFileMock(args: string[], options: HostsFileMockOptions) {
  const shimDir = fs.mkdtempSync(path.join(os.tmpdir(), "portless-hosts-cli-shim-"));
  const preloadPath = path.join(shimDir, "hosts-preload.cjs");
  const capturePath = path.join(shimDir, "hosts-capture.json");
  try {
    fs.writeFileSync(
      preloadPath,
      [
        'const fs = require("node:fs");',
        'const path = require("node:path");',
        'const childProcess = require("node:child_process");',
        'const { syncBuiltinESMExports } = require("node:module");',
        "const originalReadFileSync = fs.readFileSync;",
        "const originalWriteFileSync = fs.writeFileSync;",
        "const originalSpawnSync = childProcess.spawnSync;",
        'const hostsPath = process.platform === "win32"',
        '  ? path.join(process.env.SystemRoot || "C:\\\\Windows", "System32", "drivers", "etc", "hosts")',
        '  : "/etc/hosts";',
        'let content = process.env.PORTLESS_TEST_HOSTS_CONTENT || "";',
        "let reads = 0;",
        "const capture = { writes: [], sudo: null };",
        "fs.readFileSync = function (file, ...rest) {",
        "  if (String(file) !== hostsPath) return originalReadFileSync.call(this, file, ...rest);",
        "  reads += 1;",
        '  if (process.env.PORTLESS_TEST_HOSTS_READ_MODE === "initial-error" ||',
        '      (process.env.PORTLESS_TEST_HOSTS_READ_MODE === "verification-error" && reads > 1)) {',
        '    const error = new Error("hosts read failed");',
        '    error.code = "EACCES";',
        "    throw error;",
        "  }",
        "  return content;",
        "};",
        "fs.writeFileSync = function (file, data, ...rest) {",
        "  if (String(file) !== hostsPath) return originalWriteFileSync.call(this, file, data, ...rest);",
        "  capture.writes.push(String(data));",
        '  if (process.env.PORTLESS_TEST_HOSTS_WRITE_MODE === "error") {',
        '    const error = new Error("hosts write failed");',
        '    error.code = "EACCES";',
        "    throw error;",
        "  }",
        "  content = String(data);",
        "};",
        "if (process.env.PORTLESS_TEST_HOSTS_UID !== undefined) {",
        "  process.getuid = () => Number(process.env.PORTLESS_TEST_HOSTS_UID);",
        "}",
        "childProcess.spawnSync = function (command, commandArgs, spawnOptions) {",
        '  if (command !== "sudo") return originalSpawnSync.call(this, command, commandArgs, spawnOptions);',
        "  capture.sudo = { command, args: commandArgs };",
        '  return { status: Number(process.env.PORTLESS_TEST_HOSTS_SUDO_STATUS || "1") };',
        "};",
        "syncBuiltinESMExports();",
        'process.on("exit", () => {',
        "  originalWriteFileSync(process.env.PORTLESS_TEST_HOSTS_CAPTURE, JSON.stringify({ content, ...capture }));",
        "});",
      ].join("\n") + "\n"
    );

    const result = run(args, {
      env: {
        PORTLESS_STATE_DIR: options.stateDir,
        PORTLESS_TEST_HOSTS_CAPTURE: capturePath,
        PORTLESS_TEST_HOSTS_CONTENT: options.content,
        PORTLESS_TEST_HOSTS_READ_MODE: options.readMode ?? "ok",
        PORTLESS_TEST_HOSTS_WRITE_MODE: options.writeMode ?? "ok",
        PORTLESS_TEST_HOSTS_UID: String(options.uid ?? 0),
        PORTLESS_TEST_HOSTS_SUDO_STATUS: String(options.sudoStatus ?? 1),
        NODE_OPTIONS: `--require=${preloadPath}`,
      },
    });
    const capture = JSON.parse(fs.readFileSync(capturePath, "utf-8")) as HostsFileMockCapture;
    return { ...result, capture };
  } finally {
    fs.rmSync(shimDir, { recursive: true, force: true });
  }
}

