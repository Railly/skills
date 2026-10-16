import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'evidence.json'), 'utf8'));
const rows = evidence.results.filter(r => r.uid === 0 && r.scope !== 'repetition');
const results = [];
for (const row of rows) {
  for (const revision of ['base', 'head']) {
    const dir = path.join(root, 'baseline-fixtures', row.id, revision);
    fs.mkdirSync(dir, { recursive: true });
    const fixture = path.join(dir, 'hosts');
    fs.writeFileSync(fixture, row.initial);
    const attempts = [];
    for (const phase of ['fault', 'immediate-persistent-retry', 'immediate-recovery']) {
      const trace = path.join(dir, phase + '.jsonl');
      fs.writeFileSync(trace, '');
      const env = { PATH: '/usr/bin:/bin', HOME: dir, TMPDIR: dir, NO_COLOR: '1', AUDIT_ROOT: root, AUDIT_HOSTS: fixture, AUDIT_TRACE: trace, AUDIT_FAULT: phase === 'immediate-recovery' ? 'none' : row.fault, AUDIT_UID: '0', AUDIT_MODULE: path.join(root, revision + '-hosts.mts'), AUDIT_NAMES: JSON.stringify(row.names), AUDIT_COMMAND: row.command };
      const before = fs.readFileSync(fixture, 'utf8');
      const args = ['--require', path.join(root, 'preload.cjs'), path.join(root, 'module-worker.mjs')];
      const child = spawnSync(process.execPath, args, { cwd: dir, env, encoding: 'utf8' });
      const events = fs.readFileSync(trace, 'utf8').trim().split('\n').filter(Boolean).map(s => JSON.parse(s));
      const after = fs.readFileSync(fixture, 'utf8');
      attempts.push({ phase, command: [process.execPath, ...args], environment: env, exitCode: child.status, signal: child.signal, stdout: child.stdout, stderr: child.stderr, before, after, events });
    }
    results.push({ id: row.id, revision, attempts });
  }
}
const differences = [];
for (const row of rows) {
  const base = results.find(r => r.id === row.id && r.revision === 'base').attempts[0];
  const head = results.find(r => r.id === row.id && r.revision === 'head').attempts[0];
  const compact = a => ({ exitCode: a.exitCode, writes: a.events.filter(e => e.op === 'write').length, after: a.after });
  if (JSON.stringify(compact(base)) !== JSON.stringify(compact(head))) differences.push({ id: row.id, base: compact(base), head: compact(head) });
}
const failures = results.flatMap(r => r.attempts.filter(a => a.signal || !a.stdout.includes('"ok":') || !a.events.some(e => e.op === 'exit')).map(a => ({ id: r.id, revision: r.revision, phase: a.phase, stderr: a.stderr })));
fs.writeFileSync(path.join(root, 'base-comparison.json'), JSON.stringify({ method: 'Unmodified git-show source snapshots executed by Node 24 native TypeScript stripping, not a rebuilt base CLI.', base: evidence.base, head: evidence.head, moduleExecutions: results.length * 3, unexpectedHarnessFailures: failures, firstAttemptDifferences: differences, results }, null, 2) + '\n');
console.log(JSON.stringify({ moduleExecutions: results.length * 3, unexpectedHarnessFailures: failures, firstAttemptDifferences: differences }, null, 2));
process.exitCode = failures.length ? 1 : 0;
