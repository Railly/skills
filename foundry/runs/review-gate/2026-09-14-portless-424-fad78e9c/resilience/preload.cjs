const fs = require('node:fs');
const cp = require('node:child_process');
const net = require('node:net');
const { syncBuiltinESMExports } = require('node:module');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const root = process.env.AUDIT_ROOT;
const fixture = process.env.AUDIT_HOSTS;
const trace = process.env.AUDIT_TRACE;
if (!root || !fixture?.startsWith(root + '/') || !trace?.startsWith(root + '/')) throw new Error('Missing isolated audit configuration');
const read = fs.readFileSync.bind(fs);
const write = fs.writeFileSync.bind(fs);
const append = fs.appendFileSync.bind(fs);
const emit = (event) => append(trace, JSON.stringify({ time: new Date().toISOString(), ...event }) + '\n');
const pname = (p) => p instanceof URL ? fileURLToPath(p) : Buffer.isBuffer(p) ? p.toString() : p;
const isHosts = (p) => pname(p) === '/etc/hosts';
const fault = process.env.AUDIT_FAULT || 'none';
let reads = 0;
let writes = 0;
const fail = (code) => Object.assign(new Error('injected ' + code), { code });
fs.readFileSync = function(p, ...args) {
  if (!isHosts(p)) {
    if (typeof pname(p) === 'string' && path.resolve(pname(p)) === '/private/etc/hosts') throw new Error('Real hosts access blocked');
    return read(p, ...args);
  }
  reads++;
  const denied = fault === 'initial-read' || (fault === 'post-read' && writes > 0);
  emit({ op: 'read', path: '/etc/hosts', redirected: fixture, ordinal: reads, result: denied ? 'EACCES' : 'ok' });
  if (denied) throw fail('EACCES');
  return read(fixture, ...args);
};
fs.writeFileSync = function(p, data, ...args) {
  if (!isHosts(p)) {
    if (typeof pname(p) !== 'string' || !path.resolve(pname(p)).startsWith(root + '/')) throw new Error('Non-fixture write blocked: ' + pname(p));
    return write(p, data, ...args);
  }
  writes++;
  const before = read(fixture, 'utf8');
  const intended = String(data);
  let outcome = 'ok';
  if (fault === 'write-error') outcome = 'EIO';
  else if (fault === 'write-noop') outcome = 'noop';
  else if (fault === 'partial-write') {
    write(fixture, intended.includes('# portless-end') ? intended.slice(0, intended.indexOf('# portless-end')) : '# truncated unrelated data\n');
    outcome = 'partial-EIO';
  } else if (fault === 'unrelated-loss') {
    write(fixture, intended.slice(intended.indexOf('# portless-start')));
    outcome = 'unrelated-data-lost';
  } else write(fixture, data, ...args);
  emit({ op: 'write', path: '/etc/hosts', redirected: fixture, ordinal: writes, outcome, before, intended, after: read(fixture, 'utf8') });
  if (outcome === 'EIO' || outcome === 'partial-EIO') throw fail('EIO');
};
for (const api of ['openSync', 'appendFileSync', 'truncateSync', 'unlinkSync', 'renameSync', 'chmodSync', 'chownSync', 'rmSync', 'mkdirSync', 'rmdirSync', 'copyFileSync', 'createWriteStream']) {
  const original = fs[api].bind(fs);
  fs[api] = function(p, ...args) {
    const name = pname(p);
    if (api === 'openSync' && (args[0] === 'r' || args[0] === 0) && !isHosts(p) && name !== '/private/etc/hosts') return original(p, ...args);
    if (isHosts(p) || typeof name !== 'string' || !path.resolve(name).startsWith(root + '/')) throw new Error('Unexpected filesystem mutation blocked: ' + api + ':' + name);
    if (['renameSync', 'copyFileSync'].includes(api) && !path.resolve(pname(args[0])).startsWith(root + '/')) throw new Error('Mutation destination blocked');
    return original(p, ...args);
  };
}
for (const api of ['readFile', 'writeFile', 'open', 'appendFile', 'truncate', 'unlink', 'rename', 'chmod', 'chown', 'rm', 'mkdir', 'rmdir', 'copyFile', 'createReadStream']) {
  const original = fs[api].bind(fs);
  fs[api] = function(p, ...args) {
    if (isHosts(p)) throw new Error('Unexpected hosts API blocked: ' + api);
    return original(p, ...args);
  };
}
for (const api of ['readFile', 'writeFile', 'open', 'appendFile', 'truncate', 'unlink', 'rename', 'chmod', 'chown', 'rm', 'mkdir', 'rmdir', 'copyFile']) {
  const original = fs.promises[api].bind(fs.promises);
  fs.promises[api] = async function(p, ...args) {
    if (isHosts(p)) throw new Error('Unexpected promise hosts API blocked: ' + api);
    return original(p, ...args);
  };
}
process.getuid = () => Number(process.env.AUDIT_UID || 0);
process.geteuid = process.getuid;
cp.spawnSync = (command, args, options) => {
  if (command !== 'sudo') throw new Error('Child execution blocked: ' + command);
  const mode = process.env.AUDIT_SUDO || '1';
  const status = mode === 'timeout' ? null : Number(mode);
  emit({ op: 'sudo-stub', command, args, timeout: options?.timeout, status, error: mode === 'timeout' ? 'ETIMEDOUT' : null });
  return { pid: 0, status, signal: mode === 'timeout' ? 'SIGTERM' : null, error: mode === 'timeout' ? fail('ETIMEDOUT') : undefined, stdout: null, stderr: null, output: [null, null, null] };
};
for (const api of ['spawn', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) cp[api] = () => { throw new Error('Child execution blocked: ' + api); };
net.Socket.prototype.connect = function() {
  emit({ op: 'network-blocked', result: 'ECONNREFUSED' });
  process.nextTick(() => this.destroy(fail('ECONNREFUSED')));
  return this;
};
net.Server.prototype.listen = function() { throw new Error('Listening blocked'); };
syncBuiltinESMExports();
emit({ op: 'preload-ready', fault, uid: process.getuid(), pid: process.pid, node: process.version, platform: process.platform });
process.on('exit', (code) => emit({ op: 'exit', code, reads, writes, memory: process.memoryUsage(), activeResources: process.getActiveResourcesInfo() }));
