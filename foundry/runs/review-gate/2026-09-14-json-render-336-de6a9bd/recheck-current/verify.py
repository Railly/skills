import datetime
import hashlib
import json
import os
import pathlib
import subprocess

OUT = pathlib.Path(__file__).resolve().parent
RUN = OUT.parent
TARGET = pathlib.Path('/Users/raillyhugo/Programming/vercel/json-render-336-review')
SKILLS = pathlib.Path('/Users/raillyhugo/Programming/railly/skills')
GATE = SKILLS / 'skills/review-gate/scripts/gate.sh'
commands = []
hashes = {}


def load(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify_hash(path, expected):
    path = pathlib.Path(path)
    actual = digest(path)
    assert actual == expected.removeprefix('sha256:'), str(path)
    hashes[str(path)] = actual


def run(name, argv, cwd=TARGET, env=None, expected=0):
    result = subprocess.run(list(map(str, argv)), cwd=cwd, env=env, capture_output=True, text=True)
    (OUT / (name + '.stdout')).write_text(result.stdout)
    (OUT / (name + '.stderr')).write_text(result.stderr)
    commands.append({'name': name, 'argv': list(map(str, argv)), 'cwd': str(cwd), 'exit_code': result.returncode, 'expected_exit_code': expected})
    print(name + ': exit ' + str(result.returncode), flush=True)
    assert result.returncode == expected, (name, result.stdout[-2000:], result.stderr[-2000:])
    return result.stdout


manifest_path = RUN / 'manifest.json'
manifest_bytes = manifest_path.read_bytes()
manifest = json.loads(manifest_bytes)
report = load(RUN / 'run-report.json')
base = report['run']['base']
head = report['run']['head']
assert manifest['work_item']['authorization'] == 'read-only'
assert report['run']['verdict'] == 'incomplete'
assert run('head', ['git', 'rev-parse', 'HEAD']).strip() == head
assert not run('status-before', ['git', 'status', '--porcelain=v1'])
for path, expected in load(RUN / 'resumed-coordinator/integration-validation.json')['final_sha256'].items():
    verify_hash(path, expected)
identity = load(RUN / 'resumed-security/final-identity-check.json')
for path, expected in {**identity['source_sha256'], **identity['built_sha256']}.items():
    verify_hash(TARGET / path, expected)
resilience = load(RUN / 'resumed-resilience/receipt.json')
cone = resilience['fingerprint']['dependency_cone']
for path, expected in cone['sources'].items():
    verify_hash(TARGET / path, expected)
for path, expected in {**cone['built_artifacts'], **cone['probe_hashes'], **resilience['evidence_hashes']}.items():
    verify_hash(path, expected)
for name in ['test-strength/receipt.json', 'test-strength/copy-survivor-results.json', 'core-build.log', 'core-tests.log', 'typecheck-comparison.json']:
    verify_hash(RUN / name, load(RUN / 'resumed-coordinator/checks.json')['protected_sha256'][name])
for name, skill in manifest['skill_revisions'].items():
    relative = str(pathlib.Path(skill['path']).relative_to(SKILLS))
    assert not run('skill-status-' + name, ['git', 'status', '--porcelain=v1', '--', relative], SKILLS)
    assert 'git-tree:' + run('skill-tree-' + name, ['git', 'rev-parse', 'HEAD:' + relative], SKILLS).strip() == skill['digest']
    assert 'git:' + run('skill-revision-' + name, ['git', 'rev-parse', 'HEAD'], SKILLS).strip() == skill['revision']
paths = run('changed-paths', ['git', 'diff', '--name-only', base, head]).splitlines()
assert 'sha256:' + hashlib.sha256(json.dumps(paths, separators=(',', ':')).encode()).hexdigest() == identity['changed_path_digest']
assert 'sha256:' + hashlib.sha256(json.dumps(load(RUN / 'contract.json'), separators=(',', ':')).encode()).hexdigest() == identity['contract_digest']
run('covered', ['bash', GATE, 'covered', RUN.parent, '336'])
run('style', ['bash', GATE, 'style', base])
run('surfaces', ['bash', GATE, 'surfaces', RUN / 'conventions.used.md', base])
run('diff-check', ['git', 'diff', '--check', base, head])
run('version-sync', ['bun', 'scripts/check-version-sync.js'])
(OUT / 'tmp').mkdir(exist_ok=True)
traces = {}
for variant, expected in [('head', 1), ('base', 0)]:
    env = os.environ.copy()
    env.update({'AUDIT_VARIANT': variant, 'AUDIT_TRACE': str(OUT / ('traces-' + variant + '.json')), 'TMPDIR': str(OUT / 'tmp')})
    run('probe-' + variant, ['node', TARGET / 'node_modules/vitest/vitest.mjs', 'run', '--config', OUT / 'pressure.config.mjs', '--configLoader', 'runner', '-t', '^(H01|P01) ', '--reporter=json', '--outputFile', OUT / ('vitest-' + variant + '.json')], cwd=RUN / 'resumed-resilience', env=env, expected=expected)
    traces[variant] = load(OUT / ('traces-' + variant + '.json'))
    assert [t['id'] for t in traces[variant]] == ['H01', 'P01']
    assert all(t['test_status'] == ('fail' if variant == 'head' else 'pass') for t in traces[variant])
assert 'source' not in traces['head'][0]['observations'][0]['rejected']['state']
head_round = traces['head'][1]['observations'][0]['rounds'][0]
base_round = traces['base'][1]['observations'][0]['rounds'][0]
assert head_round['state']['items'] == ['a', 'b']
assert head_round['callback'] == [{'path': '/items/01', 'value': 'rejected'}, {'path': '/count', 'value': 1}]
assert base_round['state']['items'] == ['a', 'rejected']
run('report', ['bash', GATE, 'report', RUN / 'run-report.json'], expected=1)
assert 'finding F1 remains open' in (OUT / 'report.stderr').read_text()
assert 'finding F2 remains open' in (OUT / 'report.stderr').read_text()
assert 'finding TS-3 remains open' in (OUT / 'report.stderr').read_text()
run('render', ['bash', GATE, 'render', RUN / 'run-report.json', OUT / 'run-report.generated.md'])
remote = json.loads(run('remote', ['gh', 'pr', 'view', '336', '--repo', 'vercel-labs/json-render', '--json', 'headRefOid,baseRefOid,state,mergeable,reviewDecision,statusCheckRollup,reviews,url']))
assert remote['headRefOid'] == head and remote['baseRefOid'] == base and remote['state'] == 'OPEN'
assert remote['reviewDecision'] == 'CHANGES_REQUESTED'
checks = remote['statusCheckRollup']
assert len(checks) == 23 and all(c.get('conclusion') in [None, 'SUCCESS'] and c.get('state') in [None, 'SUCCESS'] and c.get('status') in [None, 'COMPLETED'] for c in checks)
assert not run('status-after', ['git', 'status', '--porcelain=v1'])
for path, expected in dict(hashes).items():
    verify_hash(path, expected)
assert manifest_path.read_bytes() == manifest_bytes
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
receipt = {'schema_version': 1, 'kind': 'exact-head-revalidation', 'checked_at': now, 'status': 'complete', 'verdict': 'incomplete', 'head': head, 'base': base, 'authorization': 'read-only', 'execution_mode': 'sequential_saved_evidence_revalidation', 'independence': 'No new independent review claimed; prior normative challenge retained.', 'source_mutations': False, 'publications': False, 'artifact_hashes_verified': len(hashes), 'protected_sha256': hashes, 'commands': commands, 'reproduced_findings': ['F1', 'F2'], 'reused_finding': 'TS-3, saved mutation receipt hash checked; mutations not rerun', 'head_probes': '0/2 pass, F1/F2 reproduced', 'base_controls': '2/2 pass; historical semantics, not conformance approval', 'remote': {'reviewDecision': remote['reviewDecision'], 'checks': len(checks), 'all_successful': True}, 'report': str(RUN / 'run-report.json'), 'report_exit_code': 1, 'limits': report['run']['gaps'], 'historical_checks_not_rerun': ['core build', '577 core tests', 'full mutation campaign', 'full resilience matrix', 'security corpus', 'normative challenge corpus', 'workspace typecheck']}
(OUT / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
(OUT / 'manifest.before.json').write_bytes(manifest_bytes)
manifest['stages']['review'].setdefault('revalidations', []).append({'checked_at': now, 'head_sha': head, 'verdict': 'incomplete', 'receipt': str(OUT / 'receipt.json'), 'command': 'python3 recheck-current/verify.py'})
temporary = OUT / 'manifest.tmp.json'
temporary.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
os.replace(temporary, manifest_path)
assert load(manifest_path)['stages']['review']['status'] == 'fail'
assert load(manifest_path)['stages']['review']['revalidations'][-1]['receipt'] == str(OUT / 'receipt.json')
print(json.dumps({k: receipt[k] for k in ['status', 'verdict', 'artifact_hashes_verified', 'head_probes', 'base_controls', 'remote', 'report_exit_code', 'source_mutations', 'publications']}, indent=2))
