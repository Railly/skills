import hashlib
import json
import pathlib
import platform
import shlex
import subprocess
import time
from datetime import datetime, timezone

out = pathlib.Path(__file__).resolve().parent
root = pathlib.Path('/tmp/portless-review-424-fad78e9c')
skills = pathlib.Path('/Users/raillyhugo/Programming/railly/skills')
head = 'fad78e9c5e3f1958558eca616d747313e4d4ba60'
base = '1ad573bb95810daf6cd50c1718707015450f3f09'
started = time.monotonic()
records = []

def capture(name, argv, cwd):
    start = time.monotonic()
    result = subprocess.run(argv, cwd=cwd, text=True, capture_output=True)
    record = {'command': shlex.join(argv), 'cwd': str(cwd), 'exit_code': result.returncode, 'elapsed_seconds': round(time.monotonic() - start, 3), 'stdout': result.stdout, 'stderr': result.stderr}
    records.append(record)
    (out / (name + '.txt')).write_text(json.dumps(record, indent=2) + '\n')
    if result.returncode:
        raise RuntimeError(name + ' failed; see captured output')
    return result.stdout

actual_head = capture('head', ['git', 'rev-parse', 'HEAD'], root).strip()
assert actual_head == head
assert capture('frozen-status', ['git', 'status', '--short'], root) == ''
assert capture('merge-base', ['git', 'merge-base', 'HEAD', base], root).strip() == base
assert capture('skill-revision', ['git', 'rev-parse', 'HEAD'], skills).strip() == '77fdde3e8d7e13b7c27c7660f7c15619839e38af'
capture('changed-diff', ['git', 'diff', base + '...HEAD', '--', 'packages/portless/src/hosts.ts', 'packages/portless/src/hosts.test.ts', 'packages/portless/src/cli.ts', 'packages/portless/src/cli.test.ts'], root)
contract = capture('contract-diff', ['git', 'diff', base + '...HEAD', '--', 'README.md', 'apps/docs/src/app/commands/page.mdx', 'skills/portless/SKILL.md'], root)
env = {'node': capture('node-version', ['node', '--version'], root).strip(), 'bun': capture('bun-version', ['bun', '--version'], root).strip(), 'platform': platform.platform(), 'machine': platform.machine()}
paths = ['packages/portless/src/hosts.ts', 'packages/portless/src/hosts.test.ts', 'packages/portless/src/cli.ts', 'packages/portless/src/cli.test.ts', 'packages/portless/package.json', 'package.json', 'pnpm-lock.yaml']
paths += [str(p.relative_to(root)) for p in sorted((root / 'packages/portless/dist').glob('*.js'))]
fingerprints = {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in paths}
skill_path = skills / 'skills/.experimental/test-strength/SKILL.md'
fingerprints[str(skill_path)] = hashlib.sha256(skill_path.read_bytes()).hexdigest()
manifest = out.parent / 'manifest.json'
manifest_state = {'present': manifest.exists(), 'updated_by_this_stage': False}
if manifest.exists():
    manifest_state['sha256'] = hashlib.sha256(manifest.read_bytes()).hexdigest()
(out / 'fingerprints.json').write_text(json.dumps(fingerprints, indent=2) + '\n')
(out / 'inspection-commands.json').write_text(json.dumps(records, indent=2) + '\n')
receipt = {
    'stage': 'test-strength', 'status': 'ready-awaiting-parent-boundary-drive', 'head': head, 'merge_base': base,
    'command': 'python3 ' + str(out / 'prepare.py'), 'commands_path': str(out / 'inspection-commands.json'),
    'relevant_paths': paths, 'contract_digest': hashlib.sha256(contract.encode()).hexdigest(),
    'contract_digest_basis': 'SHA256 of exact git diff for changed README/docs/portless skill; provisional until parent manifest contract is available',
    'environment': env, 'environment_digest': hashlib.sha256(json.dumps(env, sort_keys=True).encode()).hexdigest(),
    'skill_revision': '77fdde3e8d7e13b7c27c7660f7c15619839e38af', 'skill_path': str(skill_path),
    'elapsed_seconds': round(time.monotonic() - started, 3), 'elapsed_scope': 'recorded inspection capture only',
    'created_at': datetime.now(timezone.utc).isoformat(), 'report_path': str(out / 'model.md'),
    'reusable': False, 'dependency_cone_evidence': str(out / 'fingerprints.json'),
    'manifest': manifest_state, 'tests_run': False, 'mutations_run': False,
    'blocker': 'User requires parent/resilience built CLI drive before authored tests; no parent drive evidence or release-to-run received.',
    'verification_state': 'HEAD, merge base, frozen worktree cleanliness, skill revision, source tests and CLI preload inspected. No behavioral verification claimed.',
    'safety': 'No source edits, no GitHub mutation, no sudo invocation, no system hosts access. All stage writes restricted to this directory.'
}
(out / 'stage-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
(out / 'ready.json').write_text(json.dumps({'status': receipt['status'], 'head': head, 'model': str(out / 'model.md'), 'receipt': str(out / 'stage-receipt.json'), 'tests_run': False, 'message': 'Ready for parent built CLI drive. Resume this stage after boundary evidence is available.'}, indent=2) + '\n')
print(json.dumps({'status': receipt['status'], 'tests_run': False, 'manifest_present': manifest_state['present'], 'receipt': str(out / 'stage-receipt.json')}, indent=2))
