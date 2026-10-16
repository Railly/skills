import { spawn } from "node:child_process";
import fs from "node:fs"; import path from "node:path"; import os from "node:os";
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const [variant] = process.argv.slice(2);
const prof = fs.mkdtempSync(path.join(os.tmpdir(), "cdpprobe-"));
const dl = path.join(process.env.PROBE_DIR, "dl", variant); fs.rmSync(dl,{recursive:true,force:true}); fs.mkdirSync(dl,{recursive:true});
const ch = spawn(CH, ["--headless=new","--remote-debugging-port=0",`--user-data-dir=${prof}`,"about:blank"], {stdio:["ignore","ignore","pipe"]});
const wsUrl = await new Promise(r => ch.stderr.on("data", d => { const m = String(d).match(/ws:\/\/\S+/); if (m) r(m[0]); }));
const ws = new WebSocket(wsUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map(); const log = [];
ws.onmessage = ({data}) => { const m = JSON.parse(data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (/download/i.test(m.method||"")) log.push({t:Date.now(), method:m.method, session:m.sessionId?"page":"browser", keys:Object.keys(m.params).join(","), state:m.params.state, filePath:m.params.filePath, suggested:m.params.suggestedFilename}); };
const send = (method, params={}, sessionId) => new Promise(r => { const i=++id; pending.set(i,r); ws.send(JSON.stringify({id:i,method,params,...(sessionId?{sessionId}:{})})); });
const {result:{targetId}} = await send("Target.createTarget",{url:"about:blank"});
const {result:{sessionId}} = await send("Target.attachToTarget",{targetId,flatten:true});
await send("Page.enable",{},sessionId);
const cfg = { none:null, allow:{behavior:"allow",downloadPath:dl}, allowEv:{behavior:"allow",downloadPath:dl,eventsEnabled:true}, nameEv:{behavior:"allowAndName",downloadPath:dl,eventsEnabled:true}, defaultEv:{behavior:"default",eventsEnabled:true}, nameEvPage:{behavior:"allowAndName",downloadPath:dl,eventsEnabled:true,__page:true} }[variant];
if (cfg) { const {__page,...p}=cfg; const r = await send("Browser.setDownloadBehavior",p,__page?sessionId:undefined); if (r.error) console.log("setDownloadBehavior error", r.error.message); }
await send("Page.navigate",{url:"http://127.0.0.1:18779/"},sessionId); await new Promise(r=>setTimeout(r,800));
await send("Runtime.evaluate",{expression:"document.getElementById('dl').click()"},sessionId);
await new Promise(r=>setTimeout(r,2500));
console.log(`== ${variant}`); for (const e of log) console.log(`  ${e.session} ${e.method} state=${e.state??"-"} filePath=${e.filePath??"-"} suggested=${e.suggested??"-"} keys=${e.keys}`);
console.log("  files:", fs.readdirSync(dl).join(" ")||"(none)");
ws.close(); ch.kill(); try{fs.rmSync(prof,{recursive:true,force:true,maxRetries:5})}catch{}
