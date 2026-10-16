import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import sys
import time

OUT = Path(__file__).resolve().parent
ROOT = Path('/tmp/portless-review-424-fad78e9c')
PKG = ROOT / 'packages/portless'
COPY = OUT / 'disposable'
NODE = shutil.which('node')
VITEST = PKG / 'node_modules/vitest/vitest.mjs'
PATTERN = 'hosts file mutation safety|blockMatchesHostnames|CLI hosts subcommand sync safety'
ENV = {'PATH': os.environ['PATH'], 'HOME': str(OUT / 'home'), 'TMPDIR': str(OUT / 'tmp'), 'NO_COLOR': '1', 'CI': '1', 'PORTLESS_PORT': '65431', 'PORTLESS_SYNC_HOSTS': '0'}
for p in [COPY / 'src', COPY / 'node_modules', OUT / 'logs', OUT / 'tmp', OUT / 'home']:
    p.mkdir(parents=True, exist_ok=True)
records = []

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def command(label, argv, cwd=COPY, expected=None):
    started = time.monotonic()
    result = subprocess.run([str(a) for a in argv], cwd=cwd, env=ENV, capture_output=True, text=True)
    log = OUT / 'logs' / (label + '.log')
    log.write_text('$ ' + shlex.join([str(a) for a in argv]) + '\nCWD=' + str(cwd) + '\n' + result.stdout + '\nSTDERR:\n' + result.stderr + '\nEXIT=' + str(result.returncode) + '\n')
    record = {'label': label, 'command': shlex.join([str(a) for a in argv]), 'cwd': str(cwd), 'environment': ENV, 'exit_code': result.returncode, 'elapsed_seconds': round(time.monotonic() - started, 3), 'log': str(log)}
    records.append(record)
    (OUT / ('commands-' + sys.argv[1] + '.json')).write_text(json.dumps(records, indent=2) + '\n')
    print(label + ': exit=' + str(result.returncode) + ' ' + str(record['elapsed_seconds']) + 's', flush=True)
    if expected is not None and result.returncode != expected:
        raise RuntimeError(label + ': unexpected exit; inspect ' + str(log))
    return result

def tests(label, extra=False, expected=None):
    files = ['src/hosts.test.ts', 'src/cli.test.ts']
    pattern = PATTERN
    if extra:
        files += ['src/gaps.test.ts', 'src/cli-gaps.test.ts']
        pattern += '|review gap'
    return command(label, [NODE, VITEST, 'run', '--config', COPY / 'vitest.config.mjs', '--no-cache', '--maxWorkers', '1', '--reporter', 'verbose', *files, '-t', pattern], expected=expected)

def materialize():
    fingerprints = json.loads((OUT / 'fingerprints.json').read_text())
    for p, digest in fingerprints.items():
        actual = Path(p) if Path(p).is_absolute() else ROOT / p
        assert sha(actual) == digest, 'Fingerprint drift: ' + str(actual)
    evidence = json.loads((OUT.parent / 'resilience/evidence.json').read_text())
    assert evidence['cliSha256'] == sha(PKG / 'dist/cli.js')
    assert evidence['unexpectedOracleFailures'] == []
    assert evidence['head'] == 'fad78e9c5e3f1958558eca616d747313e4d4ba60'
    (OUT / 'resilience-link.json').write_text(json.dumps({'evidence': str(OUT.parent / 'resilience/evidence.json'), 'sha256': sha(OUT.parent / 'resilience/evidence.json'), 'cells': evidence['cells'], 'executions': evidence['executions'], 'cliSha256': evidence['cliSha256']}, indent=2) + '\n')
    for name in ['hosts.ts', 'hosts.test.ts', 'cli.test.ts']:
        shutil.copyfile(PKG / 'src' / name, COPY / 'src' / name)
    shutil.copytree(PKG / 'dist', COPY / 'dist', dirs_exist_ok=True)
    shutil.copyfile(PKG / 'package.json', COPY / 'package.json')
    link = COPY / 'node_modules/vitest'
    if not link.exists():
        link.symlink_to((PKG / 'node_modules/vitest').resolve(), target_is_directory=True)
    (COPY / 'vitest.config.mjs').write_text('export default ' + json.dumps({'root': str(COPY), 'cacheDir': str(OUT / 'vite-cache'), 'test': {'include': ['src/*.test.ts'], 'watch': False}}) + ';\n')


def replace_once(s, old, new):
    assert s.count(old) == 1, (old, s.count(old))
    return s.replace(old, new, 1)


def change_guard(s, operation):
    signature = ('export function syncHostsFile(hostnames: string[]): boolean {' if operation == 'sync-source' else 'export function cleanHostsFile(): boolean {' if operation == 'clean-source' else 'function syncHostsFile(hostnames) {' if operation == 'sync-built' else 'function cleanHostsFile() {')
    old = signature + '\n  const content = readHostsFile();\n  if (content === null) return false;'
    return replace_once(s, old, signature + '\n  const content = readHostsFile() ?? "";')


def mutant(label, file, transform, extra=False):
    target = COPY / file
    original = target.read_text()
    changed = transform(original)
    assert changed != original
    (OUT / (label + '.mutation.json')).write_text(json.dumps({'file': file, 'before_sha256': hashlib.sha256(original.encode()).hexdigest(), 'after_sha256': hashlib.sha256(changed.encode()).hexdigest()}, indent=2) + '\n')
    import difflib
    (OUT / (label + '.patch')).write_text(''.join(difflib.unified_diff(original.splitlines(True), changed.splitlines(True), fromfile=file, tofile=file)))
    try:
        target.write_text(changed)
        result = tests(label + '-mutant', extra)
        combined = result.stdout + result.stderr
        if result.returncode:
            assert 'AssertionError:' in combined, 'Not an assertion kill: ' + label
            assert 'Transform failed' not in combined and 'SyntaxError:' not in combined, 'Invalid mutant: ' + label
        outcome = 'killed' if result.returncode else 'survived'
    finally:
        target.write_text(original)
        assert target.read_text() == original
    tests(label + '-restored', extra, expected=0)
    return {'id': label, 'file': file, 'outcome': outcome, 'extra_review_tests': extra, 'patch': str(OUT / (label + '.patch')), 'red_log': str(OUT / 'logs' / (label + '-mutant.log')), 'green_log': str(OUT / 'logs' / (label + '-restored.log'))}


if sys.argv[1] == 'baseline':
    materialize()
    command('frozen-before', ['git', 'status', '--short'], ROOT, expected=0)
    tests('baseline', expected=0)
    tests('baseline-repeat', expected=0)
elif sys.argv[1] == 'mutate':
    source = 'src/hosts.ts'
    chunk = 'dist/chunk-RQ7SS7J3.js'
    verify = 'return verification !== null && blockMatchesHostnames(verification, hostnames);'
    cases = [
        ('initial-source', source, lambda s: change_guard(s, 'sync-source')),
        ('verification-empty-source', source, lambda s: replace_once(s, verify, 'return blockMatchesHostnames(verification ?? "", hostnames);')),
        ('verification-null-source', source, lambda s: replace_once(s, verify, 'return verification === null || blockMatchesHostnames(verification, hostnames);')),
        ('cleanup-source', source, lambda s: change_guard(s, 'clean-source')),
        ('falsey-initial-source', source, lambda s: replace_once(s, 'if (content === null) return false;\n  if (blockMatchesHostnames', 'if (!content) return false;\n  if (blockMatchesHostnames')),
        ('mismatch-source', source, lambda s: replace_once(s, verify, 'return verification !== null;')),
        ('noop-source', source, lambda s: replace_once(s, 'if (blockMatchesHostnames(content, hostnames)) return true;', 'if (false) return true;')),
        ('write-error-source', source, lambda s: replace_once(s, '  } catch {\n    return false;\n  }\n  // Re-read', '  } catch {\n    return true;\n  }\n  // Re-read')),
        ('empty-mismatch-source', source, lambda s: replace_once(s, verify, 'return verification !== null && (hostnames.length === 0 || blockMatchesHostnames(verification, hostnames));')),
        ('cleanup-readable-source', source, lambda s: replace_once(s, '  try {\n    if (!content.includes(MARKER_START))', '  if (content !== null) return false;\n  try {\n    if (!content.includes(MARKER_START))')),
        ('initial-built', chunk, lambda s: change_guard(s, 'sync-built')),
        ('verification-built', chunk, lambda s: replace_once(s, verify, 'return blockMatchesHostnames(verification ?? "", hostnames);')),
        ('cleanup-built', chunk, lambda s: change_guard(s, 'clean-built')),
        ('cli-empty-bypass', 'dist/cli.js', lambda s: replace_once(s, 'if (syncHostsFile(hostnames)) {', 'if (hostnames.length === 0 || syncHostsFile(hostnames)) {')),
        ('cli-wrong-argument', 'dist/cli.js', lambda s: replace_once(s, 'if (syncHostsFile(hostnames)) {', 'if (syncHostsFile([])) {')),
        ('cli-ignore-sync-result', 'dist/cli.js', lambda s: replace_once(s, 'if (syncHostsFile(hostnames)) {', 'if ((syncHostsFile(hostnames), true)) {')),
        ('cli-ignore-clean-result', 'dist/cli.js', lambda s: replace_once(s, 'if (args[1] === "clean") {\n    if (cleanHostsFile()) {', 'if (args[1] === "clean") {\n    if ((cleanHostsFile(), true)) {')),
        ('cli-ignore-sudo-failure', 'dist/cli.js', lambda s: replace_once(s, '"hosts", "sync"],\n      {\n        stdio: "inherit",\n        timeout: SUDO_SPAWN_TIMEOUT_MS\n      }\n    );\n    if (result.status === 0) return;', '"hosts", "sync"],\n      {\n        stdio: "inherit",\n        timeout: SUDO_SPAWN_TIMEOUT_MS\n      }\n    );\n    return;')),
    ]
    outcomes = []
    for case in cases:
        outcomes.append(mutant(*case))
        (OUT / 'mutation-results.json').write_text(json.dumps(outcomes, indent=2) + '\n')
    command('frozen-after-mutations', ['git', 'status', '--short'], ROOT, expected=0)
    print(json.dumps(outcomes, indent=2))
elif sys.argv[1] == 'gaps':
    original_cli_tests = (COPY / 'src/cli.test.ts').read_text()
    fixture = '\n'.join(original_cli_tests.splitlines()[:10]) + '\n'
    fixture += original_cli_tests[original_cli_tests.index('/** Run the CLI'):original_cli_tests.index('function writeExpoShim')]
    fixture = fixture.replace('function runWithHostsFileMock(', 'export function runWithHostsFileMock(')
    (COPY / 'src/cli-fixture.ts').write_text(fixture)
    tests('gaps-baseline', extra=True, expected=0)
    source = 'src/hosts.ts'
    verify = 'return verification !== null && blockMatchesHostnames(verification, hostnames);'
    cases = [
        ('gap-empty-mismatch', source, lambda s: replace_once(s, verify, 'return verification !== null && (hostnames.length === 0 || blockMatchesHostnames(verification, hostnames));')),
        ('gap-cleanup-readable', source, lambda s: replace_once(s, '  try {\n    if (!content.includes(MARKER_START))', '  if (content !== null) return false;\n  try {\n    if (!content.includes(MARKER_START))')),
        ('gap-cli-wrong-argument', 'dist/cli.js', lambda s: replace_once(s, 'if (syncHostsFile(hostnames)) {', 'if (syncHostsFile([])) {')),
        ('gap-cli-sudo-failure', 'dist/cli.js', lambda s: replace_once(s, '"hosts", "sync"],\n      {\n        stdio: "inherit",\n        timeout: SUDO_SPAWN_TIMEOUT_MS\n      }\n    );\n    if (result.status === 0) return;', '"hosts", "sync"],\n      {\n        stdio: "inherit",\n        timeout: SUDO_SPAWN_TIMEOUT_MS\n      }\n    );\n    return;')),
        ('gap-cleanup-write-error', source, lambda s: replace_once(s, '    fs.writeFileSync(HOSTS_PATH, removeBlock(content));\n    return true;\n  } catch {\n    return false;', '    fs.writeFileSync(HOSTS_PATH, removeBlock(content));\n    return true;\n  } catch {\n    return true;')),
    ]
    outcomes = []
    for case in cases:
        outcomes.append(mutant(*case, extra=True))
        (OUT / 'gap-mutation-results.json').write_text(json.dumps(outcomes, indent=2) + '\n')
    base = command('base-hosts-source', ['git', 'show', '1ad573bb95810daf6cd50c1718707015450f3f09:packages/portless/src/hosts.ts'], ROOT, expected=0).stdout
    outcomes.append(mutant('fix-absent-base-hosts', source, lambda s: base))
    (OUT / 'gap-mutation-results.json').write_text(json.dumps(outcomes, indent=2) + '\n')
    tests('final-green', extra=True, expected=0)
    tests('final-green-repeat', extra=True, expected=0)
    command('frozen-final', ['git', 'status', '--short'], ROOT, expected=0)
    print(json.dumps(outcomes, indent=2))
else:
    raise ValueError(sys.argv[1])
