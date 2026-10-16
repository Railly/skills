import copy
import hashlib
import json
import pathlib

root = pathlib.Path(__file__).resolve().parent
receipt = json.loads((root / 'security-receipt.json').read_text())
previous_path = root / 'security-receipt.v1.pre-schema-fix.json'
previous = json.loads(previous_path.read_text())
previous_validation = json.loads((root / 'receipt-validation.v1.pre-schema-fix.json').read_text())
assert hashlib.sha256(previous_path.read_bytes()).hexdigest() == previous_validation['receipt_sha256']
expected = copy.deepcopy(previous)
for observation in expected['observations']:
    detail = observation['confidence']
    observation['confidence'] = detail.split()[0]
    observation['confidence_detail'] = detail
original_gaps = previous['verification']['gaps']
assert all(isinstance(gap['material_to_stated_security_conclusion'], bool) for gap in original_gaps)
expected['verification']['gaps'] = [gap for gap in original_gaps if gap['material_to_stated_security_conclusion']]
expected['verification']['limitations'] = [gap for gap in original_gaps if not gap['material_to_stated_security_conclusion']]
assert receipt == expected, 'Only confidence normalization/detail preservation and the material/non-material partition may change'
assert len(receipt['observations']) == 5
assert len(receipt['verification']['limitations']) == 5
assert len({gap['id'] for gap in receipt['verification']['gaps'] + receipt['verification']['limitations']}) == len(original_gaps)
assert receipt['claim'] == previous['claim']
assert 'core' in receipt['claim']['scope']
assert any('Ordinary JSON' in assumption for assumption in receipt['claim']['assumptions'])
sec004 = next(observation for observation in receipt['observations'] if observation['id'] == 'SEC-004')
assert sec004['classification'] == 'hardening'
assert 'Broad all-renderer rejection contract is not satisfied' in sec004['chain']['impact']
assert 'not a universal renderer' in receipt['merge_relevance']['conclusion']
identity = json.loads((root / 'final-identity-check.json').read_text())
initial = json.loads((root / 'identity-check.json').read_text())
required = ['status', 'fingerprint', 'claim', 'trust_model', 'observations', 'verification', 'merge_relevance', 'artifact']
assert all(key in receipt for key in required)
assert receipt['status'] in ['pass', 'findings', 'incomplete']
for key in ['head_sha', 'base_sha', 'dirty_digest', 'changed_path_digest', 'contract_digest', 'skill_revision', 'skill_tree']:
    assert receipt['fingerprint'][key] == identity[key], key
for key in ['source_sha256', 'built_sha256', 'saved_evidence_sha256']:
    assert initial[key] == identity[key], key
classes = {'confirmed_vulnerability', 'likely_vulnerability', 'hardening', 'non_security_defect', 'informational', 'verification_gap'}
scopes = {'in_scope_security_regression', 'adjacent_security_blocker', 'out_of_scope_hardening', 'unrelated_bug'}
checked_paths = set()
for observation in receipt['observations']:
    assert observation['classification'] in classes
    assert observation['scope'] in scopes
    assert all(observation['chain'].get(key) for key in ['capability', 'reachability', 'control', 'boundary', 'impact'])
    assert observation['prerequisites'] and observation['evidence']
    assert observation['confidence'] in {'high', 'medium', 'low'}
    assert observation['confidence_detail'] == next(item['confidence'] for item in previous['observations'] if item['id'] == observation['id'])
    for path in observation['evidence']:
        assert (root / path).is_file(), path
        checked_paths.add(path)
assert receipt['status'] == 'pass'
assert not receipt['merge_relevance']['security_blockers']
assert isinstance(receipt['verification']['gaps'], list)
assert isinstance(receipt['verification']['limitations'], list)
assert all(gap['material_to_stated_security_conclusion'] is True for gap in receipt['verification']['gaps'])
assert all(item['material_to_stated_security_conclusion'] is False for item in receipt['verification']['limitations'])
assert receipt['verification']['gaps'] == [], 'Gate treats every remaining material gap as a blocker'
assert receipt['provenance']['independent_family_claimed'] is False
boundary = json.loads((root / 'boundary-results.json').read_text())
renderer = json.loads((root / 'renderer-boundary-results.json').read_text())
assert boundary['status'] == renderer['status'] == 'pass'
assert boundary['cases'] == 1251
assert len(renderer['observations']) == 6
assert all(row['global_prototypes_unchanged'] for row in renderer['observations'])
meta = json.loads((root / 'renderer-resolved-identity.json').read_text())
pinned = (root / 'hooks.resolved-head.ts').read_text()
assert hashlib.sha256(pinned.encode()).hexdigest() == meta['pinned_source_sha256']
restored = pinned
for a, b in meta['replacements'].items():
    restored = restored.replace(b, a)
assert 'sha256:' + hashlib.sha256(restored.encode()).hexdigest() == identity['source_sha256']['packages/react/src/hooks.ts']
assert (root / 'public-export-probe.mjs').read_bytes() == (root.parent / 'public-export-probe.mjs').read_bytes()
assert json.loads((root / 'public-export-probe.json').read_text())['status'] == 'pass'
assert (root / receipt['artifact']).is_file()
result = {'status': 'pass', 'exit_code': 0, 'validator': 'Local receipt-contract structural, classification, fingerprint and evidence-integrity assertions; not an official Review Gate promotion validator', 'head_sha': identity['head_sha'], 'security_status': receipt['status'], 'observations': len(receipt['observations']), 'core_cases': boundary['cases'], 'renderer_characterization_cases': len(renderer['observations']), 'target_clean': True, 'protected_evidence_unchanged': True, 'core_bundles_unchanged': True, 'receipt_sha256': hashlib.sha256((root / 'security-receipt.json').read_bytes()).hexdigest(), 'report_sha256': hashlib.sha256((root / receipt['artifact']).read_bytes()).hexdigest(), 'evidence_hashes': {path: hashlib.sha256((root / path).read_bytes()).hexdigest() for path in sorted(checked_paths)}}
assert result['evidence_hashes'] == previous_validation['evidence_hashes'], 'Review evidence must remain byte-identical'
assert result['report_sha256'] == previous_validation['report_sha256']
result.update({'validation_mode': 'metadata_only_no_probe_reruns', 'probes_rerun': False, 'identity_state_note': 'Target cleanliness and bundle identity fields describe the preserved prior identity evidence, not a new live target check.', 'confidence_enums_valid': True, 'confidence_details_preserved': True, 'material_gaps': len(receipt['verification']['gaps']), 'non_material_limitations': len(receipt['verification']['limitations']), 'all_original_limitations_preserved': True, 'conclusions_and_scope_unchanged': True, 'sec004_excludes_universal_renderer_pass': True, 'review_evidence_byte_identical': True, 'previous_receipt': previous_path.name, 'previous_receipt_sha256': previous_validation['receipt_sha256'], 'gate_rules_checked': 'validate-run-report.mjs:447-450 (empty gaps for pass), :485-487 (confidence enum); no full shared report validation or promotion verdict'})
(root / 'receipt-validation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: result[key] for key in ['status', 'exit_code', 'head_sha', 'security_status', 'observations', 'confidence_enums_valid', 'confidence_details_preserved', 'material_gaps', 'non_material_limitations', 'all_original_limitations_preserved', 'conclusions_and_scope_unchanged', 'sec004_excludes_universal_renderer_pass', 'review_evidence_byte_identical', 'probes_rerun']}))
