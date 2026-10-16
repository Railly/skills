import pathlib, json, hashlib, subprocess, datetime, time
O = pathlib.Path(__file__).resolve().parent
start = time.monotonic()
r = json.loads((O / 'receipt.json').read_text())
checks = []
def check(name, value):
    checks.append({'check': name, 'pass': bool(value)})
def sha(path):
    return 'sha256:' + hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
check('stage is complete and failed, not safe/green', r['status'] == 'fail' and r['execution_status'] == 'completed' and r['method_complete'])
check('exact head fingerprint', r['head_sha'] == r['fingerprint']['head_sha'] == subprocess.check_output(['git', '-C', '/Users/raillyhugo/Programming/vercel/json-render-336-review', 'rev-parse', 'HEAD']).decode().strip())
check('clean target', not subprocess.check_output(['git', '-C', '/Users/raillyhugo/Programming/vercel/json-render-336-review', 'status', '--porcelain']))
check('exact skill', r['skill_revision'] == 'git:77fdde3e8d7e13b7c27c7660f7c15619839e38af')
check('positive elapsed time', r['elapsed_ms'] > 0)
check('head tests 26 passed, F1 F2 only failed', (r['test_results']['head']['numTotalTests'], r['test_results']['head']['numPassedTests'], r['test_results']['head']['numFailedTests']) == (28, 26, 2))
check('base 28 observation/control tests passed', (r['test_results']['base']['numTotalTests'], r['test_results']['base']['numPassedTests'], r['test_results']['base']['exit_code']) == (28, 28, 0))
check('unknown identities and no independence claim', r['identity_and_independence']['author'] is None and r['identity_and_independence']['author_model'] is None and r['identity_and_independence']['reviewer_model'] is None and not r['identity_and_independence']['cross_family_independence_established'])
check('no fixes or publications and manifest deliberately not linked', not r['fixes'] and not r['authorization']['publications'] and not r['authorization']['manifest_updated'] and not r['authorization']['run_report_updated'])
check('matrix has 28 executed, 6 explicit gaps, 6 justified NA', r['matrix_counts'] == {'executed_cells': 28, 'gap_cells': 6, 'not_applicable_cells': 6})
for row in r['matrix']:
    if row['execution'] == 'executed':
        head_path, key = row['evidence']['head'].split('#')
        base_path, base_key = row['evidence']['base'].split('#')
        heads = json.loads(pathlib.Path(head_path).read_text())
        bases = json.loads(pathlib.Path(base_path).read_text())
        check(row['id'] + ' reproducible evidence, expected state/signal, retry and owner/deadline', any(t['id'] == key for t in heads) and any(t['id'] == base_key for t in bases) and row['expected_state_and_signal'] and row['retry'] and row['cleanup'].get('owner') and row['cleanup'].get('deadline'))
    else:
        check(row['id'] + ' explicit scope justification', row.get('reason'))
for cp in r['commit_points']:
    check(cp['id'] + ' commit, owner, timeout, cancellation, idempotency, forced partitions and cleanup', all(cp.get(k) for k in ['commit', 'owner', 'timeout', 'cancel', 'idempotency', 'partitions', 'cleanup']))
for c in r['commands']:
    check(c['log'] + ' command/exit/output evidence', bool(c['command']) and isinstance(c['exit_code'], int) and pathlib.Path(c['log']).is_file())
for path, expected in r['evidence_hashes'].items():
    check('evidence hash: ' + path, sha(path) == expected)
pre = json.loads((O / 'preflight.json').read_text())
for path, expected in {**pre['prior_evidence'], **pre['artifacts']}.items():
    check('protected unchanged: ' + path, sha(path) == expected)
for path, expected in r['fingerprint']['dependency_cone']['probe_hashes'].items():
    check('probe fingerprint: ' + path, sha(path) == expected)
check('contract compact digest matches run fingerprint', r['fingerprint']['contract_digest'] == 'sha256:' + hashlib.sha256(json.dumps(json.loads((O.parent / 'contract.json').read_text()), separators=(',', ':')).encode()).hexdigest())
check('environment digest correct', r['fingerprint']['environment_digest'] == 'sha256:' + hashlib.sha256(json.dumps(json.loads((O / 'environment.json').read_text()), sort_keys=True, separators=(',', ':')).encode()).hexdigest())
check('human report and integrity artifact exist', pathlib.Path(r['report_path']).is_file() and pathlib.Path(r['final_integrity']['evidence']).is_file())
failed = [c for c in checks if not c['pass']]
record = {'command': 'python3 validate-receipt.py', 'cwd': str(O), 'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'elapsed_ms': round((time.monotonic() - start) * 1000), 'exit_code': 1 if failed else 0, 'status': 'fail' if failed else 'pass', 'receipt_status_not_overridden': r['status'], 'receipt_sha256': sha(O / 'receipt.json'), 'checks_count': len(checks), 'failures': failed, 'checks': checks}
(O / 'receipt-validation.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({k: record[k] for k in ['status', 'exit_code', 'checks_count', 'failures', 'receipt_status_not_overridden', 'receipt_sha256']}, indent=2))
raise SystemExit(record['exit_code'])
