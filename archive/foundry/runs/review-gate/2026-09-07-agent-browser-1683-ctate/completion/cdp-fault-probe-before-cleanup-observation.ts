import { mkdtempSync, readFileSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const bin = process.env.AB_GATE_BIN ?? "/Users/raillyhugo/Programming/vercel/agent-browser-1683/cli/target/debug/agent-browser";
const mode = process.argv[2] ?? "late";
const prior = process.argv[3] === "persisted";
const output = process.argv[4] ?? join(import.meta.dir, `fault-${mode}-${prior ? "persisted" : "new"}.json`);
const dir = mkdtempSync(join(tmpdir(), "ab1683-fault-"));
const trace: any[] = [];
const failures: string[] = [];
const names = ["gate-host", "gate-agent"];
let armed = false;
let injected = false;
let dropped = false;
let killed = false;
let contextId: string | undefined;
let popupSession: string | undefined;
let hostControl: CDP | undefined;
let proxy: ReturnType<typeof Bun.serve> | undefined;
const record = (event: any) => trace.push({ time: Date.now(), ...event });
const assert = (condition: any, message: string) => { if (!condition) throw new Error(message); };
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function until(predicate: () => boolean, label: string, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Timeout: ${label}`);
    await sleep(10);
  }
}

class CDP {
  ws: WebSocket;
  next = 1;
  pending = new Map<number, { resolve: Function; reject: Function }>();
  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = e => {
      const value = JSON.parse(String(e.data));
      const waiter = this.pending.get(value.id);
      if (!waiter) return;
      this.pending.delete(value.id);
      value.error ? waiter.reject(new Error(JSON.stringify(value.error))) : waiter.resolve(value.result);
    };
    this.ws.onclose = () => {
      for (const waiter of this.pending.values()) waiter.reject(new Error("control CDP closed"));
      this.pending.clear();
    };
  }
  async call(method: string, params?: any): Promise<any> {
    await until(() => this.ws.readyState === WebSocket.OPEN, "control CDP open");
    const id = this.next++;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params }));
    return Promise.race([result, sleep(15000).then(() => { throw new Error(`CDP timeout: ${method}`); })]);
  }
}

async function cli(session: string, args: string[], mustSucceed = true) {
  const env = { ...process.env, AGENT_BROWSER_SOCKET_DIR: dir, NO_COLOR: "1" };
  for (const key of ["AGENT_BROWSER_CDP", "AGENT_BROWSER_AUTO_CONNECT", "AGENT_BROWSER_ISOLATE_CONTEXT", "AGENT_BROWSER_PIN_TAB", "AGENT_BROWSER_NAMESPACE", "XDG_RUNTIME_DIR"]) delete env[key];
  const proc = Bun.spawn([bin, "--session", session, ...args, "--json"], {
    cwd: "/Users/raillyhugo/kai", env, stdout: "pipe", stderr: "pipe",
  });
  const timer = setTimeout(() => proc.kill("SIGKILL"), 45000);
  const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  clearTimeout(timer);
  let response: any;
  try { response = JSON.parse(stdout); } catch { response = { stdout }; }
  record({ kind: "cli", session, args, code, response, stderr });
  if (mustSucceed) assert(code === 0 && response.success, `CLI failed: ${args.join(" ")} ${stdout} ${stderr}`);
  return { code, response };
}

async function stopDaemon(session: string, signal: NodeJS.Signals) {
  const path = join(dir, `${session}.pid`);
  const pid = Number(readFileSync(path, "utf8").trim());
  process.kill(pid, signal);
  record({ kind: "kill-own-daemon", session, pid, signal });
  await until(() => { try { process.kill(pid, 0); return false; } catch { return true; } }, "daemon exit", 15000);
}

function binding() {
  const path = join(dir, "gate-agent.target");
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

let result: any = {};
try {
  await cli(names[0], ["open", "about:blank"]);
  const hostUrl = (await cli(names[0], ["get", "cdp-url"])).response.data.cdpUrl;
  hostControl = new CDP(hostUrl);
  const before = await hostControl.call("Target.getBrowserContexts");
  const script = join(dir, "probe.js");
  writeFileSync(script, "globalThis.__abGateProbe = true;");
  proxy = Bun.serve({
    hostname: "127.0.0.1", port: 0,
    fetch(req, server) {
      if (server.upgrade(req, { data: {} })) return;
      return new Response("Only WebSocket upgrades are supported", { status: 400 });
    },
    websocket: {
      open(front: any) {
        const back = new WebSocket(hostUrl);
        const pending = new Map<number, any>();
        const held: any[] = [];
        let holding = false;
        front.data = { back, pending };
        back.onmessage = async event => {
          try {
            const value = JSON.parse(String(event.data));
            const command = pending.get(value.id);
            if (command) pending.delete(value.id);
            if (command?.method === "Target.createBrowserContext") {
              contextId = value.result?.browserContextId;
              record({ kind: "created-context", contextId });
            }
            if (value.method === "Target.attachedToTarget") record({ kind: "real-attach-event", event: value });
            if (holding && value.method) { held.push(value); return; }
            if (armed && !injected && command?.method === "Page.addScriptToEvaluateOnNewDocument") {
              injected = true;
              if (mode === "kill") {
                killed = true;
                await stopDaemon(names[1], "SIGKILL");
                return;
              }
              if (!contextId) contextId = binding()?.browserContextId;
              assert(contextId, "isolated context must exist before fault");
              holding = true;
              const popup = await hostControl!.call("Target.createTarget", { url: "about:blank", browserContextId: contextId });
              await until(() => held.some(e => e.method === "Target.attachedToTarget" && e.params.targetInfo.targetId === popup.targetId), "real popup auto-attach");
              const attached = held.find(e => e.method === "Target.attachedToTarget" && e.params.targetInfo.targetId === popup.targetId);
              popupSession = attached.params.sessionId;
              record({ kind: "release-real-events-before-init-response", popupTarget: popup.targetId, popupSession });
              holding = false;
              for (const e of held.splice(0)) front.send(JSON.stringify(e));
            }
            front.send(JSON.stringify(value));
          } catch (error) {
            failures.push(String(error));
            front.close();
            back.close();
          }
        };
        back.onclose = () => front.close();
        back.onerror = e => failures.push(`proxy upstream: ${e}`);
      },
      async message(front: any, raw: any) {
        try {
          const value = JSON.parse(String(raw));
          record({ kind: "client-command", method: value.method, id: value.id, sessionId: value.sessionId });
          if (armed && injected && popupSession && value.sessionId === popupSession && value.method === "Runtime.enable") {
            record({ kind: "forced-real-session-command-error", method: value.method, sessionId: value.sessionId });
            front.send(JSON.stringify({ id: value.id, sessionId: value.sessionId, error: { code: -32000, message: "ab1683 forced late target setup failure" } }));
            return;
          }
          if (armed && mode === "late-drop" && injected && value.method === "Target.disposeBrowserContext") {
            dropped = true;
            record({ kind: "drop-before-dispose", contextId: value.params.browserContextId });
            front.close();
            front.data.back.close();
            return;
          }
          await until(() => front.data.back.readyState === WebSocket.OPEN, "proxy upstream open");
          front.data.pending.set(value.id, value);
          front.data.back.send(JSON.stringify(value));
        } catch (error) { failures.push(String(error)); front.close(); }
      },
      close(front: any) { front.data?.back?.close(); },
    },
  });
  const endpoint = `ws://127.0.0.1:${proxy.port}/devtools/browser/probe`;
  const launch = ["--cdp", endpoint, "--isolate-context", "--proxy", "http://gate:probe@127.0.0.1:9", "--init-script", script, "open", "about:blank"];
  let previousBinding: any = null;
  if (prior) {
    await cli(names[1], launch);
    previousBinding = binding();
    assert(previousBinding?.browserContextId, "prior isolated binding");
    contextId = previousBinding.browserContextId;
    await stopDaemon(names[1], "SIGTERM");
  }
  armed = true;
  const failed = await cli(names[1], launch, false);
  assert(failed.code !== 0, "faulted request must fail");
  assert(injected, "fault must be injected");
  if (mode !== "kill") assert(trace.some(e => e.kind === "forced-real-session-command-error"), "final-drain setup fault must execute");
  if (mode === "late-drop") assert(dropped, "cleanup CDP must be dropped");
  if (mode === "kill") assert(killed, "own daemon must be killed");
  assert(!failures.length, `proxy fixture errors: ${failures.join("; ")}`);
  const afterFailure = await hostControl.call("Target.getBrowserContexts");
  const failedBinding = binding();
  if (prior) assert(JSON.stringify(failedBinding) === JSON.stringify(previousBinding), "failure must preserve prior binding");
  else assert(failedBinding === null, "failed request must not publish binding");
  const residual = afterFailure.browserContextIds.length - before.browserContextIds.length;
  if (!prior && mode === "late") assert(residual === 0, "reachable Chrome must dispose the unpersisted context");
  if (!prior && mode !== "late") assert(residual === 1, "transport/death residual must be measured exactly");
  armed = false;
  popupSession = undefined;
  if (process.argv[5] === "flagless") {
    await cli(names[1], ["open", "about:blank"]);
    const afterFlagless = binding();
    if (prior) assert(afterFlagless?.browserContextId === previousBinding.browserContextId, "flagless request must preserve prior context");
    else assert(!afterFlagless?.browserContextId, "flagless request after failure must not acquire isolation");
    record({ kind: "flagless-after-failure", binding: afterFlagless });
  }
  const retried = await cli(names[1], launch);
  const retryBinding = binding();
  assert(retryBinding?.browserContextId, "retry must persist isolation");
  if (prior) assert(retryBinding.browserContextId === previousBinding.browserContextId, "retry must reuse prior context");
  await cli(names[1], ["get", "url"]);
  await stopDaemon(names[1], "SIGTERM");
  await cli(names[1], ["--cdp", endpoint, "open", "about:blank"]);
  assert(binding()?.browserContextId === retryBinding.browserContextId, "restart with omitted isolation must preserve context");
  result = { status: "pass", mode, prior, failed: failed.response, before, afterFailure, failedBinding, residual, retryBinding, retried: retried.response, failures };
} catch (error) {
  result = { status: "fail", mode, prior, error: String(error), failures };
} finally {
  armed = false;
  for (const name of [names[1], names[0]]) {
    try { await cli(name, ["close"], false); } catch {}
  }
  hostControl?.ws.close();
  proxy?.stop(true);
  writeFileSync(output, JSON.stringify({ ...result, bin, trace }, null, 2) + "\n");
  rmSync(dir, { recursive: true, force: true });
}
console.log(JSON.stringify({ status: result.status, mode, prior, residual: result.residual, error: result.error, output }));
process.exit(result.status === "pass" ? 0 : 1);
