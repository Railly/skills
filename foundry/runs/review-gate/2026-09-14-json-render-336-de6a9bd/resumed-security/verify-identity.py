import hashlib
import json
import pathlib
import subprocess
import sys

OUT = pathlib.Path(__file__).resolve().parent
RUN = OUT.parent
TARGET = pathlib.Path('/Users/raillyhugo/Programming/vercel/json-render-336-review')
SKILLS = pathlib.Path('/Users/raillyhugo/Programming/railly/skills')

def git(root, *args):
    return subprocess.check_output(['git', '--no-optional-locks', '-C', str(root), *args])

def sha(data):
    return 'sha256:' + hashlib.sha256(data).hexdigest()

identity = json.loads((RUN / 'identity.json').read_text())
head = git(TARGET, 'rev-parse', 'HEAD').decode().strip()
base = identity['base_sha']
status = git(TARGET, 'status', '--porcelain=v1')
paths = git(TARGET, 'diff', '--name-only', base, head).decode().splitlines()
assert head == identity['head_sha'] == 'de6a9bdbc0100ac778dff1ad48ab2f732b7d181e'
assert base == '6c7164342a37fab055907f1666658e1333e2cb86'
assert not status
assert paths == identity['changed_paths']
package = 'skills/.experimental/security-review'
revision = git(SKILLS, 'rev-parse', 'HEAD').decode().strip()
assert revision == '77fdde3e8d7e13b7c27c7660f7c15619839e38af'
assert not git(SKILLS, 'status', '--porcelain=v1', '--', package)
tree = git(SKILLS, 'rev-parse', f'HEAD:{package}').decode().strip()
assert 'git-tree:' + tree == identity['skill_revisions']['security-review']['digest']
contract = (RUN / 'contract.json').read_bytes()
contract_digest = sha(json.dumps(json.loads(contract), separators=(',', ':')).encode())
assert contract_digest == identity['contract_digest']
assert sha(json.dumps(paths, separators=(',', ':')).encode()) == identity['changed_paths_digest']
source_hashes = {}
for path in paths + ['packages/core/src/index.ts', 'packages/core/src/store-utils.ts', 'packages/react/src/hooks.ts', 'packages/react-state/src/index.tsx']:
    data = (TARGET / path).read_bytes()
    assert data == git(TARGET, 'show', f'{head}:{path}')
    source_hashes[path] = sha(data)
map_checks = []
build_hashes = {}
for name in ['index.js', 'index.mjs', 'chunk-2ZV3P2JU.mjs', 'store-utils.js', 'store-utils.mjs']:
    artifact = TARGET / 'packages/core/dist' / name
    build_hashes[str(artifact.relative_to(TARGET))] = sha(artifact.read_bytes())
    mapping = json.loads(pathlib.Path(str(artifact) + '.map').read_text())
    checked = []
    for source, content in zip(mapping.get('sources', []), mapping.get('sourcesContent', [])):
        resolved = (artifact.parent / source).resolve()
        if resolved.is_relative_to(TARGET / 'packages/core/src'):
            path = str(resolved.relative_to(TARGET))
            assert content.encode() == git(TARGET, 'show', f'{head}:{path}'), path
            checked.append(path)
    map_checks.append({'artifact': str(artifact.relative_to(TARGET)), 'matching_exact_head_sources': checked})
covered = {p for m in map_checks for p in m['matching_exact_head_sources']}
assert {'packages/core/src/types.ts', 'packages/core/src/path-utils.ts', 'packages/core/src/state-store.ts'} <= covered
saved = {}
for name in ['identity.json', 'manifest.json', 'contract.json', 'run-report.json', 'run-report.md', 'public-export-probe.mjs', 'public-export-probe.json', 'core-build.log', 'core-tests.log', 'caller-contexts.txt', 'coordinator/hook-proof.test.ts', 'coordinator/hook-proof-head.json', 'consumer/result.json', 'resumed-caller-review/base-invalid-result.json', 'test-strength/receipt.json']:
    saved[name] = sha((RUN / name).read_bytes())
result = {'status': 'pass', 'head_sha': head, 'base_sha': base, 'dirty_digest': 'clean', 'changed_paths': paths, 'changed_path_digest': identity['changed_paths_digest'], 'changed_path_digest_basis': 'SHA256 of compact JSON without trailing newline; recomputed from current ordered git diff path list. Contract uses the same serialization.', 'changed_paths_raw_sha256': sha(git(TARGET, 'diff', '--name-only', base, head)), 'contract_digest': contract_digest, 'contract_raw_sha256': sha(contract), 'skill_revision': 'git:' + revision, 'skill_tree': 'git-tree:' + tree, 'source_sha256': source_hashes, 'built_sha256': build_hashes, 'sourcemap_identity': map_checks, 'saved_evidence_sha256': saved, 'runtime': {'bun': subprocess.check_output(['bun', '--version']).decode().strip(), 'node': subprocess.check_output(['node', '--version']).decode().strip()}, 'limitations': ['Source maps and current bundle hashes corroborate built provenance, not a reproducible-build attestation or retroactive execution signature. Saved logs are reused as historical evidence, not represented as newly executed tests.']}
name = sys.argv[1] if len(sys.argv) > 1 else 'identity-check.json'
assert name in ['identity-check.json', 'final-identity-check.json']
if name == 'final-identity-check.json':
    original = json.loads((OUT / 'identity-check.json').read_text())
    for key in ['source_sha256', 'built_sha256', 'saved_evidence_sha256']:
        assert original[key] == result[key], key
(OUT / name).write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'status': 'pass', 'head_sha': head, 'dirty': 'clean', 'source_maps_checked': len(map_checks), 'artifact': name}))
