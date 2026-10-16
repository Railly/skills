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
HANDOFF = pathlib.Path('/Users/raillyhugo/kai/05_Areas/vercel/json-render-handoff.md')
checks = []

def load(path):
    return json.loads(path.read_text())

def check(name, condition):
    checks.append({'name': name, 'pass': bool(condition)})

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def prior(path):
    path = pathlib.Path(path).absolute()
    if path.parent == RUN and path.name in ['manifest.json', 'run-report.json', 'run-report.md', 'report-validation.log']:
        return OUT / (path.name + '.before')
    return path

def hashcheck(path, digest, archived=False):
    resolved = prior(path) if archived else pathlib.Path(path)
    check('sha256 ' + str(resolved), sha(resolved) == digest.removeprefix('sha256:'))

report = load(RUN / 'run-report.json')
manifest = load(RUN / 'manifest.json')
initial = load(OUT / 'checks.json')
security_path = RUN / 'resumed-security/security-receipt.json'
security = load(security_path)
resilience = load(RUN / 'resumed-resilience/receipt.json')
challenge = load(RUN / 'resumed-challenge/receipt.json')
check('report remains incomplete', report['run']['status'] == report['run']['verdict'] == 'incomplete')
check('required upstream failures preserved', report['stage_receipts']['test_strength']['status'] == report['stage_receipts']['resilience']['status'] == 'fail')
check('original Test Strength receipt embedded unchanged', report['stage_receipts']['test_strength'] == load(RUN / 'test-strength/receipt.json'))
check('current resilience embedded without changed results', all(report['stage_receipts']['resilience'][key] == value for key, value in resilience.items()))
check('current security embedded with lossless path normalization', all(report['security_review'][key] == value for key, value in security.items() if key != 'artifact'))
check('security scope and limits retained', security['status'] == 'pass' and len(security['verification']['limitations']) == 5 and security['verification']['gaps'] == [])
check('native model provenance is unknown', report['provenance']['same_family'] is None and not challenge['model_independence_claimed'])
check('normative challenge limits retained', report['risk']['independent_challenge']['satisfied'] and challenge['summary']['passed'] == 742 and challenge['summary']['checks'] == 744 and challenge['summary']['normative_diagnostic_mismatches'] == 2)
open_findings = [finding['id'] for finding in report['findings'] if finding['resolution'] == 'open']
check('F1 F2 and TS-3 open exactly', open_findings == ['F1', 'F2', 'TS-3'])
check('R1 remains refuted', next(f for f in report['findings'] if f['id'] == 'R1')['state'] == 'refuted')
check('manifest matches receipts', manifest['stages']['review']['status'] == 'fail' and manifest['stages']['security']['status'] == 'pass' and manifest['stages']['resilience']['status'] == 'fail')
check('no source or publication authority added', manifest['work_item']['authorization'] == 'read-only' and manifest['work_item']['head_sha'] == report['run']['head'])
for name, digest in initial['protected_sha256'].items():
    path = RUN / name
    if name == 'resumed-security/security-receipt.json':
        path = RUN / 'resumed-security/security-receipt.v1.pre-schema-fix.json'
    hashcheck(path, digest)
identity = load(RUN / 'resumed-security/final-identity-check.json')
for path, digest in identity['source_sha256'].items():
    hashcheck(TARGET / path, digest)
for path, digest in identity['built_sha256'].items():
    hashcheck(TARGET / path, digest)
for path, digest in identity['saved_evidence_sha256'].items():
    hashcheck(RUN / path, digest, archived=True)
resilience_preflight = load(RUN / 'resumed-resilience/preflight.json')
for path, digest in {**resilience_preflight['prior_evidence'], **resilience_preflight['artifacts'], **resilience['evidence_hashes'], **resilience['fingerprint']['dependency_cone']['probe_hashes']}.items():
    hashcheck(path, digest, archived=True)
challenge_execution = load(RUN / 'resumed-challenge/execution.json')
for path, digest in {**challenge_execution['protected_files_before'], **challenge_execution['identity']['dist_sha256']}.items():
    hashcheck(path, digest, archived=True)
for key, filename in [('corpus', 'corpus.json'), ('execution', 'execution.json'), ('runner', 'verify.mjs')]:
    hashcheck(RUN / 'resumed-challenge' / filename, challenge['evidence_sha256'][key])
for source in load(RUN / 'resumed-challenge/oracle-freeze.json')['sources'].values():
    hashcheck(source['resolved_path'], source['sha256'])
security_validation = load(RUN / 'resumed-security/receipt-validation.json')
hashcheck(security_path, security_validation['receipt_sha256'])
for path, digest in security_validation['evidence_hashes'].items():
    hashcheck(RUN / 'resumed-security' / path, digest, archived=True)
for path in [security_path, pathlib.Path(resilience['artifact']), pathlib.Path(challenge['artifact'])]:
    check('receipt artifact exists ' + str(path), path.is_file() and path.stat().st_size > 0)
old_handoff = (OUT / 'handoff.before.md').read_text()
check('entire prior handoff preserved verbatim below new state', HANDOFF.read_text().endswith(old_handoff.removeprefix('# json-render\n\n## Estado activo\n\n')))
check('live clean target', not subprocess.check_output(['git', 'status', '--porcelain=v1'], cwd=TARGET))
check('live exact head', subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=TARGET).decode().strip() == report['run']['head'])
for skill in manifest['skill_revisions'].values():
    path = str(pathlib.Path(skill['path']).relative_to(SKILLS))
    check('unchanged executing skill ' + path, not subprocess.check_output(['git', 'status', '--porcelain=v1', '--', path], cwd=SKILLS))
    check('exact skill tree ' + path, 'git-tree:' + subprocess.check_output(['git', 'rev-parse', 'HEAD:' + path], cwd=SKILLS).decode().strip() == skill['digest'])
remote_result = subprocess.run(['gh', 'pr', 'view', '336', '--repo', 'vercel-labs/json-render', '--json', 'headRefOid,baseRefOid,state,mergeable,reviewDecision,url,statusCheckRollup'], cwd=TARGET, capture_output=True, text=True)
(OUT / 'final-pr-state.json').write_text(remote_result.stdout)
(OUT / 'final-pr-state.stderr').write_text(remote_result.stderr)
check('remote query completed', remote_result.returncode == 0)
remote = json.loads(remote_result.stdout) if remote_result.returncode == 0 else {}
check('remote unchanged base head open', remote.get('headRefOid') == report['run']['head'] and remote.get('baseRefOid') == report['run']['base'] and remote.get('state') == 'OPEN')
check('23 successful remote checks', len(remote.get('statusCheckRollup', [])) == 23 and all(c.get('conclusion') in [None, 'SUCCESS', 'SKIPPED', 'NEUTRAL'] and c.get('state') in [None, 'SUCCESS'] and c.get('status') in [None, 'COMPLETED'] for c in remote.get('statusCheckRollup', [])))
render = subprocess.run(['bash', str(GATE), 'render', str(RUN / 'run-report.json'), str(OUT / 'view-verification.md')], cwd=TARGET, capture_output=True, text=True)
check('official render succeeds', render.returncode == 0)
view = (OUT / 'view-verification.md').read_text().replace('- Same family: no', '- Same family: unknown; no cross-family independence claimed').replace('## Verified properties', '## Property ledger (includes refuted claims)')
check('human view deterministically derived with display-only corrections', view == (RUN / 'run-report.md').read_text())
gate = subprocess.run(['bash', str(GATE), 'report', str(RUN / 'run-report.json')], cwd=TARGET, capture_output=True, text=True)
(OUT / 'final-gate-validation.log').write_text(gate.stdout + gate.stderr)
expected_reasons = [
    'run.status must be complete before the gate can pass',
    'run.verdict must be pass before the gate can pass',
    'a pass report cannot contain run gaps',
    'property P3 is not verified',
    'property P5 is not verified',
    'assumption ASSUMPTION-3 is refuted',
    'stage_receipts.test_strength is required but did not pass',
    'stage_receipts.resilience is required but did not pass',
    'finding F1 remains open',
    'finding F2 remains open',
    'finding TS-3 remains open'
]
check('gate returns 1 for precisely the eleven known promotion blockers', gate.returncode == 1 and gate.stdout.splitlines() == ['FINDING [report] ' + reason for reason in expected_reasons] and not gate.stderr)
failed = [c for c in checks if not c['pass']]
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
result = {'status': 'fail' if failed else 'pass', 'exit_code': 1 if failed else 0, 'checked_at': now, 'checks_count': len(checks), 'failures': failed, 'checks': checks, 'review_gate_status': 'incomplete', 'review_gate_exit_code': gate.returncode, 'review_gate_blockers': expected_reasons, 'source_clean': not subprocess.check_output(['git', 'status', '--porcelain=v1'], cwd=TARGET), 'head': report['run']['head'], 'remote_query_exit_code': remote_result.returncode, 'command': 'python3 resumed-coordinator/verify-integration.py', 'meaning': 'Artifact consistency and preservation pass, not a promotion pass.'}
if not failed:
    manifest['stages']['handoff'].update({'finished_at': now, 'reason': 'Resumed review receipts, blockers and preserved historical state documented; no fixes/publications.', 'evidence': [str(HANDOFF), str(OUT / 'resumption.json'), str(OUT / 'integration-validation.json')], 'receipt_id': 'handoff:json-render:336:de6a9bd:resumed'})
    manifest['close_cycle']['handoff'] = 'complete'
    manifest['updated_at'] = now
    temporary = RUN / 'manifest.resume-verified.tmp'
    temporary.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    os.replace(temporary, RUN / 'manifest.json')
result['final_sha256'] = {str(path): sha(path) for path in [RUN / 'manifest.json', RUN / 'run-report.json', RUN / 'run-report.md', HANDOFF, security_path, RUN / 'resumed-resilience/receipt.json', RUN / 'resumed-challenge/receipt.json']}
(OUT / 'integration-validation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: result[key] for key in ['status', 'exit_code', 'checks_count', 'failures', 'review_gate_status', 'review_gate_exit_code', 'source_clean', 'head']}, indent=2))
raise SystemExit(result['exit_code'])
