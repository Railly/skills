import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const require = createRequire(`${root}/packages/@wterm/just-bash/package.json`);
const ts = require('typescript');
const dependency = pathToFileURL(require.resolve('just-bash')).href;
const source = execFileSync('git', ['show', '0065c68c9d90ed831608d3b17eced9a14bcde609:packages/@wterm/just-bash/src/index.ts'], { cwd: root, encoding: 'utf8' });
const baselineJS = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replaceAll('"just-bash"', JSON.stringify(dependency));
const { BashShell: Before } = await import(`data:text/javascript;base64,${Buffer.from(baselineJS).toString('base64')}`);
const { BashShell: After } = await import(pathToFileURL(`${root}/packages/@wterm/just-bash/dist/index.js`).href);
const fixtures = { '/home/user/homefile': 'HOME', '/tmp/tmpfile': 'TMP' };
const make = async (Shell, options = { files: fixtures }) => {
  const output = [];
  const shell = new Shell({ ...options, prompt: cwd => `[${cwd}]> ` });
  await shell.attach(data => output.push(data));
  const submit = async command => {
    output.length = 0;
    await shell.handleInput(command);
    output.length = 0;
    await shell.handleInput('\r');
    return { command, cwd: shell.cwd, output: output.join('') };
  };
  return { shell, output, submit };
};
const results = [];
for (const [name, command] of [
  ['assigned-PWD', 'PWD=/tmp; pwd'],
  ['unset-PWD', 'cd /tmp; unset PWD; pwd'],
  ['local-PWD', 'f() { local PWD; cd /tmp; }; f; pwd'],
  ['nonzero', 'cd /tmp; false'],
  ['explicit-exit', 'cd /tmp; exit 1'],
]) {
  const sides = {};
  for (const [label, Shell] of [['base', Before], ['head', After]]) {
    const { submit } = await make(Shell);
    sides[label] = [await submit(command), await submit('pwd')];
  }
  results.push({ case: name, ...sides });
}
for (const [label, Shell] of [['base', Before], ['head', After]]) {
  const relative = await make(Shell, { cwd: 'home/user', files: fixtures });
  const initial = await relative.submit('pwd');
  await relative.shell.handleInput('cat home');
  relative.output.length = 0;
  await relative.shell.handleInput('\t');
  results.push({ case: 'relative-cwd-completion', version: label, initial, completion: relative.output.join('') });
  const empty = await make(Shell, {});
  results.push({ case: 'default-filesystem', version: label, commands: [await empty.submit('pwd'), await empty.submit('ls'), await empty.submit('ls')] });
  const once = await make(Shell);
  await once.submit('echo once >> /tmp/once.txt; true');
  results.push({ case: 'append-once', version: label, contents: await once.shell.bash.readFile('/tmp/once.txt') });
}
console.log(JSON.stringify({ node: process.version, dependency: 'just-bash@2.14.2', results }, null, 2));
const failures = [];
for (const name of ['assigned-PWD', 'unset-PWD', 'local-PWD']) {
  const item = results.find(x => x.case === name);
  try { assert.equal(item.head[0].cwd, item.base[0].cwd); } catch { failures.push(`${name}: expected ${item.base[0].cwd}, got ${item.head[0].cwd}`); }
}
const relativeHead = results.find(x => x.case === 'relative-cwd-completion' && x.version === 'head');
if (relativeHead.initial.cwd !== '/home/user' || relativeHead.completion !== 'file') failures.push('relative cwd: not normalized; completion lost');
const defaultHead = results.find(x => x.case === 'default-filesystem' && x.version === 'head');
if (defaultHead.commands.slice(1).some(x => x.output.includes('No such file or directory'))) failures.push('default shell: repeated ls fails in nonexistent /home/user');
assert.equal(results.find(x => x.case === 'append-once' && x.version === 'head').contents, 'once\n');
assert.equal(results.find(x => x.case === 'append-once' && x.version === 'base').contents, 'once\nonce\n');
console.log(`EFFECT_ONCE_PASS: base appends twice; head appends once`);
for (const failure of failures) console.log(`REGRESSION: ${failure}`);
console.log(`REGRESSION_COUNT=${failures.length} (3 root causes)`);
process.exitCode = failures.length ? 1 : 0;
