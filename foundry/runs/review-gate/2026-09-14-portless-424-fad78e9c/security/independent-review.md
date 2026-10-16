# Independent security and correctness review

Repository: vercel-labs/portless, PR #424. Author: ctate. Author model: unknown.

Head: `fad78e9c5e3f1958558eca616d747313e4d4ba60`

Merge base: `1ad573bb95810daf6cd50c1718707015450f3f09`

Supplied current main: `c7f38a6f33de1322ca628470be594d907da5aa71`

Frozen checkout: `/tmp/portless-review-424-fad78e9c`. Worktree clean before and after probes. Exact identity digests and skill revision are in `security-receipt.json`.

## Result

No new, actionable security or correctness regression found in the reviewed diff. The security receipt is `pass` for the bounded read-failure integrity claim, not an overall promotion verdict. Review Gate owns promotion.

This is a separate reasoning pass in the assigned native fallback context after the user-reported FX wrapper auth-field schema mismatch. No nested reviewer was launched. Same-family independence limitation applies; cross-family independence is not claimed. The author's model is unknown and was not inferred from commit trailers. Other reviewers' results were not consulted.

The parent `manifest.json` was not available through the final pre-emission check. Digests were calculated independently and must be reconciled by the coordinating reviewer. No manifest was written.

## Scope and evidence

Fully read the explicitly selected security-review skill, classification rules, receipt contract, supplied Portless conventions, target AGENTS.md, and all seven files' changes. Traced unchanged callers instead of treating added tests as proof:

- `hosts.ts:18-23,104-121`: read failures now return null, initial failure exits before mutation, verification requires a readable managed block. A readable empty file remains distinct from failure.
- `hosts.ts:128-151`: cleanup rejects initial failure; best-effort inspection still returns an empty list. The helper's externally visible value remains boolean/string-array as appropriate.
- `cli.ts:2478-2515`: one reconciliation call handles both empty and populated route sets. Empty routes no longer bypass the strict read through `getManagedHostnames`. Failure uses the existing root/Windows error and non-root Unix elevation branches.
- `cli.ts:2430-2457`: cleanup now reaches the existing error/elevation path on read failure. No actual elevation was performed in this review.
- `cli.ts:635-704,868`: daemon startup, watcher and explicit-sync callback use the same guarded helper; shutdown's cleanup return was already ignored.
- `cli.ts:2171-2186`: global clean now exposes initial-read failure through its existing privilege/warning path. Root cleanup can still warn and finish, as it already could on a write failure. This does not establish attacker-induced availability impact.
- `cli-utils.ts:1020-1083` and `cli.ts:2870-2891`: resolution warning and doctor remain best-effort consumers. No changed return shape breaks these callers.
- `cli-utils.ts:712-795`: discovery is unchanged; the probe stubs it rather than touching real state or making loopback requests.
- `routes.ts:174-208` and `cli.ts:649-658`: route data comes from the existing local store; the HTTP request does not provide arbitrary hostname data to the callback.
- `proxy.ts:88-125,268-274`: unchanged loopback peer/authority, browser-header rejection and single-token checks precede the callback. `hosts-sync-auth.ts:29-38` keeps the existing mode-0600 token write. Only source was read; no token file was accessed.
- `cli.ts:417-425,2442-2449,2501-2508`: unchanged argv-based privileged command and PORTLESS_* forwarding. New read-error reachability is not a sudo authorization bypass. No new command interpolation or remotely supplied argv was introduced.

README, the agent skill, both relevant CLI help passages and command docs were updated together. Their new manual-sync wording describes a successful initial read and post-write managed-block verification, not transactional durability. Cleanup's preexisting lack of post-write verification should not be confused with a new manual-sync regression.

The full diff is 7 paths, 399 insertions, 34 deletions. `routes.ts`, `cli-utils.ts`, `proxy.ts`, and `hosts-sync-auth.ts` are unchanged against the actual merge base. Comparing the reviewed subsystem with supplied current main found only unrelated Turbo help text in cli.ts, not a competing hosts/security change.

## Inherited observations

These are not new PR findings and are not security blockers. They remain useful limits on the integrity claim:

1. Orphan/malformed managed blocks are not repaired by an empty sync. `hosts.ts:31-39` treats a missing end marker as an absent block, and `77-91,107` accepts that as matching an empty set. An orphan start marker and stale entry remain unchanged at both base and head. The old CLI also returned early on this shape. Follow-up: distinguish malformed from absent if recovery is desired.
2. Post-write verification is not complete-file integrity verification. `hosts.ts:111-121` uses a non-transactional whole-file write and checks only managed hostnames. In the bounded truncation fixture, empty-sync verification accepts an empty file, even though unrelated entries disappeared. This happens at both base and head. `cleanHostsFile` also still returns immediately after its write at `133-134`. No claim that a lower-trust attacker can cause real protected-file truncation was established. Follow-up: transactional writes/whole-content preservation need their own scoped design and verification.
3. Route-read failure is still conflated with empty desired routes. `routes.ts:174-208` returns an empty array for several read/parse failures; `cli.ts:2483-2485` consumes it. The unchanged real RouteStore plus manual handler removed a valid stale managed block after a synthetic route-read error at both base and head. Existing base cli.ts:2475-2492 already attempted that removal. Follow-up: route-read provenance, not a regression from this hosts-read fix.

Unvalidated route strings, file races and state-directory trust are inherited surfaces, not grounds to invent a new attacker capability here. A route writer already has the same daemon-consumed route channel at the base. No broad unrelated audit or exploit attempt was performed.

## Verification

Commands ran from `/tmp/portless-review-424-fad78e9c` unless noted.

- `git rev-parse HEAD; git status --porcelain=v1`: exit 0, requested head, clean worktree.
- `git merge-base 1ad573bb95810daf6cd50c1718707015450f3f09 fad78e9c5e3f1958558eca616d747313e4d4ba60`: exit 0, supplied base. This confirms base ancestry; no claim of recomputing a remote branch's merge base.
- `git diff --no-ext-diff --no-textconv 1ad573bb95810daf6cd50c1718707015450f3f09 fad78e9c5e3f1958558eca616d747313e4d4ba60`: exit 0, entire diff read, including paginated retained output.
- `git diff --check 1ad573bb95810daf6cd50c1718707015450f3f09 fad78e9c5e3f1958558eca616d747313e4d4ba60`: PASS, exit 0, no output.
- `node --version`: exit 0, `v24.18.0`.
- Source probe below: PASS, exit 0, 40 checks. It runs exact head/base hosts code, RouteStore, and extracted real manual handler bodies with in-memory seams. No source copy is written. Windows is a simulated branch, not a Windows machine.

Preserved successful output handle: `fx-command-replay-f911fa4e577957f478c78116bc040c99-df41fe8f351b22d3.bin`.

Meaningful output:

```text
PASS darwin initial-read refusal 0
PASS darwin verification-read refusal 0
PASS darwin exact reconciliation preserves unrelated entries 0
PASS darwin initial-read refusal 1
PASS darwin verification-read refusal 1
PASS darwin exact reconciliation preserves unrelated entries 1
PASS darwin cleanup-read refusal and inspection compatibility
PASS darwin readable empty no-op
PASS darwin matching populated no-op
PASS darwin write error
PASS darwin write discard
PASS darwin CLI sync read failure uid=0
PASS darwin CLI sync read failure uid=1000
PASS darwin CLI clean read failure uid=0
PASS darwin CLI clean read failure uid=1000
PASS win32 initial-read refusal 0
PASS win32 verification-read refusal 0
PASS win32 exact reconciliation preserves unrelated entries 0
PASS win32 initial-read refusal 1
PASS win32 verification-read refusal 1
PASS win32 exact reconciliation preserves unrelated entries 1
PASS win32 cleanup-read refusal and inspection compatibility
PASS win32 readable empty no-op
PASS win32 matching populated no-op
PASS win32 write error
PASS win32 write discard
PASS win32 CLI sync read failure uid=0
PASS win32 CLI sync read failure uid=1000
PASS win32 CLI clean read failure uid=0
PASS win32 CLI clean read failure uid=1000
PASS 1ad573bb differential read-failure populated
PASS 1ad573bb differential verification-read empty
PASS 1ad573bb preexisting orphan-marker no-op
PASS 1ad573bb preexisting empty-sync verification accepts truncation
PASS 1ad573bb preexisting route-read failure clears managed entries
PASS fad78e9c differential read-failure populated
PASS fad78e9c differential verification-read empty
PASS fad78e9c preexisting orphan-marker no-op
PASS fad78e9c preexisting empty-sync verification accepts truncation
PASS fad78e9c preexisting route-read failure clears managed entries
RESULT 40 checks passed; only in-memory hosts, routes, UID and spawn stubs used; no target writes, real hosts access, DNS or privilege execution.
```

Node also emitted its `stripTypeScriptTypes` experimental-feature warning. There was no application failure in the corrected run.

The first probe attempt exited 1 after 12 passing checks because `assert.deepEqual` compared a VM array's different prototype to a host array. Actual and expected were both `['hosts', 'sync']`. That was a harness error, not a product finding. The only correction was changing `h.snapshot().spawns[0].args.slice(-2)` to `Array.from(h.snapshot().spawns[0].args.slice(-2))` in the assertion. The full matrix was then rerun. Failed output handle: `fx-command-replay-a05e62311a215032bbac6c7b4a2e2f62-7d715ccdc193e0d4.bin`.

Exact successful command, including stdin:

```sh
node --input-type=module <<'NODE'
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
const base = '1ad573bb95810daf6cd50c1718707015450f3f09';
const head = 'fad78e9c5e3f1958558eca616d747313e4d4ba60';
const source = (sha, file) => execFileSync('git', ['show', `${sha}:packages/portless/src/${file}.ts`], {encoding:'utf8'});
const sources = new Map([base,head].map(sha => [sha, Object.fromEntries(['hosts','cli','routes'].map(f => [f,source(sha,f)]))]));
const js = s => stripTypeScriptTypes(s).replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
const original = '127.0.0.1 localhost\n\n# portless-start\n127.0.0.1 stale.test\n# portless-end\n\n192.0.2.10 custom.test\n';
function setup(sha, options={}) {
  const {platform='darwin',uid=0,content=original,readMode='ok',writeMode='ok',routeMode='ok',routes=[],sudoStatus=1}=options;
  let memory=content, reads=0, writes=[], spawns=[], logs=[], errors=[];
  const p=platform==='win32'?path.win32:path.posix;
  const hostsPath=platform==='win32'?p.join('C:\\Windows','System32','drivers','etc','hosts'):'/etc/hosts';
  const routePath=p.join('/fixture','routes.json');
  const fs={
    existsSync(file) { assert.equal(file,routePath); return true; },
    readFileSync(file) {
      if(file===routePath) {if(routeMode==='error') throw Error('route read failed'); return JSON.stringify(routes);}
      assert.equal(file,hostsPath); reads++;
      if(readMode==='initial-error'||(readMode==='verification-error'&&reads>1)) throw Error('EACCES');
      return memory;
    },
    writeFileSync(file,data) {
      assert.equal(file,hostsPath); writes.push(String(data));
      if(writeMode==='error') throw Error('EACCES');
      if(writeMode==='discard') return;
      memory=writeMode==='truncate'?'':String(data);
    }
  };
  const context=vm.createContext({fs,path:p,dns:{lookup(){throw Error('DNS prohibited');}},
    process:{platform,env:{},execPath:'/fixture/node',getuid:()=>uid,kill(){},exit(code){throw Object.assign(Error('exit'),{exitCode:code});}},
    console:{log:(s)=>logs.push(s),warn:(s)=>logs.push(s),error:(s)=>errors.push(s)},
    colors:new Proxy({}, {get:()=>s=>s}),HOSTS_DISPLAY:hostsPath,SUDO_SPAWN_TIMEOUT_MS:1000,
    discoverState:async()=>({dir:'/fixture'}),collectPortlessEnvArgs:()=>[],getEntryScript:()=>'/fixture/cli.js',
    spawnSync:(command,args)=>{spawns.push({command,args});return {status:sudoStatus};},
    fixOwnership(){throw Error('ownership change prohibited');},isErrnoException:()=>false
  });
  const s=sources.get(sha);
  vm.runInContext(js(s.hosts)+'\n'+js(s.routes)+'\n'+js(s.cli.slice(s.cli.indexOf('async function handleHosts('),s.cli.indexOf('type DoctorStatus'))),context);
  return {context,snapshot:()=>({memory,reads,writes,spawns,logs,errors})};
}
let checks=0;
function check(name, fn){fn();checks++;console.log(`PASS ${name}`);}
for(const platform of ['darwin','win32']) {
  for(const names of [[],['app.test']]) {
    check(`${platform} initial-read refusal ${names.length}`,()=>{const h=setup(head,{platform,readMode:'initial-error'});assert.equal(h.context.syncHostsFile(names),false);assert.equal(h.snapshot().reads,1);assert.equal(h.snapshot().writes.length,0);});
    check(`${platform} verification-read refusal ${names.length}`,()=>{const h=setup(head,{platform,readMode:'verification-error'});assert.equal(h.context.syncHostsFile(names),false);assert.equal(h.snapshot().writes.length,1);});
    check(`${platform} exact reconciliation preserves unrelated entries ${names.length}`,()=>{const h=setup(head,{platform});assert.equal(h.context.syncHostsFile(names),true);assert.equal(h.snapshot().writes.length,1);assert.ok(h.snapshot().memory.includes('127.0.0.1 localhost'));assert.ok(h.snapshot().memory.includes('192.0.2.10 custom.test'));assert.ok(!h.snapshot().memory.includes('stale.test'));});
  }
  check(`${platform} cleanup-read refusal and inspection compatibility`,()=>{const h=setup(head,{platform,readMode:'initial-error'});assert.equal(h.context.cleanHostsFile(),false);assert.equal(h.context.getManagedHostnames().length,0);assert.equal(h.snapshot().writes.length,0);});
  check(`${platform} readable empty no-op`,()=>{const h=setup(head,{platform,content:''});assert.equal(h.context.syncHostsFile([]),true);assert.equal(h.snapshot().writes.length,0);});
  check(`${platform} matching populated no-op`,()=>{const h=setup(head,{platform});assert.equal(h.context.syncHostsFile(['stale.test']),true);assert.equal(h.snapshot().writes.length,0);});
  for(const writeMode of ['error','discard']) check(`${platform} write ${writeMode}`,()=>{const h=setup(head,{platform,writeMode});assert.equal(h.context.syncHostsFile(['app.test']),false);assert.equal(h.snapshot().writes.length,1);});
  for(const command of ['sync','clean']) for(const uid of [0,1000]) {
    const h=setup(head,{platform,uid,readMode:'initial-error',sudoStatus:0});
    let status=0;
    try{await h.context.handleHosts(['hosts',command]);}catch(e){if(e.exitCode===undefined)throw e;status=e.exitCode;}
    check(`${platform} CLI ${command} read failure uid=${uid}`,()=>{const elevated=platform==='darwin'&&uid===1000;assert.equal(status,elevated?0:1);assert.equal(h.snapshot().writes.length,0);assert.equal(h.snapshot().spawns.length,elevated?1:0);if(elevated)assert.deepEqual(Array.from(h.snapshot().spawns[0].args.slice(-2)),['hosts',command]);});
  }
}
for(const sha of [base,head]) {
  check(`${sha.slice(0,8)} differential read-failure populated`,()=>{const h=setup(sha,{readMode:'initial-error'});assert.equal(h.context.syncHostsFile(['app.test']),false);assert.equal(h.snapshot().writes.length,sha===head?0:1);});
  check(`${sha.slice(0,8)} differential verification-read empty`,()=>{const h=setup(sha,{readMode:'verification-error'});assert.equal(h.context.syncHostsFile([]),sha===base);});
  check(`${sha.slice(0,8)} preexisting orphan-marker no-op`,()=>{const content='127.0.0.1 localhost\n# portless-start\n127.0.0.1 stale.test\n';const h=setup(sha,{content});assert.equal(h.context.syncHostsFile([]),true);assert.equal(h.snapshot().memory,content);});
  check(`${sha.slice(0,8)} preexisting empty-sync verification accepts truncation`,()=>{const h=setup(sha,{writeMode:'truncate'});assert.equal(h.context.syncHostsFile([]),true);assert.equal(h.snapshot().memory,'');});
  const h=setup(sha,{routeMode:'error'});await h.context.handleHosts(['hosts','sync']);
  check(`${sha.slice(0,8)} preexisting route-read failure clears managed entries`,()=>{assert.equal(h.snapshot().writes.length,1);assert.ok(!h.snapshot().memory.includes('stale.test'));});
}
console.log(`RESULT ${checks} checks passed; only in-memory hosts, routes, UID and spawn stubs used; no target writes, real hosts access, DNS or privilege execution.`);
NODE
```

## Explicit gaps and safety record

No actual hosts file was read or written, including through DNS. No sudo command, live token/secret read, target mutation, GitHub access/mutation, real state discovery, or listener was used. The only subprocesses used by the probe were read-only `git show` calls for exact source. VM spawn merely records arguments. No probe files or processes needed cleanup. Only the two requested artifacts were created under security/.

No real OS permission, elevated-child, Windows filesystem, concurrency/crash, full built-CLI, Vitest-suite, or build result is claimed. Existing added tests were reviewed statically; this probe is complementary and does not replace process-boundary or OS-boundary verification. The simulated writer can represent a truncation outcome but does not establish an attacker capable of producing it on the real machine.

The absent parent manifest is a provenance-pairing gap, not evidence that the code failed its security claim. Same-family independence and unknown author model remain explicit limitations for Review Gate.
