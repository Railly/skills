import pathlib, json, hashlib, subprocess, datetime, platform
R = pathlib.Path(__file__).resolve().parent.parent
O = R / 'resumed-resilience'
T = pathlib.Path('/Users/raillyhugo/Programming/vercel/json-render-336-review')
S = pathlib.Path('/Users/raillyhugo/Programming/railly/skills')
sha = lambda b: 'sha256:' + hashlib.sha256(b).hexdigest()
def git(*args):
    return subprocess.check_output(['git', '-C', str(T), *args])
m = json.loads((R / 'manifest.json').read_text())
head = git('rev-parse', 'HEAD').decode().strip()
base = m['work_item']['base_sha']
status = git('status', '--porcelain')
print(json.dumps({'head': head, 'expected': m['work_item']['head_sha'], 'status': status.decode()}), flush=True)
assert head == m['work_item']['head_sha']
assert not status
contract = sha(json.dumps(json.loads((R / 'contract.json').read_text()), separators=(',', ':')).encode())
assert contract == m['stages']['resilience']['fingerprint']['contract_digest']
changed = git('diff', '--name-only', base, head)
paths = changed.decode().splitlines() + ['packages/react/src/hooks.ts', 'packages/react-state/src/index.tsx', 'packages/core/src/store-utils.ts', 'pnpm-lock.yaml', 'package.json']
files = {p: sha((T / p).read_bytes()) for p in paths}
for p in paths:
    assert (T / p).read_bytes() == git('show', head + ':' + p)
checks = []
artifacts = {}
for label, root, package in [('head', T, 'core'), ('base', R / 'base-typecheck', 'core'), ('head', T, 'react')]:
    for p in (root / 'packages' / package / 'dist').glob('*'):
        if p.is_file():
            artifacts[str(p)] = sha(p.read_bytes())
    for p in (root / 'packages' / package / 'dist').glob('*.map'):
        data = json.loads(p.read_text())
        for name, content in zip(data.get('sources', []), data.get('sourcesContent', [])):
            if content is None:
                continue
            resolved = (p.parent / name).resolve()
            try:
                rel = str(resolved.relative_to(root))
            except ValueError:
                continue
            if rel.startswith('packages/core/src/') or rel == 'packages/react/src/hooks.ts':
                assert content == git('show', (head if label == 'head' else base) + ':' + rel).decode(), (label, rel)
                checks.append({'build': label + '-' + package, 'map': str(p), 'source': rel, 'matches_git': True})
prior = [R / p for p in ['manifest.json', 'contract.json', 'run-report.json', 'run-report.md']]
for sub in ['coordinator', 'consumer', 'resumed-caller-review']:
    prior += [p for p in (R / sub).rglob('*') if p.is_file()]
env = {'platform': platform.platform(), 'node': subprocess.check_output(['node', '--version']).decode().strip(), 'bun': subprocess.check_output(['bun', '--version']).decode().strip(), 'dependencies': {}}
for pkg in ['vitest', 'vite', 'react', 'react-dom', 'jsdom', '@testing-library/react']:
    p = T / 'node_modules' / pkg
    if not (p / 'package.json').exists():
        resolved = subprocess.check_output(['node', '-e', "const r=require('node:module').createRequire(process.argv[1]); console.log(r.resolve(process.argv[2]+'/package.json'))", str((T / 'node_modules/vitest/package.json').resolve()), pkg]).decode().strip()
        p = pathlib.Path(resolved).parent
    env['dependencies'][pkg] = {'resolved': str(p.resolve()), 'version': json.loads((p / 'package.json').read_text())['version']}
rev = subprocess.check_output(['git', '-C', str(S), 'rev-parse', 'HEAD']).decode().strip()
assert 'git:' + rev == m['skill_revisions']['resilience-audit']['revision']
skill = S / 'skills/.experimental/resilience-audit/SKILL.md'
assert skill.read_bytes() == subprocess.check_output(['git', '-C', str(S), 'show', rev + ':skills/.experimental/resilience-audit/SKILL.md'])
out = {'started_at': '2026-09-14T18:26:58Z', 'verified_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'head_sha': head, 'base_sha': base, 'dirty_digest': 'clean', 'contract_digest': contract, 'changed_paths_digest': sha(changed), 'environment': env, 'environment_digest': sha(json.dumps(env, sort_keys=True).encode()), 'skill_revision': 'git:' + rev, 'skill_digest': sha(skill.read_bytes()), 'skill_tree': subprocess.check_output(['git', '-C', str(S), 'rev-parse', rev + ':skills/.experimental/resilience-audit']).decode().strip(), 'relevant_paths': files, 'artifacts': artifacts, 'source_map_checks': checks, 'prior_evidence': {str(p): sha(p.read_bytes()) for p in prior}}
(O / 'preflight.json').write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps({k: out[k] for k in ['head_sha', 'contract_digest', 'changed_paths_digest', 'environment_digest', 'skill_tree']}, indent=2))
print('Source-map checks:', len(checks), 'Protected prior files:', len(prior))
print('Run node_modules:', (R / 'node_modules').resolve())
