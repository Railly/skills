import hashlib
import json
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone

out = Path(__file__).resolve().parent
root = Path('/tmp/portless-review-424-fad78e9c')
copy = out / 'disposable'
receipt = json.loads((out / 'stage-receipt.json').read_text())
initial_receipt = dict(receipt)
(out / 'preparation-receipt.json').write_text(json.dumps(initial_receipt, indent=2) + '\n')
fingerprints = json.loads((out / 'fingerprints.json').read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
for name, digest in fingerprints.items():
    path = Path(name) if Path(name).is_absolute() else root / name
    assert sha(path) == digest, 'Frozen input changed: ' + name
for name in ['src/hosts.ts', 'src/hosts.test.ts', 'src/cli.test.ts', 'dist/cli.js', 'dist/chunk-RQ7SS7J3.js', 'dist/index.js']:
    assert sha(copy / name) == sha(root / 'packages/portless' / name), 'Scratch not restored: ' + name
checks = []
for cwd, args in [(root, ['git', 'rev-parse', 'HEAD']), (root, ['git', 'status', '--porcelain=v1', '--untracked-files=all']), (Path('/Users/raillyhugo/Programming/railly/skills'), ['git', 'rev-parse', 'HEAD'])]:
    p = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    assert p.returncode == 0
    checks.append({'command': ' '.join(args), 'cwd': str(cwd), 'exit_code': p.returncode, 'stdout': p.stdout, 'stderr': p.stderr})
assert checks[0]['stdout'].strip() == receipt['head']
assert checks[1]['stdout'] == ''
assert checks[2]['stdout'].strip() == receipt['skill_revision']
(out / 'final-checks.json').write_text(json.dumps({'commands': checks, 'input_fingerprints_unchanged': True, 'scratch_production_and_original_tests_restored': True}, indent=2) + '\n')
original = json.loads((out / 'mutation-results.json').read_text())
extra = json.loads((out / 'gap-mutation-results.json').read_text())
commands = sum([json.loads((out / ('commands-' + mode + '.json')).read_text()) for mode in ['baseline', 'mutate', 'gaps']], [])
for command in commands:
    text = Path(command['log']).read_text()
    command['meaningful_output'] = [line.strip() for line in text.splitlines() if line.strip().startswith(('Test Files', 'Tests ', 'FAIL ', 'AssertionError:'))]
(out / 'commands.json').write_text(json.dumps(commands, indent=2) + '\n')
for mutation in original + extra:
    text = Path(mutation['red_log']).read_text()
    mutation['failed_tests'] = [line.strip() for line in text.splitlines() if line.strip().startswith('FAIL ')]
    mutation['assertions'] = [line.strip() for line in text.splitlines() if line.startswith('AssertionError:')]
    mutation['mutant_exit_code'] = 1 if mutation['outcome'] == 'killed' else 0
    mutation['restored_exit_code'] = 0
(out / 'verified-mutations.json').write_text(json.dumps(original + extra, indent=2) + '\n')
assert sum(m['outcome'] == 'survived' for m in original) == 4
assert all(m['outcome'] == 'killed' for m in extra)
assert '33 passed' in (out / 'logs/final-green-repeat.log').read_text()
model_rows = [
    ('I-P', 'initial-source; fix-absent-base-hosts', 'Existing helper test red on second read after initial failure; restored zero-write assertions pass. Built populated initial failure remains parent boundary evidence, not a separately killed populated CLI mutant.'),
    ('I-E', 'initial-source; initial-built; cli-empty-bypass', 'Existing helper and built CLI red; true/exit0 instead of false/exit1.'),
    ('I-C', 'cleanup-source; cleanup-built; cli-ignore-clean-result', 'Existing helper and built cleanup guard red; false/exit1 restored.'),
    ('V-P', 'verification-null-source', 'Existing populated helper rejects accepting null verification. Populated CLI verification path was driven by resilience, not independently falsified by authored populated CLI test.'),
    ('V-E', 'verification-empty-source; verification-built; fix-absent-base-hosts', 'Existing helper and CLI reject null-as-empty success.'),
    ('M-P', 'mismatch-source', 'Existing helper red when predicate is skipped.'),
    ('M-E', 'empty-mismatch-source; gap-empty-mismatch', 'Original suite survivor; scratch test red on stale readable result, restored false.'),
    ('W-P', 'write-error-source', 'Existing helper red on swallowed write error.'),
    ('N-E', 'falsey-initial-source; noop-source', 'Existing helper detects conflating readable empty with failure and unnecessary write.'),
    ('N-P', 'noop-source', 'Existing helper detects unnecessary rewrite of exact block.'),
    ('R-E', 'cli-empty-bypass', 'Existing built CLI test red on zero writes instead of stale reconciliation.'),
    ('R-P', 'cli-wrong-argument; gap-cli-wrong-argument', 'Original suite survivor at real CLI call site; scratch populated test red on absent app.test record. Route fixture uses live test PID and two independently specified records.'),
    ('C-E', 'cleanup-readable-source; gap-cleanup-readable', 'Original suite survivor; scratch no-block cleanup test red on false instead of true.'),
    ('C-S', 'cleanup-readable-source; gap-cleanup-readable', 'Original suite survivor; scratch stale cleanup test red on false instead of true; healthy assertions check writes and retained records.'),
    ('C-W', 'gap-cleanup-write-error', 'No original selected test exercises cleanup write failure; scratch-only fault changes catch to true and fails expected false. Not included in original 18-mutant survivor count.'),
    ('B-R', 'cli-ignore-sync-result; cli-ignore-clean-result', 'Existing CLI failure assertions detect ignored helper return values.'),
    ('B-U', 'initial-built; cli-empty-bypass', 'Existing sudo-success test fails when escalation is bypassed. Only stubbed sudo, not actual privileged child.'),
    ('B-F', 'cli-ignore-sudo-failure; gap-cli-sudo-failure', 'Original suite survivor; scratch failed-sudo test red on exit0 instead of exit1.'),
]
(out / 'model-results.json').write_text(json.dumps([{'cell': a, 'falsifiers': b, 'result': c} for a,b,c in model_rows], indent=2) + '\n')
wall_seconds = round(sum(c['elapsed_seconds'] for c in commands), 3)
report = '''# Test-strength receipt report: portless#424

Status: gaps in existing authored regression coverage; changed safety guards verified. No introduced production defect demonstrated in scope. Review-only, no fixes or GitHub mutations.

## Execution and oracle

Full test-strength skill read; source revision 77fdde3e8d7e13b7c27c7660f7c15619839e38af. Frozen HEAD fad78e9c5e3f1958558eca616d747313e4d4ba60, base 1ad573bb95810daf6cd50c1718707015450f3f09. Parent manifest remains parent-owned. Contract/environment digests are in stage-receipt.json, unchanged from preparation.

Model dimensions, exclusions and independent oracle are in model.md. Resilience evidence was read and its built CLI hash checked against the frozen artifact before tests: 53 cells, 159 actual CLI process invocations, no unexpected oracle failures. Its producer was disposable filesystem bytes with an inspected preload. This stage then ran PR-authored tests with in-memory fs mocks and real built CLI child processes using the PR's inspected preload. Sudo is only a spawnSync stub. Real system hosts and elevated OS permissions were deliberately not exercised.

All target inputs were byte-fingerprinted before and after. Source/built mutants existed only in test-strength/disposable. Existing tests were copied byte-for-byte and filtered by name. Node dependency files were read through one vitest symlink; cache, HOME and TMPDIR remained inside this stage. No target build or package installation occurred. Six new review-only tests were added in disposable/src/gaps.test.ts and cli-gaps.test.ts, with cli-fixture.ts materialized from the PR's already inspected harness. Populated route fixture uses the live Vitest PID, not a dead synthetic PID; its two route records survive the real RouteStore consumer. Expected records are literal reserved .test/documentation-IP fixtures, not generated by production helpers.

Selected methods: deterministic control-flow mutation, actual base-source differential substitution, fs failure injection, built-artifact dispatch checks, and repeated green runs. No parser/property fuzz campaign: parser behavior did not change and malformed-block semantics were expressly excluded. No parser fixes, no reinterpretation of resilience's preexisting malformed-block finding.

## Results

- Existing focused suite: 27 passed, 160 deliberately skipped, twice; exit 0 both times. Selection includes 12 mutation-safety tests, 9 exact-block predicate tests, 6 CLI safety tests. DNS tests excluded so system hosts is not consulted by DNS lookup.
- Original 18-mutant campaign: 14 killed with intended assertion failures (exit 1), 4 survived (exit 0). Every mutation immediately restored and rerun green (exit 0). No transform, syntax, setup, timeout or unrelated test failure accepted as a kill.
- Changed initial-read/verification/cleanup guards were falsified both in src/hosts.ts and the shared bundled chunk loaded by the CLI. CLI result handling and empty-route reconciliation were also falsified at the actual dist/cli.js call site. Source-only mutations do not establish bundle coverage; results keep those separate.
- Literal merge-base hosts.ts substitution: four expected authored failures (populated initial-read second read, empty initial-read false success, cleanup false success, empty verification false success), exit 1. HEAD source restored: all 27 pass, exit 0.
- Scratch probes: all four original survivors killed by six additional review-only tests. Separate cleanup-write-error probe also killed. Final combined suite: 33 passed, 160 skipped, twice; exit 0. These added tests are evidence only and are not in the PR.

## Meaningful original-suite survivors

| Mutant | Why existing green is insufficient | Scratch proof | Classification |
|---|---|---|---|
| cli-wrong-argument | Manual dispatcher passes [] instead of loaded route names; all six existing CLI safety cases use empty routes | Populated CLI test fails because app.test/api.test records are absent; restore passes | Missing populated CLI regression coverage, not current defect |
| empty-mismatch-source | Readable stale post-write content accepted solely because desired set is empty | Empty sync write-noop test expects false and receives true; restore passes | Missing empty readback-mismatch coverage, not current defect |
| cleanup-readable-source | All readable cleanup attempts return false without writing | Readable no-block/stale cleanup tests fail; restore passes | Adjacent cleanup-success coverage gap, outside the new null guard itself |
| cli-ignore-sudo-failure | CLI returns success regardless of stubbed sudo status | Failed escalation test expects exit1 and receives exit0; restore passes | Adjacent existing error-path coverage gap, not introduced by PR |

These are survivors of the exact focused selection, not a claim about every repository test. Resilience independently exercises several of these behaviors today; passing exploratory evidence does not add a durable PR regression test.

## Per-cell evidence

| Model cell | Falsifier IDs (each has patch plus exact red/restored log) | Result / remaining boundary limitation |
|---|---|---|
'''
for a,b,c in model_rows:
    report += '| ' + a + ' | ' + b + ' | ' + c + ' |\n'
report += '''
The dimensions also admit empty-write-error, readable-empty/populated-sync, and non-root cleanup combinations not individually falsified here. They are named supplemental gaps rather than implicitly counted as covered by W-P/N-E/B-U. Parent resilience exercises those partitions, but this compact authored-test campaign makes no deletion-sensitivity claim for them. Populated CLI guard failures have helper mutation proof and resilience drive, not independent populated CLI mutant kills. Windows, actual sudo child/environment propagation, actual system-hosts permissions, concurrent writers, proxy lifecycle and top-level trust cleanup remain outside this test stage.

## Commands, repeatability and cost

From this stage directory, the exact orchestrator commands were:

    python3 /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-portless-424-fad78e9c/test-strength/campaign.py baseline
    python3 /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-portless-424-fad78e9c/test-strength/campaign.py mutate
    python3 /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/2026-09-14-portless-424-fad78e9c/test-strength/campaign.py gaps

All three orchestrators exited 0. Actual invocation cwd was /Users/raillyhugo/Programming/railly/skills; subprocess cwd is the disposable materialization. commands.json records every exact expanded Node/Vitest command, environment, exit, duration and meaningful output. logs/*.log contains complete stdout/stderr, including expected reds. Mutation patches and before/after SHA256 records are retained. Repeat does not install dependencies. PR-focused checks take under one second per original run here; the combined scratch checks take roughly one second. A focused PR check is cheap; broader resilience/mutation campaigns can remain review/scheduled checks. No CI changes were authorized or made.

'''
report += 'Total measured subprocess time: ' + str(wall_seconds) + ' seconds. This excludes reading, authoring and chat time. Reproducibility uses exact fixtures and deterministic injected stages, no random seed or probabilistic shrinking needed. Final input fingerprints and scratch restoration checks passed; git status is empty.\n'
(out / 'report.md').write_text(report)
receipt.update({
    'status': 'gaps', 'verdict': 'Changed guards and empty CLI wiring kill realistic faults; four meaningful original focused-suite survivors documented and killed by scratch-only probes.',
    'command': 'python3 ' + str(out / 'campaign.py') + ' baseline; python3 ' + str(out / 'campaign.py') + ' mutate; python3 ' + str(out / 'campaign.py') + ' gaps',
    'commands_path': str(out / 'commands.json'), 'report_path': str(out / 'report.md'), 'model_path': str(out / 'model.md'), 'model_results_path': str(out / 'model-results.json'),
    'completed_at': datetime.now(timezone.utc).isoformat(), 'elapsed_seconds': wall_seconds, 'elapsed_scope': 'Sum of recorded verification subprocess durations only; reading and authoring excluded',
    'tests_run': True, 'mutations_run': True, 'blocker': None,
    'verification_state': '27 existing tests green twice; 18 mutants:14 killed/4 survived; all four survivors killed by scratch tests; base source yields four expected failures; final 33 tests green twice; all scratch production restored; frozen fingerprints and clean status verified.',
    'reusable': False, 'dependency_cone_evidence': [str(out / 'fingerprints.json'), str(out / 'final-checks.json'), str(out / 'resilience-link.json')],
    'reuse_reason': 'No cross-head reuse claimed. Hashes pin hosts source/tests, CLI source/tests, built CLI/shared chunk, package/runtime inputs and skill. New diff or dependency/runtime change requires re-evaluation.',
    'original_mutants': {'total': 18, 'killed': 14, 'survived': 4}, 'scratch_probe_mutants_killed': 5, 'fix_absent_base_test_failures': 4,
    'survivors': [m['id'] for m in original if m['outcome'] == 'survived'],
    'manifest': {'present': (out.parent / 'manifest.json').exists(), 'updated_by_this_stage': False, 'owner': 'parent; user explicitly prohibited stage edits'},
    'evidence': [str(out / name) for name in ['verified-mutations.json', 'commands.json', 'model-results.json', 'final-checks.json']],
})
(out / 'stage-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
(out / 'ready.json').write_text(json.dumps({'status': 'complete-with-coverage-gaps', 'head': receipt['head'], 'receipt': str(out / 'stage-receipt.json'), 'report': str(out / 'report.md'), 'tests_run': True}, indent=2) + '\n')
print(json.dumps({'status': receipt['status'], 'existing_tests': 27, 'final_tests': 33, 'original_mutants': receipt['original_mutants'], 'base_regression_failures': 4, 'frozen_clean': True, 'scratch_restored': True, 'elapsed_seconds': wall_seconds, 'report': str(out / 'report.md')}, indent=2))
