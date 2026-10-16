import copy
import datetime
import hashlib
import json
import os
import pathlib
import platform
import subprocess

OUT = pathlib.Path(__file__).resolve().parent
RUN = OUT.parent
TARGET = pathlib.Path('/Users/raillyhugo/Programming/vercel/json-render-336-review')
SKILLS = pathlib.Path('/Users/raillyhugo/Programming/railly/skills')
GATE = SKILLS / 'skills/review-gate/scripts/gate.sh'

def load(path):
    return json.loads(path.read_text())

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def save(path, value):
    data = json.dumps(value, indent=2, ensure_ascii=False) + '\n'
    temporary = path.with_name(path.name + '.resume-tmp')
    temporary.write_text(data)
    os.replace(temporary, path)

checks = load(OUT / 'checks.json')
manifest = load(OUT / 'manifest.json.before')
report = load(OUT / 'run-report.json.before')
security_path = RUN / 'resumed-security/security-receipt.json'
resilience_path = RUN / 'resumed-resilience/receipt.json'
challenge_path = RUN / 'resumed-challenge/receipt.json'
security = load(security_path)
resilience = load(resilience_path)
challenge = load(challenge_path)
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
assert (RUN / 'manifest.json').read_bytes() == (OUT / 'manifest.json.before').read_bytes()
assert (RUN / 'run-report.json').read_bytes() == (OUT / 'run-report.json.before').read_bytes()
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=TARGET).decode().strip() == checks['head']
assert not subprocess.check_output(['git', 'status', '--porcelain=v1'], cwd=TARGET)
for name, digest in checks['protected_sha256'].items():
    path = RUN / name
    if name == 'resumed-security/security-receipt.json':
        path = RUN / 'resumed-security/security-receipt.v1.pre-schema-fix.json'
    assert sha(path) == digest, name
assert security['status'] == 'pass' and not security['verification']['gaps']
assert len(security['verification']['limitations']) == 5
assert resilience['status'] == 'fail' and challenge['satisfied'] is True
assert security['fingerprint']['head_sha'] == resilience['head_sha'] == challenge['head_sha'] == checks['head']
validation = subprocess.run(['python3', 'validate-receipt.py'], cwd=security_path.parent, capture_output=True, text=True)
(OUT / 'security-schema-validation.log').write_text(validation.stdout + validation.stderr)
assert validation.returncode == 0

environment = {'platform': platform.platform(), 'python': platform.python_version(), 'node': subprocess.check_output(['node', '--version']).decode().strip(), 'bun': subprocess.check_output(['bun', '--version']).decode().strip(), 'dependency_policy': 'existing linked dependencies only; no installs/rebuilds; source-map and bundle fingerprints retained in specialist receipts'}
save(OUT / 'environment.json', environment)
provenance_gap = 'Author and exact reviewer model identities/families are unknown. Native specialists are not cross-family evidence. Independent challenge is satisfied only by the saved implementation-independent normative oracle corpus; no blinded model/human review is claimed.'
execution = {'mode': 'native_subagent', 'degraded_from': 'fx_worker', 'independence_gap': provenance_gap, 'receipt': 'resumed-coordinator/resumption.json', 'schema_failures': 0, 'operations': [{'operation': name, 'attempted_calls': 1, 'schema_failures': 0, 'identical_retry': False} for name in ['Resume Security Review', 'Resume Resilience Audit', 'Normative independent challenge', 'Security receipt schema normalization']], 'upstream_fallback': 'Prior FX wrapper auth failure retained in archived manifest; not retried. Current native subagents completed.'}
report['execution'] = execution
report['provenance'] = {'author_model': 'unknown', 'reviewer_model': 'fx native subagents; exact model identifiers and families not asserted', 'same_family': None}
report['run'].update({'status': 'incomplete', 'verdict': 'incomplete', 'resumed_at': now, 'gaps': [
    'Required Test Strength remains fail: TS-3 copy-source guard survives 203 authored tests; F1/F2 remain open. No complete per-class falsifier coverage; saved receipt is consumed unchanged, not upgraded by positive corpus checks.',
    'Required Resilience Audit now has a method-complete exact-head receipt but remains fail: 26/28 observations pass, F1 and F2 fail. Real browser/network/resource bounds and other renderer runtimes are not verified; see resumed-resilience/receipt.json G01-G05.',
    'Full local workspace type-check remains unavailable under shared linked dependencies; no install/rebuild was attempted. Saved base/head core diagnostics are both 115 with zero normalized delta, and all 23 live exact-head CI checks succeeded.',
    'Source fixes and regression-test changes are not authorized in this review-only cycle. F1, F2 and TS-3 must be resolved on a new reviewed head before promotion.'
]})
report['risk']['independent_challenge'] = {'required': True, 'satisfied': True, 'method': challenge['method'], 'artifact': 'resumed-challenge/receipt.json', 'evidence': 'RFC-derived frozen expected outputs and public ESM/CJS JSONL boundaries: 742/744 checks pass, two explicitly retained root-slash normative diagnostics, zero unexpected failures; reused corpus 9042 assertions. Independent oracle only, not independent model family or full RFC conformance.'}
report['security_review'] = copy.deepcopy(security)
report['security_review']['artifact'] = str(security_path)
report['security_review']['skill_revision'] = security['fingerprint']['skill_revision']
report['security_review']['evidence'] = 'resumed-security/security-receipt.json and security-review.md: 1251 core cases; six source-pinned React characterization cases; no demonstrated cross-authority security blocker. Scope is core ordinary JSON/API, not universal renderer rejection. Nonmaterial limits retained in verification.limitations.'
report['stage_receipts']['resilience'] = copy.deepcopy(resilience)
report['stage_receipts']['resilience']['evidence'] = 'resumed-resilience/receipt.json: 28 executed cells, six explicit gaps, six N/A; head 26/28, base controls 28/28; immediate retries and cleanup owners documented. F1/F2 remain violated; descriptive passing probes do not certify baseline resilience.'
for prop in report['properties']:
    if prop['id'] == 'P4':
        prop.update({'claim': 'Core reserved-token read/write/remove/store/compound boundaries preserve global prototype integrity for ordinary JSON graphs. This does not assert universal legacy-renderer token rejection.', 'status': 'verified', 'oracle': {'observes': 'Global prototype descriptors, own keys, external sentinel state, store identities and publication counts', 'layer': 'exact-head core source, built public ESM/CJS and serialized SpecStream', 'method': '1251 bounded cases and public-export replay, with exact source-map/bundle identity and scoped threat model', 'proxy_only': False}, 'proxy_challenge': {'proxy': 'A helper rejected one unsafe path or a renderer returned normally.', 'counterexample': 'A legacy renderer directly assigns an element dictionary key, bypassing helper rejection while global prototypes remain unchanged.', 'attempted': True, 'outcome': 'separated', 'evidence': 'resumed-security/renderer-boundary-results.json SEC-004 distinguishes local dictionary behavior from cross-authority/global prototype impact.'}, 'substrates': [{'name': 'Core ESM/CJS and source in local disposable Node/Bun processes', 'status': 'exercised', 'evidence': 'resumed-security/boundary-results.json, identity-check.json and public-export-probe.json'}], 'evidence': report['security_review']['evidence']})
    if prop['id'] == 'P3':
        prop['evidence'] += ' Reconfirmed with immediate retries: resumed-resilience/traces-head-8.json#H01 versus traces-base-3.json#H01.'
    if prop['id'] == 'P5':
        prop['evidence'] += ' Reconfirmed with repetition: resumed-resilience/traces-head-8.json#P01 versus traces-base-3.json#P01.'
for finding in report['findings']:
    if finding['id'] in ['F1', 'F2']:
        finding['evidence'] += '; resumed-resilience/receipt.json and traces-head-8.json versus traces-base-3.json'
        finding['review_disposition'] = 'Confirmed again; remains open. No correction is authorized or implemented.'
report['findings'].append({'id': 'TS-3', 'priority': 'P2', 'state': 'confirmed', 'claim': 'The malformed copy-source test uses toEqual, which misses an extra own property whose value is undefined. Removing the copy source guard leaves all 203 focused authored tests green. The separate own-key assertion fails on that mutant and passes with the guard restored.', 'evidence': 'test-strength/receipt.json; test-strength/copy-survivor-results.json; test-strength/logs/copy-mutant-full-suite.log; test-strength/logs/copy-mutant-own-key.log; test-strength/logs/copy-restored-own-key.log', 'layer': 'authored regression-test strength, not a new runtime defect on restored head', 'source': 'test-strength', 'path': 'packages/core/src/types.test.ts:624', 'changed_location': {'path': 'packages/core/src/types.test.ts', 'line_start': 624, 'line_end': 624}, 'resolution': 'open', 'recommendation': 'When a fix cycle is authorized, assert absence with Object.hasOwn or strict equality and force-red by removing only the source guard.'})
reasons = {
    'Inverse regression surface': 'Saved base/head public hook comparison and failed Test Strength receipt reused. F1 and coverage survivor TS-3 remain; receipt is present, not missing.',
    'Substrate differential corpus': 'resumed-challenge executes 744 normative/product-attributed checks across built ESM/CJS plus 9042 preserved corpus assertions. No full Cartesian or RFC-compliance claim.',
    'Reference-implementation oracle': 'Independent normative expected outputs are frozen with RFC excerpts/hashes before imports. Two root-slash mismatches retained. Independent challenge-source obligation discharged, not all conformance obligations.',
    'Error-path forcing': 'resumed-resilience method complete: 28 executed partitions with retry/cleanup, six explicit gaps and six N/A; F1/F2 fail. Full production/browser guarantees remain unverified.',
    'Newly-asserted invariant ownership': 'F1/F2 reconfirm independent writers. SEC-004 records legacy element-dictionary rejection exception without demonstrated new authority; not a universal renderer security pass.'
}
for lens in report['lenses']:
    if lens['name'] in reasons:
        lens['reason'] = reasons[lens['name']]
for check in report['deterministic']:
    if check['check'] in ['style', 'surfaces', 'diff-check']:
        check['reason'] += '; rerun exit 0 in resumed-coordinator/checks.json'
    if check['check'] == 'exact-state':
        check['reason'] = 'resumed-coordinator/checks.json and pr-state.stdout revalidate unchanged base/head, clean target and 23 successful exact-head checks.'
    if check['check'] == 'covered':
        check['outcome'] = 'acknowledged'
        check['reason'] = 'covered exited 0, but recognizes the SHA-named directory and is not a content/pass gate. Exact report validator remains required.'
report['deterministic'].append({'check': 'specialist-receipt-integrity', 'outcome': 'pass', 'reason': 'Security schema validation exit 0; Resilience 216 checks exit 0 without overriding fail; challenge validation exit 0 with 37 source-map checks. Pre-integration receipt audits are preserved, not promotion tests.'})
report['issue_candidates'].extend([
    {'title': 'Legacy renderer element dictionary has a reserved-key rejection exception', 'evidence': 'resumed-security/security-receipt.json SEC-004 and renderer-boundary-results.json', 'why_out_of_scope': 'Classified as hardening/contract limitation, not a demonstrated new cross-authority vulnerability. Direct caller is unchanged; no fix or upstream issue created.'},
    {'title': 'Root-slash JSON Pointer behavior differs from RFC 6901 example', 'evidence': 'resumed-challenge/receipt.json retains both ESM/CJS mismatches with expected 0 and actual whole document', 'why_out_of_scope': 'Root aliases were explicitly excluded by inherited Test Strength model; no full RFC-conformance claim and no new regression attribution.'},
    {'title': 'Baseline failure and recovery limitations', 'evidence': 'resumed-resilience/receipt.json and report.txt: post-commit append retry, callback redelivery, stream dedupe and cancellation/resource observations', 'why_out_of_scope': 'Matched base controls or bounded observations, not introduced F1/F2-class regressions; real deployment/resource guarantees unverified.'}
])
report['outcome'].update({'runtime_interrupted': False, 'prior_runtime_interruption_preserved': True, 'resumption_complete': True, 'promotion': 'blocked; no fixes/publications authorized', 'review_rounds': report['outcome']['review_rounds'] + 1})

manifest['orchestration'].update({'execution_mode': 'native_subagent', 'degraded_from': 'fx_worker', 'independence_gap': provenance_gap, 'prior_operations': manifest['orchestration']['operations'], 'operations': execution['operations'], 'schema_failures': 0, 'receipt': str(OUT / 'resumption.json')})
manifest['stages']['resilience'].update({'status': 'fail', 'started_at': resilience['started_at'], 'finished_at': resilience['finished_at'], 'duration_ms': resilience['elapsed_ms'], 'evidence': [str(resilience_path), resilience['report_path']], 'reason': resilience['reason'], 'receipt_id': resilience['receipt_id'], 'fingerprint': resilience['fingerprint']})
manifest['stages']['security'] = {'status': 'pass', 'skill': 'security-review', 'skill_revision': security['fingerprint']['skill_revision'], 'head_sha': checks['head'], 'started_at': None, 'finished_at': now, 'duration_ms': None, 'evidence': [str(security_path), str(security_path.parent / 'receipt-validation.json')], 'reason': 'Scoped core JSON/API security claim supported; five nonmaterial limits and SEC-004 renderer exception retained. No overall promotion pass.', 'receipt_id': security['receipt_id'], 'fingerprint': security['fingerprint']}
review = manifest['stages']['review']
review.update({'status': 'fail', 'finished_at': now, 'duration_ms': None, 'evidence': [str(RUN / 'run-report.json'), str(RUN / 'run-report.md'), str(OUT / 'resumption.json'), str(OUT / 'report-validation.log')], 'reason': 'Verdict incomplete: Test Strength and Resilience failed; F1/F2/TS-3 open. Security receipt and normative independent challenge now complete; source fixes not authorized.', 'receipt_id': 'review-gate:json-render:336:de6a9bd:resumed-incomplete'})
review['fingerprint']['environment_digest'] = 'sha256:' + sha(OUT / 'environment.json')
review['fingerprint']['command'] = 'python3 resumed-coordinator/checks.py; python3 resumed-coordinator/integrate.py; python3 resumed-coordinator/verify-integration.py'
manifest['work_item'].setdefault('resumptions', []).append({'at': now, 'authorization': 'read-only', 'request': 'Resume from json-render-handoff.md, reuse saved evidence and complete documented review pending work', 'profile_unchanged': True, 'budget_escalation': None, 'note': 'User-requested resumed review session; interruption/wait time is not represented as active verification elapsed time.'})
manifest['outcome'].update({'status': 'incomplete', 'delivery': 'review_only', 'exact_head_reuse_count': manifest['outcome']['exact_head_reuse_count'] + 1, 'restarted_stages': ['review', 'resilience', 'security'], 'interrupted_stages': [], 'review_rounds': report['outcome']['review_rounds']})
manifest['close_cycle'].update({'handoff': 'pending resumed update', 'git': 'verified clean target; no source or branch changes', 'promotion': 'not authorized; review incomplete'})
manifest['updated_at'] = now
resumption = {'status': 'review_completed_with_blockers', 'verdict': 'incomplete', 'head': checks['head'], 'base': checks['base'], 'authorization': 'read-only', 'created_at': now, 'execution': execution, 'artifacts': {'security': str(security_path), 'resilience': str(resilience_path), 'challenge': str(challenge_path)}, 'stage_statuses': {'test_strength': 'fail', 'resilience': 'fail', 'security': 'pass', 'independent_challenge': 'satisfied'}, 'open_findings': ['F1', 'F2', 'TS-3'], 'saved_test_strength_unchanged': True, 'normalizations': ['Security confidence narratives moved to confidence_detail; five nonmaterial gaps retained as limitations, no evidence removed; prior receipt preserved.', 'Embedded Security artifact resolves to canonical receipt; original relative report path retained in source receipt.', 'Canonical renderer prints no for unknown model family and labels refuted properties verified. Generated view receives two deterministic display-only corrections; raw view preserved.'], 'archive': {name: str(OUT / (name + '.before')) for name in ['manifest.json', 'run-report.json', 'run-report.md', 'report-validation.log']}, 'audit_note': 'Specialist validators bind pre-integration aggregate metadata. Their captured validations remain evidence; verify-integration.py checks archived inputs and current product/receipt hashes after writeback.', 'source_changes': False, 'publications': False, 'ci': checks['ci']}
save(RUN / 'run-report.json', report)
save(RUN / 'manifest.json', manifest)
save(OUT / 'resumption.json', resumption)
render = subprocess.run(['bash', str(GATE), 'render', str(RUN / 'run-report.json'), str(OUT / 'run-report.raw.md')], cwd=TARGET, capture_output=True, text=True)
(OUT / 'render.log').write_text(render.stdout + render.stderr)
assert render.returncode == 0
view = (OUT / 'run-report.raw.md').read_text()
if report['provenance']['same_family'] is None:
    view = view.replace('- Same family: no', '- Same family: unknown; no cross-family independence claimed')
view = view.replace('## Verified properties', '## Property ledger (includes refuted claims)')
(RUN / 'run-report.md').write_text(view)
validation = subprocess.run(['bash', str(GATE), 'report', str(RUN / 'run-report.json')], cwd=TARGET, capture_output=True, text=True)
(OUT / 'report-validation.log').write_text(validation.stdout + validation.stderr)
resumption['report_validation'] = {'command': 'bash ' + str(GATE) + ' report ' + str(RUN / 'run-report.json'), 'cwd': str(TARGET), 'exit_code': validation.returncode, 'expected': '1: blocked promotion, not a passed review', 'artifact': str(OUT / 'report-validation.log')}
save(OUT / 'resumption.json', resumption)
print(json.dumps({'verdict': report['run']['verdict'], 'stage_statuses': resumption['stage_statuses'], 'report_validation_exit_code': validation.returncode, 'open_findings': resumption['open_findings']}, indent=2))
assert validation.returncode == 1
