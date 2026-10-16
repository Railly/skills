#!/usr/bin/env node
import {
  FILE_MODE,
  HOSTS_SYNC_AUTH_CHALLENGE_HEADER,
  HOSTS_SYNC_AUTH_HEADER,
  HOSTS_SYNC_AUTH_PROOF_HEADER,
  HOSTS_SYNC_PATH,
  PORTLESS_HEADER,
  RouteConflictError,
  RouteStore,
  checkHostResolution,
  cleanHostsFile,
  createHostsSyncProof,
  createHttpRedirectServer,
  createLoopbackConnection,
  createProxyServer,
  fixOwnership,
  formatUrl,
  generateHostsSyncChallenge,
  generateHostsSyncToken,
  getManagedHostnames,
  isErrnoException,
  isProcessAlive,
  isValidHostsSyncToken,
  parseHostname,
  parseHostnames,
  readHostsSyncToken,
  removeHostsSyncToken,
  resolveUserHome,
  shouldAutoSyncHosts,
  syncHostsFile,
  writeHostsSyncToken
} from "./chunk-RQ7SS7J3.js";

// src/colors.ts
function supportsColor() {
  if ("NO_COLOR" in process.env) return false;
  if ("FORCE_COLOR" in process.env) return true;
  return !!(process.stdout.isTTY || process.stderr.isTTY);
}
var enabled = supportsColor();
var wrap = (open, close) => {
  if (!enabled) return (s) => s;
  return (s) => `\x1B[${open}m${s}\x1B[${close}m`;
};
var identity = (s) => s;
var bold = wrap("1", "22");
var dim = wrap("2", "22");
var red = wrap("31", "39");
var green = identity;
var yellow = wrap("33", "39");
var blue = Object.assign(identity, { bold });
var cyan = Object.assign(identity, { bold });
var white = identity;
var gray = dim;
var colors_default = { bold, dim, red, green, yellow, blue, cyan, white, gray };

// src/cli.ts
import * as fs10 from "fs";
import * as path9 from "path";
import { spawn as spawn4, spawnSync as spawnSync5 } from "child_process";
import { StringDecoder } from "string_decoder";

// src/certs.ts
import * as fs2 from "fs";
import * as path from "path";
import * as crypto2 from "crypto";
import * as tls from "tls";
import { execFile as execFileCb, execFileSync as execFileSync2 } from "child_process";
import { promisify } from "util";

// src/windows-ca.ts
import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import { execFileSync } from "child_process";
var WINDOWS_COMMAND_TIMEOUT_MS = 3e4;
var commandOptions = {
  encoding: "utf-8",
  timeout: WINDOWS_COMMAND_TIMEOUT_MS,
  stdio: ["pipe", "pipe", "pipe"]
};
var defaultRunner = (command, args, options) => execFileSync(command, args, options);
function isWSL(options = {}) {
  const platform = options.platform ?? process.platform;
  if (platform !== "linux") return false;
  const env = options.env ?? process.env;
  if (env.WSL_DISTRO_NAME || env.WSL_INTEROP) return true;
  const release2 = options.release ?? os.release();
  return release2.toLowerCase().includes("microsoft");
}
function wslWindowsCAStoreOptions(run = defaultRunner) {
  const command = run(
    "wslpath",
    ["-u", String.raw`C:\Windows\System32\certutil.exe`],
    commandOptions
  ).trim();
  return {
    command,
    certificatePath: (certificatePath) => run("wslpath", ["-w", certificatePath], commandOptions).trim(),
    run
  };
}
function certificateFingerprint(certificatePath) {
  const certificate = new crypto.X509Certificate(fs.readFileSync(certificatePath));
  return certificate.fingerprint.replace(/:/g, "").toLowerCase();
}
function storeOptions(options) {
  return {
    command: options.command ?? "certutil",
    certificatePath: options.certificatePath ?? ((certificatePath) => certificatePath),
    run: options.run ?? defaultRunner
  };
}
function storeContainsFingerprint(fingerprint, resolved) {
  const listing = resolved.run(resolved.command, ["-store", "-user", "Root"], commandOptions);
  return listing.replace(/\s/g, "").toLowerCase().includes(fingerprint);
}
function isWindowsCATrusted(caCertPath, options = {}) {
  try {
    const resolved = storeOptions(options);
    const fingerprint = certificateFingerprint(caCertPath);
    return storeContainsFingerprint(fingerprint, resolved);
  } catch {
    return false;
  }
}
function trustWindowsCA(caCertPath, options = {}) {
  const resolved = storeOptions(options);
  resolved.run(
    resolved.command,
    ["-addstore", "-user", "Root", resolved.certificatePath(caCertPath)],
    commandOptions
  );
}
function untrustWindowsCA(caCertPath, options = {}) {
  try {
    const resolved = storeOptions(options);
    const fingerprint = certificateFingerprint(caCertPath);
    if (!storeContainsFingerprint(fingerprint, resolved)) return { removed: true };
    resolved.run(resolved.command, ["-delstore", "-user", "Root", fingerprint], commandOptions);
    return storeContainsFingerprint(fingerprint, resolved) ? { removed: false, error: "certutil could not remove the portless CA from Root" } : { removed: true };
  } catch (error) {
    return { removed: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// src/certs.ts
var CA_VALIDITY_DAYS = 3650;
var SERVER_VALIDITY_DAYS = 365;
var EXPIRY_BUFFER_MS = 7 * 24 * 60 * 60 * 1e3;
var CA_COMMON_NAME = "portless Local CA";
var OPENSSL_TIMEOUT_MS = 15e3;
var MACOS_SECURITY_TIMEOUT_MS = 15e3;
var MACOS_SECURITY_AUTH_TIMEOUT_MS = 12e4;
var MACOS_SECURITY_ROOT_TIMEOUT_MS = 6e4;
var CA_KEY_FILE = "ca-key.pem";
var CA_CERT_FILE = "ca.pem";
var SERVER_KEY_FILE = "server-key.pem";
var SERVER_CERT_FILE = "server.pem";
var CA_TRUST_MARKER = "ca.trusted";
var CA_TRUST_REFRESH_PENDING = "ca.trust-refresh-pending";
function fileExists(filePath) {
  try {
    fs2.accessSync(filePath, fs2.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}
function caFingerprint(stateDir) {
  const caCertPath = path.join(stateDir, CA_CERT_FILE);
  try {
    const pem = fs2.readFileSync(caCertPath);
    return crypto2.createHash("sha256").update(pem).digest("hex");
  } catch {
    return null;
  }
}
function readTrustMarker(stateDir) {
  try {
    const value = fs2.readFileSync(path.join(stateDir, CA_TRUST_MARKER), "utf-8").trim();
    return value || null;
  } catch {
    return null;
  }
}
function clearTrustRefreshPending(stateDir) {
  try {
    fs2.unlinkSync(path.join(stateDir, CA_TRUST_REFRESH_PENDING));
  } catch {
  }
}
function writeTrustMarker(stateDir) {
  const fp = caFingerprint(stateDir);
  if (fp) {
    clearTrustRefreshPending(stateDir);
    const marker = isWSL() ? `wsl:${fp}` : fp;
    fs2.writeFileSync(path.join(stateDir, CA_TRUST_MARKER), marker + "\n");
    fixOwnership(path.join(stateDir, CA_TRUST_MARKER));
  }
}
function clearTrustMarker(stateDir) {
  try {
    fs2.unlinkSync(path.join(stateDir, CA_TRUST_MARKER));
  } catch {
  }
}
var _opensslEnv;
function getOpensslEnv() {
  if (process.platform !== "win32") return void 0;
  if (_opensslEnv !== void 0) return _opensslEnv;
  if (process.env.OPENSSL_CONF && fileExists(process.env.OPENSSL_CONF)) {
    _opensslEnv = {};
    return _opensslEnv;
  }
  const candidates = [
    // Git-for-Windows bundles OpenSSL here
    path.join("C:", "Program Files", "Git", "mingw64", "etc", "ssl", "openssl.cnf"),
    path.join("C:", "Program Files", "Git", "usr", "ssl", "openssl.cnf"),
    // Standalone OpenSSL installers
    path.join("C:", "Program Files", "OpenSSL-Win64", "bin", "cnf", "openssl.cnf"),
    path.join("C:", "Program Files", "OpenSSL-Win64", "openssl.cnf"),
    path.join("C:", "Program Files (x86)", "OpenSSL-Win32", "bin", "cnf", "openssl.cnf"),
    // Common winget/chocolatey install paths
    path.join("C:", "Program Files", "OpenSSL", "bin", "cnf", "openssl.cnf")
  ];
  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      _opensslEnv = { OPENSSL_CONF: candidate };
      return _opensslEnv;
    }
  }
  _opensslEnv = {};
  return _opensslEnv;
}
function opensslErrorMessage() {
  if (process.platform === "win32") {
    return "Make sure openssl is installed and working.\nInstall via: winget install -e --id ShiningLight.OpenSSL.Dev\nIf already installed, set OPENSSL_CONF to the path of your openssl.cnf file.";
  }
  return "Make sure openssl is installed (ships with macOS and most Linux distributions).";
}
function isCertValid(certPath) {
  try {
    const pem = fs2.readFileSync(certPath, "utf-8");
    const cert = new crypto2.X509Certificate(pem);
    const expiry = new Date(cert.validTo).getTime();
    return Date.now() + EXPIRY_BUFFER_MS < expiry;
  } catch {
    return false;
  }
}
function isCertSansComplete(certPath) {
  try {
    const text = openssl(["x509", "-in", certPath, "-noout", "-text"]);
    return /DNS:\*\.local\b/.test(text);
  } catch {
    return false;
  }
}
function isCertSignatureStrong(certPath) {
  try {
    const text = openssl(["x509", "-in", certPath, "-noout", "-text"]);
    const match = text.match(/Signature Algorithm:\s*(\S+)/i);
    if (!match) return false;
    const algo = match[1].toLowerCase();
    return !algo.includes("sha1");
  } catch {
    return false;
  }
}
function openssl(args, options) {
  try {
    const extraEnv = getOpensslEnv();
    return execFileSync2("openssl", args, {
      encoding: "utf-8",
      timeout: OPENSSL_TIMEOUT_MS,
      input: options?.input,
      stdio: ["pipe", "pipe", "pipe"],
      ...extraEnv && Object.keys(extraEnv).length > 0 ? { env: { ...process.env, ...extraEnv } } : {}
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`openssl failed: ${message}

${opensslErrorMessage()}`);
  }
}
var execFileAsync = promisify(execFileCb);
async function opensslAsync(args) {
  try {
    const extraEnv = getOpensslEnv();
    const { stdout } = await execFileAsync("openssl", args, {
      encoding: "utf-8",
      timeout: OPENSSL_TIMEOUT_MS,
      ...extraEnv && Object.keys(extraEnv).length > 0 ? { env: { ...process.env, ...extraEnv } } : {}
    });
    return stdout;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`openssl failed: ${message}

${opensslErrorMessage()}`);
  }
}
function generateCA(stateDir) {
  const keyPath = path.join(stateDir, CA_KEY_FILE);
  const certPath = path.join(stateDir, CA_CERT_FILE);
  openssl(["ecparam", "-genkey", "-name", "prime256v1", "-noout", "-out", keyPath]);
  openssl([
    "req",
    "-new",
    "-x509",
    "-sha256",
    "-key",
    keyPath,
    "-out",
    certPath,
    "-days",
    CA_VALIDITY_DAYS.toString(),
    "-subj",
    `/CN=${CA_COMMON_NAME}`,
    "-addext",
    "basicConstraints=critical,CA:TRUE",
    "-addext",
    "keyUsage=critical,keyCertSign,cRLSign"
  ]);
  fs2.chmodSync(keyPath, 384);
  fs2.chmodSync(certPath, 420);
  fixOwnership(keyPath, certPath);
  clearTrustMarker(stateDir);
  return { certPath, keyPath };
}
function generateServerCert(stateDir) {
  const caKeyPath = path.join(stateDir, CA_KEY_FILE);
  const caCertPath = path.join(stateDir, CA_CERT_FILE);
  const serverKeyPath = path.join(stateDir, SERVER_KEY_FILE);
  const serverCertPath = path.join(stateDir, SERVER_CERT_FILE);
  const csrPath = path.join(stateDir, "server.csr");
  const extPath = path.join(stateDir, "server-ext.cnf");
  openssl(["ecparam", "-genkey", "-name", "prime256v1", "-noout", "-out", serverKeyPath]);
  openssl(["req", "-new", "-key", serverKeyPath, "-out", csrPath, "-subj", "/CN=localhost"]);
  const sans = ["DNS:localhost", "DNS:*.localhost", "DNS:*.local"];
  fs2.writeFileSync(
    extPath,
    [
      "authorityKeyIdentifier=keyid,issuer",
      "basicConstraints=CA:FALSE",
      "keyUsage=digitalSignature,keyEncipherment",
      "extendedKeyUsage=serverAuth",
      `subjectAltName=${sans.join(",")}`
    ].join("\n") + "\n"
  );
  const srlPath = path.join(stateDir, "ca.srl");
  if (!fileExists(srlPath)) {
    fs2.writeFileSync(
      srlPath,
      crypto2.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase() + "\n"
    );
  }
  openssl([
    "x509",
    "-req",
    "-sha256",
    "-in",
    csrPath,
    "-CA",
    caCertPath,
    "-CAkey",
    caKeyPath,
    "-CAserial",
    srlPath,
    "-out",
    serverCertPath,
    "-days",
    SERVER_VALIDITY_DAYS.toString(),
    "-extfile",
    extPath
  ]);
  for (const tmp of [csrPath, extPath]) {
    try {
      fs2.unlinkSync(tmp);
    } catch {
    }
  }
  fs2.chmodSync(serverKeyPath, 384);
  fs2.chmodSync(serverCertPath, 420);
  fixOwnership(serverKeyPath, serverCertPath);
  return { certPath: serverCertPath, keyPath: serverKeyPath };
}
function ensureCerts(stateDir) {
  const caCertPath = path.join(stateDir, CA_CERT_FILE);
  const caKeyPath = path.join(stateDir, CA_KEY_FILE);
  const serverCertPath = path.join(stateDir, SERVER_CERT_FILE);
  const serverKeyPath = path.join(stateDir, SERVER_KEY_FILE);
  let caGenerated = false;
  const caMissing = !fileExists(caCertPath) || !fileExists(caKeyPath) || !isCertValid(caCertPath) || !isCertSignatureStrong(caCertPath);
  if (caMissing) {
    generateCA(stateDir);
    caGenerated = true;
  }
  if (caGenerated || !fileExists(serverCertPath) || !fileExists(serverKeyPath) || !isCertValid(serverCertPath) || !isCertSignatureStrong(serverCertPath) || !isCertSansComplete(serverCertPath)) {
    generateServerCert(stateDir);
  }
  return {
    certPath: serverCertPath,
    keyPath: serverKeyPath,
    caPath: caCertPath,
    caGenerated
  };
}
function isCATrusted(stateDir) {
  const caCertPath = path.join(stateDir, CA_CERT_FILE);
  if (!fileExists(caCertPath)) return false;
  const marker = readTrustMarker(stateDir);
  if (marker) {
    const fp = caFingerprint(stateDir);
    const expected = fp && isWSL() ? `wsl:${fp}` : fp;
    if (expected && marker === expected) return true;
  }
  if (process.platform === "darwin") {
    return isCATrustedMacOS(caCertPath);
  } else if (process.platform === "linux") {
    if (!isCATrustedLinux(stateDir)) return false;
    if (!isWSL()) return true;
    try {
      return isWindowsCATrusted(caCertPath, wslWindowsCAStoreOptions());
    } catch {
      return false;
    }
  } else if (process.platform === "win32") {
    return isWindowsCATrusted(caCertPath);
  }
  return false;
}
function isCATrustedMacOS(caCertPath) {
  try {
    const isRoot = (process.getuid?.() ?? -1) === 0;
    const sudoUser = process.env.SUDO_USER;
    if (isRoot && sudoUser) {
      execFileSync2(
        "sudo",
        ["-u", sudoUser, "security", "verify-cert", "-c", caCertPath, "-L", "-p", "ssl"],
        {
          stdio: "pipe",
          timeout: MACOS_SECURITY_TIMEOUT_MS
        }
      );
    } else {
      execFileSync2("security", ["verify-cert", "-c", caCertPath, "-L", "-p", "ssl"], {
        stdio: "pipe",
        timeout: MACOS_SECURITY_TIMEOUT_MS
      });
    }
    return true;
  } catch {
    return false;
  }
}
function loginKeychainPath() {
  try {
    const result = execFileSync2("security", ["default-keychain"], {
      encoding: "utf-8",
      timeout: MACOS_SECURITY_TIMEOUT_MS
    }).trim();
    const match = result.match(/"(.+)"/);
    if (match) return match[1];
  } catch {
  }
  const home = process.env.HOME || `/Users/${process.env.USER || "unknown"}`;
  return path.join(home, "Library", "Keychains", "login.keychain-db");
}
var LINUX_CA_TRUST_CONFIGS = {
  debian: {
    certDir: "/usr/local/share/ca-certificates",
    updateCommand: "update-ca-certificates"
  },
  arch: {
    certDir: "/etc/ca-certificates/trust-source/anchors",
    updateCommand: "update-ca-trust"
  },
  fedora: {
    certDir: "/etc/pki/ca-trust/source/anchors",
    updateCommand: "update-ca-trust"
  },
  suse: {
    certDir: "/etc/pki/trust/anchors",
    updateCommand: "update-ca-certificates"
  }
};
function detectLinuxDistro() {
  try {
    const osRelease = fs2.readFileSync("/etc/os-release", "utf-8").toLowerCase();
    if (osRelease.includes("arch")) return "arch";
    if (osRelease.includes("fedora") || osRelease.includes("rhel") || osRelease.includes("centos"))
      return "fedora";
    if (osRelease.includes("suse")) return "suse";
    if (osRelease.includes("debian") || osRelease.includes("ubuntu")) return "debian";
  } catch {
  }
  for (const [distro, config] of Object.entries(LINUX_CA_TRUST_CONFIGS)) {
    try {
      execFileSync2("which", [config.updateCommand], { stdio: "pipe", timeout: 5e3 });
      if (fs2.existsSync(path.dirname(config.certDir))) return distro;
    } catch {
    }
  }
  return void 0;
}
function getLinuxCATrustConfig() {
  const distro = detectLinuxDistro();
  return LINUX_CA_TRUST_CONFIGS[distro ?? "debian"];
}
function isCATrustedLinux(stateDir, config = getLinuxCATrustConfig()) {
  const systemCertPath = path.join(config.certDir, "portless-ca.crt");
  if (!fileExists(systemCertPath)) return false;
  try {
    const ours = fs2.readFileSync(path.join(stateDir, CA_CERT_FILE), "utf-8").trim();
    const installed = fs2.readFileSync(systemCertPath, "utf-8").trim();
    return ours === installed;
  } catch {
    return false;
  }
}
var HOST_CERTS_DIR = "host-certs";
var CERT_FILENAME_SUFFIX_LEN = "-key.pem".length;
var MAX_FILENAME_BASE = 255 - CERT_FILENAME_SUFFIX_LEN;
function sanitizeHostForFilename(hostname) {
  const safe = hostname.replace(/\./g, "_").replace(/[^a-z0-9_-]/gi, "");
  if (safe.length <= MAX_FILENAME_BASE) {
    return safe;
  }
  const hash = crypto2.createHash("sha256").update(hostname).digest("hex").slice(0, 16);
  const prefix = safe.slice(0, MAX_FILENAME_BASE - hash.length - 1);
  return `${prefix}_${hash}`;
}
var MAX_CN_LENGTH = 64;
async function generateHostCertAsync(stateDir, hostname) {
  const caKeyPath = path.join(stateDir, CA_KEY_FILE);
  const caCertPath = path.join(stateDir, CA_CERT_FILE);
  const hostDir = path.join(stateDir, HOST_CERTS_DIR);
  if (!fs2.existsSync(hostDir)) {
    await fs2.promises.mkdir(hostDir, { recursive: true, mode: 493 });
    fixOwnership(hostDir);
  }
  const safeName = sanitizeHostForFilename(hostname);
  const keyPath = path.join(hostDir, `${safeName}-key.pem`);
  const certPath = path.join(hostDir, `${safeName}.pem`);
  const csrPath = path.join(hostDir, `${safeName}.csr`);
  const extPath = path.join(hostDir, `${safeName}-ext.cnf`);
  await opensslAsync(["ecparam", "-genkey", "-name", "prime256v1", "-noout", "-out", keyPath]);
  const cn = hostname.length > MAX_CN_LENGTH ? hostname.slice(0, MAX_CN_LENGTH) : hostname;
  await opensslAsync(["req", "-new", "-key", keyPath, "-out", csrPath, "-subj", `/CN=${cn}`]);
  const sans = [`DNS:${hostname}`];
  const parts = hostname.split(".");
  if (parts.length >= 2) {
    sans.push(`DNS:*.${parts.slice(1).join(".")}`);
  }
  await fs2.promises.writeFile(
    extPath,
    [
      "authorityKeyIdentifier=keyid,issuer",
      "basicConstraints=CA:FALSE",
      "keyUsage=digitalSignature,keyEncipherment",
      "extendedKeyUsage=serverAuth",
      `subjectAltName=${sans.join(",")}`
    ].join("\n") + "\n"
  );
  const srlPath = path.join(stateDir, "ca.srl");
  if (!fs2.existsSync(srlPath)) {
    await fs2.promises.writeFile(
      srlPath,
      crypto2.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase() + "\n"
    );
  }
  await opensslAsync([
    "x509",
    "-req",
    "-sha256",
    "-in",
    csrPath,
    "-CA",
    caCertPath,
    "-CAkey",
    caKeyPath,
    "-CAserial",
    srlPath,
    "-out",
    certPath,
    "-days",
    SERVER_VALIDITY_DAYS.toString(),
    "-extfile",
    extPath
  ]);
  for (const tmp of [csrPath, extPath]) {
    try {
      await fs2.promises.unlink(tmp);
    } catch {
    }
  }
  await fs2.promises.chmod(keyPath, 384);
  await fs2.promises.chmod(certPath, 420);
  fixOwnership(keyPath, certPath);
  return { certPath, keyPath };
}
function createSNICallback(stateDir, defaultCert, defaultKey, tlds = "localhost", caCert) {
  const cache = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Map();
  const configuredTlds = Array.isArray(tlds) ? tlds : [tlds];
  const defaultCtx = tls.createSecureContext({
    cert: caCert ? Buffer.concat([defaultCert, caCert]) : defaultCert,
    key: defaultKey
  });
  return (servername, cb) => {
    if (servername === "localhost" && configuredTlds.includes("localhost")) {
      cb(null, defaultCtx);
      return;
    }
    if (cache.has(servername)) {
      cb(null, cache.get(servername));
      return;
    }
    const safeName = sanitizeHostForFilename(servername);
    const hostDir = path.join(stateDir, HOST_CERTS_DIR);
    const certPath = path.join(hostDir, `${safeName}.pem`);
    const keyPath = path.join(hostDir, `${safeName}-key.pem`);
    if (fileExists(certPath) && fileExists(keyPath) && isCertValid(certPath) && isCertSignatureStrong(certPath)) {
      try {
        const hostCert = fs2.readFileSync(certPath);
        const ctx = tls.createSecureContext({
          cert: caCert ? Buffer.concat([hostCert, caCert]) : hostCert,
          key: fs2.readFileSync(keyPath)
        });
        cache.set(servername, ctx);
        cb(null, ctx);
        return;
      } catch {
      }
    }
    if (pending.has(servername)) {
      pending.get(servername).then((ctx) => cb(null, ctx)).catch((err) => cb(err instanceof Error ? err : new Error(String(err))));
      return;
    }
    const promise = generateHostCertAsync(stateDir, servername).then(async (generated) => {
      const [hostCert, key] = await Promise.all([
        fs2.promises.readFile(generated.certPath),
        fs2.promises.readFile(generated.keyPath)
      ]);
      return tls.createSecureContext({
        cert: caCert ? Buffer.concat([hostCert, caCert]) : hostCert,
        key
      });
    });
    pending.set(servername, promise);
    promise.then((ctx) => {
      cache.set(servername, ctx);
      pending.delete(servername);
      cb(null, ctx);
    }).catch((err) => {
      pending.delete(servername);
      cb(err instanceof Error ? err : new Error(String(err)));
    });
  };
}
function trustCA(stateDir) {
  const caCertPath = path.join(stateDir, CA_CERT_FILE);
  if (!fileExists(caCertPath)) {
    return {
      trusted: false,
      error: "CA certificate not found. Run portless trust to generate it."
    };
  }
  try {
    if (process.platform === "darwin") {
      const isRoot = (process.getuid?.() ?? -1) === 0;
      if (isRoot) {
        execFileSync2(
          "security",
          [
            "add-trusted-cert",
            "-d",
            "-r",
            "trustRoot",
            "-k",
            "/Library/Keychains/System.keychain",
            caCertPath
          ],
          { stdio: "pipe", timeout: MACOS_SECURITY_ROOT_TIMEOUT_MS }
        );
      } else {
        const keychain = loginKeychainPath();
        execFileSync2(
          "security",
          ["add-trusted-cert", "-r", "trustRoot", "-k", keychain, caCertPath],
          { stdio: "pipe", timeout: MACOS_SECURITY_AUTH_TIMEOUT_MS }
        );
      }
      writeTrustMarker(stateDir);
      return { trusted: true };
    } else if (process.platform === "linux") {
      const config = getLinuxCATrustConfig();
      if (!fs2.existsSync(config.certDir)) {
        fs2.mkdirSync(config.certDir, { recursive: true });
      }
      const dest = path.join(config.certDir, "portless-ca.crt");
      fs2.copyFileSync(caCertPath, dest);
      execFileSync2(config.updateCommand, [], { stdio: "pipe", timeout: 3e4 });
      if (isWSL()) {
        trustWindowsCA(caCertPath, wslWindowsCAStoreOptions());
      }
      writeTrustMarker(stateDir);
      return { trusted: true };
    } else if (process.platform === "win32") {
      trustWindowsCA(caCertPath);
      writeTrustMarker(stateDir);
      return { trusted: true };
    }
    return { trusted: false, error: `Unsupported platform: ${process.platform}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ETIMEDOUT")) {
      const hint = process.platform === "darwin" ? "The macOS security command timed out. This can happen when the Keychain Services daemon is unresponsive or a system authorization dialog was not dismissed in time. Try restarting Keychain Access (or run: sudo killall securityd) and then: portless trust" : "The trust command timed out. Try: portless trust";
      return { trusted: false, error: hint };
    }
    if (message.includes("authorization") || message.includes("permission") || message.includes("EACCES")) {
      return {
        trusted: false,
        error: "Permission denied. Try: portless trust"
      };
    }
    return { trusted: false, error: message };
  }
}
function untrustCA(stateDir) {
  const caCertPath = path.join(stateDir, CA_CERT_FILE);
  if (!fileExists(caCertPath)) {
    clearTrustMarker(stateDir);
    return { removed: true };
  }
  const runningInWSL = isWSL();
  try {
    let result;
    if (process.platform === "darwin") {
      result = untrustCAMacOS(caCertPath);
    } else if (process.platform === "linux") {
      result = runningInWSL ? untrustCAWSL(stateDir, caCertPath) : untrustCALinux(stateDir);
    } else if (process.platform === "win32") {
      result = untrustWindowsCA(caCertPath);
    } else {
      result = { removed: false, error: `Unsupported platform: ${process.platform}` };
    }
    if (result.removed) clearTrustMarker(stateDir);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { removed: false, error: message };
  }
}
function untrustCAMacOS(caCertPath) {
  const errors = [];
  const tryExec = (args) => {
    try {
      execFileSync2("security", args, { stdio: "pipe", timeout: MACOS_SECURITY_ROOT_TIMEOUT_MS });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
      return false;
    }
  };
  tryExec(["remove-trusted-cert", caCertPath]);
  const keychains = [loginKeychainPath(), "/Library/Keychains/System.keychain"];
  for (const kc of keychains) {
    for (let i = 0; i < 20; i++) {
      if (!tryExec(["delete-certificate", "-c", CA_COMMON_NAME, kc])) break;
    }
  }
  return isCATrustedMacOSAfterAttempt(caCertPath) ? { removed: false, error: errors.join("; ") || "Could not remove CA from keychain (try sudo)" } : { removed: true };
}
function isCATrustedMacOSAfterAttempt(caCertPath) {
  try {
    const isRoot = (process.getuid?.() ?? -1) === 0;
    const sudoUser = process.env.SUDO_USER;
    if (isRoot && sudoUser) {
      execFileSync2(
        "sudo",
        ["-u", sudoUser, "security", "verify-cert", "-c", caCertPath, "-L", "-p", "ssl"],
        { stdio: "pipe", timeout: MACOS_SECURITY_TIMEOUT_MS }
      );
    } else {
      execFileSync2("security", ["verify-cert", "-c", caCertPath, "-L", "-p", "ssl"], {
        stdio: "pipe",
        timeout: MACOS_SECURITY_TIMEOUT_MS
      });
    }
    return true;
  } catch {
    return false;
  }
}
function untrustCALinux(stateDir, options = {}) {
  const errors = [];
  const pendingRefreshPath = path.join(stateDir, CA_TRUST_REFRESH_PENDING);
  let refreshNeeded = fileExists(pendingRefreshPath);
  const configs = options.configs ?? Object.values(LINUX_CA_TRUST_CONFIGS);
  const activeConfig = options.activeConfig ?? getLinuxCATrustConfig();
  const runUpdate = options.runUpdate ?? ((command) => {
    execFileSync2(command, [], { stdio: "pipe", timeout: 3e4 });
  });
  for (const config of configs) {
    const dest = path.join(config.certDir, "portless-ca.crt");
    try {
      if (fileExists(dest)) {
        const ours = fs2.readFileSync(path.join(stateDir, CA_CERT_FILE), "utf-8").trim();
        const installed = fs2.readFileSync(dest, "utf-8").trim();
        if (ours === installed) {
          if (!refreshNeeded) {
            fs2.writeFileSync(pendingRefreshPath, "1\n");
            fixOwnership(pendingRefreshPath);
            refreshNeeded = true;
          }
          fs2.unlinkSync(dest);
        }
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  if (refreshNeeded) {
    try {
      runUpdate(activeConfig.updateCommand);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }
  if (errors.length > 0 || isCATrustedLinux(stateDir, activeConfig)) {
    return {
      removed: false,
      error: errors.join("; ") || "CA still trusted (remove portless-ca.crt and run the distro CA update command, often with sudo)"
    };
  }
  clearTrustRefreshPending(stateDir);
  return { removed: true };
}
function untrustCAWSL(stateDir, caCertPath) {
  const linuxResult = untrustCALinux(stateDir);
  let windowsResult;
  try {
    windowsResult = untrustWindowsCA(caCertPath, wslWindowsCAStoreOptions());
  } catch (err) {
    windowsResult = {
      removed: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
  if (linuxResult.removed && windowsResult.removed) return { removed: true };
  const errors = [linuxResult.error, windowsResult.error].filter(Boolean);
  return {
    removed: false,
    error: errors.join("; ") || "Could not remove the portless CA from every WSL trust store"
  };
}

// src/tailscale.ts
import { spawnSync } from "child_process";
var TAILSCALE_BINARY = "tailscale";
var TAILSCALE_COMMAND_TIMEOUT_MS = 3e4;
var PREFERRED_SERVE_PORTS = [443, 8443, 8444, 8445, 8446, 8447, 8448, 8449, 8450];
var FUNNEL_PORTS = [443, 8443, 1e4];
function defaultRunner2(args) {
  const result = spawnSync(TAILSCALE_BINARY, args, {
    encoding: "utf-8",
    killSignal: "SIGKILL",
    timeout: TAILSCALE_COMMAND_TIMEOUT_MS
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    ...result.error ? { error: result.error } : {}
  };
}
function trimDot(value) {
  return value.endsWith(".") ? value.slice(0, -1) : value;
}
function normalizeSpace(value) {
  return value.trim().replace(/\s+/g, " ");
}
function runOrThrow(args, action, runner) {
  const result = runner(args);
  if (result.error) {
    const errno = result.error;
    if (errno.code === "ENOENT") {
      throw new Error(
        "Tailscale CLI not found. Install Tailscale (https://tailscale.com/download) and ensure `tailscale` is on PATH."
      );
    }
    throw new Error(`Failed to ${action}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const details = normalizeSpace(result.stderr || result.stdout);
    throw new Error(`Failed to ${action}: ${details || "unknown tailscale error"}`);
  }
  return result;
}
function parseStatusJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Failed to parse `tailscale status --json` output.");
  }
}
function statusToDnsName(status) {
  const dnsName = status.Self?.DNSName;
  if (typeof dnsName === "string" && dnsName.length > 0) {
    return trimDot(dnsName);
  }
  const host = status.Self?.HostName;
  const suffix = status.CurrentTailnet?.MagicDNSSuffix;
  if (typeof host === "string" && host.length > 0 && typeof suffix === "string" && suffix.length > 0) {
    return `${host}.${trimDot(suffix)}`;
  }
  throw new Error(
    "Could not determine Tailscale node DNS name from `tailscale status --json`. Is Tailscale connected?"
  );
}
function isFunnelCapability(value) {
  const normalized = value.toLowerCase();
  return normalized === "funnel" || normalized.endsWith("/funnel");
}
function isHttpsCapability(value) {
  const normalized = value.toLowerCase();
  return normalized === "https" || normalized.endsWith("/https");
}
function hasCapability(status, predicate) {
  const capabilities = status.Self?.Capabilities;
  if (Array.isArray(capabilities) && capabilities.some(predicate)) {
    return true;
  }
  const capMap = status.Self?.CapMap;
  return Boolean(capMap && Object.keys(capMap).some(predicate));
}
function hasHttpsCapability(status) {
  return hasCapability(status, isHttpsCapability);
}
function hasFunnelCapability(status) {
  return hasCapability(status, isFunnelCapability);
}
function throwHttpsNotEnabled() {
  throw new Error(
    "Tailscale HTTPS is not enabled on your tailnet. Enable HTTPS certificates in Tailscale DNS settings, then run portless again."
  );
}
function throwFunnelNotEnabled(status) {
  const nodeId = status.Self?.ID;
  const enableUrl = typeof nodeId === "string" && nodeId.length > 0 ? ` Visit https://login.tailscale.com/f/funnel?node=${nodeId} to enable it.` : "";
  throw new Error(
    "Tailscale Funnel is not enabled on your tailnet. Enable Funnel for this node, then run portless again." + enableUrl
  );
}
function ensureTailscaleReady(options = {}) {
  const runner = options.runner ?? defaultRunner2;
  runOrThrow(["version"], "check tailscale version", runner);
  const statusResult = runOrThrow(["status", "--json"], "read tailscale status", runner);
  const status = parseStatusJson(statusResult.stdout);
  const dnsName = statusToDnsName(status);
  if (options.requireHttps && !hasHttpsCapability(status)) {
    throwHttpsNotEnabled();
  }
  if (options.requireFunnel && !hasFunnelCapability(status)) {
    throwFunnelNotEnabled(status);
  }
  return {
    dnsName,
    baseUrl: `https://${dnsName}`
  };
}
function getUsedServePorts(runner = defaultRunner2) {
  const result = runner(["serve", "status", "--json"]);
  if (result.error || result.status !== 0) {
    return /* @__PURE__ */ new Set();
  }
  try {
    const config = JSON.parse(result.stdout);
    const ports = /* @__PURE__ */ new Set();
    if (config.Web) {
      for (const hostPort of Object.keys(config.Web)) {
        const match = hostPort.match(/:(\d+)$/);
        if (match) {
          ports.add(parseInt(match[1], 10));
        }
      }
    }
    if (config.TCP) {
      for (const portStr of Object.keys(config.TCP)) {
        const p = parseInt(portStr, 10);
        if (!isNaN(p)) ports.add(p);
      }
    }
    return ports;
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function findAvailableServePort(usedPorts, mode = "serve") {
  const pool = mode === "funnel" ? FUNNEL_PORTS : PREFERRED_SERVE_PORTS;
  for (const port2 of pool) {
    if (!usedPorts.has(port2)) return port2;
  }
  if (mode === "funnel") {
    throw new Error(
      "All Tailscale Funnel ports are in use (443, 8443, 10000). Stop an existing funnel to free a port."
    );
  }
  let port = PREFERRED_SERVE_PORTS[PREFERRED_SERVE_PORTS.length - 1] + 1;
  while (usedPorts.has(port)) port++;
  return port;
}
function isConflictError(stderr, stdout) {
  const text = `${stderr}
${stdout}`.toLowerCase();
  return text.includes("already in use") || text.includes("already exists") || text.includes("port conflict") || text.includes("address already");
}
function isFunnelNotEnabledError(stderr, stdout) {
  const text = `${stderr}
${stdout}`.toLowerCase();
  return text.includes("funnel is not enabled on your tailnet");
}
function formatFunnelNotEnabledError(stderr, stdout) {
  const details = normalizeSpace(`${stderr}
${stdout}`);
  return "Tailscale Funnel is not enabled on your tailnet. Enable Funnel for this node, then run portless again." + (details ? ` Tailscale said: ${details}` : "");
}
var CONFLICT_MESSAGES = {
  serve: "Stop the existing serve or let portless auto-assign a different port.",
  funnel: "Tailscale Funnel supports ports 443, 8443, and 10000."
};
function register(mode, localPort, httpsPort, runner) {
  const target = `http://127.0.0.1:${localPort}`;
  const result = runner([mode, "--bg", "--yes", `--https=${httpsPort}`, target]);
  if (result.error) {
    const errno = result.error;
    if (errno.code === "ENOENT") {
      throw new Error(
        "Tailscale CLI not found. Install Tailscale (https://tailscale.com/download) and ensure `tailscale` is on PATH."
      );
    }
    if (mode === "funnel" && isFunnelNotEnabledError(result.stderr, result.stdout)) {
      throw new Error(formatFunnelNotEnabledError(result.stderr, result.stdout));
    }
    if (mode === "funnel" && errno.code === "ETIMEDOUT") {
      throw new Error(
        "Tailscale Funnel registration timed out. Make sure Funnel is enabled on your tailnet, then run portless again."
      );
    }
    throw new Error(`Failed to register tailscale ${mode}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    if (mode === "funnel" && isFunnelNotEnabledError(result.stderr, result.stdout)) {
      throw new Error(formatFunnelNotEnabledError(result.stderr, result.stdout));
    }
    if (isConflictError(result.stderr, result.stdout)) {
      throw new Error(
        `Tailscale ${mode === "funnel" ? "Funnel " : ""}HTTPS port ${httpsPort} is already in use. ` + CONFLICT_MESSAGES[mode]
      );
    }
    const details = normalizeSpace(result.stderr || result.stdout);
    throw new Error(
      `Failed to register tailscale ${mode} on port ${httpsPort}: ${details || "unknown tailscale error"}`
    );
  }
}
function unregister(mode, httpsPort, options) {
  const runner = options?.runner ?? defaultRunner2;
  const result = runner([mode, "--yes", `--https=${httpsPort}`, "off"]);
  if (result.error) {
    const errno = result.error;
    if (errno.code === "ENOENT") return;
    throw new Error(`Failed to remove tailscale ${mode}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const text = `${result.stderr}
${result.stdout}`.toLowerCase();
    const looksLikeMissing = text.includes("not found") || text.includes("no serve config") || text.includes("nothing to remove") || text.includes("does not exist");
    if (options?.ignoreMissing && looksLikeMissing) return;
    const details = normalizeSpace(result.stderr || result.stdout);
    throw new Error(
      `Failed to remove tailscale ${mode} on port ${httpsPort}: ${details || "unknown tailscale error"}`
    );
  }
}
function registerServe(localPort, httpsPort, options) {
  register("serve", localPort, httpsPort, options?.runner ?? defaultRunner2);
}
function registerFunnel(localPort, httpsPort, options) {
  register("funnel", localPort, httpsPort, options?.runner ?? defaultRunner2);
}
function unregisterTailscale(route) {
  if (!route.tailscaleHttpsPort) return;
  const mode = route.tailscaleFunnel ? "funnel" : "serve";
  unregister(mode, route.tailscaleHttpsPort, { ignoreMissing: true });
}
function formatTailscaleUrl(baseUrl, httpsPort) {
  const trimmed = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  if (httpsPort === 443) return trimmed;
  return `${trimmed}:${httpsPort}`;
}

// src/ngrok.ts
import { spawn, spawnSync as spawnSync2 } from "child_process";
var NGROK_BINARY = "ngrok";
var NGROK_START_TIMEOUT_MS = 3e4;
var NGROK_COMMAND_TIMEOUT_MS = 1e4;
var OUTPUT_BUFFER_LIMIT = 16384;
function defaultSpawner(args) {
  return spawn(NGROK_BINARY, args, {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
}
function defaultRunner3(args) {
  const result = spawnSync2(NGROK_BINARY, args, {
    encoding: "utf-8",
    killSignal: "SIGKILL",
    timeout: NGROK_COMMAND_TIMEOUT_MS
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    ...result.error ? { error: result.error } : {}
  };
}
function normalizeSpace2(value) {
  return value.trim().replace(/\s+/g, " ");
}
function formatSpawnError(error) {
  const errno = error;
  if (errno.code === "ENOENT") {
    return new Error(
      "ngrok CLI not found. Install ngrok (https://ngrok.com/download) and ensure `ngrok` is on PATH."
    );
  }
  return new Error(`Failed to start ngrok: ${error.message}`);
}
function formatOutputError(output) {
  const details = normalizeSpace2(output);
  const lower = details.toLowerCase();
  if (lower.includes("authtoken") || lower.includes("authentication") || lower.includes("not logged in")) {
    return new Error(
      "ngrok could not start because authentication is not configured. Run `ngrok config add-authtoken <token>`, then run portless again."
    );
  }
  return new Error(
    `Failed to start ngrok tunnel: ${details || "ngrok exited before printing a public URL"}`
  );
}
function ensureNgrokAvailable(runner = defaultRunner3) {
  const result = runner(["version"]);
  if (result.error) {
    throw formatSpawnError(result.error);
  }
  if (result.status !== 0) {
    const details = normalizeSpace2(result.stderr || result.stdout);
    throw new Error(`Failed to check ngrok version: ${details || "unknown ngrok error"}`);
  }
}
function cleanUrl(value) {
  return value.replace(/[),.]+$/g, "");
}
function extractNgrokUrl(output) {
  const urlMatches = output.matchAll(/https:\/\/[^\s"'<>]+/g);
  for (const match of urlMatches) {
    const raw = match[0];
    const matchIndex = match.index ?? 0;
    const before = output.slice(Math.max(0, matchIndex - 80), matchIndex).toLowerCase();
    const looksLikeTunnel = before.includes("forwarding") || before.includes("url=") || before.includes('"url"') || before.includes("started tunnel");
    if (!looksLikeTunnel) continue;
    const candidate = cleanUrl(raw);
    try {
      const parsed = new URL(candidate);
      if (parsed.hostname === "ngrok.com" || parsed.hostname.endsWith(".ngrok.com")) {
        continue;
      }
      return parsed.toString().replace(/\/$/, "");
    } catch {
      continue;
    }
  }
  return null;
}
function buildNgrokArgs(localPort, hostHeader = "rewrite") {
  return [
    "http",
    "--log=stdout",
    "--log-format=logfmt",
    `--host-header=${hostHeader}`,
    `http://127.0.0.1:${localPort}`
  ];
}
function startNgrok(localPort, options = {}) {
  const spawner = options.spawner ?? defaultSpawner;
  const timeoutMs = options.timeoutMs ?? NGROK_START_TIMEOUT_MS;
  const args = buildNgrokArgs(localPort, options.hostHeader);
  let child;
  try {
    child = spawner(args);
  } catch (err) {
    return Promise.reject(formatSpawnError(err instanceof Error ? err : new Error(String(err))));
  }
  return new Promise((resolve4, reject) => {
    let settled = false;
    let started = false;
    let output = "";
    const settle = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const appendOutput = (chunk) => {
      if (settled) return;
      output += chunk.toString();
      if (output.length > OUTPUT_BUFFER_LIMIT) {
        output = output.slice(-OUTPUT_BUFFER_LIMIT);
      }
      const url = extractNgrokUrl(output);
      if (url) {
        settle(() => {
          started = true;
          resolve4({ url, pid: child.pid, child });
        });
      }
    };
    const timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {
      }
      settle(
        () => reject(
          new Error(
            "Timed out waiting for ngrok to print a public URL. Check that ngrok is authenticated and can connect."
          )
        )
      );
    }, timeoutMs);
    child.stdout?.on("data", appendOutput);
    child.stderr?.on("data", appendOutput);
    child.on("error", (err) => {
      settle(() => reject(formatSpawnError(err)));
    });
    child.on("exit", (code, signal) => {
      if (settled) {
        if (started) options.onExit?.(code, signal);
        return;
      }
      settle(() => {
        const suffix = signal ? ` (signal ${signal})` : code !== null ? ` (exit ${code})` : "";
        const error = formatOutputError(output);
        reject(new Error(`${error.message}${suffix}`));
      });
    });
  });
}
function stopNgrokProcess(child) {
  if (!child) return;
  try {
    child.kill("SIGTERM");
  } catch {
  }
}
function stopNgrok(route) {
  if (!route.ngrokPid) return;
  try {
    process.kill(route.ngrokPid, "SIGTERM");
  } catch {
  }
}

// src/auto.ts
import { createHash as createHash2 } from "crypto";
import { execFileSync as execFileSync3 } from "child_process";
import * as fs3 from "fs";
import * as path2 from "path";
var MAX_DNS_LABEL_LENGTH = 63;
function truncateLabel(label) {
  if (label.length <= MAX_DNS_LABEL_LENGTH) return label;
  const hash = createHash2("sha256").update(label).digest("hex").slice(0, 6);
  const maxPrefixLength = MAX_DNS_LABEL_LENGTH - 7;
  const prefix = label.slice(0, maxPrefixLength).replace(/-+$/, "");
  return `${prefix}-${hash}`;
}
function sanitizeForHostname(name) {
  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  return truncateLabel(sanitized);
}
function inferProjectName(cwd = process.cwd()) {
  const pkgResult = findPackageJsonName(cwd);
  if (pkgResult) {
    const sanitized2 = sanitizeForHostname(pkgResult);
    if (sanitized2) {
      return { name: sanitized2, source: "package.json" };
    }
  }
  const gitRoot = findGitRoot(cwd);
  if (gitRoot) {
    const sanitized2 = sanitizeForHostname(path2.basename(gitRoot));
    if (sanitized2) {
      return { name: sanitized2, source: "git root" };
    }
  }
  const sanitized = sanitizeForHostname(path2.basename(cwd));
  if (sanitized) {
    return { name: sanitized, source: "directory name" };
  }
  throw new Error("Could not infer a project name from package.json, git root, or directory name");
}
function findPackageJsonName(startDir) {
  let dir = startDir;
  for (; ; ) {
    const pkgPath = path2.join(dir, "package.json");
    try {
      const raw = fs3.readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw);
      if (typeof pkg.name === "string" && pkg.name) {
        return pkg.name.replace(/^@[^/]+\//, "");
      }
    } catch {
    }
    const parent = path2.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
function findGitRoot(startDir) {
  try {
    const toplevel = execFileSync3("git", ["rev-parse", "--show-toplevel"], {
      cwd: startDir,
      encoding: "utf-8",
      timeout: 5e3,
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (toplevel) return toplevel;
  } catch {
  }
  let dir = startDir;
  for (; ; ) {
    const gitPath = path2.join(dir, ".git");
    try {
      const stat = fs3.statSync(gitPath);
      if (stat.isDirectory()) return dir;
      if (stat.isFile()) return dir;
    } catch {
    }
    const parent = path2.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
function applyWorktreePrefix(baseName, worktree) {
  return worktree ? `${worktree.prefix}.${baseName}` : baseName;
}
var DEFAULT_BRANCHES = /* @__PURE__ */ new Set(["main", "master"]);
function branchToPrefix(branch) {
  if (!branch || branch === "HEAD" || DEFAULT_BRANCHES.has(branch)) return null;
  const lastSegment = branch.split("/").pop();
  const prefix = sanitizeForHostname(lastSegment);
  return prefix || null;
}
function detectWorktreePrefix(cwd = process.cwd()) {
  const cliResult = detectWorktreeViaCli(cwd);
  if (cliResult !== void 0) return cliResult;
  return detectWorktreeViaFilesystem(cwd);
}
function detectWorktreeViaCli(cwd) {
  try {
    const listOutput = execFileSync3("git", ["worktree", "list", "--porcelain"], {
      cwd,
      encoding: "utf-8",
      timeout: 5e3,
      stdio: ["ignore", "pipe", "ignore"]
    });
    const worktreeCount = listOutput.split("\n").filter((l) => l.startsWith("worktree ")).length;
    if (worktreeCount <= 1) return null;
    const gitDir = path2.resolve(
      cwd,
      execFileSync3("git", ["rev-parse", "--git-dir"], {
        cwd,
        encoding: "utf-8",
        timeout: 5e3,
        stdio: ["ignore", "pipe", "ignore"]
      }).trim()
    );
    const gitCommonDir = path2.resolve(
      cwd,
      execFileSync3("git", ["rev-parse", "--git-common-dir"], {
        cwd,
        encoding: "utf-8",
        timeout: 5e3,
        stdio: ["ignore", "pipe", "ignore"]
      }).trim()
    );
    if (gitDir === gitCommonDir) return null;
    const branch = execFileSync3("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      encoding: "utf-8",
      timeout: 5e3,
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    const prefix = branchToPrefix(branch);
    if (!prefix) return null;
    return { prefix, source: "git branch" };
  } catch {
    return void 0;
  }
}
function detectWorktreeViaFilesystem(startDir) {
  let dir = startDir;
  for (; ; ) {
    const gitPath = path2.join(dir, ".git");
    try {
      const stat = fs3.statSync(gitPath);
      if (stat.isDirectory()) {
        return null;
      }
      if (stat.isFile()) {
        const content = fs3.readFileSync(gitPath, "utf-8").trim();
        const match = content.match(/^gitdir:\s*(.+)$/);
        if (!match) return null;
        const gitdir = match[1];
        if (!gitdir.match(/[/\\]worktrees[/\\][^/\\]+$/)) return null;
        const branch = readBranchFromHead(path2.resolve(dir, gitdir));
        const prefix = branchToPrefix(branch ?? "");
        if (!prefix) return null;
        return { prefix, source: "git branch" };
      }
    } catch {
    }
    const parent = path2.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
function readBranchFromHead(gitdir) {
  try {
    const head = fs3.readFileSync(path2.join(gitdir, "HEAD"), "utf-8").trim();
    const refMatch = head.match(/^ref: refs\/heads\/(.+)$/);
    return refMatch ? refMatch[1] : null;
  } catch {
    return null;
  }
}

// src/cli-utils.ts
import * as crypto3 from "crypto";
import * as fs5 from "fs";
import * as http from "http";
import * as https from "https";
import * as net from "net";
import * as os2 from "os";
import * as path4 from "path";
import * as readline from "readline";
import { execFileSync as execFileSync4, execSync, spawn as spawn2 } from "child_process";

// src/config.ts
import * as fs4 from "fs";
import * as path3 from "path";
var ConfigValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigValidationError";
  }
};
var CONFIG_FILENAME = "portless.json";
function loadConfig(cwd = process.cwd()) {
  const configPath = path3.join(cwd, CONFIG_FILENAME);
  try {
    const raw = fs4.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    validateConfig(parsed, configPath);
    return { config: parsed, configDir: cwd };
  } catch (err) {
    if (isErrnoException2(err) && err.code === "ENOENT") {
      return loadConfigFromPackageJson(cwd);
    }
    if (err instanceof SyntaxError) {
      throw new ConfigValidationError(`Invalid JSON in ${configPath}`);
    }
    throw err;
  }
}
function normalizePortlessValue(value) {
  if (typeof value === "string") {
    return value.trim() ? { name: value.trim() } : null;
  }
  return value;
}
function loadConfigFromPackageJson(dir) {
  const pkgPath = path3.join(dir, "package.json");
  try {
    const raw = fs4.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    if (pkg && typeof pkg === "object" && "portless" in pkg) {
      const config = normalizePortlessValue(pkg.portless);
      if (config === null) return null;
      validateConfig(config, `${pkgPath} "portless"`);
      return { config, configDir: dir };
    }
  } catch (err) {
    if (isErrnoException2(err) && err.code === "ENOENT") return null;
    if (err instanceof SyntaxError) return null;
    throw err;
  }
  return null;
}
function loadPackagePortlessConfig(dir) {
  const pkgPath = path3.join(dir, "package.json");
  try {
    const raw = fs4.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    if (pkg && typeof pkg === "object" && "portless" in pkg) {
      const config = normalizePortlessValue(pkg.portless);
      if (config === null) return null;
      if (typeof config === "object" && !Array.isArray(config)) {
        validateAppConfig(config, "portless", pkgPath);
        return config;
      }
    }
  } catch (err) {
    if (err instanceof ConfigValidationError) throw err;
  }
  return null;
}
function resolveAppConfig(config, configDir, packageDir) {
  if (config.apps) {
    const rel = normalizePath(path3.relative(configDir, packageDir));
    if (rel && !rel.startsWith("..")) {
      let candidate = rel;
      while (candidate) {
        if (config.apps[candidate]) {
          return config.apps[candidate];
        }
        const parent = path3.dirname(candidate);
        if (parent === "." || parent === candidate) break;
        candidate = normalizePath(parent);
      }
    }
    return {};
  }
  return { name: config.name, script: config.script, appPort: config.appPort, proxy: config.proxy };
}
function resolveScript(scriptName, packageDir) {
  const pkgPath = path3.join(packageDir, "package.json");
  try {
    const raw = fs4.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    const scriptValue = pkg?.scripts?.[scriptName];
    if (typeof scriptValue !== "string" || !scriptValue.trim()) {
      return null;
    }
    return splitCommand(scriptValue);
  } catch {
    return null;
  }
}
function resolveScriptRaw(scriptName, packageDir) {
  const pkgPath = path3.join(packageDir, "package.json");
  try {
    const pkg = JSON.parse(fs4.readFileSync(pkgPath, "utf-8"));
    const scriptValue = pkg?.scripts?.[scriptName];
    return typeof scriptValue === "string" && scriptValue.trim() ? scriptValue : null;
  } catch {
    return null;
  }
}
function hasScript(scriptName, dir) {
  const pkgPath = path3.join(dir, "package.json");
  try {
    const raw = fs4.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    return typeof pkg?.scripts?.[scriptName] === "string";
  } catch {
    return false;
  }
}
var LOCK_FILES = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["package-lock.json", "npm"]
];
function detectPackageManager(cwd) {
  let dir = cwd;
  for (; ; ) {
    const pkgPath = path3.join(dir, "package.json");
    try {
      const raw = fs4.readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw);
      if (typeof pkg.packageManager === "string") {
        const name = pkg.packageManager.split("@")[0];
        if (name === "pnpm" || name === "yarn" || name === "bun" || name === "npm") {
          return name;
        }
      }
    } catch {
    }
    for (const [file, pm] of LOCK_FILES) {
      try {
        fs4.accessSync(path3.join(dir, file), fs4.constants.F_OK);
        return pm;
      } catch {
      }
    }
    const parent = path3.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "npm";
}
function resolveScriptCommand(scriptName, packageDir) {
  if (!hasScript(scriptName, packageDir)) return null;
  const pm = detectPackageManager(packageDir);
  return [pm, "run", scriptName];
}
function splitCommand(command) {
  const args = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  for (const ch of command) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\" && !inSingle) {
      escaped = true;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (/\s/.test(ch) && !inSingle && !inDouble) {
      if (current) {
        args.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current) args.push(current);
  return args;
}
var BUILD_ONLY_COMMANDS = /* @__PURE__ */ new Set([
  "tsup",
  "tsc",
  "esbuild",
  "rollup",
  "babel",
  "swc",
  "unbuild",
  "pkgroll",
  "ncc",
  "microbundle"
]);
function isServerCommand(args) {
  if (args.length === 0) return false;
  const bin = path3.basename(args[0]);
  return !BUILD_ONLY_COMMANDS.has(bin);
}
function normalizePath(p) {
  return p.replace(/\\/g, "/");
}
function isErrnoException2(err) {
  return err instanceof Error && "code" in err;
}
var KNOWN_TOP_KEYS = /* @__PURE__ */ new Set(["name", "script", "appPort", "proxy", "apps", "turbo"]);
var KNOWN_APP_KEYS = /* @__PURE__ */ new Set(["name", "script", "appPort", "proxy"]);
function validateConfig(config, configPath) {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new ConfigValidationError(`${configPath} must be a JSON object.`);
  }
  const obj = config;
  if (obj.name !== void 0) {
    if (typeof obj.name !== "string" || !obj.name.trim()) {
      throw new ConfigValidationError(`"name" in ${configPath} must be a non-empty string.`);
    }
  }
  if (obj.script !== void 0) {
    if (typeof obj.script !== "string" || !obj.script.trim()) {
      throw new ConfigValidationError(`"script" in ${configPath} must be a non-empty string.`);
    }
  }
  if (obj.appPort !== void 0) {
    if (typeof obj.appPort !== "number" || !Number.isInteger(obj.appPort) || obj.appPort < 1 || obj.appPort > 65535) {
      throw new ConfigValidationError(
        `"appPort" in ${configPath} must be an integer between 1 and 65535.`
      );
    }
  }
  if (obj.proxy !== void 0) {
    if (typeof obj.proxy !== "boolean") {
      throw new ConfigValidationError(`"proxy" in ${configPath} must be a boolean.`);
    }
  }
  if (obj.turbo !== void 0) {
    if (typeof obj.turbo !== "boolean") {
      throw new ConfigValidationError(`"turbo" in ${configPath} must be a boolean.`);
    }
  }
  if (obj.apps !== void 0) {
    if (typeof obj.apps !== "object" || obj.apps === null || Array.isArray(obj.apps)) {
      throw new ConfigValidationError(`"apps" in ${configPath} must be an object.`);
    }
    for (const [key, value] of Object.entries(obj.apps)) {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new ConfigValidationError(`"apps.${key}" in ${configPath} must be an object.`);
      }
      validateAppConfig(value, `apps.${key}`, configPath);
    }
  }
  warnUnknownKeys(obj, KNOWN_TOP_KEYS, configPath);
}
function validateAppConfig(obj, prefix, configPath) {
  if (obj.name !== void 0) {
    if (typeof obj.name !== "string" || !obj.name.trim()) {
      throw new ConfigValidationError(
        `"${prefix}.name" in ${configPath} must be a non-empty string.`
      );
    }
  }
  if (obj.script !== void 0) {
    if (typeof obj.script !== "string" || !obj.script.trim()) {
      throw new ConfigValidationError(
        `"${prefix}.script" in ${configPath} must be a non-empty string.`
      );
    }
  }
  if (obj.appPort !== void 0) {
    if (typeof obj.appPort !== "number" || !Number.isInteger(obj.appPort) || obj.appPort < 1 || obj.appPort > 65535) {
      throw new ConfigValidationError(
        `"${prefix}.appPort" in ${configPath} must be an integer between 1 and 65535.`
      );
    }
  }
  if (obj.proxy !== void 0) {
    if (typeof obj.proxy !== "boolean") {
      throw new ConfigValidationError(`"${prefix}.proxy" in ${configPath} must be a boolean.`);
    }
  }
  warnUnknownKeys(obj, KNOWN_APP_KEYS, configPath, prefix);
}
function warnUnknownKeys(obj, known, configPath, prefix) {
  for (const key of Object.keys(obj)) {
    if (!known.has(key)) {
      const label = prefix ? `"${prefix}.${key}"` : `"${key}"`;
      console.warn(
        `Warning: Unknown key ${label} in ${configPath}. Known keys: ${[...known].join(", ")}`
      );
    }
  }
}

// src/cli-utils.ts
var isWindows = process.platform === "win32";
var FALLBACK_PROXY_PORT = 1355;
var PRIVILEGED_PORT_THRESHOLD = 1024;
var INTERNAL_LAN_IP_ENV = "PORTLESS_INTERNAL_LAN_IP";
var INTERNAL_LAN_IP_FLAG = "--lan-ip-auto";
var IPV4_LOOPBACK_PROXY_HOST = "127.0.0.1";
var IPV6_LOOPBACK_PROXY_HOST = "::1";
var IPV4_LAN_PROXY_HOST = "0.0.0.0";
var IPV6_LAN_PROXY_HOST = "::";
var LEGACY_SYSTEM_STATE_DIR = isWindows ? path4.join(os2.tmpdir(), "portless") : "/tmp/portless";
var USER_STATE_DIR = path4.join(resolveUserHome(), ".portless");
var MIN_APP_PORT = 4e3;
var MAX_APP_PORT = 4999;
var RANDOM_PORT_ATTEMPTS = 50;
var BLOCKED_PORTS = /* @__PURE__ */ new Set([
  0,
  1,
  7,
  9,
  11,
  13,
  15,
  17,
  19,
  20,
  21,
  22,
  23,
  25,
  37,
  42,
  43,
  53,
  69,
  77,
  79,
  87,
  95,
  101,
  102,
  103,
  104,
  109,
  110,
  111,
  113,
  115,
  117,
  119,
  123,
  135,
  137,
  139,
  143,
  161,
  179,
  389,
  427,
  465,
  512,
  513,
  514,
  515,
  526,
  530,
  531,
  532,
  540,
  548,
  554,
  556,
  563,
  587,
  601,
  636,
  989,
  990,
  993,
  995,
  1719,
  1720,
  1723,
  2049,
  3659,
  4045,
  4190,
  5060,
  5061,
  6e3,
  6566,
  6665,
  6666,
  6667,
  6668,
  6669,
  6679,
  6697,
  10080
]);
var SOCKET_TIMEOUT_MS = 500;
var PID_LOOKUP_TIMEOUT_MS = 5e3;
var WAIT_FOR_PROXY_MAX_ATTEMPTS = 20;
var WAIT_FOR_PROXY_INTERVAL_MS = 250;
var SIGNAL_CODES = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGQUIT: 3,
  SIGABRT: 6,
  SIGKILL: 9,
  SIGTERM: 15
};
var COMMAND_SHUTDOWN_GRACE_MS = 5e3;
var COMMAND_SHUTDOWN_FORCE_MS = 1e4;
var COMMAND_SHUTDOWN_POLL_MS = 50;
function trackProcessTree(rootPid, tracked) {
  tracked.set(rootPid, { pid: rootPid, pgid: rootPid });
  if (isWindows) {
    return;
  }
  try {
    const output = execFileSync4("ps", ["-axo", "pid=,ppid=,pgid="], {
      encoding: "utf-8",
      timeout: PID_LOOKUP_TIMEOUT_MS
    });
    const rows = output.trim().split("\n").map((line) => {
      const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)$/);
      if (!match) return null;
      return {
        pid: parseInt(match[1], 10),
        ppid: parseInt(match[2], 10),
        pgid: parseInt(match[3], 10)
      };
    }).filter((row) => row !== null);
    const descendants = /* @__PURE__ */ new Set([rootPid]);
    let foundDescendant = true;
    while (foundDescendant) {
      foundDescendant = false;
      for (const row of rows) {
        if (descendants.has(row.ppid) && !descendants.has(row.pid)) {
          descendants.add(row.pid);
          foundDescendant = true;
        }
      }
    }
    for (const row of rows) {
      if (descendants.has(row.pid)) {
        tracked.set(row.pid, { pid: row.pid, pgid: row.pgid });
      }
    }
  } catch {
  }
}
function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
function hasRunningProcesses(tracked) {
  return [...tracked.keys()].some(isProcessRunning);
}
function signalTrackedProcesses(tracked, signal) {
  if (isWindows) {
    for (const { pid } of tracked.values()) {
      try {
        process.kill(pid, signal);
      } catch {
      }
    }
    return;
  }
  const groups = new Set([...tracked.values()].map(({ pgid }) => pgid));
  for (const pgid of groups) {
    try {
      process.kill(-pgid, signal);
    } catch {
    }
  }
}
function getProxyBindTargets(lanMode) {
  return lanMode ? [{ host: IPV4_LAN_PROXY_HOST }, { host: IPV6_LAN_PROXY_HOST, ipv6Only: true }] : [{ host: IPV4_LOOPBACK_PROXY_HOST }, { host: IPV6_LOOPBACK_PROXY_HOST, ipv6Only: true }];
}
function listenOnProxyInterface(server, port, target, listener) {
  server.listen({ port, host: target.host, ipv6Only: target.ipv6Only }, listener);
}
function killTree(child, signal = "SIGTERM") {
  if (!child.pid) {
    child.kill(signal);
    return;
  }
  if (!isWindows) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
    }
  }
  try {
    child.kill(signal);
  } catch {
  }
}
function getProtocolPort(tls2) {
  return tls2 ? 443 : 80;
}
function getDefaultPort(tls2) {
  const envPort = process.env.PORTLESS_PORT;
  if (envPort) {
    const port = parseInt(envPort, 10);
    if (!isNaN(port) && port >= 1 && port <= 65535) return port;
  }
  return tls2 === void 0 ? FALLBACK_PROXY_PORT : getProtocolPort(tls2);
}
function resolveStateDir(_port) {
  if (process.env.PORTLESS_STATE_DIR) return process.env.PORTLESS_STATE_DIR;
  return USER_STATE_DIR;
}
function readPortFromDir(dir) {
  try {
    const raw = fs5.readFileSync(path4.join(dir, "proxy.port"), "utf-8").trim();
    const port = parseInt(raw, 10);
    return isNaN(port) ? null : port;
  } catch {
    return null;
  }
}
var TLS_MARKER_FILE = "proxy.tls";
var CUSTOM_CERT_MARKER_FILE = "proxy.custom-cert";
function readTlsMarker(dir) {
  try {
    return fs5.existsSync(path4.join(dir, TLS_MARKER_FILE));
  } catch {
    return false;
  }
}
function writeTlsMarker(dir, enabled2) {
  const markerPath = path4.join(dir, TLS_MARKER_FILE);
  if (enabled2) {
    fs5.writeFileSync(markerPath, "1", { mode: 420 });
  } else {
    try {
      fs5.unlinkSync(markerPath);
    } catch {
    }
  }
}
function readCustomCertMarker(dir) {
  try {
    return fs5.existsSync(path4.join(dir, CUSTOM_CERT_MARKER_FILE));
  } catch {
    return false;
  }
}
function writeCustomCertMarker(dir, enabled2) {
  const markerPath = path4.join(dir, CUSTOM_CERT_MARKER_FILE);
  if (enabled2) {
    fs5.writeFileSync(markerPath, "1", { mode: 420 });
  } else {
    try {
      fs5.unlinkSync(markerPath);
    } catch {
    }
  }
}
var LAN_MARKER_FILE = "proxy.lan";
function readLanMarker(dir) {
  try {
    const raw = fs5.readFileSync(path4.join(dir, LAN_MARKER_FILE), "utf-8").trim();
    return raw || null;
  } catch {
    return null;
  }
}
function writeLanMarker(dir, ip) {
  const markerPath = path4.join(dir, LAN_MARKER_FILE);
  if (!ip) {
    try {
      fs5.unlinkSync(markerPath);
    } catch {
    }
  } else {
    fs5.writeFileSync(markerPath, ip, { mode: 420 });
  }
}
var DEFAULT_TLD = "localhost";
var RISKY_TLDS = /* @__PURE__ */ new Map([
  ["local", "conflicts with mDNS/Bonjour on macOS"],
  ["dev", "Google-owned; browsers force HTTPS via preloaded HSTS"],
  ["app", "Google-owned; browsers force HTTPS via preloaded HSTS"],
  ["com", "public TLD; DNS requests will leak to the internet"],
  ["org", "public TLD; DNS requests will leak to the internet"],
  ["net", "public TLD; DNS requests will leak to the internet"],
  ["io", "public TLD; DNS requests will leak to the internet"],
  ["edu", "public TLD; DNS requests will leak to the internet"],
  ["gov", "public TLD; DNS requests will leak to the internet"],
  ["mil", "public TLD; DNS requests will leak to the internet"],
  ["int", "public TLD; DNS requests will leak to the internet"]
]);
var SUFFIX_RISKY_TLDS = /* @__PURE__ */ new Set(["local", "dev", "app"]);
function getRiskyTldReason(tld) {
  const exact = RISKY_TLDS.get(tld);
  if (exact) return exact;
  for (const risky of SUFFIX_RISKY_TLDS) {
    if (tld.endsWith(`.${risky}`)) return RISKY_TLDS.get(risky);
  }
  return void 0;
}
function validateTld(tld) {
  if (!tld) return "TLD cannot be empty";
  if (tld.length > 253) {
    return `Invalid TLD "${tld}": exceeds 253-character DNS limit`;
  }
  const labelRe = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  const labels = tld.split(".");
  for (const label of labels) {
    if (!label) {
      return `Invalid TLD "${tld}": labels cannot be empty`;
    }
    if (label.length > 63) {
      return `Invalid TLD "${tld}": label "${label}" exceeds 63-character DNS limit`;
    }
    if (!labelRe.test(label)) {
      return `Invalid TLD "${tld}": labels must contain only lowercase letters, digits, and interior hyphens`;
    }
  }
  return null;
}
function parseTldList(value, source = "TLD") {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const tlds = [];
  const seen = /* @__PURE__ */ new Set();
  for (const rawPart of trimmed.split(",")) {
    const tld = rawPart.trim().toLowerCase();
    const err = validateTld(tld);
    if (err) throw new Error(source === "TLD" ? err : `${source}: ${err}`);
    if (!seen.has(tld)) {
      seen.add(tld);
      tlds.push(tld);
    }
  }
  return tlds;
}
var TLD_FILE = "proxy.tld";
var TLDS_FILE = "proxy.tlds";
function readLegacyTldFromDir(dir) {
  try {
    const raw = fs5.readFileSync(path4.join(dir, TLD_FILE), "utf-8").trim();
    return raw || DEFAULT_TLD;
  } catch {
    return DEFAULT_TLD;
  }
}
function readTldsFromDir(dir) {
  try {
    const raw = fs5.readFileSync(path4.join(dir, TLDS_FILE), "utf-8").trim();
    const parsed = raw.startsWith("[") ? JSON.parse(raw) : raw.split(/\r?\n/).flatMap((line) => line.split(",")).map((line) => line.trim()).filter(Boolean);
    if (!Array.isArray(parsed)) return [readLegacyTldFromDir(dir)];
    const tlds = parsed.flatMap((value) => {
      if (typeof value !== "string") return [];
      try {
        return parseTldList(value);
      } catch (err) {
        console.warn(
          `Warning: ignoring invalid TLD entry in ${TLDS_FILE}: ${err instanceof Error ? err.message : String(err)}`
        );
        return [];
      }
    });
    return tlds.length > 0 ? [...new Set(tlds)] : [DEFAULT_TLD];
  } catch {
    return [readLegacyTldFromDir(dir)];
  }
}
function writeTldsFile(dir, tlds) {
  const uniqueTlds = [...new Set(tlds)];
  const tldsPath = path4.join(dir, TLDS_FILE);
  const tldPath = path4.join(dir, TLD_FILE);
  if (uniqueTlds.length === 1 && uniqueTlds[0] === DEFAULT_TLD) {
    try {
      fs5.unlinkSync(tldsPath);
    } catch {
    }
    try {
      fs5.unlinkSync(tldPath);
    } catch {
    }
  } else {
    fs5.writeFileSync(tldsPath, uniqueTlds.join("\n") + "\n", { mode: 420 });
    fs5.writeFileSync(tldPath, uniqueTlds[0] ?? DEFAULT_TLD, { mode: 420 });
  }
}
function writeTldFile(dir, tld) {
  writeTldsFile(dir, [tld]);
}
function getDefaultTlds() {
  const val = process.env.PORTLESS_TLD?.trim().toLowerCase();
  if (!val) return [DEFAULT_TLD];
  const tlds = parseTldList(val, "PORTLESS_TLD");
  return tlds.length > 0 ? tlds : [DEFAULT_TLD];
}
function isHttpsEnvDisabled() {
  const val = process.env.PORTLESS_HTTPS;
  return val === "0" || val === "false";
}
function isWildcardEnvEnabled() {
  const val = process.env.PORTLESS_WILDCARD;
  return val === "1" || val === "true";
}
function isLanEnvEnabled() {
  const val = process.env.PORTLESS_LAN;
  return val === "1" || val === "true";
}
function readPersistedProxyState() {
  const dir = process.env.PORTLESS_STATE_DIR || USER_STATE_DIR;
  const port = readPortFromDir(dir);
  if (port !== null) {
    const tls2 = readTlsMarker(dir);
    const tlds = readTldsFromDir(dir);
    const tld = tlds[0] ?? DEFAULT_TLD;
    const lanIp = readLanMarker(dir);
    return { port, tls: tls2, tld, tlds, lanMode: lanIp !== null };
  }
  return null;
}
function buildProxyStartConfig(options) {
  const requestedTlds = options.tlds && options.tlds.length > 0 ? [...options.tlds] : [options.tld];
  const effectiveTlds = options.lanMode ? ["local"] : [...new Set(requestedTlds)];
  const effectiveTld = effectiveTlds[0] ?? DEFAULT_TLD;
  const args = [];
  if (options.foreground) {
    args.push("--foreground");
  }
  if (options.includePort && options.proxyPort !== void 0) {
    args.push("--port", options.proxyPort.toString());
  }
  if (options.useHttps) {
    if (options.customCertPath && options.customKeyPath) {
      args.push("--cert", options.customCertPath, "--key", options.customKeyPath);
    } else {
      args.push("--https");
    }
  } else {
    args.push("--no-tls");
  }
  if (options.lanMode) {
    args.push("--lan");
    if (options.lanIp) {
      if (options.lanIpExplicit) {
        args.push("--ip", options.lanIp);
      } else {
        args.push(INTERNAL_LAN_IP_FLAG, options.lanIp);
      }
    }
  } else if (effectiveTlds.length > 1 || effectiveTld !== DEFAULT_TLD) {
    for (const tld of effectiveTlds) {
      args.push("--tld", tld);
    }
  }
  if (options.useWildcard) {
    args.push("--wildcard");
  }
  if (options.skipTrust) {
    args.push("--skip-trust");
  }
  return { effectiveTld, effectiveTlds, args };
}
async function discoverState() {
  if (process.env.PORTLESS_STATE_DIR) {
    const dir2 = process.env.PORTLESS_STATE_DIR;
    const port = readPortFromDir(dir2) ?? getDefaultPort();
    const lanIp = readLanMarker(dir2);
    if (await isProxyRunning(port) || await isPortListening(port)) {
      const tls2 = readTlsMarker(dir2);
      const tlds3 = readTldsFromDir(dir2);
      const tld = tlds3[0] ?? DEFAULT_TLD;
      return {
        dir: dir2,
        port,
        tls: tls2,
        tld,
        tlds: tlds3,
        lanMode: lanIp !== null,
        lanIp
      };
    }
    const tlds2 = readTldsFromDir(dir2);
    return {
      dir: dir2,
      port,
      tls: readTlsMarker(dir2),
      tld: tlds2[0] ?? DEFAULT_TLD,
      tlds: tlds2,
      lanMode: lanIp !== null,
      lanIp: null
    };
  }
  const userPort = readPortFromDir(USER_STATE_DIR);
  if (userPort !== null) {
    if (await isProxyRunning(userPort)) {
      const tls2 = readTlsMarker(USER_STATE_DIR);
      const tlds2 = readTldsFromDir(USER_STATE_DIR);
      const tld = tlds2[0] ?? DEFAULT_TLD;
      const lanIp = readLanMarker(USER_STATE_DIR);
      return {
        dir: USER_STATE_DIR,
        port: userPort,
        tls: tls2,
        tld,
        tlds: tlds2,
        lanMode: lanIp !== null,
        lanIp
      };
    }
  }
  const legacyPort = readPortFromDir(LEGACY_SYSTEM_STATE_DIR);
  if (legacyPort !== null) {
    if (await isProxyRunning(legacyPort)) {
      const tls2 = readTlsMarker(LEGACY_SYSTEM_STATE_DIR);
      const tlds2 = readTldsFromDir(LEGACY_SYSTEM_STATE_DIR);
      const tld = tlds2[0] ?? DEFAULT_TLD;
      const lanIp = readLanMarker(LEGACY_SYSTEM_STATE_DIR);
      return {
        dir: LEGACY_SYSTEM_STATE_DIR,
        port: legacyPort,
        tls: tls2,
        tld,
        tlds: tlds2,
        lanMode: lanIp !== null,
        lanIp
      };
    }
  }
  const configuredPort = getDefaultPort();
  const probePorts = /* @__PURE__ */ new Set([443, 80, FALLBACK_PROXY_PORT, configuredPort]);
  for (const port of probePorts) {
    if (await isProxyRunning(port)) {
      const dir2 = resolveStateDir(port);
      const markerTls = readTlsMarker(dir2);
      const tls2 = markerTls || port === getProtocolPort(true);
      const tlds2 = readTldsFromDir(dir2);
      const tld = tlds2[0] ?? DEFAULT_TLD;
      const lanIp = readLanMarker(dir2);
      return {
        dir: dir2,
        port,
        tls: tls2,
        tld,
        tlds: tlds2,
        lanMode: lanIp !== null,
        lanIp
      };
    }
  }
  const dir = resolveStateDir(configuredPort);
  const tlds = readTldsFromDir(dir);
  return {
    dir,
    port: configuredPort,
    tls: readTlsMarker(dir),
    tld: tlds[0] ?? DEFAULT_TLD,
    tlds,
    lanMode: readLanMarker(dir) !== null,
    lanIp: null
  };
}
async function findFreePort(minPort = MIN_APP_PORT, maxPort = MAX_APP_PORT) {
  if (minPort > maxPort) {
    throw new Error(`minPort (${minPort}) must be <= maxPort (${maxPort})`);
  }
  const tryPort = (port) => {
    return new Promise((resolve4) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.close(() => resolve4(true));
      });
      server.on("error", () => resolve4(false));
    });
  };
  for (let i = 0; i < RANDOM_PORT_ATTEMPTS; i++) {
    const port = minPort + Math.floor(Math.random() * (maxPort - minPort + 1));
    if (!BLOCKED_PORTS.has(port) && await tryPort(port)) {
      return port;
    }
  }
  for (let port = minPort; port <= maxPort; port++) {
    if (!BLOCKED_PORTS.has(port) && await tryPort(port)) {
      return port;
    }
  }
  throw new Error(`No free port found in range ${minPort}-${maxPort}`);
}
function isProxyRunning(port, tls2 = false) {
  return new Promise((resolve4) => {
    const requestFn = tls2 ? https.request : http.request;
    const req = requestFn(
      {
        hostname: "127.0.0.1",
        port,
        path: "/",
        method: "HEAD",
        timeout: SOCKET_TIMEOUT_MS,
        ...tls2 ? { rejectUnauthorized: false } : {}
      },
      (res) => {
        res.resume();
        resolve4(res.headers[PORTLESS_HEADER.toLowerCase()] === "1");
      }
    );
    req.on("error", () => resolve4(false));
    req.on("timeout", () => {
      req.destroy();
      resolve4(false);
    });
    req.end();
  });
}
var HOSTS_DISPLAY = process.platform === "win32" ? "hosts file" : "/etc/hosts";
function hostsUnresolvedMessage(hostnames) {
  return `${hostnames.join(", ")} will not resolve. Run: portless hosts sync`;
}
var HOSTS_SYNC_TRIGGER_TIMEOUT_MS = 500;
var UNTRIGGERED_SYNC_CEILING_MS = 3500;
function probeHostsSyncAuth(port, tls2, token, challenge, signal) {
  return new Promise((resolve4) => {
    const requestFn = tls2 ? https.request : http.request;
    const req = requestFn(
      {
        hostname: "127.0.0.1",
        port,
        path: "/",
        method: "HEAD",
        headers: { [HOSTS_SYNC_AUTH_CHALLENGE_HEADER]: challenge },
        signal,
        ...tls2 ? { rejectUnauthorized: false } : {}
      },
      (res) => {
        const expectedProof = token ? createHostsSyncProof(token, challenge) : null;
        const suppliedProof = res.headers[HOSTS_SYNC_AUTH_PROOF_HEADER];
        const available = res.headers[PORTLESS_HEADER.toLowerCase()] === "1" && typeof suppliedProof === "string" && expectedProof !== null && isValidHostsSyncToken(suppliedProof) && crypto3.timingSafeEqual(Buffer.from(suppliedProof), Buffer.from(expectedProof));
        res.resume();
        res.on("end", () => resolve4(available ? "available" : "mute"));
        res.on("error", () => resolve4("mute"));
      }
    );
    req.on("error", (err) => {
      resolve4(err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" ? "absent" : "mute");
    });
    req.end();
  });
}
async function triggerHostsSync(port, tls2 = false, stateDir = resolveStateDir(port)) {
  const signal = AbortSignal.timeout(HOSTS_SYNC_TRIGGER_TIMEOUT_MS);
  const token = readHostsSyncToken(stateDir);
  const challenge = generateHostsSyncChallenge();
  const capability = await probeHostsSyncAuth(port, tls2, token, challenge, signal);
  if (capability !== "available") return capability;
  if (!token) return Promise.resolve("mute");
  return new Promise((resolve4) => {
    const requestFn = tls2 ? https.request : http.request;
    const req = requestFn(
      {
        hostname: "127.0.0.1",
        port,
        path: HOSTS_SYNC_PATH,
        method: "POST",
        headers: { [HOSTS_SYNC_AUTH_HEADER]: token },
        signal,
        ...tls2 ? { rejectUnauthorized: false } : {}
      },
      (res) => {
        const result = res.statusCode === 204 ? "acted" : res.statusCode === 409 ? "disabled" : "mute";
        res.resume();
        res.on("end", () => resolve4(result));
        res.on("error", () => resolve4("mute"));
      }
    );
    req.on("error", (err) => {
      resolve4(err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" ? "absent" : "mute");
    });
    req.end();
  });
}
async function reportHostsSync(hostnames, port, tls2, lanMode, onWarn, trigger = triggerHostsSync, resolves = checkHostResolution, ceilingMs = UNTRIGGERED_SYNC_CEILING_MS, readManaged = getManagedHostnames) {
  const managed = lanMode ? hostnames.filter((hostname) => !hostname.endsWith(".local")) : hostnames;
  if (managed.length === 0) return;
  const found = await trigger(port, tls2);
  const unresolved = async () => {
    const checked = await Promise.all(managed.map((hostname) => resolves(hostname)));
    return managed.filter((_, i) => !checked[i]);
  };
  if (found !== "mute") {
    const missing2 = await unresolved();
    if (missing2.length > 0) onWarn(hostsUnresolvedMessage(missing2));
    return;
  }
  const deadline = Date.now() + ceilingMs;
  while (Date.now() < deadline) {
    const written = new Set(readManaged());
    if (managed.every((hostname) => written.has(hostname))) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  const missing = await unresolved();
  if (missing.length > 0) onWarn(hostsUnresolvedMessage(missing));
}
function syncHostsWithWarning(hostnames, alreadyWarned, onWarn, sync = syncHostsFile) {
  if (sync(hostnames)) return false;
  if (hostnames.length === 0) return alreadyWarned;
  if (!alreadyWarned) onWarn();
  return true;
}
function isPortListening(port) {
  return new Promise((resolve4) => {
    const socket = createLoopbackConnection(port);
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve4(result);
    };
    socket.setTimeout(SOCKET_TIMEOUT_MS);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });
}
function parsePidFromNetstat(output, port) {
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;
    const localAddr = parts[1];
    const lastColon = localAddr.lastIndexOf(":");
    if (lastColon === -1) continue;
    const addrPort = parseInt(localAddr.substring(lastColon + 1), 10);
    if (addrPort === port) {
      const pid = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(pid) && pid > 0) return pid;
    }
  }
  return null;
}
function findPidsOnPort(port) {
  try {
    if (isWindows) {
      const output2 = execSync("netstat -ano -p tcp", {
        encoding: "utf-8",
        timeout: PID_LOOKUP_TIMEOUT_MS
      });
      const pid = parsePidFromNetstat(output2, port);
      return pid === null ? [] : [pid];
    }
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: "utf-8",
      timeout: PID_LOOKUP_TIMEOUT_MS
    });
    return output.trim().split("\n").map((s) => parseInt(s, 10)).filter((n) => !isNaN(n) && n > 0);
  } catch {
    return [];
  }
}
function findPidOnPort(port) {
  try {
    if (isWindows) {
      const output2 = execSync("netstat -ano -p tcp", {
        encoding: "utf-8",
        timeout: PID_LOOKUP_TIMEOUT_MS
      });
      return parsePidFromNetstat(output2, port);
    }
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: "utf-8",
      timeout: PID_LOOKUP_TIMEOUT_MS
    });
    const pid = parseInt(output.trim().split("\n")[0], 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}
async function waitForProxy(port, maxAttempts = WAIT_FOR_PROXY_MAX_ATTEMPTS, intervalMs = WAIT_FOR_PROXY_INTERVAL_MS, tls2 = false) {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve4) => setTimeout(resolve4, intervalMs));
    if (await isProxyRunning(port, tls2)) {
      return true;
    }
  }
  return false;
}
function shellEscape(arg) {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
function collectBinPaths(cwd) {
  const dirs = [];
  let dir = cwd;
  for (; ; ) {
    const bin = path4.join(dir, "node_modules", ".bin");
    if (fs5.existsSync(bin)) {
      dirs.push(bin);
    }
    const parent = path4.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dirs;
}
function augmentedPath(env, cwd) {
  const source = env ?? process.env;
  const base = source.PATH ?? source.Path ?? "";
  const bins = collectBinPaths(cwd ?? process.cwd());
  const nodeBin = path4.dirname(process.execPath);
  const allBins = [...bins, nodeBin];
  return allBins.join(path4.delimiter) + path4.delimiter + base;
}
function spawnCommand(commandArgs, options) {
  const env = {
    ...options?.env ?? process.env,
    PATH: augmentedPath(options?.env)
  };
  if (isWindows) {
    for (const key of Object.keys(env)) {
      if (key !== "PATH" && key.toUpperCase() === "PATH") {
        delete env[key];
      }
    }
  }
  const child = isWindows ? spawn2("cmd.exe", ["/d", "/s", "/c", commandArgs.join(" ")], {
    stdio: "inherit",
    env
  }) : spawn2("/bin/sh", ["-c", commandArgs.map(shellEscape).join(" ")], {
    stdio: "inherit",
    env,
    detached: true
  });
  let exiting = false;
  let shutdownSignal;
  let childExited = false;
  const trackedProcesses = /* @__PURE__ */ new Map();
  let graceTimer;
  let forceTimer;
  let shutdownPoll;
  const cleanup = () => {
    if (graceTimer) clearTimeout(graceTimer);
    if (forceTimer) clearTimeout(forceTimer);
    if (shutdownPoll) clearInterval(shutdownPoll);
    process.removeListener("SIGINT", onSigInt);
    process.removeListener("SIGTERM", onSigTerm);
    options?.onCleanup?.();
  };
  const finish = (code) => {
    if (exiting) return;
    exiting = true;
    cleanup();
    process.exit(code);
  };
  const finishShutdownIfComplete = () => {
    if (!shutdownSignal || !childExited || hasRunningProcesses(trackedProcesses)) return;
    finish(128 + (SIGNAL_CODES[shutdownSignal] || 15));
  };
  const handleSignal = (signal) => {
    if (shutdownSignal) {
      if (child.pid) trackProcessTree(child.pid, trackedProcesses);
      signalTrackedProcesses(trackedProcesses, signal);
      return;
    }
    shutdownSignal = signal;
    if (child.pid) trackProcessTree(child.pid, trackedProcesses);
    killTree(child, signal);
    graceTimer = setTimeout(() => {
      if (child.pid) trackProcessTree(child.pid, trackedProcesses);
      signalTrackedProcesses(trackedProcesses, "SIGTERM");
    }, COMMAND_SHUTDOWN_GRACE_MS);
    forceTimer = setTimeout(() => {
      if (child.pid) trackProcessTree(child.pid, trackedProcesses);
      signalTrackedProcesses(trackedProcesses, "SIGKILL");
    }, COMMAND_SHUTDOWN_FORCE_MS);
    shutdownPoll = setInterval(finishShutdownIfComplete, COMMAND_SHUTDOWN_POLL_MS);
  };
  const onSigInt = () => handleSignal("SIGINT");
  const onSigTerm = () => handleSignal("SIGTERM");
  process.on("SIGINT", onSigInt);
  process.on("SIGTERM", onSigTerm);
  child.on("error", (err) => {
    if (exiting || shutdownSignal) return;
    console.error(`Failed to run command: ${err.message}`);
    if (err.code === "ENOENT") {
      console.error(`Is "${commandArgs[0]}" installed and in your PATH?`);
    }
    finish(1);
  });
  child.on("exit", (code, signal) => {
    if (exiting) return;
    childExited = true;
    if (shutdownSignal) {
      finishShutdownIfComplete();
      return;
    }
    if (signal) {
      finish(128 + (SIGNAL_CODES[signal] || 15));
      return;
    }
    finish(code ?? 1);
  });
}
var FRAMEWORKS_NEEDING_PORT = {
  vite: {
    strictPort: true,
    serverSubcommands: ["dev", "serve", "preview"],
    nonServerSubcommands: ["build", "optimize"],
    defaultIsServer: true,
    positionalRootIsServer: true,
    // Union of vite 6 and vite 7, listing a flag whether its value is required
    // or optional, since cac consumes the next token either way. Derived from
    // each CLI's own option table, not from its prose docs.
    valueFlags: [
      "--assetsDir",
      "--assetsInlineLimit",
      "--base",
      "--configLoader",
      "--host",
      "--manifest",
      "--minify",
      "--open",
      "--outDir",
      "--port",
      "--sourcemap",
      "--ssr",
      "--ssrManifest",
      "--target",
      "-c",
      "--config",
      "-d",
      "--debug",
      "-f",
      "--filter",
      "-l",
      "--logLevel",
      "-m",
      "--mode"
    ]
  },
  vp: { strictPort: true, serverSubcommands: ["dev"], defaultIsServer: false },
  "react-router": { strictPort: true, serverSubcommands: ["dev"], defaultIsServer: false },
  rsbuild: {
    strictPort: false,
    serverSubcommands: ["dev", "preview"],
    defaultIsServer: true,
    valueFlags: [
      "--base",
      "--config-loader",
      "--dist-path",
      "--env-dir",
      "--env-mode",
      "--environment",
      "--host",
      "--log-level",
      "--output",
      "--port",
      "-c",
      "--config",
      "-m",
      "--mode",
      "-o",
      "--open",
      "-r",
      "--root"
    ]
  },
  astro: { strictPort: false, serverSubcommands: ["dev", "preview"], defaultIsServer: false },
  ng: { strictPort: false, serverSubcommands: ["serve", "dev", "s"], defaultIsServer: false },
  "react-native": { strictPort: false, serverSubcommands: ["start"], defaultIsServer: false },
  expo: { strictPort: false, serverSubcommands: ["start", "serve"], defaultIsServer: true }
};
var PACKAGE_RUNNERS = {
  npx: {
    subcommands: [],
    valueFlags: ["-c", "--call", "-p", "--package", "-w", "--workspace", "--allow-scripts"]
  },
  bunx: { subcommands: [] },
  pnpx: { subcommands: [], valueFlags: ["-p", "--package"] },
  yarn: { subcommands: ["dlx", "exec"] },
  pnpm: { subcommands: ["dlx", "exec"] }
};
function parseFrameworkInvocation(commandArgs) {
  if (commandArgs.length === 0) return null;
  const first = path4.basename(commandArgs[0]);
  let frameworkIndex = FRAMEWORKS_NEEDING_PORT[first] ? 0 : null;
  if (frameworkIndex === null) {
    const runner = PACKAGE_RUNNERS[first];
    if (!runner) return null;
    let i = 1;
    const skipRunnerOptions = () => {
      while (i < commandArgs.length && commandArgs[i].startsWith("-")) {
        const option = commandArgs[i];
        i++;
        if (option === "--") break;
        if (!option.includes("=") && runner.valueFlags?.includes(option)) i++;
      }
    };
    if (runner.subcommands.length > 0) {
      skipRunnerOptions();
      if (i >= commandArgs.length) return null;
      if (!runner.subcommands.includes(commandArgs[i])) {
        const name = path4.basename(commandArgs[i]);
        frameworkIndex = FRAMEWORKS_NEEDING_PORT[name] ? i : null;
      } else {
        i++;
      }
    }
    if (frameworkIndex === null) {
      skipRunnerOptions();
      if (i >= commandArgs.length) return null;
      const name = path4.basename(commandArgs[i]);
      frameworkIndex = FRAMEWORKS_NEEDING_PORT[name] ? i : null;
    }
  }
  if (frameworkIndex === null) return null;
  const basename4 = path4.basename(commandArgs[frameworkIndex]);
  const framework = FRAMEWORKS_NEEDING_PORT[basename4];
  const optionEnd = commandArgs.indexOf("--", frameworkIndex + 1);
  const insertionIndex = optionEnd === -1 ? commandArgs.length : optionEnd;
  return {
    basename: basename4,
    framework,
    frameworkIndex,
    frameworkArgs: commandArgs.slice(frameworkIndex + 1, insertionIndex),
    insertionIndex
  };
}
function findFrameworkBasename(commandArgs) {
  return parseFrameworkInvocation(commandArgs)?.basename ?? null;
}
function frameworkPositionals(args, framework) {
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") break;
    if (!arg.startsWith("-")) {
      positionals.push(arg);
      continue;
    }
    if (arg.includes("=")) continue;
    if (framework.valueFlags?.includes(arg)) {
      i++;
      continue;
    }
    if (!framework.valueFlags && positionals.length === 0) return null;
  }
  return positionals;
}
function invokesFrameworkServer(frameworkArgs, framework) {
  const positionals = frameworkPositionals(frameworkArgs, framework);
  if (positionals === null) return false;
  const [subcommand] = positionals;
  if (subcommand === void 0) return framework.defaultIsServer;
  if (framework.serverSubcommands.includes(subcommand)) return true;
  if (framework.nonServerSubcommands?.includes(subcommand)) return false;
  return framework.positionalRootIsServer === true;
}
function injectFrameworkFlags(commandArgs, port) {
  const invocation = parseFrameworkInvocation(commandArgs);
  if (!invocation) return [];
  const { basename: basename4, framework, frameworkArgs, insertionIndex } = invocation;
  if (!invokesFrameworkServer(frameworkArgs, framework)) return [];
  const flags = [];
  if (!hasCliOption(frameworkArgs, "--port")) {
    flags.push("--port", port.toString());
    if (framework.strictPort) {
      flags.push("--strictPort");
    }
  }
  const hasHostChoice = hasCliOption(frameworkArgs, "--host") || basename4 === "expo" && ["--localhost", "--lan", "--tunnel"].some((option) => hasCliOption(frameworkArgs, option));
  if (!hasHostChoice) {
    const isExpoLan = basename4 === "expo" && isLanEnvEnabled();
    if (!isExpoLan) {
      flags.push("--host", basename4 === "expo" ? "localhost" : "127.0.0.1");
    }
  }
  commandArgs.splice(insertionIndex, 0, ...flags);
  return flags;
}
var PACKAGE_SCRIPT_MANAGERS = /* @__PURE__ */ new Set(["npm", "pnpm", "yarn", "bun"]);
function isUnsafeToAppendArgs(command) {
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let atWordStart = true;
  const chars = Array.from(command);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (escaped) {
      escaped = false;
      if (ch === "\n" || ch === "\r") continue;
      atWordStart = false;
      continue;
    }
    if (ch === "\\" && !inSingle) {
      escaped = true;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      atWordStart = false;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      atWordStart = false;
      continue;
    }
    if (inSingle || inDouble) continue;
    if (ch === ";" || ch === "\n" || ch === "\r" || ch === "|") return true;
    if (ch === "#" && atWordStart) return true;
    if (ch === "&") {
      const prev = chars[i - 1];
      const next = chars[i + 1];
      if (prev === ">" && next !== void 0 && /[0-9-]/.test(next)) continue;
      return true;
    }
    atWordStart = ch === " " || ch === "	";
  }
  return false;
}
function hasCliOption(args, option) {
  return args.some((arg) => arg === option || arg.startsWith(`${option}=`));
}
function resolvePackageScriptTokens(commandArgs, packageDir) {
  if (commandArgs.length < 3) return null;
  const runner = path4.basename(commandArgs[0]);
  if (!PACKAGE_SCRIPT_MANAGERS.has(runner)) return null;
  const [, runSubcommand, scriptName] = commandArgs;
  if (runSubcommand !== "run" || scriptName.startsWith("-")) return null;
  return resolveScript(scriptName, packageDir);
}
function isSafeToInjectIntoScript(scriptName, rawScript, packageDir) {
  const rawScriptText = resolveScriptRaw(scriptName, packageDir);
  if (rawScriptText && isUnsafeToAppendArgs(rawScriptText)) return false;
  if (rawScript.includes("--")) return false;
  return true;
}
function resolveFrameworkBasename(commandArgs, packageDir = process.cwd()) {
  const direct = findFrameworkBasename(commandArgs);
  if (direct) return direct;
  const scriptTokens = resolvePackageScriptTokens(commandArgs, packageDir);
  return scriptTokens ? findFrameworkBasename(scriptTokens) : null;
}
function injectPackageScriptFrameworkFlags(commandArgs, port, packageDir = process.cwd()) {
  const rawScript = resolvePackageScriptTokens(commandArgs, packageDir);
  if (!rawScript) return;
  const [, , scriptName] = commandArgs;
  if (!isSafeToInjectIntoScript(scriptName, rawScript, packageDir)) return;
  const userExtras = commandArgs.slice(3).filter((arg) => arg !== "--");
  const probe = [...rawScript, ...userExtras];
  const forwardedFlags = injectFrameworkFlags(probe, port);
  if (forwardedFlags.length === 0) return;
  if (path4.basename(commandArgs[0]) === "npm" && !commandArgs.includes("--")) {
    commandArgs.push("--");
  }
  commandArgs.push(...forwardedFlags);
}

// src/clean-utils.ts
import * as fs6 from "fs";
import * as path5 from "path";
var PORTLESS_STATE_FILES = [
  "routes.json",
  "routes.lock",
  "proxy.pid",
  "proxy.port",
  "proxy.log",
  "proxy.tls",
  "proxy.custom-cert",
  "proxy.tld",
  "proxy.tlds",
  "proxy.lan",
  "proxy.hosts-sync-token",
  "proxy.hosts-sync-token.tmp",
  "ca.trusted",
  "ca.trust-refresh-pending",
  "ca-key.pem",
  "ca.pem",
  "server-key.pem",
  "server.pem",
  "server.csr",
  "server-ext.cnf",
  "ca.srl"
];
var HOST_CERTS_DIR2 = "host-certs";
var CA_IDENTITY_FILES = /* @__PURE__ */ new Set(["ca-key.pem", "ca.pem", "ca.trust-refresh-pending"]);
function collectStateDirsForCleanup() {
  const dirs = /* @__PURE__ */ new Set();
  const add = (d) => {
    const trimmed = d?.trim();
    if (!trimmed) return;
    const resolved = path5.resolve(trimmed);
    if (fs6.existsSync(resolved)) dirs.add(resolved);
  };
  add(USER_STATE_DIR);
  add(LEGACY_SYSTEM_STATE_DIR);
  add(process.env.PORTLESS_STATE_DIR);
  return [...dirs];
}
function attemptCATrustRemovalForCleanup(stateDirs, untrust) {
  const results = /* @__PURE__ */ new Map();
  for (const stateDir of stateDirs) {
    if (!fs6.existsSync(path5.join(stateDir, "ca.pem"))) continue;
    results.set(stateDir, untrust(stateDir));
  }
  return results;
}
function removePortlessStateFiles(dir, options = {}) {
  for (const f of PORTLESS_STATE_FILES) {
    if (options.preserveCAIdentity && CA_IDENTITY_FILES.has(f)) continue;
    try {
      fs6.unlinkSync(path5.join(dir, f));
    } catch {
    }
  }
  try {
    fs6.rmSync(path5.join(dir, HOST_CERTS_DIR2), { recursive: true, force: true });
  } catch {
  }
}

// src/mdns.ts
import { spawn as spawn3, spawnSync as spawnSync3 } from "child_process";

// src/lan-ip.ts
import { createSocket } from "dgram";
import { networkInterfaces } from "os";
var PROBE_HOST = "1.1.1.1";
var PROBE_PORT = 53;
var NO_ROUTE_IP = "0.0.0.0";
function isIPv4Family(family) {
  return family === "IPv4" || family === 4;
}
function parseMac(macStr) {
  return macStr.split(":").slice(0, 16).map((seq) => parseInt(seq, 16));
}
function isInternalInterface(iname, macStr, internal) {
  if (internal) {
    return true;
  }
  const mac = parseMac(macStr);
  if (mac.every((x) => !x)) {
    return true;
  }
  if (mac[0] === 0 && mac[1] === 21 && mac[2] === 93) {
    return true;
  }
  if (iname.includes("vEthernet") || /^bridge\d+$/.test(iname)) {
    return true;
  }
  return false;
}
function probeDefaultRouteIPv4() {
  return new Promise((resolve4, reject) => {
    const socket = createSocket({ type: "udp4", reuseAddr: true });
    socket.on("error", (error) => {
      socket.close();
      socket.unref();
      reject(error);
    });
    socket.connect(PROBE_PORT, PROBE_HOST, () => {
      const addr = socket.address();
      socket.close();
      socket.unref();
      if (addr && "address" in addr && addr.address && addr.address !== NO_ROUTE_IP) {
        resolve4(addr.address);
      } else {
        reject(new Error("No route to host"));
      }
    });
  });
}
function findInterfaceRowForIp(ip) {
  const ifs = networkInterfaces();
  for (const iname of Object.keys(ifs)) {
    const entries = ifs[iname];
    if (!entries) continue;
    for (const e of entries) {
      if (!isIPv4Family(e.family)) continue;
      if (e.address !== ip) continue;
      return { iname, address: e.address, mac: e.mac, internal: e.internal };
    }
  }
  return null;
}
async function getLocalNetworkIp() {
  try {
    const ip = await probeDefaultRouteIPv4();
    if (ip === "127.0.0.1") {
      return null;
    }
    const row = findInterfaceRowForIp(ip);
    if (!row) {
      return null;
    }
    if (row.address === "127.0.0.1") {
      return null;
    }
    if (isInternalInterface(row.iname, row.mac, row.internal)) {
      return null;
    }
    return row.address;
  } catch {
    return null;
  }
}

// src/mdns.ts
var activePublishers = /* @__PURE__ */ new Map();
var LAN_IP_POLL_INTERVAL_MS = 5e3;
function getMdnsPublisher() {
  if (process.platform === "darwin") {
    return {
      command: "dns-sd",
      probeArgs: ["-h"],
      missingReason: "dns-sd not found",
      buildArgs: (fqdn, name, port, ip) => [
        "-P",
        name,
        "_http._tcp",
        "local",
        port.toString(),
        fqdn,
        ip
      ]
    };
  }
  if (process.platform === "linux") {
    return {
      command: "avahi-publish-address",
      probeArgs: ["--help"],
      missingReason: "avahi-publish-address not found. Install avahi-utils: sudo apt install avahi-utils",
      buildArgs: (fqdn, _name, _port, ip) => ["-R", fqdn, ip]
    };
  }
  return null;
}
function hasCommand(command, probeArgs) {
  const result = spawnSync3(command, probeArgs, {
    stdio: "ignore",
    timeout: 1e3,
    windowsHide: true
  });
  return result.error?.code !== "ENOENT";
}
function startLanIpMonitor(options) {
  const resolveIp = options.resolveIp ?? getLocalNetworkIp;
  let currentIp = options.initialIp;
  let stopped = false;
  let polling = false;
  const poll = async () => {
    if (stopped || polling) return;
    polling = true;
    try {
      const nextIp = await resolveIp();
      if (stopped || nextIp === currentIp) return;
      const previousIp = currentIp;
      currentIp = nextIp;
      options.onChange(nextIp, previousIp);
    } catch (error) {
      options.onError?.(error);
    } finally {
      polling = false;
    }
  };
  const timer = setInterval(() => {
    void poll();
  }, options.intervalMs ?? LAN_IP_POLL_INTERVAL_MS);
  timer.unref?.();
  return {
    stop: () => {
      stopped = true;
      clearInterval(timer);
    }
  };
}
function isMdnsSupported() {
  const publisher = getMdnsPublisher();
  if (!publisher) {
    return { supported: false, reason: "mDNS publishing is not supported on this platform" };
  }
  if (!hasCommand(publisher.command, publisher.probeArgs)) {
    return { supported: false, reason: publisher.missingReason };
  }
  return { supported: true };
}
function serviceName(hostname) {
  return hostname.replace(/\.local$/, "");
}
function publish(hostname, port, ip, onError) {
  if (activePublishers.has(hostname)) return;
  const fqdn = hostname.endsWith(".local") ? hostname : `${hostname}.local`;
  const name = serviceName(fqdn);
  const publisher = getMdnsPublisher();
  if (!publisher) {
    return;
  }
  const child = spawn3(publisher.command, publisher.buildArgs(fqdn, name, port, ip), {
    stdio: "ignore",
    detached: false
  });
  child.on("error", (err) => {
    activePublishers.delete(hostname);
    const msg = err.code === "ENOENT" ? publisher.missingReason : `mDNS publish error for ${hostname}: ${err.message}`;
    onError?.(msg);
  });
  child.on("exit", () => {
    activePublishers.delete(hostname);
  });
  activePublishers.set(hostname, child);
}
function unpublish(hostname) {
  const child = activePublishers.get(hostname);
  if (!child) return;
  activePublishers.delete(hostname);
  child.kill("SIGTERM");
}
function cleanupAll() {
  for (const child of activePublishers.values()) {
    child.kill("SIGTERM");
  }
  activePublishers.clear();
}

// src/workspace.ts
import * as fs7 from "fs";
import * as path6 from "path";
function findWorkspaceRoot(cwd = process.cwd()) {
  let dir = cwd;
  for (; ; ) {
    try {
      fs7.accessSync(path6.join(dir, "pnpm-workspace.yaml"), fs7.constants.R_OK);
      return dir;
    } catch {
    }
    if (readWorkspacesFromPackageJson(dir) !== null) {
      return dir;
    }
    const parent = path6.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
function detectWorkspaceSource(workspaceRoot) {
  try {
    fs7.accessSync(path6.join(workspaceRoot, "pnpm-workspace.yaml"), fs7.constants.R_OK);
    return "pnpm";
  } catch {
  }
  if (readWorkspacesFromPackageJson(workspaceRoot) !== null) {
    return "package-json";
  }
  return null;
}
function readWorkspacesFromPackageJson(dir) {
  const pkgPath = path6.join(dir, "package.json");
  try {
    const raw = fs7.readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    if (!pkg || typeof pkg !== "object") return null;
    const ws = pkg.workspaces;
    if (Array.isArray(ws)) {
      return ws.filter((g) => typeof g === "string");
    }
    if (ws && typeof ws === "object" && !Array.isArray(ws) && Array.isArray(ws.packages)) {
      return ws.packages.filter((g) => typeof g === "string");
    }
  } catch {
  }
  return null;
}
function discoverWorkspacePackages(workspaceRoot) {
  const source = detectWorkspaceSource(workspaceRoot);
  let globs;
  if (source === "pnpm") {
    const wsPath = path6.join(workspaceRoot, "pnpm-workspace.yaml");
    let content;
    try {
      content = fs7.readFileSync(wsPath, "utf-8");
    } catch {
      return [];
    }
    globs = parsePnpmWorkspaceYaml(content);
  } else if (source === "package-json") {
    globs = readWorkspacesFromPackageJson(workspaceRoot) ?? [];
  } else {
    return [];
  }
  const dirs = expandPackageGlobs(workspaceRoot, globs);
  const packages = [];
  for (const dir of dirs) {
    const pkgPath = path6.join(dir, "package.json");
    try {
      const raw = fs7.readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw);
      const rawName = typeof pkg.name === "string" ? pkg.name : null;
      const scopeMatch = rawName?.match(/^@([^/]+)\//);
      const scope = scopeMatch ? scopeMatch[1] : null;
      const name = rawName ? rawName.replace(/^@[^/]+\//, "") : null;
      const scripts = typeof pkg.scripts === "object" && pkg.scripts !== null ? pkg.scripts : {};
      packages.push({ dir, name, scope, scripts });
    } catch {
    }
  }
  return packages;
}
function parsePnpmWorkspaceYaml(content) {
  const lines = content.split("\n");
  const globs = [];
  let inPackages = false;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headerMatch = line.match(/^packages\s*:(.*)/);
    if (headerMatch) {
      const rest = headerMatch[1].trim();
      if (rest.startsWith("[")) {
        return parseFlowSequence(rest);
      }
      inPackages = true;
      continue;
    }
    if (inPackages) {
      if (line.length > 0 && !line.startsWith(" ") && !line.startsWith("	") && !line.startsWith("-")) {
        break;
      }
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^-\s+['"]?([^'"#]+?)['"]?\s*(?:#.*)?$/);
      if (match) {
        const glob = match[1].trim();
        if (glob) globs.push(glob);
      }
    }
  }
  return globs;
}
function parseFlowSequence(input) {
  const inner = input.replace(/^\[/, "").replace(/]\s*$/, "");
  return inner.split(",").map((s) => s.trim().replace(/^['"]/, "").replace(/['"]$/, "").trim()).filter(Boolean);
}
function expandPackageGlobs(root, globs) {
  const included = /* @__PURE__ */ new Set();
  const excluded = /* @__PURE__ */ new Set();
  for (const glob of globs) {
    if (glob.startsWith("!")) {
      const negated = glob.slice(1);
      for (const dir of expandSingleGlob(root, negated)) {
        excluded.add(dir);
      }
    } else {
      for (const dir of expandSingleGlob(root, glob)) {
        included.add(dir);
      }
    }
  }
  for (const dir of excluded) {
    included.delete(dir);
  }
  return [...included].sort();
}
function segmentMatches(pattern, name) {
  if (pattern === "*" || pattern === "**") return true;
  const starIdx = pattern.indexOf("*");
  if (starIdx === -1) return pattern === name;
  const prefix = pattern.slice(0, starIdx);
  const suffix = pattern.slice(starIdx + 1).replace(/\*+$/, "");
  return name.startsWith(prefix) && name.endsWith(suffix);
}
function expandSingleGlob(root, glob) {
  const segments = glob.split("/");
  return expandSegments(root, segments);
}
function expandSegments(base, segments) {
  if (segments.length === 0) {
    try {
      const stat = fs7.statSync(base);
      if (stat.isDirectory()) return [base];
    } catch {
    }
    return [];
  }
  const [current, ...rest] = segments;
  if (current.includes("*")) {
    try {
      const entries = fs7.readdirSync(base, { withFileTypes: true });
      const matched = entries.filter((e) => e.isDirectory() && segmentMatches(current, e.name));
      if (rest.length === 0) {
        return matched.map((e) => path6.join(base, e.name));
      }
      const results = [];
      for (const entry of matched) {
        results.push(...expandSegments(path6.join(base, entry.name), rest));
      }
      return results;
    } catch {
      return [];
    }
  }
  return expandSegments(path6.join(base, current), rest);
}

// src/turbo.ts
import * as fs8 from "fs";
import * as path7 from "path";
var LOADER_FILENAME = "turbo-env-loader.cjs";
var MANIFEST_FILENAME = "dev-manifest.json";
function loaderPath(baseDir = USER_STATE_DIR) {
  return path7.join(baseDir, LOADER_FILENAME);
}
function manifestPath(baseDir = USER_STATE_DIR) {
  return path7.join(baseDir, MANIFEST_FILENAME);
}
function loaderSource(baseDir = USER_STATE_DIR) {
  return `"use strict";
var fs = require("fs");
var path = require("path");
var manifestPath = path.join(${JSON.stringify(baseDir)}, "dev-manifest.json");
try {
  var raw = fs.readFileSync(manifestPath, "utf-8");
  var manifest = JSON.parse(raw);
  var cwd = process.cwd();
  var entry = manifest[cwd];
  if (entry && typeof entry === "object") {
    var keys = Object.keys(entry);
    for (var i = 0; i < keys.length; i++) {
      process.env[keys[i]] = entry[keys[i]];
    }
  }
} catch (_) {}
`;
}
function ensureEnvLoader(baseDir = USER_STATE_DIR) {
  fs8.mkdirSync(baseDir, { recursive: true, mode: 493 });
  const target = loaderPath(baseDir);
  const source = loaderSource(baseDir);
  try {
    const existing = fs8.readFileSync(target, "utf-8");
    if (existing === source) return;
  } catch {
  }
  fs8.writeFileSync(target, source, { mode: 420 });
}
function writeManifest(entries, baseDir = USER_STATE_DIR) {
  fs8.mkdirSync(baseDir, { recursive: true, mode: 493 });
  fs8.writeFileSync(manifestPath(baseDir), JSON.stringify(entries, null, 2) + "\n", { mode: 420 });
}
function removeManifest(baseDir = USER_STATE_DIR) {
  try {
    fs8.unlinkSync(manifestPath(baseDir));
  } catch {
  }
}
function buildNodeOptions(baseDir = USER_STATE_DIR) {
  const existing = process.env.NODE_OPTIONS || "";
  const lp = loaderPath(baseDir);
  const requireFlag = lp.includes(" ") ? `--require "${lp}"` : `--require ${lp}`;
  return existing ? `${requireFlag} ${existing}` : requireFlag;
}
function hasTurboConfig(wsRoot) {
  try {
    fs8.accessSync(path7.join(wsRoot, "turbo.json"), fs8.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

// src/service.ts
import * as fs9 from "fs";
import * as os3 from "os";
import * as path8 from "path";
import { spawnSync as spawnSync4 } from "child_process";
var DEFAULT_SERVICE_PORT = getProtocolPort(true);
var SERVICE_LABEL = "sh.portless.proxy";
var SYSTEMD_SERVICE = "portless.service";
var WINDOWS_TASK_NAME = "Portless Proxy";
var INTERNAL_ELEVATED_ENV = "PORTLESS_INTERNAL_SERVICE_ELEVATED";
var SERVICE_ENV_KEYS = /* @__PURE__ */ new Set(["PORTLESS_SYNC_HOSTS"]);
function normalizeTlds(tlds) {
  return [...new Set(tlds.length > 0 ? tlds : [DEFAULT_TLD])];
}
function primaryTld(tlds) {
  return tlds[0] ?? DEFAULT_TLD;
}
function formatTldList(tlds) {
  return tlds.map((tld) => `.${tld}`).join(", ");
}
var DEFAULT_SERVICE_CONFIG = {
  proxyPort: DEFAULT_SERVICE_PORT,
  useHttps: true,
  customCertPath: null,
  customKeyPath: null,
  lanMode: false,
  lanIp: null,
  lanIpExplicit: false,
  tld: DEFAULT_TLD,
  tlds: [DEFAULT_TLD],
  useWildcard: false,
  extraEnv: {}
};
function defaultRunner4(command, args, options) {
  return spawnSync4(command, args, {
    encoding: "utf-8",
    stdio: options?.stdio ?? "pipe"
  });
}
function isSupportedPlatform(platform) {
  return platform === "darwin" || platform === "linux" || platform === "win32";
}
function xmlEscape(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function systemdEscape(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function windowsQuote(value) {
  return `"${value.replace(/"/g, '\\"')}"`;
}
function xmlUnescape(value) {
  return value.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}
function parseBooleanEnv(value) {
  if (value === void 0) return null;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}
function parsePortValue(value, source) {
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`${source} must be a number between 1 and 65535.`);
  }
  return port;
}
function getFlagValue(args, index, flag) {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flag} requires a value.`);
  }
  return value;
}
function resolveServicePath(value) {
  const expanded = value === "~" ? os3.homedir() : value.startsWith("~/") || value.startsWith("~\\") ? path8.join(os3.homedir(), value.slice(2)) : value;
  return path8.resolve(expanded);
}
function normalizeServiceInstallPaths(config) {
  return {
    ...config,
    stateDir: config.stateDir ? resolveServicePath(config.stateDir) : void 0,
    customCertPath: config.customCertPath ? resolveServicePath(config.customCertPath) : null,
    customKeyPath: config.customKeyPath ? resolveServicePath(config.customKeyPath) : null
  };
}
function collectServiceExtraEnv(env) {
  const extraEnv = {};
  for (const key of SERVICE_ENV_KEYS) {
    const value = env[key];
    if (value) extraEnv[key] = value;
  }
  return extraEnv;
}
function parseServiceInstallConfig(args, env = process.env, options = {}) {
  const config = {
    ...DEFAULT_SERVICE_CONFIG,
    extraEnv: collectServiceExtraEnv(env)
  };
  if (env.PORTLESS_STATE_DIR) {
    config.stateDir = env.PORTLESS_STATE_DIR;
  }
  const envHttps = parseBooleanEnv(env.PORTLESS_HTTPS);
  if (envHttps !== null) {
    config.useHttps = envHttps;
  }
  const envLan = parseBooleanEnv(env.PORTLESS_LAN);
  if (envLan !== null) {
    config.lanMode = envLan;
  }
  if (env.PORTLESS_LAN_IP) {
    config.lanMode = true;
    config.lanIp = env.PORTLESS_LAN_IP;
    config.lanIpExplicit = true;
  }
  if (env.PORTLESS_TLD) {
    config.tlds = normalizeTlds(parseTldList(env.PORTLESS_TLD, "PORTLESS_TLD"));
    config.tld = primaryTld(config.tlds);
  }
  const envWildcard = parseBooleanEnv(env.PORTLESS_WILDCARD);
  if (envWildcard !== null) {
    config.useWildcard = envWildcard;
  }
  if (env.PORTLESS_PORT) {
    config.proxyPort = parsePortValue(env.PORTLESS_PORT, "PORTLESS_PORT");
  } else {
    config.proxyPort = getProtocolPort(config.useHttps);
  }
  const tokens = args[0] === "service" ? args.slice(2) : args;
  let tldFlagSeen = false;
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    switch (token) {
      case "-p":
      case "--port":
        config.proxyPort = parsePortValue(getFlagValue(tokens, i, token), token);
        i += 1;
        break;
      case "--https":
        config.useHttps = true;
        break;
      case "--no-tls":
        config.useHttps = false;
        break;
      case "--lan":
        config.lanMode = true;
        break;
      case "--ip":
        config.lanMode = true;
        config.lanIp = getFlagValue(tokens, i, token);
        config.lanIpExplicit = true;
        i += 1;
        break;
      case "--tld": {
        const tlds = parseTldList(getFlagValue(tokens, i, token));
        config.tlds = normalizeTlds([...tldFlagSeen ? config.tlds : [], ...tlds]);
        config.tld = primaryTld(config.tlds);
        tldFlagSeen = true;
        i += 1;
        break;
      }
      case "--wildcard":
        config.useWildcard = true;
        break;
      case "--cert":
        config.customCertPath = getFlagValue(tokens, i, token);
        config.useHttps = true;
        i += 1;
        break;
      case "--key":
        config.customKeyPath = getFlagValue(tokens, i, token);
        config.useHttps = true;
        i += 1;
        break;
      case "--state-dir":
        config.stateDir = getFlagValue(tokens, i, token);
        i += 1;
        break;
      case "--foreground":
      case "--skip-trust":
        if (!options.allowRuntimeFlags) {
          throw new Error(`Unknown service install option "${token}".`);
        }
        break;
      default:
        throw new Error(`Unknown service install option "${token}".`);
    }
  }
  if (config.customCertPath && !config.customKeyPath || !config.customCertPath && config.customKeyPath) {
    throw new Error("--cert and --key must be used together.");
  }
  if (!env.PORTLESS_PORT && !tokens.includes("--port") && !tokens.includes("-p")) {
    config.proxyPort = getProtocolPort(config.useHttps);
  }
  if (!config.lanMode) {
    config.lanIp = null;
    config.lanIpExplicit = false;
  } else {
    config.tlds = ["local"];
    config.tld = "local";
  }
  return config;
}
function resolveUserContext(platform) {
  if (platform === "win32") {
    const home = resolveUserHome({ platform });
    return { home, username: process.env.USERNAME };
  }
  const sudoUser = process.env.SUDO_USER;
  const sudoUid = process.env.SUDO_UID;
  const sudoGid = process.env.SUDO_GID;
  if (sudoUser && sudoUser !== "root") {
    const home = resolveUserHome({ platform });
    return { home, uid: sudoUid, gid: sudoGid, username: sudoUser };
  }
  const userInfo2 = os3.userInfo();
  return {
    home: os3.homedir(),
    uid: process.getuid?.()?.toString(),
    gid: process.getgid?.()?.toString(),
    username: userInfo2.username
  };
}
function buildProxyCommand(entryScript, serviceConfig) {
  const proxyConfig = buildProxyStartConfig({
    useHttps: serviceConfig.useHttps,
    customCertPath: serviceConfig.customCertPath,
    customKeyPath: serviceConfig.customKeyPath,
    lanMode: serviceConfig.lanMode,
    lanIp: serviceConfig.lanIp,
    lanIpExplicit: serviceConfig.lanIpExplicit,
    tld: serviceConfig.tld,
    tlds: serviceConfig.tlds,
    useWildcard: serviceConfig.useWildcard,
    foreground: true,
    includePort: true,
    proxyPort: serviceConfig.proxyPort,
    skipTrust: true
  });
  return [entryScript, "proxy", "start", ...proxyConfig.args];
}
function buildServiceEnv(ctx) {
  const env = {
    PORTLESS_STATE_DIR: ctx.stateDir,
    PORTLESS_PORT: ctx.config.proxyPort.toString(),
    PORTLESS_HTTPS: ctx.config.useHttps ? "1" : "0",
    PORTLESS_LAN: ctx.config.lanMode ? "1" : "0",
    PORTLESS_WILDCARD: ctx.config.useWildcard ? "1" : "0",
    ...ctx.config.extraEnv
  };
  if (ctx.config.lanMode && ctx.config.lanIpExplicit && ctx.config.lanIp) {
    env.PORTLESS_LAN_IP = ctx.config.lanIp;
  }
  if (ctx.config.lanMode) {
    env.PORTLESS_TLD = "local";
  } else if (ctx.config.tlds.length > 1 || ctx.config.tld !== DEFAULT_TLD) {
    env.PORTLESS_TLD = ctx.config.tlds.join(",");
  }
  if (ctx.platform === "win32") {
    env.USERPROFILE = ctx.user.home;
    env.PATH = ctx.pathEnv;
  } else {
    env.HOME = ctx.user.home;
    if (ctx.user.uid) env.SUDO_UID = ctx.user.uid;
    if (ctx.user.gid) env.SUDO_GID = ctx.user.gid;
  }
  return env;
}
function defaultStateDir(platform, userHome) {
  return platform === "win32" ? path8.win32.join(userHome, ".portless") : path8.posix.join(userHome, ".portless");
}
function buildLaunchdPlist(ctx, programArguments) {
  const env = buildServiceEnv(ctx);
  const envEntries = Object.entries(env).map(
    ([key, value]) => `    <key>${xmlEscape(key)}</key>
    <string>${xmlEscape(value)}</string>`
  ).join("\n");
  const args = programArguments.map((arg) => `    <string>${xmlEscape(arg)}</string>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${SERVICE_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
${args}
  </array>
  <key>EnvironmentVariables</key>
  <dict>
${envEntries}
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${xmlEscape(path8.posix.join(ctx.stateDir, "service.log"))}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEscape(path8.posix.join(ctx.stateDir, "service.log"))}</string>
</dict>
</plist>
`;
}
function buildSystemdUnit(ctx, execStart) {
  const env = buildServiceEnv(ctx);
  const envLines = Object.entries(env).map(([key, value]) => `Environment=${key}=${systemdEscape(value)}`).join("\n");
  return `[Unit]
Description=Portless HTTPS proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
${envLines}
Environment=PATH=${systemdEscape(ctx.pathEnv)}
ExecStart=${execStart.map(systemdEscape).join(" ")}
Restart=on-failure
RestartSec=2
KillSignal=SIGTERM
TimeoutStopSec=5

[Install]
WantedBy=multi-user.target
`;
}
function buildWindowsScript(ctx, command) {
  const env = buildServiceEnv(ctx);
  const setEnv = Object.entries(env).map(([key, value]) => `set "${key}=${value.replace(/"/g, "").replace(/%/g, "%%")}"`).join("\r\n");
  const proxyCommand = [windowsQuote(ctx.nodePath), ...command.map(windowsQuote)].join(" ");
  return `@echo off\r
${setEnv}\r
${proxyCommand}\r
`;
}
function buildWindowsTaskXml(scriptPath) {
  const taskArguments = `/d /s /c "${windowsQuote(scriptPath)}"`;
  return `\uFEFF<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.3" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Portless HTTPS proxy</Description>
  </RegistrationInfo>
  <Triggers>
    <BootTrigger>
      <Enabled>true</Enabled>
    </BootTrigger>
  </Triggers>
  <Principals>
    <Principal id="System">
      <UserId>S-1-5-18</UserId>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="System">
    <Exec>
      <Command>cmd.exe</Command>
      <Arguments>${xmlEscape(taskArguments)}</Arguments>
    </Exec>
  </Actions>
</Task>
`;
}
function buildServiceSpec(options) {
  const installConfig = {
    ...DEFAULT_SERVICE_CONFIG,
    ...options.installConfig,
    extraEnv: options.installConfig?.extraEnv ?? {}
  };
  installConfig.tlds = installConfig.lanMode ? ["local"] : normalizeTlds(
    options.installConfig?.tlds ?? (options.installConfig?.tld ? [options.installConfig.tld] : installConfig.tlds)
  );
  installConfig.tld = primaryTld(installConfig.tlds);
  const stateDir = options.stateDir || installConfig.stateDir || defaultStateDir(options.platform, options.userHome);
  const normalizedConfig = {
    ...installConfig,
    stateDir
  };
  const ctx = {
    platform: options.platform,
    nodePath: options.nodePath,
    entryScript: options.entryScript,
    stateDir,
    user: {
      home: options.userHome,
      uid: options.uid,
      gid: options.gid,
      username: options.username
    },
    pathEnv: options.pathEnv || "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
    programData: options.programData || "C:\\ProgramData",
    config: normalizedConfig
  };
  const proxyCommand = buildProxyCommand(ctx.entryScript, ctx.config);
  if (ctx.platform === "darwin") {
    const programArguments = [ctx.nodePath, ...proxyCommand];
    return {
      platform: "darwin",
      label: SERVICE_LABEL,
      plistPath: `/Library/LaunchDaemons/${SERVICE_LABEL}.plist`,
      plist: buildLaunchdPlist(ctx, programArguments),
      stateDir: ctx.stateDir,
      config: ctx.config,
      programArguments
    };
  }
  if (ctx.platform === "linux") {
    const execStart = [ctx.nodePath, ...proxyCommand];
    return {
      platform: "linux",
      serviceName: SYSTEMD_SERVICE,
      unitPath: `/etc/systemd/system/${SYSTEMD_SERVICE}`,
      unit: buildSystemdUnit(ctx, execStart),
      stateDir: ctx.stateDir,
      config: ctx.config,
      execStart
    };
  }
  const scriptDir = path8.win32.join(ctx.programData, "portless", "service");
  const scriptPath = path8.win32.join(scriptDir, "portless-service.cmd");
  const taskXmlPath = path8.win32.join(scriptDir, "portless-task.xml");
  const script = buildWindowsScript(ctx, proxyCommand);
  const taskXml = buildWindowsTaskXml(scriptPath);
  return {
    platform: "win32",
    taskName: WINDOWS_TASK_NAME,
    stateDir: ctx.stateDir,
    config: ctx.config,
    scriptDir,
    scriptPath,
    script,
    taskXmlPath,
    taskXml,
    createArgs: ["/Create", "/TN", WINDOWS_TASK_NAME, "/XML", taskXmlPath, "/F"],
    runArgs: ["/Run", "/TN", WINDOWS_TASK_NAME],
    deleteArgs: ["/Delete", "/TN", WINDOWS_TASK_NAME, "/F"],
    queryArgs: ["/Query", "/TN", WINDOWS_TASK_NAME, "/FO", "LIST", "/V"]
  };
}
function currentServiceSpec(entryScript, installConfig) {
  if (!isSupportedPlatform(process.platform)) {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  const user = resolveUserContext(process.platform);
  const stateDir = installConfig?.stateDir || process.env.PORTLESS_STATE_DIR || defaultStateDir(process.platform, user.home);
  const config = installConfig ?? {
    ...DEFAULT_SERVICE_CONFIG,
    stateDir,
    extraEnv: collectServiceExtraEnv(process.env)
  };
  return buildServiceSpec({
    platform: process.platform,
    nodePath: process.execPath,
    entryScript,
    userHome: user.home,
    uid: user.uid,
    gid: user.gid,
    username: user.username,
    stateDir,
    pathEnv: process.env.PATH,
    programData: process.env.ProgramData,
    installConfig: config
  });
}
function parseQuotedWords(input, options = {}) {
  const words = [];
  let current = "";
  let inQuote = false;
  let inWord = false;
  const unescapeBackslash = options.unescapeBackslash ?? true;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      inQuote = !inQuote;
      inWord = true;
      continue;
    }
    if (char === "\\" && i + 1 < input.length && (input[i + 1] === '"' || unescapeBackslash && input[i + 1] === "\\")) {
      current += input[i + 1];
      inWord = true;
      i += 1;
      continue;
    }
    if (/\s/.test(char) && !inQuote) {
      if (inWord) {
        words.push(current);
        current = "";
        inWord = false;
      }
      continue;
    }
    current += char;
    inWord = true;
  }
  if (inWord) {
    words.push(current);
  }
  return words;
}
function parsePlistStrings(block) {
  return [...block.matchAll(/<string>([\s\S]*?)<\/string>/g)].map((match) => xmlUnescape(match[1]));
}
function parsePlistEnv(block) {
  const env = {};
  for (const match of block.matchAll(/<key>([\s\S]*?)<\/key>\s*<string>([\s\S]*?)<\/string>/g)) {
    env[xmlUnescape(match[1])] = xmlUnescape(match[2]);
  }
  return env;
}
function readInstalledServiceSnapshot(spec) {
  try {
    if (spec.platform === "darwin") {
      if (!fs9.existsSync(spec.plistPath)) return null;
      const plist = fs9.readFileSync(spec.plistPath, "utf-8");
      const argsBlock = plist.match(/<key>ProgramArguments<\/key>\s*<array>([\s\S]*?)<\/array>/);
      const envBlock = plist.match(/<key>EnvironmentVariables<\/key>\s*<dict>([\s\S]*?)<\/dict>/);
      if (!argsBlock) return null;
      return {
        command: parsePlistStrings(argsBlock[1]),
        env: envBlock ? parsePlistEnv(envBlock[1]) : {}
      };
    }
    if (spec.platform === "linux") {
      if (!fs9.existsSync(spec.unitPath)) return null;
      const unit = fs9.readFileSync(spec.unitPath, "utf-8");
      const env2 = {};
      let command = null;
      for (const line of unit.split("\n")) {
        if (line.startsWith("Environment=")) {
          const entry = line.slice("Environment=".length);
          const eq = entry.indexOf("=");
          if (eq > 0) {
            const key = entry.slice(0, eq);
            const value = parseQuotedWords(entry.slice(eq + 1))[0] ?? "";
            env2[key] = value;
          }
        } else if (line.startsWith("ExecStart=")) {
          command = parseQuotedWords(line.slice("ExecStart=".length));
        }
      }
      return command ? { command, env: env2 } : null;
    }
    if (!fs9.existsSync(spec.scriptPath)) return null;
    const script = fs9.readFileSync(spec.scriptPath, "utf-8");
    const env = {};
    let commandLine = null;
    for (const rawLine of script.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.toLowerCase() === "@echo off") continue;
      const envMatch = line.match(/^set "([^=]+)=(.*)"$/);
      if (envMatch) {
        env[envMatch[1]] = envMatch[2].replace(/%%/g, "%");
        continue;
      }
      commandLine = line;
    }
    return commandLine ? { command: parseQuotedWords(commandLine, { unescapeBackslash: false }), env } : null;
  } catch {
    return null;
  }
}
function installedConfigFromSnapshot(snapshot, fallback) {
  const proxyIndex = snapshot.command.findIndex(
    (arg, index) => arg === "proxy" && snapshot.command[index + 1] === "start"
  );
  if (proxyIndex === -1) return null;
  try {
    const parsed = parseServiceInstallConfig(
      ["service", "install", ...snapshot.command.slice(proxyIndex + 2)],
      snapshot.env,
      { allowRuntimeFlags: true }
    );
    const stateDir = parsed.stateDir || snapshot.env.PORTLESS_STATE_DIR || fallback.stateDir;
    return { ...parsed, stateDir };
  } catch {
    return null;
  }
}
function readInstalledServiceConfig(spec) {
  const snapshot = readInstalledServiceSnapshot(spec);
  if (!snapshot) return null;
  return installedConfigFromSnapshot(snapshot, spec.config);
}
function collectPortlessEnvArgs(env = process.env, omit = /* @__PURE__ */ new Set()) {
  const envArgs = [];
  for (const key of Object.keys(env)) {
    if (key.startsWith("PORTLESS_") && env[key] && !omit.has(key)) {
      envArgs.push(`${key}=${env[key]}`);
    }
  }
  return envArgs;
}
function buildElevatedEnvArgs(options) {
  const extraEnv = options.extraEnv ?? {};
  const overrideKeys = /* @__PURE__ */ new Set(["PORTLESS_STATE_DIR", ...Object.keys(extraEnv)]);
  return [
    "env",
    ...collectPortlessEnvArgs(options.env, overrideKeys),
    ...Object.entries(extraEnv).map(([key, value]) => `${key}=${value}`),
    `HOME=${options.home}`,
    `PORTLESS_STATE_DIR=${options.stateDir}`
  ];
}
function buildServiceUninstallSudoArgs(entryScript, options = {}) {
  const env = options.env ?? process.env;
  const home = options.home ?? os3.homedir();
  const stateDir = options.stateDir ?? env.PORTLESS_STATE_DIR ?? path8.join(home, ".portless");
  return [
    ...buildElevatedEnvArgs({ home, stateDir, env }),
    options.nodePath ?? process.execPath,
    entryScript,
    "service",
    "uninstall"
  ];
}
function requireUnixElevation(args, runner) {
  if (process.platform !== "darwin" && process.platform !== "linux") return;
  if ((process.getuid?.() ?? -1) === 0) return;
  if (process.env[INTERNAL_ELEVATED_ENV] === "1") return;
  const home = os3.homedir();
  const stateDir = process.env.PORTLESS_STATE_DIR || path8.join(home, ".portless");
  const result = runner(
    "sudo",
    [
      ...buildElevatedEnvArgs({
        home,
        stateDir,
        extraEnv: { [INTERNAL_ELEVATED_ENV]: "1" }
      }),
      process.execPath,
      args[0],
      ...args.slice(1)
    ],
    { stdio: "inherit" }
  );
  process.exit(result.status ?? 1);
}
function runRequired(runner, command, args) {
  const result = runner(command, args);
  if (result.status !== 0) {
    const detail = result.stderr || result.stdout || result.error?.message || `${command} failed`;
    throw new Error(detail.trim());
  }
}
function runOptional(runner, command, args) {
  runner(command, args);
}
function isPermissionError(err) {
  const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
  const message = err instanceof Error ? err.message : String(err);
  return code === "EACCES" || code === "EPERM" || /permission denied|operation not permitted|access is denied/i.test(message);
}
function stopProxyOnPort(entryScript, runner, proxyPort) {
  runRequired(runner, process.execPath, [
    entryScript,
    "proxy",
    "stop",
    "--port",
    proxyPort.toString()
  ]);
}
async function stopExistingProxy(entryScript, runner, proxyPort) {
  const ports = /* @__PURE__ */ new Set();
  try {
    const currentState = await discoverState();
    if (currentState.port !== proxyPort && await isProxyRunning(currentState.port)) {
      ports.add(currentState.port);
    }
  } catch {
  }
  ports.add(proxyPort);
  for (const port of ports) {
    stopProxyOnPort(entryScript, runner, port);
  }
}
function prepareServiceState(stateDir) {
  fs9.mkdirSync(stateDir, { recursive: true });
  fixOwnership(stateDir);
}
function prepareTrust(stateDir) {
  try {
    ensureCerts(stateDir);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to generate certificates in ${stateDir}. Ensure OpenSSL is installed.
${detail}`
    );
  }
  if (isCATrusted(stateDir)) return;
  console.log(colors_default.gray("Trusting portless CA for service startup..."));
  const trustResult = trustCA(stateDir);
  if (trustResult.trusted) {
    console.log(colors_default.green("CA added to the system trust store."));
    return;
  }
  console.warn(colors_default.yellow("Could not add the CA to the system trust store."));
  if (trustResult.error) {
    console.warn(colors_default.gray(trustResult.error));
  }
  console.warn(colors_default.yellow("Run `portless trust` if browsers show certificate warnings."));
}
function ensureServiceConfigSupported(config) {
  if (!config.lanMode) return;
  const mdnsSupport = isMdnsSupported();
  if (mdnsSupport.supported) return;
  const reason = mdnsSupport.reason ? `
${mdnsSupport.reason}` : "";
  throw new Error(
    `LAN mode requires mDNS publishing, which is not supported on this platform.${reason}`
  );
}
async function installService(entryScript, runner, args) {
  const installConfig = normalizeServiceInstallPaths(parseServiceInstallConfig(args));
  ensureServiceConfigSupported(installConfig);
  requireUnixElevation([entryScript, ...args], runner);
  const spec = currentServiceSpec(entryScript, installConfig);
  prepareServiceState(spec.stateDir);
  if (spec.config.useHttps && !spec.config.customCertPath) {
    prepareTrust(spec.stateDir);
  }
  if (spec.platform === "darwin") {
    runOptional(runner, "launchctl", ["bootout", "system", spec.plistPath]);
    await stopExistingProxy(entryScript, runner, spec.config.proxyPort);
    fs9.writeFileSync(spec.plistPath, spec.plist);
    fs9.chmodSync(spec.plistPath, 420);
    runRequired(runner, "chown", ["root:wheel", spec.plistPath]);
    runRequired(runner, "launchctl", ["bootstrap", "system", spec.plistPath]);
    runRequired(runner, "launchctl", ["enable", `system/${spec.label}`]);
    runRequired(runner, "launchctl", ["kickstart", "-k", `system/${spec.label}`]);
  } else if (spec.platform === "linux") {
    runOptional(runner, "systemctl", ["disable", "--now", spec.serviceName]);
    await stopExistingProxy(entryScript, runner, spec.config.proxyPort);
    fs9.writeFileSync(spec.unitPath, spec.unit);
    fs9.chmodSync(spec.unitPath, 420);
    runRequired(runner, "systemctl", ["daemon-reload"]);
    runRequired(runner, "systemctl", ["enable", spec.serviceName]);
    runRequired(runner, "systemctl", ["restart", spec.serviceName]);
  } else {
    fs9.mkdirSync(spec.scriptDir, { recursive: true });
    fs9.writeFileSync(spec.scriptPath, spec.script);
    fs9.writeFileSync(spec.taskXmlPath, spec.taskXml, "utf16le");
    runRequired(runner, "schtasks", spec.createArgs);
    runOptional(runner, "schtasks", ["/End", "/TN", spec.taskName]);
    await stopExistingProxy(entryScript, runner, spec.config.proxyPort);
    runOptional(runner, "schtasks", spec.runArgs);
  }
  console.log(colors_default.green("Portless service installed."));
  console.log(colors_default.gray(`State directory: ${spec.stateDir}`));
  console.log(colors_default.gray(`Proxy port: ${spec.config.proxyPort}`));
}
async function uninstallService(entryScript, runner) {
  requireUnixElevation([entryScript, "service", "uninstall"], runner);
  const spec = currentServiceSpec(entryScript);
  if (spec.platform === "darwin") {
    runOptional(runner, "launchctl", ["bootout", "system", spec.plistPath]);
    fs9.rmSync(spec.plistPath, { force: true });
  } else if (spec.platform === "linux") {
    runOptional(runner, "systemctl", ["disable", "--now", spec.serviceName]);
    fs9.rmSync(spec.unitPath, { force: true });
    runOptional(runner, "systemctl", ["daemon-reload"]);
  } else {
    runOptional(runner, "schtasks", ["/End", "/TN", spec.taskName]);
    runOptional(runner, "schtasks", spec.deleteArgs);
    fs9.rmSync(spec.scriptDir, { recursive: true, force: true });
  }
  console.log(colors_default.green("Portless service uninstalled."));
}
function tryUninstallService(entryScript, runner = defaultRunner4) {
  let installed = false;
  try {
    const spec = currentServiceSpec(entryScript);
    if (spec.platform === "darwin") {
      installed = fs9.existsSync(spec.plistPath);
      if (!installed) return { removed: false, installed: false };
      runOptional(runner, "launchctl", ["bootout", "system", spec.plistPath]);
      fs9.rmSync(spec.plistPath, { force: true });
    } else if (spec.platform === "linux") {
      installed = fs9.existsSync(spec.unitPath);
      if (!installed) return { removed: false, installed: false };
      runOptional(runner, "systemctl", ["disable", "--now", spec.serviceName]);
      fs9.rmSync(spec.unitPath, { force: true });
      runOptional(runner, "systemctl", ["daemon-reload"]);
    } else {
      const query = runner("schtasks", ["/Query", "/TN", spec.taskName, "/FO", "LIST"]);
      installed = query.status === 0;
      if (!installed) return { removed: false, installed: false };
      runOptional(runner, "schtasks", ["/End", "/TN", spec.taskName]);
      runRequired(runner, "schtasks", spec.deleteArgs);
      fs9.rmSync(spec.scriptDir, { recursive: true, force: true });
    }
    return { removed: true, installed: true };
  } catch (err) {
    return {
      removed: false,
      installed,
      error: err instanceof Error ? err.message : String(err),
      needsElevation: installed && isPermissionError(err)
    };
  }
}
async function getServiceStatus(entryScript, runner) {
  const spec = currentServiceSpec(entryScript);
  const installedConfig = readInstalledServiceConfig(spec) ?? spec.config;
  const proxyRunning = await isProxyRunning(installedConfig.proxyPort, installedConfig.useHttps);
  if (spec.platform === "darwin") {
    const installed2 = fs9.existsSync(spec.plistPath);
    const result = runner("launchctl", ["print", `system/${spec.label}`]);
    const output2 = `${result.stdout || ""}${result.stderr || ""}`;
    const managerState = result.status === 0 && /state = running|pid = \d+/.test(output2) ? "running" : installed2 ? "installed" : "not installed";
    return {
      installed: installed2,
      managerState,
      proxyRunning,
      config: installedConfig,
      details: spec.plistPath
    };
  }
  if (spec.platform === "linux") {
    const enabled2 = runner("systemctl", ["is-enabled", spec.serviceName]);
    const active = runner("systemctl", ["is-active", spec.serviceName]);
    const installed2 = enabled2.status === 0 || active.status === 0 || fs9.existsSync(spec.unitPath);
    const activeText = (active.stdout || "").trim();
    return {
      installed: installed2,
      managerState: active.status === 0 ? activeText || "active" : installed2 ? "installed" : "not installed",
      proxyRunning,
      config: installedConfig,
      details: spec.unitPath
    };
  }
  const query = runner("schtasks", spec.queryArgs);
  const output = `${query.stdout || ""}${query.stderr || ""}`;
  const installed = query.status === 0;
  const stateMatch = output.match(/^\s*Status:\s*(.+)$/im);
  return {
    installed,
    managerState: installed ? stateMatch?.[1]?.trim() || "installed" : "not installed",
    proxyRunning,
    config: installedConfig,
    details: spec.taskName
  };
}
async function printServiceStatus(entryScript, runner) {
  const status = await getServiceStatus(entryScript, runner);
  const config = status.config;
  console.log(colors_default.bold("portless service"));
  console.log(`  Manager state: ${status.managerState}`);
  console.log(`  Installed: ${status.installed ? "yes" : "no"}`);
  console.log(
    `  Proxy on ${config.proxyPort}: ${status.proxyRunning ? "responding" : "not responding"}`
  );
  console.log(`  HTTPS: ${config.useHttps ? "yes" : "no"}`);
  console.log(`  TLDs: ${config.lanMode ? ".local" : formatTldList(config.tlds)}`);
  console.log(`  LAN mode: ${config.lanMode ? "yes" : "no"}`);
  if (config.lanIpExplicit && config.lanIp) {
    console.log(`  LAN IP: ${config.lanIp}`);
  }
  console.log(`  Wildcard: ${config.useWildcard ? "yes" : "no"}`);
  console.log(`  State directory: ${config.stateDir}`);
  if (status.details) {
    console.log(`  Service entry: ${status.details}`);
  }
}
function printServiceHelp() {
  console.log(`
${colors_default.bold("portless service")} - Start portless automatically when the OS starts.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless service install")}             Install and start the HTTPS service on port 443
  ${colors_default.cyan("portless service install --lan")}       Enable LAN mode for the startup service
  ${colors_default.cyan("portless service install -p 8443")}     Use a custom proxy port
  ${colors_default.cyan("portless service uninstall")}           Stop and remove the startup service
  ${colors_default.cyan("portless service status")}              Show service and proxy status

${colors_default.bold("Install options:")}
  -p, --port <number>              Port for the proxy service
  --no-tls                         Disable HTTPS
  --https                          Enable HTTPS
  --lan                            Enable LAN mode
  --ip <address>                   Pin a specific LAN IP
  --tld <tld>                      Use a custom TLD outside LAN mode, repeatable
  --wildcard                       Allow subdomain fallback
  --cert <path>                    Use a custom TLS certificate
  --key <path>                     Use a custom TLS private key
  --state-dir <path>               Use a custom service state directory

${colors_default.bold("Notes:")}
  The service uses the default clean URL mode unless options or PORTLESS_*
  environment variables are provided during install.
  macOS and Linux install a root-owned service so port 443 can bind at boot.
  Windows installs a Task Scheduler startup task that runs as SYSTEM.
`);
}
async function handleService(args, options) {
  const action = args[1];
  const runner = options.runner || defaultRunner4;
  if (!action || action === "--help" || action === "-h") {
    printServiceHelp();
    process.exit(0);
  }
  try {
    if (action === "install") {
      await installService(options.entryScript, runner, args);
      return;
    }
    if (action === "uninstall") {
      await uninstallService(options.entryScript, runner);
      return;
    }
    if (action === "status") {
      await printServiceStatus(options.entryScript, runner);
      return;
    }
    console.error(colors_default.red(`Error: Unknown service command "${action}".`));
    printServiceHelp();
    process.exit(1);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(colors_default.red("Error:"), message);
    process.exit(1);
  }
}

// src/cli.ts
var chalk = colors_default;
var HOSTS_DISPLAY2 = isWindows ? "hosts file" : "/etc/hosts";
var DEBOUNCE_MS = 100;
var POLL_INTERVAL_MS = 3e3;
var EXIT_TIMEOUT_MS = 2e3;
var SUDO_SPAWN_TIMEOUT_MS = 3e4;
function normalizeTlds2(tlds) {
  return [...new Set(tlds.length > 0 ? tlds : [DEFAULT_TLD])];
}
function primaryTld2(tlds) {
  return tlds[0] ?? DEFAULT_TLD;
}
function formatTldList2(tlds) {
  return tlds.map((tld) => `.${tld}`).join(", ");
}
function defaultProxyConfig(tlds, useHttps, lanMode) {
  const effectiveTlds = lanMode ? ["local"] : normalizeTlds2(tlds);
  return {
    useHttps,
    customCertPath: null,
    customKeyPath: null,
    lanMode,
    lanIp: null,
    lanIpExplicit: false,
    tld: primaryTld2(effectiveTlds),
    tlds: effectiveTlds,
    useWildcard: false
  };
}
function resolveProxyConfig(options) {
  const config = defaultProxyConfig(
    options.defaultTlds,
    options.useHttps,
    options.explicit.lanMode ? options.lanMode : options.persistedLanMode
  );
  if (options.explicit.useHttps) {
    config.useHttps = options.useHttps;
    if (!options.useHttps) {
      config.customCertPath = null;
      config.customKeyPath = null;
    }
  }
  if (options.explicit.customCert) {
    config.useHttps = true;
    config.customCertPath = options.customCertPath;
    config.customKeyPath = options.customKeyPath;
  }
  if (options.explicit.lanMode) {
    config.lanMode = options.lanMode;
    if (!options.lanMode) {
      config.lanIp = null;
      config.lanIpExplicit = false;
      if (!options.explicit.tlds) {
        config.tlds = normalizeTlds2(options.defaultTlds);
        config.tld = primaryTld2(config.tlds);
      }
    }
  }
  if (options.explicit.lanIp && options.lanIp) {
    config.lanMode = true;
    config.lanIp = options.lanIp;
    config.lanIpExplicit = true;
  }
  if (options.explicit.tlds) {
    config.tlds = normalizeTlds2(options.tlds);
    config.tld = primaryTld2(config.tlds);
  }
  if (options.explicit.useWildcard) {
    config.useWildcard = options.useWildcard;
  }
  if (!config.lanMode) {
    config.lanIp = null;
    config.lanIpExplicit = false;
  }
  if (config.lanMode) {
    config.tlds = ["local"];
    config.tld = "local";
    if (!config.lanIpExplicit) {
      config.lanIp = null;
    }
  }
  if (!config.useHttps) {
    config.customCertPath = null;
    config.customKeyPath = null;
  }
  return config;
}
function readCurrentProxyConfig(dir) {
  const lanIp = readLanMarker(dir);
  const tlds = readTldsFromDir(dir);
  const tld = primaryTld2(tlds);
  return {
    useHttps: readTlsMarker(dir),
    customCertPath: null,
    customKeyPath: null,
    lanMode: lanIp !== null,
    lanIp,
    lanIpExplicit: false,
    tld,
    tlds,
    useWildcard: false
  };
}
function getProxyConfigMismatchMessages(desiredConfig, actualConfig, explicit) {
  const messages = [];
  if (explicit.lanMode && desiredConfig.lanMode !== actualConfig.lanMode) {
    messages.push(
      desiredConfig.lanMode ? "requested LAN mode, but the running proxy is not using LAN mode" : "requested non-LAN mode, but the running proxy is using LAN mode"
    );
  }
  if (explicit.lanIp && desiredConfig.lanIp !== actualConfig.lanIp) {
    messages.push(
      `requested LAN IP ${desiredConfig.lanIp}, but the running proxy is using ${actualConfig.lanIp ?? "auto-detected LAN mode"}`
    );
  }
  if (explicit.useHttps && desiredConfig.useHttps !== actualConfig.useHttps) {
    messages.push(
      desiredConfig.useHttps ? "requested HTTPS, but the running proxy is using HTTP" : "requested HTTP, but the running proxy is using HTTPS"
    );
  }
  if (explicit.tlds && (desiredConfig.tlds.length !== actualConfig.tlds.length || desiredConfig.tlds.some((tld, index) => tld !== actualConfig.tlds[index]))) {
    messages.push(
      `requested ${formatTldList2(desiredConfig.tlds)}, but the running proxy is using ${formatTldList2(actualConfig.tlds)}`
    );
  }
  return messages;
}
function formatProxyStartCommand(proxyPort, config) {
  const needsSudo = !isWindows && proxyPort < PRIVILEGED_PORT_THRESHOLD;
  const { args } = buildProxyStartConfig({
    useHttps: config.useHttps,
    customCertPath: config.customCertPath,
    customKeyPath: config.customKeyPath,
    lanMode: config.lanMode,
    lanIp: config.lanIpExplicit ? config.lanIp : null,
    lanIpExplicit: config.lanIpExplicit,
    tld: config.tld,
    tlds: config.tlds,
    useWildcard: config.useWildcard,
    includePort: proxyPort !== getDefaultPort(config.useHttps),
    proxyPort
  });
  return `${needsSudo ? "sudo " : ""}portless proxy start${args.length > 0 ? ` ${args.join(" ")}` : ""}`;
}
function printProxyConfigMismatch(proxyPort, desiredConfig, messages) {
  const needsSudo = !isWindows && proxyPort < PRIVILEGED_PORT_THRESHOLD;
  const portFlag = proxyPort !== getDefaultPort(desiredConfig.useHttps) ? ` -p ${proxyPort}` : "";
  console.error(
    chalk.yellow(`Proxy is already running on port ${proxyPort} with a different config.`)
  );
  for (const message of messages) {
    console.error(chalk.yellow(`- ${message}`));
  }
  console.error(chalk.blue("Stop it first, then restart with the desired settings:"));
  console.error(chalk.cyan(`  ${needsSudo ? "sudo " : ""}portless proxy stop${portFlag}`));
  console.error(chalk.cyan(`  ${formatProxyStartCommand(proxyPort, desiredConfig)}`));
  process.exit(1);
}
function getEntryScript() {
  const script = process.argv[1];
  if (!script) {
    throw new Error("Cannot determine portless entry script (process.argv[1] is undefined)");
  }
  return script;
}
function isLocallyInstalled() {
  let dir = process.cwd();
  for (; ; ) {
    if (fs10.existsSync(path9.join(dir, "node_modules", "portless", "package.json"))) {
      return true;
    }
    const parent = path9.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return false;
}
function collectPortlessEnvArgs2() {
  const envArgs = [];
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("PORTLESS_") && process.env[key]) {
      envArgs.push(`${key}=${process.env[key]}`);
    }
  }
  return envArgs;
}
function sudoStop(port) {
  const stopArgs = [process.execPath, getEntryScript(), "proxy", "stop", "-p", String(port)];
  console.log(colors_default.yellow("Proxy is running as root. Elevating with sudo to stop it..."));
  const result = spawnSync5("sudo", ["env", ...collectPortlessEnvArgs2(), ...stopArgs], {
    stdio: "inherit",
    timeout: SUDO_SPAWN_TIMEOUT_MS
  });
  return result.status === 0;
}
function runCleanWithSudo(reason) {
  console.log(colors_default.yellow(`${reason} Requesting sudo...`));
  const home = process.env.HOME;
  const result = spawnSync5(
    "sudo",
    [
      "env",
      ...collectPortlessEnvArgs2(),
      ...home ? [`HOME=${home}`] : [],
      process.execPath,
      getEntryScript(),
      "clean"
    ],
    {
      stdio: "inherit",
      timeout: SUDO_SPAWN_TIMEOUT_MS
    }
  );
  return result.status === 0;
}
function runServiceUninstallWithSudo(reason) {
  console.log(colors_default.yellow(`${reason} Requesting sudo...`));
  const result = spawnSync5("sudo", buildServiceUninstallSudoArgs(getEntryScript()), {
    stdio: "inherit",
    timeout: SUDO_SPAWN_TIMEOUT_MS
  });
  return result.status === 0;
}
function isEnabledEnv(value) {
  return value === "1" || value === "true";
}
function formatProcessExitSuffix(code, signal) {
  if (signal) return ` (signal ${signal})`;
  if (code !== null) return ` (exit ${code})`;
  return "";
}
function buildHostnames(name, tlds) {
  return parseHostnames(name, normalizeTlds2(tlds));
}
function formatUrls(hostnames, proxyPort, tls2) {
  return hostnames.map((hostname) => formatUrl(hostname, proxyPort, tls2));
}
function formatViteAllowedHosts(tlds) {
  return tlds.map((configuredTld) => `.${configuredTld}`).join(",");
}
function formatBindEndpoint(host, port) {
  return host.includes(":") ? `[${host}]:${port}` : `${host}:${port}`;
}
function isUnavailableIpv6Bind(err, host) {
  return host.includes(":") && (err.code === "EAFNOSUPPORT" || err.code === "EADDRNOTAVAIL");
}
function addRoutes(store, hostnames, port, pid, force = false) {
  const registered = [];
  const killedPids = [];
  try {
    for (const hostname of hostnames) {
      const killedPid = store.addRoute(hostname, port, pid, force);
      registered.push(hostname);
      if (killedPid !== void 0) {
        killedPids.push(killedPid);
      }
    }
  } catch (err) {
    for (const hostname of registered) {
      try {
        store.removeRoute(hostname, pid);
      } catch {
      }
    }
    throw err;
  }
  return [...new Set(killedPids)];
}
function removeRoutes(store, hostnames, ownerPid) {
  for (const hostname of hostnames) {
    try {
      store.removeRoute(hostname, ownerPid);
    } catch {
    }
  }
}
function reportHostsSyncHere(hostnames, port, tls2, lanMode) {
  return reportHostsSync(
    hostnames,
    port,
    tls2,
    lanMode,
    (message) => console.warn(colors_default.yellow(message))
  );
}
function startProxyServer(store, proxyPort, tld, tlds, tlsOptions, lanIp, strict, customCert = false) {
  store.ensureDir();
  const isTls = !!tlsOptions;
  const mdnsSupport = isMdnsSupported();
  let activeLanIp = lanIp && mdnsSupport.supported ? lanIp : null;
  const lanModeActive = activeLanIp !== null;
  const bindTargets = getProxyBindTargets(lanModeActive);
  const primaryBindTarget = bindTargets[0];
  const lanIpPinned = !!process.env.PORTLESS_LAN_IP;
  let lanMonitor = null;
  if (lanIp && !mdnsSupport.supported) {
    const reason = mdnsSupport.reason ?? "mDNS publishing is not supported on this platform.";
    console.warn(chalk.yellow(`LAN mode disabled: ${reason}`));
  }
  const routesPath = store.getRoutesPath();
  if (!fs10.existsSync(routesPath)) {
    fs10.writeFileSync(routesPath, "[]", { mode: FILE_MODE });
  }
  try {
    fs10.chmodSync(routesPath, FILE_MODE);
  } catch {
  }
  fixOwnership(routesPath);
  let cachedRoutes = store.loadRoutes();
  let debounceTimer = null;
  let watcher = null;
  let pollingInterval = null;
  const autoSyncHosts = shouldAutoSyncHosts(process.env.PORTLESS_SYNC_HOSTS);
  const hostsSyncToken = generateHostsSyncToken();
  const onMdnsError = (msg) => console.warn(chalk.yellow(msg));
  const publishCachedRoutes = () => {
    if (!activeLanIp) return;
    for (const route of cachedRoutes) {
      publish(route.hostname, proxyPort, activeLanIp, onMdnsError);
    }
  };
  const updateLanIp = (nextIp, previousIp = activeLanIp) => {
    if (nextIp === activeLanIp) return;
    if (activeLanIp) {
      cleanupAll();
    }
    activeLanIp = nextIp;
    writeLanMarker(store.dir, activeLanIp);
    if (previousIp && nextIp) {
      console.log(chalk.green(`LAN IP changed: ${previousIp} -> ${nextIp}`));
    } else if (previousIp && !nextIp) {
      console.warn(chalk.yellow("LAN mode temporarily unavailable: no active LAN IP"));
    } else if (!previousIp && nextIp) {
      console.log(chalk.green(`LAN mode restored: ${nextIp}`));
    }
    publishCachedRoutes();
  };
  let hostsSyncWarned = false;
  const syncHostsAndLatch = (hostnames) => {
    let ok = true;
    hostsSyncWarned = syncHostsWithWarning(
      hostnames,
      hostsSyncWarned,
      () => console.warn(colors_default.yellow(`Could not write ${HOSTS_DISPLAY2} for route hostnames.`)),
      (names) => {
        ok = syncHostsFile(names);
        return ok;
      }
    );
    return ok;
  };
  const onHostsSyncRequest = () => {
    if (!autoSyncHosts) return "disabled";
    let hostnames;
    try {
      hostnames = store.loadRoutes().map((route) => route.hostname);
    } catch {
      hostnames = cachedRoutes.map((route) => route.hostname);
    }
    syncHostsAndLatch(hostnames);
    return "acted";
  };
  const reloadRoutes = () => {
    try {
      const previousRoutes = new Map(cachedRoutes.map((r) => [r.hostname, r.port]));
      cachedRoutes = store.loadRoutes();
      if (autoSyncHosts) {
        syncHostsAndLatch(cachedRoutes.map((r) => r.hostname));
      }
      if (activeLanIp) {
        const currentRoutes = new Map(cachedRoutes.map((r) => [r.hostname, r.port]));
        for (const route of cachedRoutes) {
          const previousPort = previousRoutes.get(route.hostname);
          if (previousPort === void 0) {
            publish(route.hostname, proxyPort, activeLanIp, onMdnsError);
          } else if (previousPort !== route.port) {
            unpublish(route.hostname);
            publish(route.hostname, proxyPort, activeLanIp, onMdnsError);
          }
        }
        for (const hostname of previousRoutes.keys()) {
          if (!currentRoutes.has(hostname)) {
            unpublish(hostname);
          }
        }
      }
    } catch {
    }
  };
  try {
    watcher = fs10.watch(routesPath, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(reloadRoutes, DEBOUNCE_MS);
    });
  } catch {
    console.warn(colors_default.yellow("fs.watch unavailable; falling back to polling for route changes"));
    pollingInterval = setInterval(reloadRoutes, POLL_INTERVAL_MS);
  }
  if (autoSyncHosts) {
    syncHostsAndLatch(cachedRoutes.map((r) => r.hostname));
  }
  publishCachedRoutes();
  const createServer2 = () => createProxyServer({
    getRoutes: () => cachedRoutes,
    proxyPort,
    tld,
    tlds,
    strict,
    onError: (msg) => console.error(colors_default.red(msg)),
    onHostsSyncRequest,
    hostsSyncToken,
    tls: tlsOptions
  });
  const server = createServer2();
  const additionalServers = /* @__PURE__ */ new Set();
  const redirectServers = /* @__PURE__ */ new Set();
  const closeAuxiliaryServers = () => {
    for (const auxiliaryServer of [...additionalServers, ...redirectServers]) {
      try {
        auxiliaryServer.close();
      } catch {
      }
    }
  };
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(colors_default.red(`Port ${proxyPort} is already in use.`));
      console.error(colors_default.blue("Stop the existing proxy first:"));
      console.error(colors_default.cyan("  portless proxy stop"));
      console.error(colors_default.blue("Or check what is using the port:"));
      console.error(
        colors_default.cyan(
          isWindows ? `  netstat -ano | findstr :${proxyPort}` : `  lsof -ti tcp:${proxyPort}`
        )
      );
    } else if (err.code === "EACCES") {
      console.error(colors_default.red(`Permission denied for port ${proxyPort}.`));
      console.error(colors_default.blue("Use an unprivileged port (no sudo needed):"));
      console.error(colors_default.cyan("  portless proxy start -p 1355"));
    } else {
      console.error(colors_default.red(`Proxy error: ${err.message}`));
    }
    closeAuxiliaryServers();
    process.exit(1);
  });
  const proto = isTls ? "HTTPS/2" : "HTTP";
  const tldLabel = tlds.length > 1 || tld !== DEFAULT_TLD ? ` (TLDs: ${formatTldList2(tlds)})` : "";
  const modeLabel = strict === false ? " (wildcard)" : "";
  for (const bindTarget of bindTargets.slice(1)) {
    const additionalServer = createServer2();
    additionalServers.add(additionalServer);
    additionalServer.on("error", (err) => {
      additionalServers.delete(additionalServer);
      if (!isUnavailableIpv6Bind(err, bindTarget.host)) {
        console.warn(
          colors_default.yellow(
            `Could not listen on ${formatBindEndpoint(bindTarget.host, proxyPort)}: ${err.message}`
          )
        );
      }
    });
    listenOnProxyInterface(additionalServer, proxyPort, bindTarget, () => {
      console.log(
        colors_default.green(
          `${proto} proxy listening on ${formatBindEndpoint(bindTarget.host, proxyPort)}${tldLabel}${modeLabel}`
        )
      );
    });
  }
  if (isTls && proxyPort !== 80) {
    for (const bindTarget of bindTargets) {
      const redirectServer = createHttpRedirectServer(proxyPort);
      redirectServers.add(redirectServer);
      redirectServer.on("error", () => {
        redirectServers.delete(redirectServer);
      });
      listenOnProxyInterface(redirectServer, 80, bindTarget, () => {
        console.log(
          colors_default.green(
            `HTTP-to-HTTPS redirect listening on ${formatBindEndpoint(bindTarget.host, 80)}`
          )
        );
      });
    }
  }
  listenOnProxyInterface(server, proxyPort, primaryBindTarget, () => {
    if (!writeHostsSyncToken(store.dir, hostsSyncToken)) {
      console.warn(colors_default.yellow("Could not publish hosts sync authorization."));
    }
    fs10.writeFileSync(store.pidPath, process.pid.toString(), { mode: FILE_MODE });
    fs10.writeFileSync(store.portFilePath, proxyPort.toString(), { mode: FILE_MODE });
    writeTlsMarker(store.dir, isTls);
    writeCustomCertMarker(store.dir, isTls && customCert);
    writeTldsFile(store.dir, tlds);
    writeLanMarker(store.dir, activeLanIp);
    fixOwnership(store.dir, store.pidPath, store.portFilePath);
    console.log(
      colors_default.green(
        `${proto} proxy listening on ${formatBindEndpoint(primaryBindTarget.host, proxyPort)}${tldLabel}${modeLabel}`
      )
    );
    if (activeLanIp) {
      console.log(chalk.green(`LAN mode: ${activeLanIp}`));
      console.log(chalk.gray("Services are discoverable as <name>.local on your network"));
      if (isTls && !customCert) {
        console.log(chalk.yellow("For HTTPS on devices, install the CA certificate:"));
        console.log(chalk.gray(`  ${path9.join(store.dir, "ca.pem")}`));
      }
      if (!lanIpPinned) {
        lanMonitor = startLanIpMonitor({
          initialIp: activeLanIp,
          onChange: (nextIp, previousIp) => updateLanIp(nextIp, previousIp),
          onError: (error) => {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(chalk.yellow(`Failed to refresh LAN IP: ${message}`));
          }
        });
      }
    }
  });
  let exiting = false;
  const cleanup = () => {
    if (exiting) return;
    exiting = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (pollingInterval) clearInterval(pollingInterval);
    if (lanMonitor) lanMonitor.stop();
    if (watcher) {
      watcher.close();
    }
    if (activeLanIp) cleanupAll();
    closeAuxiliaryServers();
    try {
      fs10.unlinkSync(store.pidPath);
    } catch {
    }
    try {
      fs10.unlinkSync(store.portFilePath);
    } catch {
    }
    writeTlsMarker(store.dir, false);
    writeCustomCertMarker(store.dir, false);
    writeTldFile(store.dir, DEFAULT_TLD);
    writeLanMarker(store.dir, null);
    removeHostsSyncToken(store.dir);
    if (autoSyncHosts) cleanHostsFile();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), EXIT_TIMEOUT_MS).unref();
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  console.log(colors_default.cyan("\nProxy is running. Press Ctrl+C to stop.\n"));
  console.log(colors_default.gray(`Routes file: ${store.getRoutesPath()}`));
}
function sudoStopOrHint(port) {
  if (!isWindows) {
    if (!sudoStop(port)) {
      console.error(colors_default.red("Failed to stop proxy with sudo."));
      console.error(colors_default.blue("Try manually:"));
      console.error(colors_default.cyan(`  portless proxy stop -p ${port}`));
    }
  } else {
    console.error(colors_default.red("Permission denied. The proxy was started with elevated privileges."));
    console.error(colors_default.blue("Stop it with:"));
    console.error(colors_default.cyan("  Run portless proxy stop as Administrator"));
  }
}
async function stopProxy(store, proxyPort, _tls) {
  const pidPath = store.pidPath;
  if (!fs10.existsSync(pidPath)) {
    if (await isProxyRunning(proxyPort)) {
      console.log(colors_default.yellow(`PID file is missing but port ${proxyPort} is still in use.`));
      const pid = findPidOnPort(proxyPort);
      if (pid !== null) {
        try {
          process.kill(pid, "SIGTERM");
          try {
            fs10.unlinkSync(store.portFilePath);
          } catch {
          }
          writeTlsMarker(store.dir, false);
          writeCustomCertMarker(store.dir, false);
          writeTldFile(store.dir, DEFAULT_TLD);
          writeLanMarker(store.dir, null);
          console.log(colors_default.green(`Killed process ${pid}. Proxy stopped.`));
        } catch (err) {
          if (isErrnoException(err) && err.code === "EPERM") {
            sudoStopOrHint(proxyPort);
          } else {
            const message = err instanceof Error ? err.message : String(err);
            console.error(colors_default.red(`Failed to stop proxy: ${message}`));
            console.error(colors_default.blue("Check if the process is still running:"));
            console.error(
              colors_default.cyan(
                isWindows ? `  netstat -ano | findstr :${proxyPort}` : `  lsof -ti tcp:${proxyPort}`
              )
            );
          }
        }
      } else if (!isWindows && process.getuid?.() !== 0) {
        sudoStopOrHint(proxyPort);
      } else {
        console.error(colors_default.red(`Could not identify the process on port ${proxyPort}.`));
        console.error(colors_default.blue("Try manually:"));
        console.error(
          colors_default.cyan(
            isWindows ? "  taskkill /F /PID <pid>" : `  sudo kill "$(lsof -ti tcp:${proxyPort})"`
          )
        );
      }
    } else {
      console.log(colors_default.yellow("Proxy is not running."));
    }
    return;
  }
  try {
    const pid = parseInt(fs10.readFileSync(pidPath, "utf-8"), 10);
    if (isNaN(pid)) {
      console.error(colors_default.red("Corrupted PID file. Removing it."));
      fs10.unlinkSync(pidPath);
      writeTlsMarker(store.dir, false);
      writeCustomCertMarker(store.dir, false);
      writeTldFile(store.dir, DEFAULT_TLD);
      writeLanMarker(store.dir, null);
      return;
    }
    try {
      process.kill(pid, 0);
    } catch (err) {
      if (isErrnoException(err) && err.code === "EPERM") {
        sudoStopOrHint(proxyPort);
        return;
      }
      console.log(colors_default.yellow("Proxy process is no longer running. Cleaning up stale files."));
      fs10.unlinkSync(pidPath);
      try {
        fs10.unlinkSync(store.portFilePath);
      } catch {
      }
      writeTlsMarker(store.dir, false);
      writeCustomCertMarker(store.dir, false);
      writeTldFile(store.dir, DEFAULT_TLD);
      writeLanMarker(store.dir, null);
      return;
    }
    if (!await isProxyRunning(proxyPort)) {
      console.log(
        colors_default.yellow(
          `PID file exists but port ${proxyPort} is not listening. The PID may have been recycled.`
        )
      );
      console.log(colors_default.yellow("Removing stale PID file."));
      fs10.unlinkSync(pidPath);
      writeTlsMarker(store.dir, false);
      writeCustomCertMarker(store.dir, false);
      writeTldFile(store.dir, DEFAULT_TLD);
      writeLanMarker(store.dir, null);
      return;
    }
    process.kill(pid, "SIGTERM");
    fs10.unlinkSync(pidPath);
    try {
      fs10.unlinkSync(store.portFilePath);
    } catch {
    }
    writeTlsMarker(store.dir, false);
    writeCustomCertMarker(store.dir, false);
    writeTldFile(store.dir, DEFAULT_TLD);
    writeLanMarker(store.dir, null);
    console.log(colors_default.green("Proxy stopped."));
  } catch (err) {
    if (isErrnoException(err) && err.code === "EPERM") {
      sudoStopOrHint(proxyPort);
    } else {
      const message = err instanceof Error ? err.message : String(err);
      console.error(colors_default.red(`Failed to stop proxy: ${message}`));
      console.error(colors_default.blue("Check if the process is still running:"));
      console.error(
        colors_default.cyan(
          isWindows ? `  netstat -ano | findstr :${proxyPort}` : `  lsof -ti tcp:${proxyPort}`
        )
      );
    }
  }
}
function listRoutes(store, proxyPort, tls2) {
  const routes = store.loadRoutes();
  if (routes.length === 0) {
    console.log(colors_default.yellow("No active routes."));
    console.log(colors_default.gray("Start an app with: portless <name> <command>"));
    return;
  }
  console.log(colors_default.blue.bold("\nActive routes:\n"));
  for (const route of routes) {
    const url = formatUrl(route.hostname, proxyPort, tls2);
    const label = route.pid === 0 ? "(alias)" : `(pid ${route.pid})`;
    console.log(
      `  ${colors_default.cyan(url)}  ${colors_default.gray("->")}  ${colors_default.white(`localhost:${route.port}`)}  ${colors_default.gray(label)}`
    );
    if (route.tailscaleUrl) {
      const tsLabel = route.tailscaleFunnel ? "funnel" : "tailscale";
      console.log(`    ${colors_default.gray(tsLabel + ":")} ${colors_default.green(route.tailscaleUrl)}`);
    }
    if (route.ngrokUrl) {
      console.log(`    ${colors_default.gray("ngrok:")} ${colors_default.green(route.ngrokUrl)}`);
    }
  }
  console.log();
}
function resolveProxyDesiredState(lanMode) {
  const envTlds = getDefaultTlds();
  const envTld = primaryTld2(envTlds);
  const explicit = {
    useHttps: process.env.PORTLESS_HTTPS !== void 0,
    customCert: false,
    lanMode: process.env.PORTLESS_LAN !== void 0,
    lanIp: process.env.PORTLESS_LAN_IP !== void 0,
    tlds: process.env.PORTLESS_TLD !== void 0,
    useWildcard: process.env.PORTLESS_WILDCARD !== void 0
  };
  const desiredConfig = resolveProxyConfig({
    persistedLanMode: lanMode,
    explicit,
    defaultTlds: envTlds,
    useHttps: !isHttpsEnvDisabled(),
    customCertPath: null,
    customKeyPath: null,
    lanMode: isLanEnvEnabled(),
    lanIp: process.env.PORTLESS_LAN_IP || null,
    tlds: envTlds,
    useWildcard: isWildcardEnvEnabled()
  });
  return { explicit, desiredConfig, envTld, envTlds };
}
async function ensureProxyRunning(proxyPort, tls2, desired) {
  const { explicit, desiredConfig } = desired;
  const proxyResponsive = await isProxyRunning(proxyPort, tls2);
  const proxyListeningFromStateDir = !!process.env.PORTLESS_STATE_DIR && await isPortListening(proxyPort);
  if (proxyResponsive || proxyListeningFromStateDir) {
    return { started: false };
  }
  const persisted = readPersistedProxyState();
  const startConfig = { ...desiredConfig };
  let startPort;
  if (persisted) {
    if (!explicit.useHttps && persisted.tls !== desiredConfig.useHttps) {
      startConfig.useHttps = persisted.tls;
    }
    if (!explicit.tlds && (persisted.tlds.length !== desiredConfig.tlds.length || persisted.tlds.some((tld, index) => tld !== desiredConfig.tlds[index]))) {
      startConfig.tlds = persisted.tlds;
      startConfig.tld = primaryTld2(persisted.tlds);
    }
    if (!explicit.lanMode && persisted.lanMode !== desiredConfig.lanMode) {
      startConfig.lanMode = persisted.lanMode;
    }
    const envPort = getDefaultPort(startConfig.useHttps);
    if (persisted.port !== envPort) {
      startPort = persisted.port;
    }
  }
  const effectivePort = startPort ?? getDefaultPort(startConfig.useHttps);
  const needsSudo = !isWindows && effectivePort < PRIVILEGED_PORT_THRESHOLD;
  const manualStartCommand = formatProxyStartCommand(effectivePort, startConfig);
  const fallbackStartCommand = formatProxyStartCommand(FALLBACK_PROXY_PORT, startConfig);
  const isInteractive = !!process.stdin.isTTY && !process.env.CI;
  if (needsSudo && !isInteractive) {
    console.error(colors_default.red("Proxy is not running and no TTY is available for sudo."));
    console.error(colors_default.blue("Option 1: start the proxy in a terminal (will prompt for sudo):"));
    console.error(colors_default.cyan(`  ${manualStartCommand}`));
    console.error(
      colors_default.blue(
        `Option 2: use an unprivileged port (no sudo needed, URLs will include :${FALLBACK_PROXY_PORT}):`
      )
    );
    console.error(colors_default.cyan(`  ${fallbackStartCommand}`));
    process.exit(1);
  }
  console.log(colors_default.gray("Starting proxy..."));
  const proxyStartConfig = buildProxyStartConfig({
    useHttps: startConfig.useHttps,
    customCertPath: startConfig.customCertPath,
    customKeyPath: startConfig.customKeyPath,
    lanMode: startConfig.lanMode,
    lanIp: startConfig.lanIpExplicit ? startConfig.lanIp : null,
    lanIpExplicit: startConfig.lanIpExplicit,
    tld: startConfig.tld,
    tlds: startConfig.tlds,
    useWildcard: startConfig.useWildcard,
    includePort: startPort !== void 0,
    proxyPort: startPort
  });
  const startArgs = [getEntryScript(), "proxy", "start", ...proxyStartConfig.args];
  const result = spawnSync5(process.execPath, startArgs, {
    stdio: "inherit",
    timeout: SUDO_SPAWN_TIMEOUT_MS
  });
  let discovered = null;
  if (!result.signal) {
    for (let i = 0; i < WAIT_FOR_PROXY_MAX_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, WAIT_FOR_PROXY_INTERVAL_MS));
      const state = await discoverState();
      if (await isProxyRunning(state.port)) {
        discovered = state;
        break;
      }
    }
  }
  if (!discovered) {
    console.error(colors_default.red("Failed to start proxy."));
    const fallbackDir = resolveStateDir(effectivePort);
    const logPath = path9.join(fallbackDir, "proxy.log");
    console.error(colors_default.blue("Try starting it manually:"));
    console.error(colors_default.cyan(`  ${manualStartCommand}`));
    if (fs10.existsSync(logPath)) {
      console.error(colors_default.gray(`Logs: ${logPath}`));
    }
    process.exit(1);
    return { started: false };
  }
  return { started: true, state: discovered };
}
async function runApp(initialStore, proxyPort, stateDir, name, commandArgs, tls2, tlds, force, autoInfo, desiredPort, lanMode = false, lanIp) {
  let store = initialStore;
  console.log(chalk.blue.bold(`
portless
`));
  const wantsFunnel = isEnabledEnv(process.env.PORTLESS_FUNNEL);
  const wantsTailscale = wantsFunnel || isEnabledEnv(process.env.PORTLESS_TAILSCALE);
  const wantsNgrok = isEnabledEnv(process.env.PORTLESS_NGROK);
  let tsBaseUrl;
  if (wantsTailscale) {
    try {
      const tsReady = ensureTailscaleReady({
        requireFunnel: wantsFunnel,
        requireHttps: true
      });
      tsBaseUrl = tsReady.baseUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(colors_default.red(`Error: ${message}`));
      if (message.includes("not found")) {
        console.error(colors_default.blue("Install Tailscale: https://tailscale.com/download"));
      } else if (!message.includes("not enabled on your tailnet")) {
        console.error(colors_default.blue("Make sure Tailscale is connected:"));
        console.error(colors_default.cyan("  tailscale up"));
      }
      process.exit(1);
    }
  }
  if (wantsNgrok) {
    try {
      ensureNgrokAvailable();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(colors_default.red(`Error: ${message}`));
      if (message.includes("not found")) {
        console.error(colors_default.blue("Install ngrok: https://ngrok.com/download"));
      }
      process.exit(1);
    }
  }
  let desired;
  try {
    desired = resolveProxyDesiredState(lanMode);
  } catch (err) {
    console.error(colors_default.red(`Error: ${err.message}`));
    process.exit(1);
  }
  buildHostnames(name, tlds);
  const ensureResult = await ensureProxyRunning(proxyPort, tls2, desired);
  if (ensureResult.started) {
    proxyPort = ensureResult.state.port;
    stateDir = ensureResult.state.dir;
    tlds = ensureResult.state.tlds;
    tls2 = ensureResult.state.tls;
    lanMode = ensureResult.state.lanMode;
    lanIp = ensureResult.state.lanIp;
    store = new RouteStore(stateDir, {
      onWarning: (msg) => console.warn(colors_default.yellow(msg))
    });
    if (tls2 && !isCATrusted(stateDir)) {
      await handleTrust();
    }
  } else {
    const runningConfig = readCurrentProxyConfig(stateDir);
    const mismatchMessages = getProxyConfigMismatchMessages(
      desired.desiredConfig,
      runningConfig,
      desired.explicit
    );
    if (mismatchMessages.length > 0) {
      printProxyConfigMismatch(proxyPort, desired.desiredConfig, mismatchMessages);
    }
    lanMode = runningConfig.lanMode;
    lanIp = runningConfig.lanIp;
    tlds = runningConfig.tlds;
    console.log(chalk.gray("-- Proxy is running"));
  }
  const hostnames = buildHostnames(name, tlds);
  const hostname = hostnames[0];
  if (desired.explicit.tlds && (desired.envTlds.some((envConfiguredTld, index) => envConfiguredTld !== tlds[index]) || desired.envTlds.length !== tlds.length)) {
    console.warn(
      chalk.yellow(
        `Warning: PORTLESS_TLD=${desired.envTlds.join(",")} but the running proxy uses ${formatTldList2(tlds)}.`
      )
    );
  }
  if (lanIp) {
    console.log(chalk.gray(`-- ${hostnames.join(", ")} (LAN: ${lanIp})`));
  } else {
    console.log(chalk.gray(`-- ${hostnames.join(", ")} (auto-resolves to 127.0.0.1)`));
  }
  if (autoInfo) {
    const baseName = autoInfo.prefix ? name.slice(autoInfo.prefix.length + 1) : name;
    console.log(chalk.gray(`-- Name "${baseName}" (from ${autoInfo.nameSource})`));
    if (autoInfo.prefix) {
      console.log(chalk.gray(`-- Prefix "${autoInfo.prefix}" (from ${autoInfo.prefixSource})`));
    }
  }
  const port = desiredPort ?? await findFreePort();
  if (desiredPort) {
    console.log(colors_default.green(`-- Using port ${port} (fixed)`));
  } else {
    console.log(colors_default.green(`-- Using port ${port}`));
  }
  let killedPids = [];
  try {
    killedPids = addRoutes(store, hostnames, port, process.pid, force);
    await reportHostsSyncHere(hostnames, proxyPort, tls2, lanMode);
  } catch (err) {
    if (err instanceof RouteConflictError) {
      console.error(colors_default.red(`Error: ${err.message}`));
      process.exit(1);
    }
    throw err;
  }
  if (killedPids.length > 0) {
    console.log(colors_default.yellow(`Killed existing process(es): ${killedPids.join(", ")}`));
  }
  const finalUrl = formatUrl(hostname, proxyPort, tls2);
  const allUrls = formatUrls(hostnames, proxyPort, tls2);
  console.log(chalk.cyan.bold(`
  -> ${finalUrl}
`));
  for (const extraUrl of allUrls.slice(1)) {
    console.log(chalk.cyan(`  also -> ${extraUrl}`));
  }
  if (allUrls.length > 1) {
    console.log("");
  }
  if (lanIp) {
    console.log(chalk.green(`  LAN -> ${finalUrl}`));
    console.log(chalk.gray("  (accessible from other devices on the same WiFi network)\n"));
  }
  let tailscaleHttpsPort;
  let tailscaleUrl;
  let ngrokUrl;
  let ngrokProcess;
  let stoppingNgrok = false;
  let ngrokRouteReady = false;
  let ngrokExitHandled = false;
  let pendingNgrokExit;
  const handleNgrokExit = (code, signal) => {
    if (stoppingNgrok || ngrokExitHandled) return;
    if (!ngrokRouteReady) {
      pendingNgrokExit = { code, signal };
      return;
    }
    ngrokExitHandled = true;
    ngrokUrl = void 0;
    console.warn(
      colors_default.yellow(
        `Warning: ngrok tunnel for ${hostname} stopped${formatProcessExitSuffix(
          code,
          signal
        )}. Removing its public URL from the route list.`
      )
    );
    try {
      store.updateRoute(hostname, {
        ngrokUrl: null,
        ngrokPid: null
      });
    } catch {
    }
  };
  if (wantsTailscale && tsBaseUrl) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const usedPorts = getUsedServePorts();
      tailscaleHttpsPort = findAvailableServePort(usedPorts, wantsFunnel ? "funnel" : "serve");
      try {
        if (wantsFunnel) {
          registerFunnel(port, tailscaleHttpsPort);
        } else {
          registerServe(port, tailscaleHttpsPort);
        }
        break;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isConflict = message.includes("already in use");
        if (isConflict && attempt < maxAttempts) continue;
        console.error(colors_default.red(`Error: ${message}`));
        process.exit(1);
      }
    }
    tailscaleUrl = formatTailscaleUrl(tsBaseUrl, tailscaleHttpsPort);
    const label = wantsFunnel ? "Funnel (public)" : "Tailscale";
    console.log(chalk.green(`  ${label} -> ${tailscaleUrl}`));
    if (wantsFunnel) {
      console.log(chalk.gray("  (accessible from the public internet via Tailscale Funnel)\n"));
    } else {
      console.log(chalk.gray("  (accessible from your tailnet)\n"));
    }
    try {
      store.updateRoute(hostname, {
        tailscaleUrl,
        tailscaleHttpsPort,
        tailscaleFunnel: wantsFunnel || void 0
      });
    } catch {
    }
  }
  if (wantsNgrok) {
    try {
      ngrokProcess = await startNgrok(port, {
        hostHeader: hostname,
        onExit: handleNgrokExit
      });
      ngrokUrl = ngrokProcess.url;
      console.log(chalk.green(`  ngrok -> ${ngrokUrl}`));
      console.log(chalk.gray("  (accessible from the public internet via ngrok)\n"));
      try {
        store.updateRoute(hostname, {
          ngrokUrl,
          ngrokPid: ngrokProcess.pid
        });
      } catch {
      } finally {
        ngrokRouteReady = true;
        if (pendingNgrokExit) {
          handleNgrokExit(pendingNgrokExit.code, pendingNgrokExit.signal);
          pendingNgrokExit = void 0;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(colors_default.red(`Error: ${message}`));
      if (message.includes("not found")) {
        console.error(colors_default.blue("Install ngrok: https://ngrok.com/download"));
      } else if (message.includes("authentication")) {
        console.error(colors_default.blue("Configure ngrok authentication:"));
        console.error(colors_default.cyan("  ngrok config add-authtoken <token>"));
      }
      try {
        unregisterTailscale({
          tailscaleHttpsPort,
          tailscaleFunnel: wantsFunnel || void 0
        });
      } catch {
      }
      try {
        removeRoutes(store, hostnames, process.pid);
      } catch {
      }
      process.exit(1);
    }
  }
  const framework = resolveFrameworkBasename(commandArgs);
  const isExpoLan = framework === "expo" && (lanMode || isLanEnvEnabled());
  const hostBind = isExpoLan ? void 0 : "127.0.0.1";
  if (lanMode && !process.env.PORTLESS_LAN) {
    process.env.PORTLESS_LAN = "1";
  }
  injectPackageScriptFrameworkFlags(commandArgs, port);
  injectFrameworkFlags(commandArgs, port);
  const caEnv = {};
  if (tls2 && !process.env.NODE_EXTRA_CA_CERTS) {
    const caPath = path9.join(stateDir, "ca.pem");
    if (fs10.existsSync(caPath)) {
      caEnv.NODE_EXTRA_CA_CERTS = caPath;
    }
  }
  const caFragment = caEnv.NODE_EXTRA_CA_CERTS ? ` NODE_EXTRA_CA_CERTS="${caEnv.NODE_EXTRA_CA_CERTS}"` : "";
  console.log(
    chalk.gray(
      `Running: PORT=${port}${hostBind ? ` HOST=${hostBind}` : ""} PORTLESS_URL=${finalUrl}${caFragment} ${commandArgs.join(" ")}
`
    )
  );
  spawnCommand(commandArgs, {
    env: {
      ...process.env,
      PORT: port.toString(),
      ...hostBind ? { HOST: hostBind } : {},
      PORTLESS_URL: finalUrl,
      __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: formatViteAllowedHosts(tlds),
      // Note: EXPO_PACKAGER_PROXY_URL is not used — expo-dev-client removed
      // baked-in pinging, making this env var ineffective. Expo handles its
      // own LAN discovery natively.
      ...lanMode ? { PORTLESS_LAN: "1" } : {},
      ...tailscaleUrl ? { PORTLESS_TAILSCALE_URL: tailscaleUrl } : {},
      ...ngrokUrl ? { PORTLESS_NGROK_URL: ngrokUrl } : {},
      ...caEnv
    },
    onCleanup: () => {
      stoppingNgrok = true;
      stopNgrokProcess(ngrokProcess?.child);
      try {
        unregisterTailscale({
          tailscaleHttpsPort,
          tailscaleFunnel: wantsFunnel || void 0
        });
      } catch {
      }
      try {
        removeRoutes(store, hostnames, process.pid);
      } catch {
      }
    }
  });
}
function parseAppPort(value) {
  if (!value || value.startsWith("--")) {
    console.error(colors_default.red("Error: --app-port requires a port number."));
    process.exit(1);
  }
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(colors_default.red(`Error: Invalid app port "${value}". Must be 1-65535.`));
    process.exit(1);
  }
  return port;
}
function appPortFromEnv() {
  const envVal = process.env.PORTLESS_APP_PORT;
  if (!envVal) return void 0;
  const port = parseInt(envVal, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(colors_default.red(`Error: Invalid PORTLESS_APP_PORT="${envVal}". Must be 1-65535.`));
    process.exit(1);
  }
  return port;
}
function applySharingFlag(flag) {
  if (flag === "--tailscale") {
    process.env.PORTLESS_TAILSCALE = "1";
    return true;
  }
  if (flag === "--funnel") {
    process.env.PORTLESS_FUNNEL = "1";
    process.env.PORTLESS_TAILSCALE = "1";
    return true;
  }
  if (flag === "--ngrok") {
    process.env.PORTLESS_NGROK = "1";
    return true;
  }
  return false;
}
function parseRunArgs(args) {
  let force = false;
  let appPort;
  let name;
  let i = 0;
  while (i < args.length && args[i].startsWith("-")) {
    if (args[i] === "--") {
      i++;
      break;
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log(`
${colors_default.bold("portless run")} - Infer project name and run through the proxy.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless run [options] [command...]")}

  When no command is given, runs the configured script (default: "dev")
  from package.json.

  Ctrl+C is forwarded to the command. Portless waits for its process tree to
  exit and terminates remaining descendants after a short grace period.

${colors_default.bold("Options:")}
  --name <name>          Override the inferred base name (worktree prefix still applies)
  --force                Kill the existing process and take over its route
  --app-port <number>    Use a fixed port for the app (skip auto-assignment)
  --tailscale            Share the app on your Tailscale network (tailnet)
  --funnel               Share the app publicly via Tailscale Funnel
  --ngrok                Share the app publicly via ngrok
  --help, -h             Show this help

${colors_default.bold("Name inference (in order):")}
  1. portless.json "name" field
  2. package.json "name" field (walks up directories)
  3. Git repo root directory name
  4. Current directory basename

  Use --name to override the inferred name while keeping worktree prefixes.
  In git worktrees, the branch name is prepended as a subdomain prefix
  (e.g. feature-auth.myapp.localhost).

${colors_default.bold("Examples:")}
  portless run                        # Run dev script through proxy
  portless run next dev               # -> https://<project>.localhost
  portless run --name myapp next dev  # -> https://myapp.localhost
  portless run vite dev               # -> https://<project>.localhost
  portless run --app-port 3000 pnpm start
`);
      process.exit(0);
    } else if (args[i] === "--force") {
      force = true;
    } else if (args[i] === "--app-port") {
      i++;
      appPort = parseAppPort(args[i]);
    } else if (args[i] === "--name") {
      i++;
      if (!args[i] || args[i].startsWith("-")) {
        console.error(colors_default.red("Error: --name requires a name value."));
        console.error(colors_default.cyan("  portless run --name <name> <command...>"));
        process.exit(1);
      }
      name = args[i];
    } else if (applySharingFlag(args[i])) {
    } else {
      console.error(colors_default.red(`Error: Unknown flag "${args[i]}".`));
      console.error(
        colors_default.blue(
          "Known flags: --name, --force, --app-port, --tailscale, --funnel, --ngrok, --help"
        )
      );
      process.exit(1);
    }
    i++;
  }
  if (!appPort) appPort = appPortFromEnv();
  return { force, appPort, name, commandArgs: args.slice(i) };
}
function parseAppArgs(args) {
  let force = false;
  let appPort;
  let i = 0;
  while (i < args.length && args[i].startsWith("-")) {
    if (args[i] === "--") {
      i++;
      break;
    } else if (args[i] === "--force") {
      force = true;
    } else if (args[i] === "--app-port") {
      i++;
      appPort = parseAppPort(args[i]);
    } else if (applySharingFlag(args[i])) {
    } else {
      console.error(colors_default.red(`Error: Unknown flag "${args[i]}".`));
      console.error(
        colors_default.blue("Known flags: --force, --app-port, --tailscale, --funnel, --ngrok")
      );
      process.exit(1);
    }
    i++;
  }
  const name = args[i];
  i++;
  while (i < args.length && args[i].startsWith("--")) {
    if (args[i] === "--") {
      i++;
      break;
    } else if (args[i] === "--force") {
      force = true;
    } else if (args[i] === "--app-port") {
      i++;
      appPort = parseAppPort(args[i]);
    } else if (applySharingFlag(args[i])) {
    } else {
      console.error(colors_default.red(`Error: Unknown flag "${args[i]}".`));
      console.error(
        colors_default.blue("Known flags: --force, --app-port, --tailscale, --funnel, --ngrok")
      );
      process.exit(1);
    }
    i++;
  }
  if (!appPort) appPort = appPortFromEnv();
  return { force, appPort, name, commandArgs: args.slice(i) };
}
function printHelp() {
  console.log(`
${colors_default.bold("portless")} - Replace port numbers with stable, named .localhost URLs. For humans and agents.

Eliminates port conflicts, memorizing port numbers, and cookie/storage
clashes by giving each dev server a stable .localhost URL.

${colors_default.bold("Install:")}
  ${colors_default.cyan("npm install -g portless")}          Global (recommended)
  ${colors_default.cyan("npm install -D portless")}          Project dev dependency

${colors_default.bold("Requirements:")}
  Node.js 24+

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless")}                         Run dev script through proxy
  ${colors_default.cyan("portless")}                         From monorepo root: run all workspace packages
  ${colors_default.cyan("portless run")}                     Same as above
  ${colors_default.cyan("portless run <cmd>")}               Run a command through the proxy
  ${colors_default.cyan("portless <name> <cmd>")}            Run with an explicit app name
  ${colors_default.cyan("portless proxy start")}             Start the proxy (HTTPS on port 443, daemon); rarely needed since it auto-starts on first run
  ${colors_default.cyan("portless proxy stop")}              Stop the proxy
  ${colors_default.cyan("portless service install")}         Start proxy automatically when the OS starts
  ${colors_default.cyan("portless get <name>")}              Print URL for a service (for cross-service refs)
  ${colors_default.cyan("portless alias <name> <port>")}     Register a static route (e.g. for Docker)
  ${colors_default.cyan("portless alias --remove <name>")}   Remove a static route
  ${colors_default.cyan("portless list")}                    Show active routes
  ${colors_default.cyan("portless doctor")}                  Check local portless health
  ${colors_default.cyan("portless trust")}                   Add local CA to system trust store
  ${colors_default.cyan("portless clean")}                   Remove portless state, trust entry, and hosts block
  ${colors_default.cyan("portless prune")}                   Kill orphaned dev servers from crashed sessions
  ${colors_default.cyan("portless hosts sync")}              Reconcile routes with ${HOSTS_DISPLAY2} (fixes Safari)
  ${colors_default.cyan("portless hosts clean")}             Remove portless entries from ${HOSTS_DISPLAY2}

${colors_default.bold("Examples:")}
  portless                            # Run dev script through proxy
  portless                            # From monorepo root: start all apps
  portless --script start             # Run "start" script instead of "dev"
  portless myapp next dev             # -> https://myapp.localhost
  portless run next dev               # -> https://<project>.localhost
  portless run next dev               # in worktree -> https://<worktree>.<project>.localhost
  portless service install            # Start HTTPS proxy on OS startup
  portless service install --lan      # Persist LAN mode in the startup service
  portless service install --wildcard # Persist wildcard routing in the startup service
  portless get backend                # -> https://backend.localhost
  portless doctor                     # Check proxy, routes, DNS, and CA trust
  portless myapp --tailscale next dev # -> also https://<node>.ts.net (tailnet)
  portless myapp --funnel next dev    # -> also https://<node>.ts.net (public)
  portless myapp --ngrok next dev     # -> also https://<random>.ngrok.app (public)

${colors_default.bold("Configuration (portless.json):")}
  Optional. Portless works out of the box by running the "dev" script
  from package.json. Use portless.json to override defaults.

  Override name:   { "name": "myapp" }
  Override script: { "name": "myapp", "script": "start" }
  Monorepo:        { "apps": { "apps/web": { "name": "myapp" } } }

${colors_default.bold("In package.json:")}
  {
    "scripts": {
      "dev": "next dev"
    }
  }
  Then run: portless
  Or:       portless run
  Or:       portless run next dev

${colors_default.bold("How it works:")}
  1. Start the proxy once (HTTPS on port 443 by default, auto-elevates with sudo)
  2. Run your apps - they auto-start the proxy and register automatically
     (apps get a random port in the 4000-4999 range via PORT)
  3. Access via https://<name>.localhost
  4. .localhost domains auto-resolve to 127.0.0.1
  5. Frameworks that ignore PORT (Vite, VitePlus, Astro, React Router, Angular,
     Expo, React Native) get --port and, when needed, --host flags
     injected automatically, including through a package script whose command
     starts with the framework. Only server commands (dev, serve, preview,
     start, a bare vite, or vite [root]) get them; build, optimize, test and
     the like reject them, and an invocation portless cannot classify is left
     alone too. Expo --localhost, --lan and --tunnel modes are preserved while
     the assigned port is still injected.
     Portless also leaves a script alone when it is
     compound (&&, |, ;), ends in a # comment, ends its own option list with
     --, is env-prefixed (NODE_ENV=production vite), delegates to another
     script, or is invoked with runner flags before the script name
     (bun run --bun dev); set the port in those yourself
  6. The proxy listens only on 127.0.0.1 and ::1 unless LAN mode is enabled
  Elevated proxy processes keep the invoking user's ~/.portless state directory.

${colors_default.bold("HTTP/2 + HTTPS (default):")}
  HTTPS with HTTP/2 multiplexing is enabled by default (faster page loads).
  WebSockets work over both HTTP/1.1 (Upgrade) and HTTP/2 (RFC 8441
  extended CONNECT), so dev server HMR works through the proxy.
  On first use, portless generates a local CA and adds it to your
  system trust store. No browser warnings. Disable with --no-tls.
  On WSL, portless also adds the CA to the Windows user certificate store.

${colors_default.bold("LAN mode:")}
  Use --lan to make services accessible from other devices (phones,
  tablets) on the same WiFi network via mDNS (.local domains).
  Normal mode binds only to 127.0.0.1 and ::1.
  LAN mode binds to 0.0.0.0 and ::.
  Useful for testing React Native / Expo apps on real devices.
  Expo keeps Metro's default LAN host behavior in this mode.
  Auto-detected LAN IPs follow network changes automatically.
  Stopped LAN proxies keep LAN mode for the next start via proxy.lan.
  All proxy settings are persisted and reused on auto-start unless
  overridden by explicit flags or env vars.
  Use PORTLESS_LAN=0 for one start to switch back to .localhost mode.
  If a proxy is already running with different explicit LAN/TLS/TLD settings,
  stop it first.
  ${colors_default.cyan("portless proxy start --lan")}
  ${colors_default.cyan("portless proxy start --lan --https")}
  ${colors_default.cyan("portless proxy start --lan --ip 192.168.1.42")}

${colors_default.bold("Tailscale sharing:")}
  Use --tailscale to share your dev server with teammates on your tailnet.
  Each app is root-mounted on its own Tailscale HTTPS port (443, then 8443,
  8444, etc.) so no basePath configuration is needed.
  Use --funnel to expose your dev server to the public internet via
  Tailscale Funnel. Requires Tailscale CLI to be installed and connected,
  with Tailscale HTTPS certificates enabled. Funnel must also be enabled
  on your tailnet.
  ${colors_default.cyan("portless myapp --tailscale next dev")}
  ${colors_default.cyan("portless myapp --funnel next dev")}

${colors_default.bold("ngrok sharing:")}
  Use --ngrok to expose your dev server to the public internet with ngrok.
  Requires the ngrok CLI to be installed and authenticated.
  ${colors_default.cyan("portless myapp --ngrok next dev")}

${colors_default.bold("Options:")}
  run [--name <name>] <cmd>      Infer project name (or override with --name)
                                Adds worktree prefix in git worktrees
  --script <name>               Run a specific package.json script (default: dev)
  -p, --port <number>           Port for the proxy (default: 443, or 80 with --no-tls)
                                Standard ports auto-elevate with sudo on macOS/Linux
  --no-tls                      Disable HTTPS (use plain HTTP on port 80)
  --https                       Enable HTTPS (default, accepted for compatibility)
  --lan                         Enable LAN mode (mDNS .local, for real device testing)
  --ip <address>                Pin a specific LAN IP (disables auto-follow; use with --lan)
  --cert <path>                 Use a custom TLS certificate
  --key <path>                  Use a custom TLS private key
  --foreground                  Run proxy in foreground (for debugging)
  --tld <tld>                   Use a custom TLD instead of .localhost (e.g. test, dev.example.com); repeat for more
  --wildcard                    Allow unregistered subdomains to fall back to parent route
  --state-dir <path>            Use a custom state directory with service install
  --app-port <number>           Use a fixed port for the app (skip auto-assignment)
  --tailscale                   Share the app on your Tailscale network (tailnet)
  --funnel                      Share the app publicly via Tailscale Funnel
  --ngrok                       Share the app publicly via ngrok
  --force                       Kill the existing process and take over its route
  --name <name>                 Use <name> as the app name (bypasses subcommand dispatch)
  --                            Stop flag parsing; everything after is passed to the child

${colors_default.bold("Environment variables:")}
  PORTLESS_PORT=<number>        Override the default proxy port (e.g. in .bashrc)
  PORTLESS_APP_PORT=<number>    Use a fixed port for the app (same as --app-port)
  PORTLESS_HTTPS=0              Disable HTTPS (same as --no-tls)
  PORTLESS_LAN=1                Enable LAN mode when set to 1 (set in .bashrc / .zshrc)
  PORTLESS_LAN_IP=<address>     Pin a specific LAN IP for LAN mode
  PORTLESS_TLD=<tld>[,<tld>]    Use one or more TLDs (e.g. localhost,test,dev.example.com)
  PORTLESS_WILDCARD=1           Allow unregistered subdomains to fall back to parent route
  PORTLESS_SYNC_HOSTS=0         Disable auto-sync of ${HOSTS_DISPLAY2} (on by default)
  PORTLESS_TAILSCALE=1          Share apps on your Tailscale network (same as --tailscale)
  PORTLESS_FUNNEL=1             Share apps publicly via Tailscale Funnel (same as --funnel)
  PORTLESS_NGROK=1              Share apps publicly via ngrok (same as --ngrok)
  PORTLESS_STATE_DIR=<path>     Override the state directory
  PORTLESS=0                    Run command directly without proxy

${colors_default.bold("Child process environment:")}
  PORT                          Ephemeral port the child should listen on
  HOST                          Usually 127.0.0.1 (omitted for Expo in LAN mode)
  PORTLESS_URL                  Primary public URL of the app
  PORTLESS_LAN                  Set to 1 when proxy is in LAN mode
  PORTLESS_TAILSCALE_URL        Tailscale URL of the app (when --tailscale is active)
  PORTLESS_NGROK_URL            ngrok URL of the app (when --ngrok is active)
  NODE_EXTRA_CA_CERTS           Path to the portless CA (set when HTTPS is active)

${colors_default.bold("Safari / DNS:")}
  .localhost subdomains auto-resolve in Chrome, Firefox, and Edge.
  Safari relies on the system DNS resolver, which may not handle them.
  Auto-syncs ${HOSTS_DISPLAY2} for route hostnames by default (including .localhost,
  custom TLDs, and LAN .local). Set PORTLESS_SYNC_HOSTS=0 to disable. If a route
  hostname will not resolve, the command that registered it warns instead of
  failing silently. Manual sync reconciles the managed entries with current routes,
  removes stale entries when there are no routes, and requires a successful read
  before writing. Every write is verified; a failed verification uses the normal
  hosts sync failure path. To sync manually:
    ${colors_default.cyan("portless hosts sync")}
  Clean up later with:
    ${colors_default.cyan("portless hosts clean")}

${colors_default.bold("Skip portless:")}
  PORTLESS=0 pnpm dev           # Runs command directly without proxy

${colors_default.bold("Reserved names:")}
  run, get, alias, hosts, list, doctor, trust, clean, prune, proxy, service are subcommands and
  cannot be used as app names directly. Use "portless run" to infer the name,
  or "portless --name <name>" to force any name including reserved ones.
`);
  process.exit(0);
}
function printVersion() {
  console.log("0.15.6");
  process.exit(0);
}
async function handleTrust() {
  const { dir } = await discoverState();
  if (!fs10.existsSync(dir)) {
    fs10.mkdirSync(dir, { recursive: true });
  }
  const { caGenerated } = ensureCerts(dir);
  if (caGenerated) {
    console.log(colors_default.gray("Generated local CA certificate."));
  }
  const result = trustCA(dir);
  if (result.trusted) {
    console.log(colors_default.green("Local CA added to system trust store."));
    console.log(colors_default.gray("Browsers will now trust portless HTTPS certificates."));
    return;
  }
  const isPermissionError2 = result.error?.includes("Permission denied") || result.error?.includes("EACCES");
  if (isPermissionError2 && !isWindows && process.getuid?.() !== 0) {
    console.log(colors_default.yellow("Trusting the CA requires elevated privileges. Requesting sudo..."));
    const sudoResult = spawnSync5(
      "sudo",
      [
        "env",
        ...collectPortlessEnvArgs2(),
        `PORTLESS_STATE_DIR=${dir}`,
        process.execPath,
        getEntryScript(),
        "trust"
      ],
      {
        stdio: "inherit",
        timeout: SUDO_SPAWN_TIMEOUT_MS
      }
    );
    if (sudoResult.status === 0) return;
    console.error(colors_default.red("sudo elevation also failed."));
  }
  console.error(colors_default.red(`Failed to trust CA: ${result.error}`));
  process.exit(1);
}
async function handleClean(args) {
  if (args[1] === "--help" || args[1] === "-h") {
    console.log(`
${colors_default.bold("portless clean")} - Remove portless artifacts from this machine.

Stops the proxy if it is running, uninstalls the startup service if installed,
removes the local CA from the OS trust store when it was installed by portless,
deletes known files under state directories (~/.portless, the system state
directory, and PORTLESS_STATE_DIR when set), and removes the portless block
from ${HOSTS_DISPLAY2}.

Only allowlisted filenames under each state directory are deleted. Custom
certificate paths from --cert and --key are never removed. If trust removal
fails, the CA certificate and key are retained so clean can safely retry.

macOS/Linux may prompt for sudo when the proxy, trust store, or ${HOSTS_DISPLAY2}
require elevated privileges. On Windows, run as Administrator if needed.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless clean")}

${colors_default.bold("Options:")}
  --help, -h             Show this help
`);
    process.exit(0);
  }
  if (args.length > 1) {
    console.error(colors_default.red(`Error: Unknown argument "${args[1]}".`));
    console.error(colors_default.cyan("  portless clean --help"));
    process.exit(1);
  }
  const serviceResult = tryUninstallService(getEntryScript());
  if (serviceResult.removed) {
    console.log(colors_default.green("Removed startup service."));
  } else if (serviceResult.needsElevation && !isWindows && (process.getuid?.() ?? -1) !== 0) {
    if (!runServiceUninstallWithSudo("Removing the startup service requires elevated privileges.")) {
      console.error(colors_default.red("Failed to remove startup service with sudo."));
      process.exit(1);
    }
  } else if (serviceResult.error) {
    const adminHint = isWindows ? " Run as Administrator and try again." : "";
    const message = `Could not remove startup service: ${serviceResult.error}${adminHint}`;
    if (serviceResult.installed) {
      console.error(colors_default.red(message));
      process.exit(1);
    }
    console.warn(colors_default.yellow(message));
  }
  console.log(colors_default.cyan("Stopping proxy if it is running..."));
  const { dir, port, tls: tls2 } = await discoverState();
  const store = new RouteStore(dir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  await stopProxy(store, port, tls2);
  const routesForClean = store.loadRoutesRaw();
  for (const route of routesForClean) {
    if (route.tailscaleHttpsPort) {
      try {
        unregisterTailscale(route);
        console.log(colors_default.green(`Removed tailscale serve on port ${route.tailscaleHttpsPort}.`));
      } catch {
      }
    }
    if (route.ngrokPid) {
      stopNgrok(route);
      console.log(colors_default.green(`Stopped ngrok tunnel for ${route.hostname}.`));
    }
  }
  const stateDirs = collectStateDirsForCleanup();
  const failedCAStateDirs = /* @__PURE__ */ new Set();
  const caRemovalResults = attemptCATrustRemovalForCleanup(stateDirs, untrustCA);
  for (const [stateDir, untrustResult] of caRemovalResults) {
    if (untrustResult.removed) {
      console.log(colors_default.green("Removed local CA from the system trust store."));
    } else {
      failedCAStateDirs.add(stateDir);
      console.warn(
        colors_default.yellow(
          `Could not remove CA from trust store: ${untrustResult.error ?? "unknown error"}
Try: sudo portless clean (Linux), or delete the certificate manually.`
        )
      );
    }
  }
  for (const stateDir of stateDirs) {
    removePortlessStateFiles(stateDir, {
      preserveCAIdentity: failedCAStateDirs.has(stateDir)
    });
  }
  console.log(colors_default.green("Removed portless state files from known state directories."));
  if (failedCAStateDirs.size > 0) {
    console.warn(
      colors_default.yellow("Retained CA identity files so trust removal can be retried safely.")
    );
  }
  if (cleanHostsFile()) {
    console.log(colors_default.green(`Removed portless entries from ${HOSTS_DISPLAY2}.`));
  } else if (!isWindows && process.getuid?.() !== 0) {
    if (!runCleanWithSudo(`Updating ${HOSTS_DISPLAY2} requires elevated privileges.`)) {
      console.error(colors_default.red(`Failed to update ${HOSTS_DISPLAY2}. Run: sudo portless clean`));
      process.exit(1);
    }
  } else {
    console.warn(
      colors_default.yellow(
        `Could not remove portless entries from ${HOSTS_DISPLAY2}${isWindows ? " (run as Administrator)." : "."}`
      )
    );
  }
  console.log(colors_default.green("Clean finished."));
}
async function handlePrune(args) {
  if (args[1] === "--help" || args[1] === "-h") {
    console.log(`
${colors_default.bold("portless prune")} - Kill orphaned dev servers left behind by crashed portless sessions.

When portless is killed with SIGKILL (kill -9) or crashes, child dev servers
may survive and continue holding their ports. This command finds those orphans
by checking routes whose owning CLI process is dead but whose port is still in
use, then terminates them and cleans up the stale route entries.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless prune")}
  ${colors_default.cyan("portless prune --force")}     Send SIGKILL instead of SIGTERM

${colors_default.bold("Options:")}
  --force                Send SIGKILL instead of SIGTERM
  --help, -h             Show this help
`);
    process.exit(0);
  }
  const forceKill = args.includes("--force");
  const { dir } = await discoverState();
  const store = new RouteStore(dir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  const stale = store.pruneStaleRoutes();
  if (stale.length === 0) {
    console.log("No orphaned routes found.");
    return;
  }
  for (const route of stale) {
    if (route.tailscaleHttpsPort) {
      try {
        unregisterTailscale(route);
        console.log(
          `  ${route.hostname} - removed tailscale serve on port ${route.tailscaleHttpsPort}`
        );
      } catch {
      }
    }
    if (route.ngrokPid) {
      stopNgrok(route);
      console.log(`  ${route.hostname} - stopped ngrok tunnel`);
    }
  }
  let killed = 0;
  for (const route of stale) {
    const pids = findPidsOnPort(route.port);
    if (pids.length === 0) {
      console.log(`  ${route.hostname} :${route.port} - route removed (port already free)`);
      continue;
    }
    const signal = forceKill ? "SIGKILL" : "SIGTERM";
    for (const pid of pids) {
      try {
        process.kill(pid, signal);
        killed++;
        console.log(`  ${route.hostname} :${route.port} - killed PID ${pid} (${signal})`);
      } catch {
        console.log(`  ${route.hostname} :${route.port} - PID ${pid} already exited`);
      }
    }
  }
  const routeWord = stale.length === 1 ? "route" : "routes";
  const procWord = killed === 1 ? "process" : "processes";
  console.log(
    colors_default.green(
      `
Pruned ${stale.length} stale ${routeWord}, killed ${killed} orphaned ${procWord}.`
    )
  );
}
async function handleList() {
  const { dir, port, tls: tls2 } = await discoverState();
  const store = new RouteStore(dir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  listRoutes(store, port, tls2);
}
async function handleGet(args) {
  if (args[1] === "--help" || args[1] === "-h") {
    console.log(`
${colors_default.bold("portless get")} - Print the URL for a service.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless get <name>")}

Constructs the URL using the same hostname and worktree logic as
"portless run", then prints it to stdout. Useful for wiring services
together:

  BACKEND_URL=$(portless get backend)

${colors_default.bold("Options:")}
  --no-worktree          Skip worktree prefix detection
  --help, -h             Show this help

${colors_default.bold("Examples:")}
  portless get backend                  # -> https://backend.localhost
  portless get backend                  # in worktree -> https://auth.backend.localhost
  portless get backend --no-worktree    # -> https://backend.localhost (skip worktree)
`);
    process.exit(0);
  }
  let skipWorktree = false;
  const positional = [];
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--no-worktree") {
      skipWorktree = true;
    } else if (args[i].startsWith("-")) {
      console.error(colors_default.red(`Error: Unknown flag "${args[i]}".`));
      console.error(colors_default.blue("Known flags: --no-worktree, --help"));
      process.exit(1);
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length === 0) {
    console.error(colors_default.red("Error: Missing service name."));
    console.error(colors_default.blue("Usage:"));
    console.error(colors_default.cyan("  portless get <name>"));
    console.error(colors_default.blue("Example:"));
    console.error(colors_default.cyan("  portless get backend"));
    process.exit(1);
  }
  const name = positional[0];
  const worktree = skipWorktree ? null : detectWorktreePrefix();
  const effectiveName = worktree ? `${worktree.prefix}.${name}` : name;
  const { port, tls: tls2, tlds } = await discoverState();
  const hostname = buildHostnames(effectiveName, tlds)[0];
  const url = formatUrl(hostname, port, tls2);
  process.stdout.write(url + "\n");
}
async function handleAlias(args) {
  if (args[1] === "--help" || args[1] === "-h") {
    console.log(`
${colors_default.bold("portless alias")} - Register a static route for services not managed by portless.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless alias <name> <port>")}        Register a route
  ${colors_default.cyan("portless alias --remove <name>")}      Remove a route
  ${colors_default.cyan("portless alias <name> <port> --force")} Override existing route

${colors_default.bold("Examples:")}
  portless alias my-postgres 5432     # -> https://my-postgres.localhost
  portless alias redis 6379           # -> https://redis.localhost
  portless alias --remove my-postgres # Remove the alias
`);
    process.exit(0);
  }
  const { dir, tlds, port: proxyPort, tls: tls2, lanMode } = await discoverState();
  const store = new RouteStore(dir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  if (args[1] === "--remove") {
    const aliasName2 = args[2];
    if (!aliasName2) {
      console.error(colors_default.red("Error: No alias name provided."));
      console.error(colors_default.cyan("  portless alias --remove <name>"));
      process.exit(1);
    }
    const hostnames2 = buildHostnames(aliasName2, tlds);
    const routes = store.loadRoutes();
    const existing = routes.find((r) => hostnames2.includes(r.hostname) && r.pid === 0);
    if (!existing) {
      console.error(colors_default.red(`Error: No alias found for "${hostnames2.join(", ")}".`));
      process.exit(1);
    }
    removeRoutes(store, hostnames2);
    console.log(colors_default.green(`Removed alias: ${hostnames2.join(", ")}`));
    return;
  }
  const aliasName = args[1];
  const aliasPort = args[2];
  if (!aliasName || !aliasPort) {
    console.error(colors_default.red("Error: Missing arguments."));
    console.error(colors_default.blue("Usage:"));
    console.error(colors_default.cyan("  portless alias <name> <port>"));
    console.error(colors_default.cyan("  portless alias --remove <name>"));
    console.error(colors_default.blue("Example:"));
    console.error(colors_default.cyan("  portless alias my-postgres 5432"));
    process.exit(1);
  }
  const hostnames = buildHostnames(aliasName, tlds);
  const port = parseInt(aliasPort, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(colors_default.red(`Error: Invalid port "${aliasPort}". Must be 1-65535.`));
    process.exit(1);
  }
  const force = args.includes("--force");
  addRoutes(store, hostnames, port, 0, force);
  console.log(colors_default.green(`Alias registered: ${hostnames.join(", ")} -> 127.0.0.1:${port}`));
  await reportHostsSyncHere(hostnames, proxyPort, tls2, lanMode);
}
async function handleHosts(args) {
  if (args[1] === "--help" || args[1] === "-h") {
    console.log(`
${colors_default.bold("portless hosts")} - Manage ${HOSTS_DISPLAY2} entries for .localhost subdomains.

Safari relies on the system DNS resolver, which may not handle .localhost
subdomains. This command reconciles portless-managed entries in ${HOSTS_DISPLAY2}.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless hosts sync")}    Reconcile current routes with ${HOSTS_DISPLAY2}
  ${colors_default.cyan("portless hosts clean")}   Remove portless entries from ${HOSTS_DISPLAY2}

${colors_default.bold("Auto-sync:")}
  The proxy updates ${HOSTS_DISPLAY2} for route hostnames by default. Disable with
  PORTLESS_SYNC_HOSTS=0. If a route hostname will not resolve, the command that
  registered it warns instead of failing silently.

${colors_default.bold("Safety:")}
  Sync removes stale entries when there are no routes. It requires a successful
  hosts-file read before writing and verifies every write. Read or verification
  failures use the normal elevated privileges or error path.
`);
    process.exit(0);
  }
  if (args[1] === "clean") {
    if (cleanHostsFile()) {
      console.log(colors_default.green(`Removed portless entries from ${HOSTS_DISPLAY2}.`));
      return;
    }
    if (!isWindows && process.getuid?.() !== 0) {
      console.log(
        colors_default.yellow(
          `Writing to ${HOSTS_DISPLAY2} requires elevated privileges. Requesting sudo...`
        )
      );
      const result = spawnSync5(
        "sudo",
        ["env", ...collectPortlessEnvArgs2(), process.execPath, getEntryScript(), "hosts", "clean"],
        {
          stdio: "inherit",
          timeout: SUDO_SPAWN_TIMEOUT_MS
        }
      );
      if (result.status === 0) return;
    }
    console.error(
      colors_default.red(`Failed to update ${HOSTS_DISPLAY2}${isWindows ? " (run as Administrator)." : "."}`)
    );
    process.exit(1);
    return;
  }
  if (!args[1]) {
    console.log(`
${colors_default.bold("Usage: portless hosts <command>")}

  ${colors_default.cyan("portless hosts sync")}    Reconcile current routes with ${HOSTS_DISPLAY2}
  ${colors_default.cyan("portless hosts clean")}   Remove portless entries from ${HOSTS_DISPLAY2}
`);
    process.exit(0);
  }
  if (args[1] !== "sync") {
    console.error(colors_default.red(`Error: Unknown hosts subcommand "${args[1]}".`));
    console.error(colors_default.blue("Usage:"));
    console.error(colors_default.cyan(`  portless hosts sync    # Reconcile routes with ${HOSTS_DISPLAY2}`));
    console.error(colors_default.cyan("  portless hosts clean   # Remove portless entries"));
    process.exit(1);
  }
  const { dir } = await discoverState();
  const store = new RouteStore(dir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  const routes = store.loadRoutes();
  const hostnames = routes.map((r) => r.hostname);
  if (syncHostsFile(hostnames)) {
    if (hostnames.length === 0) {
      console.log(colors_default.green(`No stale portless entries remain in ${HOSTS_DISPLAY2}.`));
      return;
    }
    console.log(colors_default.green(`Synced ${hostnames.length} hostname(s) to ${HOSTS_DISPLAY2}:`));
    for (const h of hostnames) {
      console.log(colors_default.cyan(`  127.0.0.1 ${h}`));
    }
    return;
  }
  if (!isWindows && process.getuid?.() !== 0) {
    console.log(
      colors_default.yellow(`Writing to ${HOSTS_DISPLAY2} requires elevated privileges. Requesting sudo...`)
    );
    const result = spawnSync5(
      "sudo",
      ["env", ...collectPortlessEnvArgs2(), process.execPath, getEntryScript(), "hosts", "sync"],
      {
        stdio: "inherit",
        timeout: SUDO_SPAWN_TIMEOUT_MS
      }
    );
    if (result.status === 0) return;
  }
  console.error(
    colors_default.red(`Failed to update ${HOSTS_DISPLAY2}${isWindows ? " (run as Administrator)." : "."}`)
  );
  process.exit(1);
}
function colorDoctorStatus(status) {
  if (status === "fail") return colors_default.red;
  if (status === "warn") return colors_default.yellow;
  if (status === "ok") return colors_default.green;
  return colors_default.gray;
}
function printDoctorFinding(finding) {
  const status = finding.status.padEnd(5);
  console.log(`${colorDoctorStatus(finding.status)(status)} ${finding.message}`);
  if (finding.hint) {
    console.log(colors_default.gray(`      ${finding.hint}`));
  }
}
function isProcessAliveForDoctor(pid) {
  if (pid <= 0) return true;
  return isProcessAlive(pid);
}
function checkPathWritable(targetPath) {
  try {
    fs10.accessSync(targetPath, fs10.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
function findExistingAncestor(targetPath) {
  let current = targetPath;
  for (; ; ) {
    if (fs10.existsSync(current)) return current;
    const parent = path9.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}
function checkCommandAvailable(command, args) {
  const result = spawnSync5(command, args, {
    stdio: "ignore",
    timeout: 3e3,
    windowsHide: true
  });
  return !result.error && (result.status === 0 || result.status === null);
}
function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
function isValidTcpPort(port) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}
function doctorProxyStartHint(proxyPort, tls2) {
  const defaultPort = getDefaultPort(tls2);
  const portArgs = proxyPort === defaultPort ? "" : ` -p ${proxyPort}`;
  const tlsArgs = tls2 ? "" : " --no-tls";
  return `Run: portless proxy start${portArgs}${tlsArgs}`;
}
async function handleDoctor(args) {
  if (args[1] === "--help" || args[1] === "-h") {
    console.log(`
${colors_default.bold("portless doctor")} - Check local portless health and print suggested fixes.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless doctor")}

Checks Node.js, the state directory, proxy liveness, route entries, HTTPS CA
trust, hostname resolution, and LAN mode prerequisites. It does not start,
stop, clean, prune, trust, or modify portless state.

${colors_default.bold("Options:")}
  --help, -h             Show this help
`);
    process.exit(0);
  }
  if (args.length > 1) {
    console.error(colors_default.red(`Error: Unknown argument "${args[1]}".`));
    console.error(colors_default.cyan("  portless doctor --help"));
    process.exit(1);
  }
  const findings = [];
  const add = (status, message, hint) => {
    findings.push({ status, message, hint });
  };
  let state;
  try {
    state = await discoverState();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    add("fail", `Could not discover portless state: ${message}`);
    state = {
      dir: resolveStateDir(),
      port: getDefaultPort(!isHttpsEnvDisabled()),
      tls: !isHttpsEnvDisabled(),
      tld: DEFAULT_TLD,
      tlds: [DEFAULT_TLD],
      lanMode: isLanEnvEnabled(),
      lanIp: null
    };
  }
  const store = new RouteStore(state.dir, {
    onWarning: (msg) => add("warn", msg)
  });
  const hasPortFile = fs10.existsSync(store.portFilePath);
  const configuredTls = hasPortFile ? state.tls : !isHttpsEnvDisabled();
  const configuredPort = hasPortFile ? state.port : getDefaultPort(configuredTls);
  const initialProxyRunning = await isProxyRunning(state.port, state.tls);
  const probePort = initialProxyRunning || hasPortFile ? state.port : configuredPort;
  const probeTls = initialProxyRunning || hasPortFile ? state.tls : configuredTls;
  const proxyRunning = initialProxyRunning && probePort === state.port ? true : await isProxyRunning(probePort, probeTls);
  const portListening = proxyRunning ? true : await isPortListening(probePort);
  const proxyPort = proxyRunning || portListening || hasPortFile ? probePort : configuredPort;
  const proxyTls = proxyRunning || portListening || hasPortFile ? probeTls : configuredTls;
  const currentProxyStateIsHttp = (proxyRunning || portListening || hasPortFile) && !proxyTls;
  const proxyUsesCustomCert = proxyTls && readCustomCertMarker(state.dir);
  const stateExists = fs10.existsSync(state.dir);
  console.log(colors_default.blue.bold("\nportless doctor\n"));
  console.log(`Version: ${"0.15.6"}`);
  console.log(`Node.js: ${process.versions.node}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);
  console.log(`State dir: ${state.dir}`);
  console.log(`Proxy target: ${formatUrl("127.0.0.1", proxyPort, proxyTls)}`);
  console.log(
    `Mode: ${proxyTls ? "HTTPS" : "HTTP"}, ${formatTldList2(state.tlds)}${state.lanMode ? ", LAN" : ""}`
  );
  console.log("");
  const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
  if (nodeMajor >= 24) {
    add("ok", `Node.js ${process.versions.node} satisfies portless requirements.`);
  } else {
    add("fail", `Node.js ${process.versions.node} is unsupported.`, "Install Node.js 24 or newer.");
  }
  if (stateExists) {
    try {
      const stat = fs10.statSync(state.dir);
      if (!stat.isDirectory()) {
        add("fail", `State path exists but is not a directory: ${state.dir}`);
      } else if (checkPathWritable(state.dir)) {
        add("ok", `State directory is writable: ${state.dir}`);
      } else {
        add("fail", `State directory is not writable: ${state.dir}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      add("fail", `Could not inspect state directory: ${message}`);
    }
  } else {
    const ancestor = findExistingAncestor(path9.dirname(state.dir));
    if (!ancestor) {
      add(
        "fail",
        `State directory does not exist and no writable ancestor was found: ${state.dir}`
      );
    } else {
      const ancestorStat = fs10.statSync(ancestor);
      if (!ancestorStat.isDirectory()) {
        add("fail", `State directory does not exist and ancestor is not a directory: ${ancestor}`);
      } else if (checkPathWritable(ancestor)) {
        add("info", `State directory has not been created yet: ${state.dir}`);
      } else {
        add("fail", `State directory does not exist and ancestor is not writable: ${ancestor}`);
      }
    }
  }
  if (proxyRunning) {
    add("ok", `Proxy is responding on port ${proxyPort}.`);
  } else if (portListening) {
    const pid = findPidOnPort(proxyPort);
    add(
      "fail",
      `Port ${proxyPort} is in use, but it is not a portless proxy.`,
      pid ? `Process on port: PID ${pid}` : "Could not identify the process holding the port."
    );
  } else {
    add(
      "warn",
      `Proxy is not running on port ${proxyPort}.`,
      doctorProxyStartHint(proxyPort, proxyTls)
    );
  }
  if (fs10.existsSync(store.pidPath)) {
    try {
      const rawPid = fs10.readFileSync(store.pidPath, "utf-8").trim();
      const pid = parseInt(rawPid, 10);
      if (isNaN(pid) || pid <= 0) {
        add("fail", `Proxy PID file is invalid: ${store.pidPath}`);
      } else if (!isProcessAliveForDoctor(pid)) {
        add("warn", `Proxy PID file is stale: ${pid}`, "Run: portless proxy stop");
      } else if (!proxyRunning) {
        add(
          "warn",
          `Proxy PID file points to PID ${pid}, but no portless proxy is responding on port ${proxyPort}.`,
          "Run: portless proxy stop"
        );
      } else {
        const portPid = findPidOnPort(proxyPort);
        if (portPid !== null && portPid !== pid) {
          add(
            "warn",
            `Proxy PID file points to PID ${pid}, but port ${proxyPort} is owned by PID ${portPid}.`,
            "Run: portless proxy stop"
          );
        } else {
          add("ok", `Proxy PID file points to the responding proxy process: ${pid}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      add("fail", `Could not read proxy PID file: ${message}`);
    }
  } else if (proxyRunning) {
    add("warn", `Proxy is running but the PID file is missing: ${store.pidPath}`);
  }
  if (proxyUsesCustomCert) {
    add("ok", "Proxy is configured with a custom TLS certificate.");
  } else if (proxyTls || !currentProxyStateIsHttp && !isHttpsEnvDisabled()) {
    if (checkCommandAvailable("openssl", ["version"])) {
      add("ok", "OpenSSL is available for certificate generation.");
    } else {
      add(
        "fail",
        "OpenSSL is not available on PATH.",
        isWindows ? "Install OpenSSL or add Git for Windows OpenSSL to PATH." : "Install OpenSSL with your system package manager."
      );
    }
  } else {
    add("info", "HTTPS is disabled, so OpenSSL is not required for this run.");
  }
  if (proxyTls && proxyUsesCustomCert) {
    add("info", "Generated local CA is not required for custom TLS certificates.");
  } else if (proxyTls) {
    const caPath = path9.join(state.dir, "ca.pem");
    if (fs10.existsSync(caPath)) {
      if (isCATrusted(state.dir)) {
        add("ok", "Local CA is trusted by the OS trust store.");
      } else {
        add(
          "warn",
          "Local CA exists but is not trusted by the OS trust store.",
          "Run: portless trust"
        );
      }
    } else if (proxyRunning) {
      add("warn", `Generated CA file is missing: ${caPath}`);
    } else {
      add("info", "Local CA has not been generated yet.");
    }
  } else {
    add("info", "HTTPS is disabled for the current proxy state.");
  }
  let rawRoutes = [];
  try {
    rawRoutes = store.loadRoutesRaw();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    add("fail", `Could not read routes: ${message}`);
  }
  const liveRoutes = rawRoutes.filter(
    (route) => route.pid === 0 || isProcessAliveForDoctor(route.pid)
  );
  const staleRoutes = rawRoutes.filter(
    (route) => route.pid !== 0 && !isProcessAliveForDoctor(route.pid)
  );
  if (rawRoutes.length === 0) {
    add("info", "No routes are registered.");
  } else if (staleRoutes.length === 0) {
    add("ok", `Routes: ${pluralize(liveRoutes.length, "active route")}.`);
  } else {
    add(
      "warn",
      `Routes: ${pluralize(liveRoutes.length, "active route")}, ${pluralize(staleRoutes.length, "stale route")}.`,
      "Run: portless prune"
    );
  }
  for (const route of staleRoutes.slice(0, 5)) {
    add("warn", `Stale route ${route.hostname} is owned by exited PID ${route.pid}.`);
  }
  if (staleRoutes.length > 5) {
    add("warn", `${staleRoutes.length - 5} additional stale routes hidden.`);
  }
  const routePortChecks = await Promise.all(
    liveRoutes.map(async (route) => {
      const validPort = isValidTcpPort(route.port);
      return {
        route,
        invalidPort: !validPort,
        listening: validPort ? await isPortListening(route.port) : false
      };
    })
  );
  for (const { route, invalidPort, listening } of routePortChecks) {
    if (invalidPort) {
      add(
        "warn",
        `Route ${route.hostname} has invalid port ${route.port}.`,
        route.pid === 0 ? "Remove or recreate the alias." : "Run: portless prune"
      );
      continue;
    }
    if (listening) continue;
    add(
      "warn",
      `Route ${route.hostname} points to port ${route.port}, but nothing is listening there.`,
      route.pid === 0 ? "Remove the alias or start that service." : "The app may still be starting."
    );
  }
  if (state.lanMode || isLanEnvEnabled()) {
    const mdns = isMdnsSupported();
    if (mdns.supported) {
      add("ok", "mDNS publishing support is available for LAN mode.");
    } else {
      add("fail", `LAN mode is enabled but mDNS publishing is unavailable: ${mdns.reason}`);
    }
    if (state.lanIp) {
      add("ok", `LAN IP is recorded: ${state.lanIp}`);
    } else {
      add("warn", "LAN mode is enabled but no LAN IP is recorded.");
    }
  } else if (liveRoutes.length > 0) {
    const managedHosts = new Set(getManagedHostnames());
    const resolutionChecks = await Promise.all(
      liveRoutes.map(async (route) => ({
        hostname: route.hostname,
        resolves: await checkHostResolution(route.hostname),
        managed: managedHosts.has(route.hostname)
      }))
    );
    const unresolved = resolutionChecks.filter((result) => !result.resolves);
    if (unresolved.length === 0) {
      add("ok", "Registered hostnames resolve through the system resolver.");
    } else {
      add(
        "warn",
        `${pluralize(unresolved.length, "hostname")} did not resolve through the system resolver.`,
        "Run: portless hosts sync"
      );
      for (const result of unresolved.slice(0, 5)) {
        const hostState = result.managed ? "present in hosts block" : "missing from hosts block";
        add("warn", `${result.hostname} is ${hostState}.`);
      }
    }
  }
  for (const finding of findings) {
    printDoctorFinding(finding);
  }
  const failures = findings.filter((finding) => finding.status === "fail").length;
  const warnings = findings.filter((finding) => finding.status === "warn").length;
  console.log("");
  if (failures > 0) {
    console.log(
      colors_default.red(`Summary: ${pluralize(failures, "failure")}, ${pluralize(warnings, "warning")}.`)
    );
    process.exit(1);
  }
  console.log(colors_default.green(`Summary: 0 failures, ${pluralize(warnings, "warning")}.`));
}
async function handleProxy(args) {
  if (args[1] === "stop") {
    let explicitPort;
    const portIdx = args.indexOf("--port") !== -1 ? args.indexOf("--port") : args.indexOf("-p");
    if (portIdx !== -1) {
      const portValue = args[portIdx + 1];
      if (portValue && !portValue.startsWith("-")) {
        const parsed = parseInt(portValue, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 65535) {
          explicitPort = parsed;
        }
      }
    }
    if (explicitPort !== void 0) {
      const dir = resolveStateDir(explicitPort);
      const store2 = new RouteStore(dir, {
        onWarning: (msg) => console.warn(colors_default.yellow(msg))
      });
      await stopProxy(store2, explicitPort, false);
    } else {
      const { dir, port, tls: tls2 } = await discoverState();
      const store2 = new RouteStore(dir, {
        onWarning: (msg) => console.warn(colors_default.yellow(msg))
      });
      await stopProxy(store2, port, tls2);
    }
    return;
  }
  const isProxyHelp = args[1] === "--help" || args[1] === "-h";
  if (isProxyHelp || args[1] !== "start") {
    console.log(`
${colors_default.bold("portless proxy")} - Manage the portless proxy server.

${colors_default.bold("Usage:")}
  ${colors_default.cyan("portless proxy start")}                Start the HTTPS proxy on port 443 (daemon)
  ${colors_default.cyan("portless proxy start --no-tls")}       Start without HTTPS (port 80)
  ${colors_default.cyan("portless proxy start --lan")}          Enable LAN mode (mDNS, .local TLD)
  ${colors_default.cyan("portless proxy start --foreground")}   Start in foreground (for debugging)
  ${colors_default.cyan("portless proxy start -p 1355")}        Start on a custom port (no sudo)
  ${colors_default.cyan("portless proxy start --tld test")}     Use .test instead of .localhost
  ${colors_default.cyan("portless proxy start --tld localhost --tld test")}  Serve both TLDs
  ${colors_default.cyan("portless proxy start --tld dev.example.com")}  Use a multi-segment TLD (production parity)
  ${colors_default.cyan("portless proxy start --wildcard")}     Allow unregistered subdomains to fall back to parent
  ${colors_default.cyan("portless proxy stop")}                 Stop the proxy

${colors_default.bold("LAN mode (--lan):")}
  Without LAN mode, the proxy listens only on 127.0.0.1 and ::1.
  LAN mode explicitly binds the proxy to 0.0.0.0 and ::.
  Makes services accessible from other devices on the same WiFi network
  via mDNS (.local domains). Useful for testing on real mobile devices.
  Auto-detects your LAN IP and follows changes automatically, or use
  --ip to pin one.
  Stopped LAN proxies keep LAN mode for the next start via proxy.lan.
  Use PORTLESS_LAN=0 for one start to switch back to .localhost mode.
`);
    process.exit(isProxyHelp || !args[1] ? 0 : 1);
  }
  const isForeground = args.includes("--foreground");
  const skipTrust = args.includes("--skip-trust");
  const hasHttpsFlag = args.includes("--https");
  const hasNoTls = args.includes("--no-tls") || isHttpsEnvDisabled();
  const wantHttps = !hasNoTls;
  let customCertPath = null;
  let customKeyPath = null;
  const certIdx = args.indexOf("--cert");
  if (certIdx !== -1) {
    customCertPath = args[certIdx + 1] || null;
    if (!customCertPath || customCertPath.startsWith("-")) {
      console.error(colors_default.red("Error: --cert requires a file path."));
      process.exit(1);
    }
  }
  const keyIdx = args.indexOf("--key");
  if (keyIdx !== -1) {
    customKeyPath = args[keyIdx + 1] || null;
    if (!customKeyPath || customKeyPath.startsWith("-")) {
      console.error(colors_default.red("Error: --key requires a file path."));
      process.exit(1);
    }
  }
  if (customCertPath && !customKeyPath || !customCertPath && customKeyPath) {
    console.error(colors_default.red("Error: --cert and --key must be used together."));
    process.exit(1);
  }
  let useHttps = wantHttps || !!(customCertPath && customKeyPath);
  let hasExplicitPort = false;
  let proxyPort = getDefaultPort(useHttps);
  let portFlagIndex = args.indexOf("--port");
  if (portFlagIndex === -1) portFlagIndex = args.indexOf("-p");
  if (portFlagIndex !== -1) {
    const portValue = args[portFlagIndex + 1];
    if (!portValue || portValue.startsWith("-")) {
      console.error(colors_default.red("Error: --port / -p requires a port number."));
      console.error(colors_default.blue("Usage:"));
      console.error(colors_default.cyan("  portless proxy start -p 8080"));
      process.exit(1);
    }
    proxyPort = parseInt(portValue, 10);
    if (isNaN(proxyPort) || proxyPort < 1 || proxyPort > 65535) {
      console.error(colors_default.red(`Error: Invalid port number: ${portValue}`));
      console.error(colors_default.blue("Port must be between 1 and 65535."));
      process.exit(1);
    }
    hasExplicitPort = true;
  }
  let tlds;
  try {
    tlds = getDefaultTlds();
  } catch (err) {
    console.error(colors_default.red(`Error: ${err.message}`));
    process.exit(1);
  }
  const tldFlagValues = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--tld") {
      const tldValue = args[i + 1];
      if (!tldValue || tldValue.startsWith("-")) {
        console.error(
          colors_default.red("Error: --tld requires a TLD value (e.g. test, dev.example.com).")
        );
        process.exit(1);
      }
      tldFlagValues.push(tldValue);
      i += 1;
    }
  }
  if (tldFlagValues.length > 0) {
    try {
      tlds = normalizeTlds2(tldFlagValues.flatMap((value) => parseTldList(value)));
    } catch (err) {
      console.error(colors_default.red(`Error: ${err.message}`));
      process.exit(1);
    }
  }
  let tld = primaryTld2(tlds);
  const useWildcard = args.includes("--wildcard") || isWildcardEnvEnabled();
  const explicit = {
    useHttps: hasHttpsFlag || hasNoTls || customCertPath !== null || customKeyPath !== null || process.env.PORTLESS_HTTPS !== void 0,
    customCert: customCertPath !== null || customKeyPath !== null,
    lanMode: process.env.PORTLESS_LAN !== void 0,
    lanIp: process.env.PORTLESS_LAN_IP !== void 0,
    tlds: tldFlagValues.length > 0 || process.env.PORTLESS_TLD !== void 0,
    useWildcard: args.includes("--wildcard") || process.env.PORTLESS_WILDCARD !== void 0
  };
  let stateDir = resolveStateDir(proxyPort);
  let persistedLanMode = readLanMarker(stateDir) !== null;
  let runningPort = null;
  if (!hasExplicitPort) {
    const currentState = await discoverState();
    persistedLanMode = currentState.lanMode;
    if (await isProxyRunning(currentState.port) || !!process.env.PORTLESS_STATE_DIR && await isPortListening(currentState.port)) {
      runningPort = currentState.port;
      proxyPort = currentState.port;
      stateDir = currentState.dir;
    }
  }
  const desiredConfig = resolveProxyConfig({
    persistedLanMode,
    explicit,
    defaultTlds: getDefaultTlds(),
    useHttps: wantHttps || !!(customCertPath && customKeyPath),
    customCertPath,
    customKeyPath,
    lanMode: isLanEnvEnabled(),
    lanIp: process.env.PORTLESS_LAN_IP || null,
    tlds,
    useWildcard
  });
  const lanMode = desiredConfig.lanMode;
  useHttps = desiredConfig.useHttps;
  customCertPath = desiredConfig.customCertPath;
  customKeyPath = desiredConfig.customKeyPath;
  tld = desiredConfig.tld;
  tlds = desiredConfig.tlds;
  const desiredWildcard = desiredConfig.useWildcard;
  let lanIp = desiredConfig.lanIpExplicit ? desiredConfig.lanIp : null;
  if (!hasExplicitPort && runningPort === null) {
    proxyPort = getDefaultPort(useHttps);
    stateDir = resolveStateDir(proxyPort);
  }
  if (lanMode && tldFlagValues.length > 0) {
    const userTlds = tldFlagValues.join(", ");
    if (userTlds !== "local") {
      console.warn(
        chalk.yellow(
          `Warning: --lan forces .local TLD (mDNS requirement). Ignoring --tld ${userTlds}.`
        )
      );
    }
  }
  for (const configuredTld of tlds) {
    const riskyReason = getRiskyTldReason(configuredTld);
    if (riskyReason && !lanMode) {
      console.warn(colors_default.yellow(`Warning: .${configuredTld}: ${riskyReason}`));
    }
  }
  const syncDisabled = process.env.PORTLESS_SYNC_HOSTS === "0" || process.env.PORTLESS_SYNC_HOSTS === "false";
  const nonDefaultTlds = tlds.filter((configuredTld) => configuredTld !== DEFAULT_TLD);
  if (nonDefaultTlds.length > 0 && !lanMode && syncDisabled) {
    console.warn(
      colors_default.yellow(
        `Warning: ${formatTldList2(nonDefaultTlds)} domains require ${HOSTS_DISPLAY2} entries to resolve to 127.0.0.1.`
      )
    );
    console.warn(colors_default.yellow("Hosts sync is disabled. To add entries manually, run:"));
    console.warn(colors_default.cyan("  portless hosts sync"));
  }
  let store = new RouteStore(stateDir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  const proxyRunning = runningPort !== null || await isProxyRunning(proxyPort);
  if (proxyRunning) {
    const runningConfig = readCurrentProxyConfig(stateDir);
    const mismatchMessages = getProxyConfigMismatchMessages(desiredConfig, runningConfig, explicit);
    if (mismatchMessages.length > 0) {
      printProxyConfigMismatch(proxyPort, desiredConfig, mismatchMessages);
    }
    if (isForeground) {
      return;
    }
    const portFlag = proxyPort !== getDefaultPort(useHttps) ? ` -p ${proxyPort}` : "";
    console.log(colors_default.yellow(`Proxy is already running on port ${proxyPort}.`));
    console.log(
      colors_default.blue(`To restart: portless proxy stop${portFlag} && portless proxy start${portFlag}`)
    );
    return;
  }
  if (lanMode) {
    const mdnsSupport = isMdnsSupported();
    if (!mdnsSupport.supported) {
      console.error(
        colors_default.red(
          "Error: LAN mode requires mDNS publishing, which is not supported on this platform."
        )
      );
      if (mdnsSupport.reason) {
        console.error(colors_default.gray(mdnsSupport.reason));
      }
      process.exit(1);
    }
    const inheritedLanIp = process.env[INTERNAL_LAN_IP_ENV] || null;
    delete process.env[INTERNAL_LAN_IP_ENV];
    if (!lanIp) {
      lanIp = inheritedLanIp || await getLocalNetworkIp();
    }
    if (!lanIp) {
      console.error(colors_default.red("Error: Could not detect LAN IP. Are you connected to a network?"));
      console.error(colors_default.blue("Specify manually:"));
      console.error(colors_default.cyan("  portless proxy start --lan --ip 192.168.1.42"));
      process.exit(1);
    }
  } else {
    delete process.env[INTERNAL_LAN_IP_ENV];
  }
  const resolvedConfig = {
    ...desiredConfig,
    useHttps,
    customCertPath,
    customKeyPath,
    lanMode,
    lanIp: desiredConfig.lanIpExplicit ? lanIp : null,
    lanIpExplicit: desiredConfig.lanIpExplicit,
    tld,
    tlds,
    useWildcard: desiredWildcard
  };
  if (!isWindows && proxyPort < PRIVILEGED_PORT_THRESHOLD && (process.getuid?.() ?? -1) !== 0) {
    const startArgs = [
      process.execPath,
      getEntryScript(),
      "proxy",
      "start",
      ...buildProxyStartConfig({
        useHttps,
        customCertPath,
        customKeyPath,
        lanMode,
        lanIp: desiredConfig.lanIpExplicit ? lanIp : null,
        lanIpExplicit: desiredConfig.lanIpExplicit,
        tld,
        tlds,
        useWildcard: desiredWildcard,
        foreground: isForeground,
        includePort: true,
        proxyPort
      }).args
    ];
    const fallbackCommand = formatProxyStartCommand(FALLBACK_PROXY_PORT, resolvedConfig);
    const currentCommand = formatProxyStartCommand(proxyPort, resolvedConfig);
    console.log(
      colors_default.yellow(`Port ${proxyPort} requires elevated privileges. Requesting sudo...`)
    );
    if (!hasExplicitPort) {
      console.log(colors_default.gray(`(To skip sudo, use an unprivileged port: ${fallbackCommand})`));
    }
    const result = spawnSync5("sudo", ["env", ...collectPortlessEnvArgs2(), ...startArgs], {
      stdio: "inherit",
      timeout: SUDO_SPAWN_TIMEOUT_MS
    });
    if (result.status === 0) {
      if (!isForeground) {
        if (await waitForProxy(proxyPort)) {
          console.log(colors_default.green(`Proxy started on port ${proxyPort}.`));
        } else {
          console.error(colors_default.red("Proxy process started but is not responding."));
          const logPath2 = path9.join(resolveStateDir(proxyPort), "proxy.log");
          if (fs10.existsSync(logPath2)) {
            console.error(colors_default.gray(`Logs: ${logPath2}`));
          }
        }
      }
      return;
    }
    if (result.signal) {
      process.exit(1);
    }
    if (!hasExplicitPort) {
      proxyPort = FALLBACK_PROXY_PORT;
      console.log(colors_default.yellow(`Falling back to port ${proxyPort}.`));
      console.log(
        colors_default.blue(`For clean URLs without port numbers, re-run and accept the sudo prompt:`)
      );
      console.log(colors_default.cyan(`  ${fallbackCommand}`));
      if (await isProxyRunning(proxyPort)) {
        console.log(colors_default.yellow(`Proxy is already running on port ${proxyPort}.`));
        return;
      }
      stateDir = resolveStateDir(proxyPort);
      store = new RouteStore(stateDir, {
        onWarning: (msg) => console.warn(colors_default.yellow(msg))
      });
    } else {
      console.error(
        colors_default.red(`Error: Port ${proxyPort} requires elevated privileges and sudo failed.`)
      );
      console.error(colors_default.blue("Try again (portless will prompt for sudo):"));
      console.error(colors_default.cyan(`  ${currentCommand}`));
      process.exit(1);
    }
  }
  let tlsOptions;
  if (useHttps) {
    store.ensureDir();
    if (customCertPath && customKeyPath) {
      try {
        const cert = fs10.readFileSync(customCertPath);
        const key = fs10.readFileSync(customKeyPath);
        const certStr = cert.toString("utf-8");
        const keyStr = key.toString("utf-8");
        if (!certStr.includes("-----BEGIN CERTIFICATE-----")) {
          console.error(colors_default.red(`Error: ${customCertPath} is not a valid PEM certificate.`));
          console.error(colors_default.gray("Expected a file starting with -----BEGIN CERTIFICATE-----"));
          process.exit(1);
        }
        if (!keyStr.match(/-----BEGIN [\w\s]*PRIVATE KEY-----/)) {
          console.error(colors_default.red(`Error: ${customKeyPath} is not a valid PEM private key.`));
          console.error(
            colors_default.gray("Expected a file starting with -----BEGIN ...PRIVATE KEY-----")
          );
          process.exit(1);
        }
        tlsOptions = { cert, key };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(colors_default.red(`Error reading certificate files: ${message}`));
        process.exit(1);
      }
    } else {
      console.log(colors_default.gray("Ensuring TLS certificates..."));
      const certs = ensureCerts(stateDir);
      if (certs.caGenerated) {
        console.log(colors_default.green("Generated local CA certificate."));
      }
      if (!skipTrust && !isCATrusted(stateDir)) {
        console.log(colors_default.yellow("Adding CA to system trust store..."));
        const trustResult = trustCA(stateDir);
        if (trustResult.trusted) {
          console.log(
            colors_default.green("CA added to system trust store. Browsers will trust portless certs.")
          );
        } else {
          console.warn(colors_default.yellow("Could not add CA to system trust store."));
          if (trustResult.error) {
            console.warn(colors_default.gray(trustResult.error));
          }
          console.warn(
            colors_default.yellow("Browsers will show certificate warnings. To fix this later, run:")
          );
          console.warn(colors_default.cyan("  portless trust"));
        }
      }
      const cert = fs10.readFileSync(certs.certPath);
      const key = fs10.readFileSync(certs.keyPath);
      const ca = fs10.readFileSync(certs.caPath);
      tlsOptions = {
        cert,
        key,
        ca,
        SNICallback: createSNICallback(stateDir, cert, key, tlds, ca)
      };
    }
  }
  if (isForeground) {
    console.log(chalk.blue.bold("\nportless proxy\n"));
    startProxyServer(
      store,
      proxyPort,
      tld,
      tlds,
      tlsOptions,
      lanIp,
      desiredWildcard ? false : void 0,
      !!(customCertPath && customKeyPath)
    );
    return;
  }
  store.ensureDir();
  const logPath = path9.join(stateDir, "proxy.log");
  const logFd = fs10.openSync(logPath, "a");
  try {
    try {
      fs10.chmodSync(logPath, FILE_MODE);
    } catch {
    }
    fixOwnership(logPath);
    const daemonArgs = [
      getEntryScript(),
      "proxy",
      "start",
      ...buildProxyStartConfig({
        useHttps,
        customCertPath,
        customKeyPath,
        lanMode,
        lanIp: desiredConfig.lanIpExplicit ? lanIp : null,
        lanIpExplicit: desiredConfig.lanIpExplicit,
        tld,
        tlds,
        useWildcard: desiredWildcard,
        foreground: true,
        includePort: true,
        proxyPort,
        skipTrust: true
      }).args
    ];
    const child = spawn4(process.execPath, daemonArgs, {
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: process.env,
      windowsHide: true
    });
    child.unref();
  } finally {
    fs10.closeSync(logFd);
  }
  if (!await waitForProxy(proxyPort, void 0, void 0, useHttps)) {
    console.error(colors_default.red("Proxy failed to start (timed out waiting for it to listen)."));
    console.error(colors_default.blue("Try starting the proxy in the foreground to see the error:"));
    console.error(colors_default.cyan("  portless proxy start --foreground"));
    if (fs10.existsSync(logPath)) {
      console.error(colors_default.gray(`Logs: ${logPath}`));
    }
    process.exit(1);
  }
  const proto = useHttps ? "HTTPS/2" : "HTTP";
  console.log(chalk.green(`${proto} proxy started on port ${proxyPort}`));
  const persistedHostnames = store.loadRoutes().map((route) => route.hostname);
  await reportHostsSyncHere(persistedHostnames, proxyPort, useHttps, lanMode);
  if (lanMode && lanIp) {
    console.log(chalk.green(`LAN mode active. IP: ${lanIp}`));
    console.log(chalk.gray("Services will be discoverable as <name>.local on your network."));
  }
}
function loadAppConfig(cwd = process.cwd()) {
  try {
    const loaded = loadConfig(cwd);
    if (!loaded) return null;
    return resolveAppConfig(loaded.config, loaded.configDir, cwd);
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      console.error(colors_default.red(`Error: ${err.message}`));
      process.exit(1);
    }
    throw err;
  }
}
async function handleDefaultMode(globalScript, extraArgs = []) {
  const cwd = process.cwd();
  const wsRoot = findWorkspaceRoot(cwd);
  if (wsRoot === cwd) {
    const packages = discoverWorkspacePackages(cwd);
    let wsScriptName;
    try {
      wsScriptName = globalScript ?? loadConfig(cwd)?.config.script ?? "dev";
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        console.error(colors_default.red(`Error: ${err.message}`));
        process.exit(1);
      }
      throw err;
    }
    const hasMatchingPackages = packages.some((p) => p.scripts[wsScriptName]);
    if (hasMatchingPackages) {
      await handleDefaultMulti(cwd, globalScript, extraArgs);
      return true;
    }
  }
  const appConfig = loadAppConfig(cwd);
  const scriptName = globalScript ?? appConfig?.script ?? "dev";
  if (hasScript(scriptName, cwd)) {
    await handleDefaultSingle(cwd, scriptName, appConfig);
    return true;
  }
  return false;
}
async function handleDefaultSingle(cwd, scriptName, appConfig) {
  const resolved = resolveScriptCommand(scriptName, cwd);
  if (!resolved) {
    console.error(colors_default.red(`Error: No "${scriptName}" script found in package.json.`));
    process.exit(1);
  }
  let baseName;
  let nameSource;
  if (appConfig?.name) {
    baseName = appConfig.name.split(".").map((label) => truncateLabel(label)).join(".");
    nameSource = "portless.json";
  } else {
    const inferred = inferProjectName(cwd);
    baseName = inferred.name;
    nameSource = inferred.source;
  }
  const worktree = detectWorktreePrefix(cwd);
  const effectiveName = applyWorktreePrefix(baseName, worktree);
  const { dir, port, tls: tls2, tlds, lanMode, lanIp } = await discoverState();
  const store = new RouteStore(dir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  await runApp(
    store,
    port,
    dir,
    effectiveName,
    resolved,
    tls2,
    tlds,
    false,
    { nameSource, prefix: worktree?.prefix, prefixSource: worktree?.source },
    appConfig?.appPort,
    lanMode,
    lanIp
  );
}
function spawnChildProcess(commandArgs, env, cwd) {
  return spawn4(commandArgs[0], commandArgs.slice(1), {
    stdio: ["ignore", "pipe", "pipe"],
    env,
    cwd,
    ...isWindows ? {} : { detached: true }
  });
}
function prefixStream(stream, output, prefix) {
  if (!stream) return;
  const decoder = new StringDecoder("utf8");
  let buffer = "";
  stream.on("data", (data) => {
    buffer += decoder.write(data);
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      output.write(`${prefix} ${line}
`);
    }
  });
  stream.on("end", () => {
    buffer += decoder.end();
    if (buffer) output.write(`${prefix} ${buffer}
`);
  });
}
function pipeOutput(child, prefix) {
  prefixStream(child.stdout, process.stdout, prefix);
  prefixStream(child.stderr, process.stderr, prefix);
}
async function spawnProxiedApp(app, stateDir, proxyPort, tls2, tlds, lanMode, exitCodes) {
  const usesPortless = app.commandArgs[0] === "portless";
  const pkgEnv = { ...process.env };
  pkgEnv.PATH = augmentedPath(pkgEnv, app.pkg.dir);
  let env;
  let store = null;
  let hostnames = [];
  let displayUrl;
  if (usesPortless) {
    env = pkgEnv;
    displayUrl = "(managed by portless)";
  } else {
    store = new RouteStore(stateDir, {
      onWarning: (msg) => console.warn(colors_default.yellow(`[${app.name}] ${msg}`))
    });
    const appPort = app.appPort ?? await findFreePort();
    hostnames = buildHostnames(app.name, tlds);
    const urls = formatUrls(hostnames, proxyPort, tls2);
    const url = urls[0];
    displayUrl = url;
    addRoutes(store, hostnames, appPort, process.pid);
    await reportHostsSyncHere(hostnames, proxyPort, tls2, lanMode);
    env = {
      ...pkgEnv,
      PORT: String(appPort),
      HOST: "127.0.0.1",
      PORTLESS_URL: url,
      __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: formatViteAllowedHosts(tlds)
    };
    if (tls2) {
      const caPath = path9.join(stateDir, "ca.pem");
      if (fs10.existsSync(caPath)) {
        env.NODE_EXTRA_CA_CERTS = caPath;
      }
    }
  }
  const child = spawnChildProcess(app.commandArgs, env, app.pkg.dir);
  pipeOutput(child, chalk.cyan(`[${app.name}]`));
  const capturedStore = store;
  const capturedHostnames = hostnames;
  child.on("exit", (code, signal) => {
    exitCodes.set(app.name, code);
    if (code !== 0 && code !== null) {
      console.error(colors_default.red(`[${app.name}] exited with code ${code}`));
    } else if (signal) {
      console.error(colors_default.yellow(`[${app.name}] killed by ${signal}`));
    }
    if (capturedStore && capturedHostnames.length > 0) {
      removeRoutes(capturedStore, capturedHostnames, process.pid);
    }
  });
  const route = store && hostnames.length > 0 ? { store, hostnames } : null;
  return { child, displayUrl, route };
}
function spawnTaskApp(app, exitCodes) {
  const pkgEnv = { ...process.env };
  pkgEnv.PATH = augmentedPath(pkgEnv, app.pkg.dir);
  const child = spawnChildProcess(app.commandArgs, pkgEnv, app.pkg.dir);
  pipeOutput(child, chalk.gray(`[${app.name}]`));
  child.on("exit", (code, signal) => {
    exitCodes.set(app.name, code);
    if (code !== 0 && code !== null) {
      console.error(colors_default.red(`[${app.name}] exited with code ${code}`));
    } else if (signal) {
      console.error(colors_default.yellow(`[${app.name}] killed by ${signal}`));
    }
  });
  return child;
}
async function handleDefaultMulti(wsRoot, globalScript, extraArgs = []) {
  let loaded;
  try {
    loaded = loadConfig(wsRoot);
  } catch (err) {
    if (err instanceof ConfigValidationError) {
      console.error(colors_default.red(`Error: ${err.message}`));
      process.exit(1);
    }
    throw err;
  }
  const packages = discoverWorkspacePackages(wsRoot);
  if (packages.length === 0) {
    console.error(colors_default.red("Error: No workspace packages found."));
    process.exit(1);
  }
  const scriptName = globalScript ?? loaded?.config.script ?? "dev";
  let projectName;
  if (loaded?.config.name) {
    projectName = loaded.config.name.split(".").map((label) => truncateLabel(label)).join(".");
  } else {
    const scopeCounts = /* @__PURE__ */ new Map();
    for (const p of packages) {
      if (p.scope) scopeCounts.set(p.scope, (scopeCounts.get(p.scope) ?? 0) + 1);
    }
    let commonScope;
    let maxCount = 0;
    for (const [scope, count] of scopeCounts) {
      if (count > maxCount) {
        commonScope = scope;
        maxCount = count;
      }
    }
    if (commonScope) {
      projectName = sanitizeForHostname(commonScope) || inferProjectName(wsRoot).name;
    } else {
      projectName = inferProjectName(wsRoot).name;
    }
  }
  const apps = [];
  const worktree = detectWorktreePrefix(wsRoot);
  for (const pkg of packages) {
    const rel = path9.relative(wsRoot, pkg.dir).replace(/\\/g, "/");
    const rootOverride = loaded ? resolveAppConfig(loaded.config, loaded.configDir, pkg.dir) : null;
    let pkgConfig;
    try {
      pkgConfig = loadPackagePortlessConfig(pkg.dir);
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        console.error(colors_default.red(`Error: ${err.message}`));
        process.exit(1);
      }
      throw err;
    }
    const appOverride = {
      ...Object.fromEntries(Object.entries(rootOverride ?? {}).filter(([, v]) => v !== void 0)),
      ...Object.fromEntries(Object.entries(pkgConfig ?? {}).filter(([, v]) => v !== void 0))
    };
    const effectiveScript = appOverride.script ?? scriptName;
    const scriptValue = pkg.scripts[effectiveScript];
    if (!scriptValue) continue;
    const rawScript = splitCommand(scriptValue);
    if (rawScript.length === 0) continue;
    const pm = detectPackageManager(pkg.dir);
    const commandArgs = [pm, "run", effectiveScript];
    const proxied = appOverride.proxy ?? isServerCommand(rawScript);
    let name;
    let label;
    if (appOverride.name) {
      name = appOverride.name.split(".").map((l) => truncateLabel(l)).join(".");
      label = appOverride.name;
    } else {
      let pkgLabel;
      if (pkg.name) {
        const sanitized = sanitizeForHostname(pkg.name);
        pkgLabel = sanitized || rel.replace(/\//g, "-");
      } else {
        pkgLabel = rel.replace(/\//g, "-");
      }
      name = pkgLabel === projectName ? projectName : `${pkgLabel}.${projectName}`;
      label = pkg.scope ? `@${pkg.scope}/${pkg.name}` : pkg.name ?? rel;
    }
    name = applyWorktreePrefix(name, worktree);
    apps.push({ pkg, name, label, commandArgs, appPort: appOverride.appPort, proxied });
  }
  if (apps.length === 0) {
    console.error(colors_default.yellow(`No workspace packages have a "${scriptName}" script.`));
    process.exit(1);
  }
  apps.sort((a, b) => a.label.localeCompare(b.label));
  const proxiedApps = apps.filter((a) => a.proxied);
  const taskApps = apps.filter((a) => !a.proxied);
  console.log(chalk.blue.bold(`
portless
`));
  let { dir, port, tls: tls2, tlds, lanMode } = await discoverState();
  if (proxiedApps.length > 0) {
    let multiDesired;
    try {
      multiDesired = resolveProxyDesiredState(false);
    } catch (err) {
      console.error(colors_default.red(`Error: ${err.message}`));
      process.exit(1);
    }
    const ensureResult = await ensureProxyRunning(port, tls2, multiDesired);
    if (ensureResult.started) {
      dir = ensureResult.state.dir;
      port = ensureResult.state.port;
      tls2 = ensureResult.state.tls;
      tlds = ensureResult.state.tlds;
      lanMode = ensureResult.state.lanMode;
    } else {
      ({ dir, port, tls: tls2, tlds, lanMode } = await discoverState());
    }
    if (tls2 && !isCATrusted(dir)) {
      await handleTrust();
    }
  }
  const useTurbo = loaded?.config.turbo !== false && hasTurboConfig(wsRoot);
  if (useTurbo) {
    await runWithTurbo(
      wsRoot,
      dir,
      port,
      tls2,
      tlds,
      lanMode,
      scriptName,
      proxiedApps,
      taskApps,
      extraArgs
    );
  } else {
    await runWithDirectSpawn(dir, port, tls2, tlds, lanMode, proxiedApps, taskApps);
  }
}
async function runWithTurbo(wsRoot, stateDir, proxyPort, tls2, tlds, lanMode, scriptName, proxiedApps, taskApps, extraArgs = []) {
  const store = new RouteStore(stateDir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  const manifest = {};
  const routes = [];
  const appUrls = [];
  for (const app of proxiedApps) {
    const usesPortless = app.commandArgs[0] === "portless";
    if (usesPortless) {
      appUrls.push({ label: app.label, url: "(managed by portless)" });
      continue;
    }
    const appPort = app.appPort ?? await findFreePort();
    const hostnames = buildHostnames(app.name, tlds);
    const urls = formatUrls(hostnames, proxyPort, tls2);
    const url = urls[0];
    appUrls.push({ label: app.label, url });
    addRoutes(store, hostnames, appPort, process.pid);
    await reportHostsSyncHere(hostnames, proxyPort, tls2, lanMode);
    routes.push({ hostnames });
    const entry = {
      PORT: String(appPort),
      HOST: "127.0.0.1",
      PORTLESS_URL: url,
      __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: formatViteAllowedHosts(tlds)
    };
    if (tls2) {
      const caPath = path9.join(stateDir, "ca.pem");
      if (fs10.existsSync(caPath)) {
        entry.NODE_EXTRA_CA_CERTS = caPath;
      }
    }
    manifest[app.pkg.dir] = entry;
  }
  ensureEnvLoader();
  writeManifest(manifest);
  if (appUrls.length > 0) {
    const maxLabel = Math.max(...appUrls.map((a) => a.label.length));
    for (const { label, url } of appUrls) {
      const pad = " ".repeat(maxLabel - label.length);
      console.log(`  ${label}${pad}  ${chalk.dim(url)}`);
    }
  }
  console.log("");
  const pm = detectPackageManager(wsRoot);
  const useRootScript = hasScript(scriptName, wsRoot);
  const turboArgs = useRootScript ? [pm, "run", scriptName, ...extraArgs] : pm === "npm" ? ["npx", "turbo", "run", scriptName, ...extraArgs] : pm === "bun" ? ["bunx", "turbo", "run", scriptName, ...extraArgs] : [pm, "exec", "turbo", "run", scriptName, ...extraArgs];
  const turboChild = spawn4(turboArgs[0], turboArgs.slice(1), {
    stdio: "inherit",
    cwd: wsRoot,
    env: {
      ...process.env,
      NODE_OPTIONS: buildNodeOptions()
    },
    ...isWindows ? {} : { detached: true }
  });
  const SIGKILL_TIMEOUT_MS = 5e3;
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    killTree(turboChild, "SIGTERM");
    setTimeout(() => {
      if (turboChild.exitCode === null && !turboChild.killed) {
        killTree(turboChild, "SIGKILL");
      }
    }, SIGKILL_TIMEOUT_MS).unref();
    for (const { hostnames } of routes) {
      removeRoutes(store, hostnames, process.pid);
    }
    removeManifest();
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  const exitCode = await new Promise((resolve4) => {
    turboChild.on("exit", (code) => resolve4(code));
  });
  cleanup();
  if (exitCode !== 0 && exitCode !== null) {
    process.exit(exitCode);
  }
}
async function runWithDirectSpawn(stateDir, proxyPort, tls2, tlds, lanMode, proxiedApps, taskApps) {
  const children = [];
  const exitCodes = /* @__PURE__ */ new Map();
  const appUrls = [];
  const routeEntries = [];
  for (const app of proxiedApps) {
    const { child, displayUrl, route } = await spawnProxiedApp(
      app,
      stateDir,
      proxyPort,
      tls2,
      tlds,
      lanMode,
      exitCodes
    );
    children.push(child);
    if (route) routeEntries.push(route);
    appUrls.push({ label: app.label, url: displayUrl });
  }
  const taskLabels = [];
  for (const app of taskApps) {
    children.push(spawnTaskApp(app, exitCodes));
    taskLabels.push(app.label);
  }
  if (appUrls.length > 0) {
    const maxLabel = Math.max(...appUrls.map((a) => a.label.length));
    for (const { label, url } of appUrls) {
      const pad = " ".repeat(maxLabel - label.length);
      console.log(`  ${label}${pad}  ${chalk.dim(url)}`);
    }
  }
  console.log("");
  const SIGKILL_TIMEOUT_MS = 5e3;
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    for (const child of children) {
      killTree(child, "SIGTERM");
    }
    setTimeout(() => {
      for (const child of children) {
        if (child.exitCode === null && !child.killed) {
          killTree(child, "SIGKILL");
        }
      }
    }, SIGKILL_TIMEOUT_MS).unref();
    for (const { store, hostnames } of routeEntries) {
      removeRoutes(store, hostnames, process.pid);
    }
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  await Promise.all(
    children.map(
      (child) => new Promise((resolve4) => {
        child.on("exit", () => resolve4());
      })
    )
  );
  const failed = [...exitCodes.entries()].filter(([, code]) => code !== 0 && code !== null);
  if (failed.length > 0) {
    console.error(
      colors_default.red(
        `
${failed.length} app${failed.length === 1 ? "" : "s"} exited with errors: ${failed.map(([name, code]) => `${name} (${code})`).join(", ")}`
      )
    );
    process.exit(1);
  }
}
async function handleRunMode(args, globalScript) {
  const parsed = parseRunArgs(args);
  const appConfig = loadAppConfig();
  if (parsed.commandArgs.length === 0) {
    const scriptName = globalScript ?? appConfig?.script ?? "dev";
    const resolved = resolveScriptCommand(scriptName, process.cwd());
    if (resolved) {
      parsed.commandArgs = resolved;
    }
  }
  if (parsed.commandArgs.length === 0) {
    console.error(colors_default.red("Error: No command provided."));
    console.error(colors_default.blue("Usage:"));
    console.error(colors_default.cyan("  portless run <command...>"));
    console.error(colors_default.blue("Example:"));
    console.error(colors_default.cyan("  portless run next dev"));
    process.exit(1);
  }
  let baseName;
  let nameSource;
  if (parsed.name) {
    baseName = parsed.name.split(".").map((label) => truncateLabel(label)).join(".");
    nameSource = "--name flag";
  } else if (appConfig?.name) {
    baseName = appConfig.name.split(".").map((label) => truncateLabel(label)).join(".");
    nameSource = "portless.json";
  } else {
    const inferred = inferProjectName();
    baseName = inferred.name;
    nameSource = inferred.source;
  }
  if (!parsed.appPort && appConfig?.appPort) {
    parsed.appPort = appConfig.appPort;
  }
  const worktree = detectWorktreePrefix();
  const effectiveName = worktree ? `${worktree.prefix}.${baseName}` : baseName;
  const { dir, port, tls: tls2, tlds, lanMode, lanIp } = await discoverState();
  const store = new RouteStore(dir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  await runApp(
    store,
    port,
    dir,
    effectiveName,
    parsed.commandArgs,
    tls2,
    tlds,
    parsed.force,
    { nameSource, prefix: worktree?.prefix, prefixSource: worktree?.source },
    parsed.appPort,
    lanMode,
    lanIp
  );
}
async function handleNamedMode(args) {
  const parsed = parseAppArgs(args);
  if (parsed.commandArgs.length === 0) {
    console.error(colors_default.red("Error: No command provided."));
    console.error(colors_default.blue("Usage:"));
    console.error(colors_default.cyan("  portless <name> <command...>"));
    console.error(colors_default.blue("Example:"));
    console.error(colors_default.cyan("  portless myapp next dev"));
    process.exit(1);
  }
  if (!parsed.appPort) {
    const appConfig = loadAppConfig();
    if (appConfig?.appPort) {
      parsed.appPort = appConfig.appPort;
    }
  }
  const safeName = parsed.name.split(".").map((label) => truncateLabel(label)).join(".");
  parseHostname(safeName, DEFAULT_TLD);
  const { dir, port, tls: tls2, tlds, lanMode, lanIp } = await discoverState();
  const store = new RouteStore(dir, {
    onWarning: (msg) => console.warn(colors_default.yellow(msg))
  });
  await runApp(
    store,
    port,
    dir,
    safeName,
    parsed.commandArgs,
    tls2,
    tlds,
    parsed.force,
    void 0,
    parsed.appPort,
    lanMode,
    lanIp
  );
}
async function main() {
  if (process.stdin.isTTY) {
    process.on("exit", () => {
      try {
        process.stdin.setRawMode(false);
      } catch {
      }
    });
  }
  const args = process.argv.slice(2);
  const isNpx = process.env.npm_command === "exec" && !process.env.npm_lifecycle_event;
  const isPnpmDlx = !!process.env.PNPM_SCRIPT_SRC_DIR && !process.env.npm_lifecycle_event;
  if ((isNpx || isPnpmDlx) && !isLocallyInstalled()) {
    console.error(colors_default.red("Error: portless should not be run via npx or pnpm dlx."));
    console.error(colors_default.blue("Install globally or as a project dependency:"));
    console.error(colors_default.cyan("  npm install -g portless"));
    console.error(colors_default.cyan("  npm install -D portless"));
    process.exit(1);
  }
  const globalBooleanFlags = /* @__PURE__ */ new Set(["--lan", "--tailscale", "--funnel", "--ngrok"]);
  const globalValueFlags = /* @__PURE__ */ new Set(["--ip", INTERNAL_LAN_IP_FLAG, "--script"]);
  const childlessCommands = /* @__PURE__ */ new Set([
    "--help",
    "-h",
    "--version",
    "-v",
    "trust",
    "clean",
    "prune",
    "list",
    "doctor",
    "get",
    "alias",
    "hosts",
    "proxy",
    "service"
  ]);
  const advancePortlessFlag = (index, localValueFlags) => {
    const arg = args[index];
    if (globalBooleanFlags.has(arg) || arg === "--force" || arg === "--help" || arg === "-h") {
      return index + 1;
    }
    if (globalValueFlags.has(arg) || localValueFlags.has(arg)) {
      return index + 2;
    }
    return null;
  };
  const globalFlagEnd = () => {
    const separator = args.indexOf("--");
    const limit = separator === -1 ? args.length : separator;
    const leadingValueFlags = /* @__PURE__ */ new Set(["--app-port"]);
    let index = 0;
    while (index < limit) {
      const next = advancePortlessFlag(index, leadingValueFlags);
      if (next === null) break;
      index = next;
    }
    if (index >= limit) return limit;
    const mode = args[index];
    if (childlessCommands.has(mode)) return limit;
    if (mode === "run") {
      index++;
      const runValueFlags = /* @__PURE__ */ new Set(["--name", "--app-port"]);
      while (index < limit) {
        const next = advancePortlessFlag(index, runValueFlags);
        if (next === null) break;
        index = next;
      }
      return index;
    }
    if (mode === "--name") {
      index += 2;
    } else {
      index++;
    }
    const namedValueFlags = /* @__PURE__ */ new Set(["--app-port"]);
    while (index < limit) {
      const next = advancePortlessFlag(index, namedValueFlags);
      if (next === null) break;
      index = next;
    }
    return index;
  };
  const stripGlobalFlag = (flag, hasValue) => {
    const end = globalFlagEnd();
    const idx = args.indexOf(flag);
    if (idx === -1 || idx >= end) return null;
    if (!hasValue) {
      args.splice(idx, 1);
      return true;
    }
    const value = args[idx + 1];
    if (!value || value.startsWith("-")) return false;
    args.splice(idx, 2);
    return value;
  };
  if (stripGlobalFlag("--lan", false)) {
    process.env.PORTLESS_LAN = "1";
  }
  const ipResult = stripGlobalFlag("--ip", true);
  if (ipResult === false) {
    console.error(chalk.red("Error: --ip requires an IP address."));
    console.error(chalk.cyan("  portless --lan --ip 192.168.1.42 run <command>"));
    process.exit(1);
  } else if (typeof ipResult === "string") {
    process.env.PORTLESS_LAN_IP = ipResult;
    process.env.PORTLESS_LAN = "1";
  }
  const autoIpResult = stripGlobalFlag(INTERNAL_LAN_IP_FLAG, true);
  if (autoIpResult === false) {
    console.error(chalk.red(`Error: ${INTERNAL_LAN_IP_FLAG} requires an IP address.`));
    process.exit(1);
  } else if (typeof autoIpResult === "string") {
    process.env[INTERNAL_LAN_IP_ENV] = autoIpResult;
    process.env.PORTLESS_LAN = "1";
  }
  if (stripGlobalFlag("--tailscale", false)) {
    process.env.PORTLESS_TAILSCALE = "1";
  }
  if (stripGlobalFlag("--funnel", false)) {
    process.env.PORTLESS_FUNNEL = "1";
    process.env.PORTLESS_TAILSCALE = "1";
  }
  if (stripGlobalFlag("--ngrok", false)) {
    process.env.PORTLESS_NGROK = "1";
  }
  const scriptResult = stripGlobalFlag("--script", true);
  if (scriptResult === false) {
    console.error(colors_default.red("Error: --script requires a script name."));
    console.error(colors_default.cyan("  portless --script start"));
    process.exit(1);
  }
  const globalScript = typeof scriptResult === "string" ? scriptResult : void 0;
  if (args[0] === "--name") {
    args.shift();
    if (!args[0]) {
      console.error(colors_default.red("Error: --name requires an app name."));
      console.error(colors_default.cyan("  portless --name <name> <command...>"));
      process.exit(1);
    }
    const skipPortless2 = process.env.PORTLESS === "0" || process.env.PORTLESS === "false" || process.env.PORTLESS === "skip";
    if (skipPortless2) {
      const { commandArgs } = parseAppArgs(args);
      if (commandArgs.length === 0) {
        console.error(colors_default.red("Error: No command provided."));
        process.exit(1);
      }
      spawnCommand(commandArgs);
      return;
    }
    await handleNamedMode(args);
    return;
  }
  const isRunCommand = args[0] === "run";
  if (isRunCommand) {
    args.shift();
  }
  const skipPortless = process.env.PORTLESS === "0" || process.env.PORTLESS === "false" || process.env.PORTLESS === "skip";
  if (skipPortless && (isRunCommand || args.length === 0 || args.length >= 2 && args[0] !== "proxy" && args[0] !== "clean" && args[0] !== "doctor" && args[0] !== "service")) {
    const parsed = isRunCommand ? parseRunArgs(args) : parseAppArgs(args);
    let commandArgs = parsed.commandArgs;
    if (commandArgs.length === 0 && (isRunCommand || args.length === 0)) {
      const appConfig = loadAppConfig();
      const scriptName = globalScript ?? appConfig?.script ?? "dev";
      const resolved = resolveScriptCommand(scriptName, process.cwd());
      if (resolved) commandArgs = resolved;
    }
    if (commandArgs.length === 0) {
      console.error(colors_default.red("Error: No command provided."));
      process.exit(1);
    }
    spawnCommand(commandArgs);
    return;
  }
  if (!isRunCommand) {
    if (args[0] === "--help" || args[0] === "-h") {
      printHelp();
      return;
    }
    if (args.length === 0 || args[0] === "--") {
      const extraArgs = args[0] === "--" ? args.slice(1) : [];
      const handled = await handleDefaultMode(globalScript, extraArgs);
      if (handled) return;
      printHelp();
      return;
    }
    if (args[0] === "--version" || args[0] === "-v") {
      printVersion();
      return;
    }
    if (args[0] === "trust") {
      await handleTrust();
      return;
    }
    if (args[0] === "clean") {
      await handleClean(args);
      return;
    }
    if (args[0] === "prune") {
      await handlePrune(args);
      return;
    }
    if (args[0] === "list") {
      await handleList();
      return;
    }
    if (args[0] === "doctor") {
      await handleDoctor(args);
      return;
    }
    if (args[0] === "get") {
      await handleGet(args);
      return;
    }
    if (args[0] === "alias") {
      await handleAlias(args);
      return;
    }
    if (args[0] === "hosts") {
      await handleHosts(args);
      return;
    }
    if (args[0] === "proxy") {
      await handleProxy(args);
      return;
    }
    if (args[0] === "service") {
      await handleService(args, { entryScript: getEntryScript() });
      return;
    }
  }
  if (isRunCommand) {
    await handleRunMode(args, globalScript);
  } else {
    await handleNamedMode(args);
  }
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(colors_default.red("Error:"), message);
  process.exit(1);
});
