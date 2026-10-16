import hashlib
import json
import pathlib
import re
import subprocess
from datetime import datetime, timezone

root = pathlib.Path(__file__).parent
checkout = pathlib.Path('/tmp/portless-review-424-fad78e9c')
skills = pathlib.Path('/Users/raillyhugo/Programming/railly/skills')
head = 'fad78e9c5e3f1958558eca616d747313e4d4ba60'
base = '1ad573bb95810daf6cd50c1718707015450f3f09'
revision = 'git:77fdde3e8d7e13b7c27c7660f7c15619839e38af'
def cmd(*args, cwd=checkout):
    return subprocess.check_output(args, cwd=cwd, text=True)
def load(name):
    return json.loads((root / name).read_text())
def save(name, value):
    target = root / name
    temporary = target.with_suffix(target.suffix + '.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(target)
assert cmd('git', 'rev-parse', 'HEAD').strip() == head
assert not cmd('git', 'status', '--porcelain=v1', '--untracked-files=all')
changed = cmd('git', 'diff', '--name-only', base, head)
changed_digest = 'sha256:' + hashlib.sha256(changed.encode()).hexdigest()
pr = json.loads(cmd('gh', 'pr', 'view', '424', '--repo', 'vercel-labs/portless', '--json', 'title,body,headRefOid,baseRefOid,state,mergeStateStatus,reviewDecision,statusCheckRollup'))
assert pr['headRefOid'] == head
save('github-final.json', pr)
impact = cmd('radius', 'impact', '--base', base, '--root', str(checkout), '--top', '30')
(root / 'impact-map.json').write_text(impact)
test = load('test-strength/stage-receipt.json')
resilience = load('resilience/stage-receipt.json')
security = load('security/security-receipt.json')
security['artifact'] = str(root / 'security/security-receipt.json')
gaps = [
    'Required Test Strength receipt has gaps: four representative mutants survive the selected committed tests. Scratch-only probes kill them but do not add regression coverage to this PR.',
    'Required Resilience receipt has gaps: actual elevated child execution, Linux/Windows fault injection, live daemon/route producers and concurrent real filesystem writers were not exercised. Remote Linux/Windows CI is green but is not those fault-injection campaigns.',
    'Separate native reviewers were used after the FX wrapper rejected its status response (unsupported auth mode: missing). Cross-family independence is unverified; author model is unknown.',
    'No preexisting work-item manifest or formal issue/design contract was found. This manifest is materialized after specialist execution; stage-local contract/environment digests remain preserved rather than falsely presented as a shared pre-run fingerprint.',
    'P3 F1 remains open: stronger no-stale-entries success wording is false for an orphaned managed block. Underlying parser behavior predates this PR.'
]
contract = {
    'source': 'https://github.com/vercel-labs/portless/pull/424',
    'basis': 'PR body and changed README, CLI help, command docs and agent skill. No linked issue or separate design specification supplied.',
    'acceptance': {
        'A1': 'An initial hosts-file read failure prevents writes and returns failure.',
        'A2': 'Readable empty content is distinct from an unreadable file.',
        'A3': 'Sync fails when its post-write hosts read fails or the managed block mismatches.',
        'A4': 'Manual zero-route sync reconciles valid managed blocks and reports errors through existing privilege/error paths.',
        'A5': 'getManagedHostnames stays best-effort on read failure.',
        'A6': 'Docs and success text accurately describe the supported cleanup scope.'
    },
    'non_goals': ['Transactional/atomic whole-file writes', 'Malformed-block parser repair', 'Route-store error semantics', 'Privilege redesign', 'Actual system hosts mutation during review']
}
save('contract.json', contract)
contract_digest = 'sha256:' + hashlib.sha256((root / 'contract.json').read_bytes()).hexdigest()
properties = []
for pid, claim, evidence, counterexample in [
    ('P1', contract['acceptance']['A1'], 'resilience/evidence.json initial-read cells: zero writes and byte equality; test-strength initial-source, initial-built, cleanup-source and cleanup-built mutants killed.', 'Base populated sync attempts a write after a failed initial read, whereas head does not.'),
    ('P2', contract['acceptance']['A2'], 'Readable-empty fixture succeeds; falsey-initial-source mutant is killed. Empty content and unreadability use separate observed cases.', 'Replacing the null guard with a falsey guard rejects readable empty files.'),
    ('P3', contract['acceptance']['A3'], 'Post-read failure cells exit 1 for empty/populated routes. Predicate-skipping mutants killed; empty mismatch survivor exposed with a scratch regression.', 'Treating null verification as empty returns false success for an empty desired set.'),
    ('P4', contract['acceptance']['A4'], 'Valid stale blocks removed with unrelated fixture mappings retained; immediate retries recorded, sudo failure/success stub paths observed.', 'A successful CLI exit alone is insufficient: wrong-argument mutant passes the empty-route authored tests but fails populated scratch probe.'),
    ('P5', contract['acceptance']['A5'], 'hosts.test.ts and independent security differential corpus retain [] for unreadable best-effort inspection; callers read in cli-utils.ts and doctor.', 'Empty best-effort results cannot establish that a hosts file was read successfully; mutation functions now read independently.')
]:
    properties.append({'id': pid, 'claim': claim, 'kind': 'integrity', 'status': 'verified', 'oracle': {'observes': 'Disposable hosts bytes, I/O trace and CLI exit status, not success prose alone', 'layer': 'Built CLI with filesystem seam redirected to disk fixtures', 'method': 'Independent literal fixtures, forced failure, immediate retry, base comparison and mutation probes', 'proxy_only': False}, 'proxy_challenge': {'proxy': 'CLI success or green authored tests', 'counterexample': counterexample, 'attempted': True, 'outcome': 'separated', 'evidence': evidence}, 'substrates': [{'name': 'Darwin arm64 Node v24.18.0, redirected disposable filesystem; sudo stubbed', 'status': 'exercised', 'evidence': evidence}], 'evidence': evidence})
properties.append({'id': 'P6', 'claim': contract['acceptance']['A6'], 'kind': 'documentation', 'status': 'refuted', 'oracle': {'observes': 'Residual stale.localhost mapping after empty sync', 'layer': 'Built CLI plus fixture bytes', 'method': 'Orphan marker fixture, three immediate invocations', 'proxy_only': False}, 'proxy_challenge': {'proxy': 'No stale portless entries remain message', 'counterexample': 'No closing marker: function sees no parsed block, returns true, leaves stale mapping untouched', 'attempted': True, 'outcome': 'separated', 'evidence': 'resilience/evidence.json sync-orphan-0'}, 'substrates': [{'name': 'Built CLI with redirected disk fixture', 'status': 'exercised', 'evidence': 'Three exit-0 runs, one read and zero writes per invocation; stale.localhost remains.'}], 'evidence': 'F1; parser defect at base too, stronger user-facing assertion is new.'})
run_lenses = {
    'New-domain matrix': 'Null vs empty read and zero/populated routes, post-read faults, root/nonroot paths exercised in specialist matrix.',
    'Shim hermeticity': 'Inspected Node preloads; captures prove interception; external processes/network blocked in independent pressure driver.',
    'Deliberate-default check': 'Base hosts code/comment already intends empty-route reconciliation; no unrelated default reversal.',
    'New-failure-outcome propagation': 'Read manual handlers, top-level clean, daemon sync/shutdown, syncHostsWithWarning and best-effort doctor/reportHostsSync callers. Manual CLI forced; daemon execution remains a named gap.',
    'Error-path forcing': 'Consumed Resilience commit-point/failure-partition receipt and Test Strength mutations.',
    'Substrate verification': 'Independent fixture bytes and call trace inspected; actual privileged OS substrate remains unverified.',
    'Dogfood the built artifact': '53 cells / 159 CLI executions before authored tests.',
    'Newly-asserted invariant ownership': 'Verification claim scoped to manual sync, not clean or transactionality; orphan wording yields F1.',
    'Docs-behavior parity': 'README, CLI help, skill and command docs aligned except F1. Historical/terse sibling mentions explicitly exempted.'
}
headings = re.findall(r'^### (.+?) \((?:promoted|candidate[^)]*)\)', (skills / 'skills/review-gate/references/gates.md').read_text(), re.M)
lenses = [{'name': name, 'status': 'run' if name in run_lenses else 'skipped', 'reason': run_lenses.get(name, 'Trigger absent: no new resolution rule, shell grammar, flag, timeout, protocol/reference reimplementation, cross-boundary feature, choice trail or per-element complexity change.')} for name in headings]
checks = [
    ('identity', 'git rev-parse HEAD; git status --porcelain=v1; gh pr view 424 --repo vercel-labs/portless --json headRefOid,baseRefOid,state,mergeStateStatus,reviewDecision,statusCheckRollup', 'Exact requested clean head; remote head unchanged, eight successful checks/statuses, REVIEW_REQUIRED.'),
    ('install', 'pnpm install --frozen-lockfile --ignore-scripts --filter portless...', 'Exit 0; 290 cached packages installed in isolated copy.'),
    ('build', 'pnpm --filter portless build', 'Exit 0; ESM and declarations built successfully.'),
    ('type-check', 'pnpm --filter portless type-check', 'Exit 0; tsc --noEmit.'),
    ('lint', 'pnpm exec eslint packages/portless/src/hosts.ts packages/portless/src/hosts.test.ts packages/portless/src/cli.ts packages/portless/src/cli.test.ts', 'Exit 0.'),
    ('format', 'pnpm exec prettier --check README.md apps/docs/src/app/commands/page.mdx packages/portless/src/hosts.ts packages/portless/src/hosts.test.ts packages/portless/src/cli.ts packages/portless/src/cli.test.ts skills/portless/SKILL.md', 'Exit 0; all matched files use Prettier code style, per target repo conventions.'),
    ('diff-check', 'git diff --check ' + base + ' HEAD', 'Exit 0.'),
    ('style', 'bash ' + str(skills / 'skills/review-gate/scripts/gate.sh') + ' style c7f38a6f33de1322ca628470be594d907da5aa71', 'Exit 0; PASS [style].'),
    ('surfaces', 'bash ' + str(skills / 'skills/review-gate/scripts/gate.sh') + ' surfaces ' + str(skills / 'cases/portless/conventions.md') + ' ' + base, 'Exit 0; PASS [surfaces].'),
    ('callers', 'bash ' + str(skills / 'skills/review-gate/scripts/gate.sh') + ' callers readHostsFile ' + base + ' packages/portless/src', 'Exit 0; all read helper callers in changed file. Public function callers separately enumerated/read.'),
    ('pressure', 'node resilience/pressure.mjs', 'Exit 0; 53 cells, 159 executions, no unexpected oracle failures; expected product failures retained.'),
    ('base-comparison', 'node resilience/compare-base.mjs', 'Exit 0; 144 base/head helper executions.'),
    ('test-strength', 'python3 test-strength/campaign.py baseline; python3 test-strength/campaign.py mutate; python3 test-strength/campaign.py gaps', 'Each orchestrator exit 0; 27 authored tests green twice; 18 mutants: 14 killed with intended exit 1 and four survivors; all four killed by scratch tests, final 33 green twice. Expanded commands and exact cwd/env in test-strength/commands.json.'),
    ('skill-identity', 'bun scripts/skills-doctor.mjs --installed skills --skill review-gate', 'Exit 0 from canonical skills checkout: exact-copy review-gate 77fdde3e8d7e source=clean.')
]
deterministic = [{'check': name, 'outcome': 'pass', 'command': command, 'reason': reason} for name, command, reason in checks]
deterministic += [
    {'check': 'covered (initial)', 'outcome': 'acknowledged', 'reason': 'Exit 1 expected before this run: no report for exact head. Historical reports were not reused.'},
    {'check': 'siblings', 'outcome': 'acknowledged', 'reason': 'Six passages/files flagged. Read evidence: README:487, commands:274 and SKILL:418 describe unchanged auto-sync warnings; SKILL:170 is a topical add-entry recommendation, not a full contract; landing page:114 describes unchanged warning/resolver behavior; changelog:47 is historical multi-TLD release prose; CLI untouched mentions are dispatch/standalone commands, not conflicting safety claims.'},
    {'check': 'non-triggered deterministic gates', 'outcome': 'acknowledged', 'reason': 'No retired flags/values, classifier narrowing, new timer, shell detector, new persistent production artifact, deepened resolver, executable or incompatible configuration example. Force-red covered by specialist receipt.'}
]
findings = [{'id': 'F1', 'state': 'confirmed', 'severity': 'P3', 'claim': 'Qualify the new empty-sync success assertion for malformed managed blocks.', 'evidence': 'routes=[] and hosts containing # portless-start / 127.0.0.1 stale.localhost without # portless-end: CLI exits 0, prints No stale portless entries remain, performs zero writes, leaves mapping. Three invocations reproduce; underlying parser/cleanup behavior at base is identical. Narrow wording or address recovery separately.', 'layer': 'CLI user-facing output', 'source': 'lens', 'path': 'packages/portless/src/cli.ts:2486-2488', 'resolution': 'open', 'artifact': 'resilience/evidence.json', 'code_regression': False}]
report = {
    'schemaVersion': 1,
    'run': {'date': '2026-09-14', 'repo': 'vercel-labs/portless', 'pr': 424, 'base': base, 'head': head, 'profile': 'external-pr', 'skill_revision': revision, 'status': 'incomplete', 'verdict': 'incomplete', 'gaps': gaps},
    'execution': {'mode': 'native_subagent', 'degraded_from': 'fx_worker', 'independence_gap': gaps[2], 'receipt': 'runtime-fallback.json', 'schema_failures': 1, 'operations': [{'operation': 'FX independent review wrapper', 'attempted_calls': 1, 'schema_failures': 1, 'identical_retry': False}, {'operation': 'Inspect available FX status once', 'attempted_calls': 1, 'schema_failures': 0, 'identical_retry': False}, {'operation': 'Native specialists', 'attempted_calls': 4, 'schema_failures': 0, 'identical_retry': False}]},
    'contract': {'path': str(root / 'contract.json'), 'spec_status': 'not_provided', 'acceptance_reviewed': list(contract['acceptance']), 'gaps': ['No separate Spec or design receipt; external PR claims reviewed directly.']},
    'provenance': {'author_model': 'unknown (ctate)', 'reviewer_model': 'native fx subagents, exact model not attested', 'same_family': True, 'note': 'Conservative same-family limitation among available reviewers; relationship to unknown author model cannot be established.'},
    'risk': {'level': 'high', 'triggers': ['system-file integrity', 'durable state', 'existing privileged retry paths'], 'independent_challenge': {'required': True, 'satisfied': False, 'method': 'substrate_corpus', 'artifact': 'security/independent-review.md', 'evidence': 'Separate-context reviews and independently specified filesystem corpus exist; neither cross-family nor full native privileged substrate independence is established.'}},
    'security_review': security,
    'claim_inventory': [{'source': source, 'location': location, 'status': status, 'properties': props, 'evidence': evidence} for source, location, status, props, evidence in [
        ('contract', 'contract.json and PR body', 'reviewed', ['P1','P2','P3','P4','P5','P6'], 'Explicit acceptance derived from user-facing PR claims, no linked issue.'),
        ('design', 'No design supplied', 'not_provided', [], 'No manifest/design/issue reference found by exact PR lookup and xref.'),
        ('user_facing', 'README.md:489, commands/page.mdx:276, SKILL.md:420, cli.ts help and success output', 'reviewed', ['P1','P2','P3','P4','P6'], 'Canonical behavior passages examined and driven against built artifact.'),
        ('implementation', 'hosts.ts and cli.ts diff plus shared callers', 'reviewed', ['P1','P2','P3','P4','P5'], 'Guards and CLI wiring pressure-tested, base-compared and mutated in scratch copies.')]],
    'properties': properties,
    'stage_receipts': {
        'test_strength': {'required': True, 'status': 'fail', 'raw_status': test['status'], 'reason': gaps[0], 'skill_revision': revision, 'artifact': str(root / 'test-strength/stage-receipt.json'), 'evidence': test['verification_state']},
        'resilience': {'required': True, 'status': 'unavailable', 'raw_status': resilience['status'], 'reason': 'Method-complete passing receipt unavailable: ' + gaps[1], 'skill_revision': revision, 'artifact': str(root / 'resilience/stage-receipt.json'), 'evidence': '53 cells/159 CLI invocations and 144 base/head module executions; scoped guarantees preserved, limitations documented.'}
    },
    'assumptions': [{'id': 'A-PARSER', 'source': 'Inherited hosts parser', 'claim': 'Cleanup requires a well-formed managed block', 'status': 'verified', 'evidence': 'Malformed orphan fails user-facing universal assertion; limitation explicit in F1.'}, {'id': 'A-ENV', 'source': 'Review isolation', 'claim': 'Redirected filesystem and stubbed sudo are not full supported-OS privilege verification', 'status': 'verified', 'evidence': 'Preload and traces inspected; real OS paths remain named gaps.'}],
    'lenses': lenses, 'deterministic': deterministic, 'findings': findings,
    'exemptions': [{'claim': 'Do not block this targeted fix on inherited whole-file atomicity, clean verification or route-store empty-on-error behavior', 'evidence': 'resilience/base-comparison.json and security/independent-review.md demonstrate the same mechanisms at merge base; no in-scope new vulnerability established.'}, {'claim': 'Current main adds only turbo.jsonc support after PR base', 'evidence': 'git log HEAD..c7f38a6 reports #422 only; unrelated to hosts. Actual PR merge base used for source proof and final Impact Map.'}],
    'issue_candidates': [{'claim': 'Malformed block recovery, transactional hosts updates, cleanup write verification and unreadable route-store reconciliation are preexisting follow-ups.', 'evidence': 'resilience/base-comparison.json; no GitHub issues created.'}],
    'outcome': {'github_mutations': [], 'target_source_changes': [], 'remote_status': pr['mergeStateStatus'], 'review_decision': pr['reviewDecision'], 'external_findings': [], 'review_rounds': 1, 'human_corrections': [], 'escaped_finding_class': None, 'temporary_checkout': str(checkout), 'cleanup': 'Isolated review clone and scratch fixtures retained for reproduction. No worktree registration or background process created.'}
}
save('runtime-fallback.json', {'status': 'failed', 'command': 'bun skills/review-gate/scripts/run-fx-review.mjs --prompt-file reviewer-prompt.txt --output fx-review.json --cwd ' + str(checkout), 'exit_code': 1, 'message': 'ERROR fx reported unsupported auth mode: missing', 'capability_inspection': 'Normal fx status --json exposes auth, unlike the wrapper credential-isolated response. No credential contents recorded and no identical retry attempted.', 'fallback': 'native_subagent'})
save('run-report.json', report)
manifest = {'schema_version': 1, 'created_at': datetime.now(timezone.utc).isoformat(), 'work_item': {'source': contract['source'], 'repository': 'vercel-labs/portless', 'cwd': str(checkout), 'base_sha': base, 'main_sha': pr['baseRefOid'], 'head_sha': head, 'dirty_digest': 'clean', 'changed_paths_digest': changed_digest, 'contract_digest': contract_digest, 'authorization': 'review-only; isolated verification/artifacts, no source fixes or GitHub mutations', 'profile': 'external-pr', 'budget_minutes': None, 'budget_note': 'No user deadline or prior manifest budget supplied.'}, 'skill_revisions': {'review-gate': {'revision': revision, 'digest': 'git-tree:54c8a332dab0febea175fc4fc375785e8745e6c4', 'path': str(skills / 'skills/review-gate'), 'status': 'exact'}}, 'orchestration': report['execution'], 'stages': {'test_strength': {'status': 'fail', 'raw_status': test['status'], 'head_sha': head, 'artifact': str(root / 'test-strength/stage-receipt.json')}, 'resilience': {'status': 'unavailable', 'raw_status': resilience['status'], 'head_sha': head, 'artifact': str(root / 'resilience/stage-receipt.json')}, 'security': {'status': 'pass', 'head_sha': head, 'artifact': str(root / 'security/security-receipt.json'), 'scope': security['claim']['scope']}, 'review': {'status': 'incomplete', 'verdict': 'incomplete', 'head_sha': head, 'skill_revision': revision, 'artifact': str(root / 'run-report.json'), 'gaps': gaps}}, 'provenance_gap': gaps[3]}
save('manifest.json', manifest)
print(json.dumps({'head': head, 'verdict': report['run']['verdict'], 'report': str(root / 'run-report.json'), 'remote_checks': len(pr['statusCheckRollup']), 'lenses': len(lenses)}))
