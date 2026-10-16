import datetime
import hashlib
import json
import pathlib
import subprocess

OUT = pathlib.Path(__file__).resolve().parent
RUN = OUT.parent
TARGET = pathlib.Path('/Users/raillyhugo/Programming/vercel/json-render-336-review')
SKILLS = pathlib.Path('/Users/raillyhugo/Programming/railly/skills')
GATE = SKILLS / 'skills/review-gate/scripts/gate.sh'
BASE = '6c7164342a37fab055907f1666658e1333e2cb86'
HEAD = 'de6a9bdbc0100ac778dff1ad48ab2f732b7d181e'
records = []

def run(name, argv, cwd=TARGET, expected=0):
    result = subprocess.run(argv, cwd=cwd, capture_output=True, text=True)
    (OUT / (name + '.stdout')).write_text(result.stdout)
    (OUT / (name + '.stderr')).write_text(result.stderr)
    records.append({'name': name, 'argv': list(map(str, argv)), 'cwd': str(cwd), 'exit_code': result.returncode, 'expected_exit_code': expected, 'stdout': str(OUT / (name + '.stdout')), 'stderr': str(OUT / (name + '.stderr'))})
    assert result.returncode == expected, (name, result.returncode, result.stderr)
    return result.stdout

for name in ['manifest.json', 'run-report.json', 'run-report.md', 'report-validation.log']:
    before = OUT / (name + '.before')
    if not before.exists():
        before.write_bytes((RUN / name).read_bytes())
    else:
        assert before.read_bytes() == (RUN / name).read_bytes(), 'Do not rerun intake after integration'
handoff = pathlib.Path('/Users/raillyhugo/kai/05_Areas/vercel/json-render-handoff.md')
before = OUT / 'handoff.before.md'
if not before.exists():
    before.write_bytes(handoff.read_bytes())
assert run('head', ['git', 'rev-parse', 'HEAD']).strip() == HEAD
assert not run('target-status', ['git', 'status', '--porcelain=v1'])
remote = json.loads(run('pr-state', ['gh', 'pr', 'view', '336', '--repo', 'vercel-labs/json-render', '--json', 'headRefOid,baseRefOid,state,mergeable,reviewDecision,url,statusCheckRollup']))
assert remote['headRefOid'] == HEAD and remote['baseRefOid'] == BASE and remote['state'] == 'OPEN'
checks = remote['statusCheckRollup']
summary = {'total': len(checks), 'unsuccessful': [c for c in checks if (c.get('conclusion') not in [None, 'SUCCESS', 'SKIPPED', 'NEUTRAL'] or c.get('state') not in [None, 'SUCCESS'] or c.get('status') not in [None, 'COMPLETED'])]}
run('covered', ['bash', str(GATE), 'covered', str(RUN.parent), '336'])
run('style', ['bash', str(GATE), 'style', BASE])
run('surfaces', ['bash', str(GATE), 'surfaces', str(RUN / 'conventions.used.md'), BASE])
run('diff-check', ['git', 'diff', '--check', BASE, HEAD])
run('version-check', ['bun', 'scripts/check-version-sync.js'])
run('security-identity', ['python3', 'verify-identity.py', 'final-identity-check.json'], RUN / 'resumed-security')
run('security-receipt-validation', ['python3', 'validate-receipt.py'], RUN / 'resumed-security')
run('resilience-receipt-validation', ['python3', 'validate-receipt.py'], RUN / 'resumed-resilience')
run('challenge-validation', ['bun', 'validate.mjs'], RUN / 'resumed-challenge')
packages = ['skills/review-gate', 'skills/.experimental/test-strength', 'skills/.experimental/security-review', 'skills/.experimental/resilience-audit']
assert not run('skill-status', ['git', 'status', '--porcelain=v1', '--', *packages], SKILLS)
assert run('skill-revision', ['git', 'rev-parse', 'HEAD'], SKILLS).strip() == '77fdde3e8d7e13b7c27c7660f7c15619839e38af'
protected = {}
for name in ['identity.json', 'contract.json', 'core-build.log', 'core-tests.log', 'typecheck-comparison.json', 'test-strength/receipt.json', 'test-strength/copy-survivor-results.json', 'resumed-security/security-receipt.json', 'resumed-resilience/receipt.json', 'resumed-challenge/receipt.json']:
    protected[name] = hashlib.sha256((RUN / name).read_bytes()).hexdigest()
record = {'status': 'pass', 'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'head': HEAD, 'base': BASE, 'checks': records, 'ci': summary, 'protected_sha256': protected, 'target_clean': True, 'source_mutations': False, 'publications': False, 'xref': {'command': 'xref 336 --repo vercel-labs/json-render --depth 2 --no-snapshot', 'exit_code': 0, 'nodes': {'336': 'OPEN', '337': 'CLOSED'}, 'notes': 'No additional open GitHub node in the graph. Deployment/preview links not opened. No comment, review or mutation.'}}
(OUT / 'checks.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({'status': 'pass', 'commands': len(records), 'ci': summary, 'target_clean': True}, indent=2))
