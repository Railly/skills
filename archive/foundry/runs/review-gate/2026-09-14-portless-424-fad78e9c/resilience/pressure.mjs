import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
const root = path.dirname(fileURLToPath(import.meta.url));
const checkout = '/tmp/portless-review-424-fad78e9c';
const cli = path.join(checkout, 'packages/portless/dist/cli.js');
const expectedHead = 'fad78e9c5e3f1958558eca616d747313e4d4ba60';
const started = new Date();
const git = (...args) => {
  const result = spawnSync('git', args, { cwd: checkout, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout;
};
if (git('rev-parse', 'HEAD').trim() !== expectedHead) throw new Error('HEAD mismatch');
const dirtyBefore = git('status', '--porcelain=v1', '--untracked-files=all');
if (dirtyBefore) throw new Error('Checkout not clean');
const unmanaged = '127.0.0.1 localhost\n::1 localhost\n192.0.2.19 keep.example\n';
const stale = unmanaged + '\n# portless-start\n127.0.0.1 stale.localhost\n# portless-end\n';
const wanted = unmanaged + '\n# portless-start\n127.0.0.1 app.localhost\n# portless-end\n';
const orphan = unmanaged + '\n# portless-start\n127.0.0.1 stale.localhost\n';
const rows = [];
for (const command of ['sync', 'clean']) {
  for (const names of command === 'sync' ? [[], ['app.localhost']] : [[]]) {
    for (const fault of ['none', 'initial-read', 'post-read', 'write-error', 'write-noop']) {
      for (const uid of [0, 501]) {
        rows.push({ id: `${command}-${names.length ? 'nonempty' : 'empty'}-${fault}-uid${uid}`, command, names, fault, uid, initial: stale, sudo: '1', scope: 'changed-read-contract-and-existing-caller' });
      }
    }
  }
}
for (const command of ['sync', 'clean']) {
  for (const sudo of ['0', 'timeout']) rows.push({ id: `${command}-sudo-${sudo}`, command, names: command === 'sync' ? ['app.localhost'] : [], fault: 'initial-read', uid: 501, initial: stale, sudo, scope: 'unchanged-caller' });
}
for (const names of [[], ['app.localhost']]) {
  rows.push({ id: `sync-noop-${names.length}`, command: 'sync', names, fault: 'none', uid: 0, initial: names.length ? wanted : unmanaged, scope: 'idempotency' });
  rows.push({ id: `sync-orphan-${names.length}`, command: 'sync', names, fault: 'none', uid: 0, initial: orphan, scope: 'preexisting-parser' });
  rows.push({ id: `sync-partial-${names.length}`, command: 'sync', names, fault: 'partial-write', uid: 0, initial: stale, scope: 'preexisting-partial-write' });
}
rows.push({ id: 'sync-unrelated-loss', command: 'sync', names: ['app.localhost'], fault: 'unrelated-loss', uid: 0, initial: stale, scope: 'preexisting-verification-scope' });
rows.push({ id: 'clean-partial', command: 'clean', names: [], fault: 'partial-write', uid: 0, initial: stale, scope: 'preexisting-partial-write' });
rows.push({ id: 'sync-real-empty-file', command: 'sync', names: ['app.localhost'], fault: 'none', uid: 0, initial: '', scope: 'empty-distinct-from-unreadable' });
for (let i = 0; i < 10; i++) rows.push({ id: `repeat-post-read-${i}`, command: 'sync', names: i % 2 ? [] : ['app.localhost'], fault: 'post-read', uid: 0, initial: stale, scope: 'repetition' });
const pressureMatrix = rows.map(({ initial, ...row }) => ({ ...row, initialBytes: initial, oracle: row.scope.startsWith('preexisting') ? 'Record exact residual bytes and immediate recovery without treating CLI success as proof of complete cleanup.' : 'Initial read failure: zero writes. Sync post-write read failure: failure even with zero routes. Write error/noop: sync fails. Normal retry must converge without losing unrelated bytes. Caller false: one sudo attempt for uid501, none for uid0; sudo success trusted, failure/timeout exit1.', cleanupDeadline: 'No owned child or writable descriptor after CLI exit; fixtures retained as evidence.', retry: 'Same command with persistent fault immediately, then same command with fault removed immediately; shared fixture state retained.' }));
fs.writeFileSync(path.join(root, 'pressure-matrix.json'), JSON.stringify({ created: started.toISOString(), checkout, expectedHead, cells: pressureMatrix, unexecuted: ['Real macOS elevation, ACL, resolver and protected hosts substrate', 'Linux and Windows kernels/filesystem/elevation', 'Real daemon or route registration producer', 'Power loss, crash during actual kernel write, fsync durability', 'Concurrent real writers and resource load'] }, null, 2) + '\n');
const results = [];
const issues = [];
for (const row of rows) {
  const dir = path.join(root, 'fixtures', row.id);
  fs.mkdirSync(path.join(dir, 'state'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'home'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'tmp'), { recursive: true });
  const fixture = path.join(dir, 'hosts');
  const routesPath = path.join(dir, 'state/routes.json');
  fs.writeFileSync(fixture, row.initial);
  fs.writeFileSync(routesPath, JSON.stringify(row.names.map(hostname => ({ hostname, port: 3201, pid: 0 }))));
  const attempts = [];
  for (const phase of ['fault', 'immediate-persistent-retry', 'immediate-recovery']) {
    const fault = phase === 'immediate-recovery' ? 'none' : row.fault;
    const trace = path.join(dir, phase + '.jsonl');
    fs.writeFileSync(trace, '');
    const before = fs.readFileSync(fixture, 'utf8');
    const begin = performance.now();
    const env = { PATH: '/usr/bin:/bin', HOME: path.join(dir, 'home'), TMPDIR: path.join(dir, 'tmp'), NO_COLOR: '1', PORTLESS_STATE_DIR: path.join(dir, 'state'), PORTLESS_PORT: '65431', PORTLESS_SYNC_HOSTS: '1', AUDIT_ROOT: root, AUDIT_HOSTS: fixture, AUDIT_TRACE: trace, AUDIT_FAULT: fault, AUDIT_UID: String(row.uid), AUDIT_SUDO: row.sudo || '1' };
    const args = ['--require', path.join(root, 'preload.cjs'), cli, 'hosts', row.command];
    const child = spawnSync(process.execPath, args, { cwd: dir, env, encoding: 'utf8', maxBuffer: 1024 * 1024 });
    const durationMs = performance.now() - begin;
    const events = fs.readFileSync(trace, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    const after = fs.readFileSync(fixture, 'utf8');
    const writes = events.filter(e => e.op === 'write');
    const reads = events.filter(e => e.op === 'read');
    const sudos = events.filter(e => e.op === 'sudo-stub');
    const out = { phase, fault, command: [process.execPath, ...args], cwd: dir, environment: env, exitCode: child.status, signal: child.signal, error: child.error?.message || null, stdout: child.stdout, stderr: child.stderr, durationMs, before, after, reads: reads.length, writes: writes.length, sudoCalls: sudos.length, events, unrelatedPreserved: row.initial === '' || after.includes(unmanaged.trimEnd()), routesUnchanged: fs.readFileSync(routesPath, 'utf8') === JSON.stringify(row.names.map(hostname => ({ hostname, port: 3201, pid: 0 }))) };
    attempts.push(out);
    const check = (ok, message) => { if (!ok) issues.push({ id: row.id, phase, message }); };
    check(!child.error && !child.signal && events.some(e => e.op === 'preload-ready') && events.some(e => e.op === 'exit'), 'CLI must complete under active isolation');
    check(!child.stderr.includes('blocked:') && !child.stderr.includes('blocked\n'), 'Unexpected safety guard activation');
    check(out.routesUnchanged, 'Routes must not be mutated');
    check(sudos.length <= 1, 'At most one caller sudo attempt per command');
    if (fault === 'initial-read') {
      check(writes.length === 0 && before === after, 'Initial unreadability must prevent all hosts writes');
      check(child.status === (row.uid === 501 && row.sudo === '0' ? 0 : 1), 'Read failure must take established caller status path');
      check(sudos.length === (row.uid === 501 ? 1 : 0), 'Caller elevation branch matches uid');
    }
    if (!row.scope.startsWith('preexisting')) {
      if (fault === 'post-read' && row.command === 'sync' && writes.length) check(child.status === 1, 'Sync unreadable verification must fail');
      if (fault === 'write-error' || (fault === 'write-noop' && row.command === 'sync')) check(child.status === 1, 'Failed write or unapplied sync must fail');
      if (phase === 'immediate-recovery' || fault === 'none') {
        check(child.status === 0, 'Healthy retry must succeed');
        check(row.names.length ? after.includes('127.0.0.1 app.localhost') && !after.includes('stale.localhost') : !after.includes('stale.localhost'), 'Healthy retry must reconcile exact valid fixture state');
        check(out.unrelatedPreserved, 'Healthy retry must preserve unrelated entries');
      }
    }
    fs.writeFileSync(path.join(dir, phase + '.result.json'), JSON.stringify(out, null, 2) + '\n');
  }
  results.push({ ...row, attempts });
}
const dirtyAfter = git('status', '--porcelain=v1', '--untracked-files=all');
if (dirtyAfter !== dirtyBefore) issues.push({ message: 'Checkout status changed', dirtyBefore, dirtyAfter });
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const summary = { started: started.toISOString(), finished: new Date().toISOString(), elapsedMs: Date.now() - started.valueOf(), head: git('rev-parse', 'HEAD').trim(), base: '1ad573bb95810daf6cd50c1718707015450f3f09', cliSha256: sha256(fs.readFileSync(cli)), node: process.version, platform: process.platform, arch: process.arch, cells: rows.length, executions: results.reduce((n, r) => n + r.attempts.length, 0), unexpectedOracleFailures: issues, dirtyBefore, dirtyAfter, results };
fs.writeFileSync(path.join(root, 'evidence.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ cells: summary.cells, executions: summary.executions, elapsedMs: summary.elapsedMs, unexpectedOracleFailures: issues, evidence: path.join(root, 'evidence.json'), cleanCheckout: !dirtyAfter }, null, 2));
process.exitCode = issues.length ? 1 : 0;
