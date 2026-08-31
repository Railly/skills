# Review Gate run report schema v1

Author one JSON report under `foundry/runs/review-gate/`. Generate its Markdown view with:

```bash
scripts/gate.sh render <run-report.json> <run-report.md>
scripts/gate.sh report <run-report.json>
```

The JSON is the source of truth. Do not edit the generated prose separately.

## Top-level contract

| Field | Required content |
|---|---|
| `schemaVersion` | `1` |
| `run` | date, repository, base, exact head, profile, executing skill revision, status, verdict, gaps |
| `execution` | runtime mode, local FX receipt when applicable, degraded source, independence gap, schema-failure count, operation records |
| `contract` | Issue Contract path, separate Spec status, reviewed acceptance IDs, gaps |
| `provenance` | author model, reviewer model, same-family flag |
| `risk` | standard or high classification and independent challenge |
| `security_review` | exact-state Security Review receipt when the security trigger applies |
| `claim_inventory` | exactly contract, design, user-facing, and implementation |
| `properties` | direct proof ledger for every material changed property |
| `stage_receipts` | Test Strength and Resilience Audit receipts or explicit non-trigger reasons |
| `assumptions` | every carried assumption with verified evidence |
| `lenses` | every selected catalog lens as run or skipped with reason |
| `deterministic` | each applicable check and its outcome |
| `findings` | confirmed, unverified, refuted, exempted, or issue-candidate records |
| `exemptions` | one-sentence evidence for each cleared absence |
| `issue_candidates` | real defects deliberately kept outside the diff |

Use [the maintained fixture](../evals/run-report-example.json) as the complete shape.

## Profiles

- `mechanical`: exact identity, applicable deterministic checks, narrow proof, one focused review.
- `standard`: claim inventory, triggered receipts and lenses, real-boundary proof.
- `high-risk`: full proof ledger and an independent challenge. Test Strength and Resilience receipts are required when their triggers apply.
- `external-pr`: standard or high-risk obligations plus built-artifact dogfood before authored tests are trusted.

The profile belongs to the work-item manifest. Escalate its default wall-time budget only when new evidence exposes a new risk.

## Orchestration circuit breaker

`execution.operations[]` records one logical operation each, including `attempted_calls`. A schema or capability failure may occur at most once per operation and three times per turn. `identical_retry` must be `false`.

Fallback order:

1. FX worker through `scripts/run-fx-review.mjs`;
2. native subagent;
3. visible Herdr worker;
4. sequential isolated pass;
5. unavailable.

Record `mode`, `degraded_from`, and `independence_gap`. Sequential isolation does not satisfy a high-risk independent challenge by itself.

When `execution.mode=fx_worker`, `execution.receipt` must point to the wrapper's local JSON artifact. The gate verifies `runtime=fx_worker`, `provider=vercel-ai-gateway`, `auth=AI_GATEWAY_API_KEY`, `credential_source=macos-keychain`, successful completion, and no timeout. Never use Cursor or `cursor-agent` as a Review Gate fallback.

Pass `--timeout-ms` from the work item's remaining review-stage wall-time budget. The wrapper writes a failed receipt even when FX exits non-zero, times out, exceeds its output buffer, or emits partial non-JSON output.

## Stage receipts

Review Gate consumes, but does not recreate:

- `stage_receipts.test_strength`, containing behavioral dimensions, exclusions, independent oracle, real producer, and fix-absent falsification;
- `stage_receipts.resilience`, containing commit points, later fallible stages, forced failure partitions, cleanup owners, and immediate retry evidence.

Every passing receipt records:

- `skill_revision`;
- a local artifact;
- evidence;
- a fingerprint with head, changed-path digest, contract digest, command, environment digest, skill revision, and relevant paths.

A receipt from an older head is valid only with `reusable: true`, human-readable `reuse_evidence`, and a `reuse` record whose source and target heads match. The later changed paths must not intersect any relevant path, while contract, environment, and skill revision stay identical. Final exact-head verification still runs.

Do not also author legacy `behavioral_strength` or `side_effects` blocks. Their evidence belongs to the two stage receipts.

## Security receipt

Security-sensitive work requires `security_review`. Its fingerprint records repository, base SHA, head SHA, dirty digest, changed-path digest, and Security Review revision. A pass requires no unresolved security blocker or verification gap. Hardening and routed non-security defects remain visible without becoming security blockers.

## Pass semantics

A pass requires:

- `run.status: complete`, `run.verdict: pass`, and no run or contract gaps;
- the report head matching the checkout head outside structural fixture mode;
- an exact executing `skill_revision`;
- all material properties verified directly, with proxy challenges and exercised substrates;
- all assumptions verified;
- current or validly reused required receipts;
- a current passing Security Review receipt whenever the security trigger applies;
- every triggered check and lens disposition recorded;
- no open confirmed or unverified finding;
- a durable local independent-challenge artifact for high-risk work.

Missing environments, failed specialist runtimes, stale receipts, and unresolved independence are gaps. They never become passes through prose.
