# Review Gate: vercel-labs/ai-cli

Date: 2026-10-15
Repository: vercel-labs/ai-cli
Base: `origin/main`
Head: `7359a87`
Profile: standard
Skill revision: `git:8d38570`
Verdict: pass

## Execution

- Mode: native_subagent
- Runtime receipt: none
- Degraded from: fx_worker
- Schema failures: 0
- Independence gap: FX wrapper keychain item 'Vercel AI Gateway' absent; reviewer was a Claude Sonnet subagent, same family as the author

## Contract

- Path: https://github.com/vercel-labs/ai-cli/pull/108
- Spec status: not_applicable
- Acceptance reviewed: none

## Stage receipts

- Test Strength: not_triggered. standard profile; no lifecycle or state-machine contract
- Resilience Audit: not_triggered. no durable commit points; single stateless request
- Security Review: missing

## Verified properties

- P1: Jev judges image content passed with --images Live runs on 2026-10-15.
- P2: Existing text and JSON decide behavior is unchanged Reviewer diffed SDK result shape across versions.
- P3: Blank stdin is ignored when images are given Found by this gate, fixed in d9070b1.

## Deterministic checks

- `style`: pass
- `surfaces`: finding-fixed. cli.test.ts flag inventory now lists --images; docs-site routing surfaces unaffected because no pages were added or renamed
- `timings`: pass
- `typecheck/lint/format/test`: pass. 308 + 20 tests

## Judgment lenses

- contract-drift: run
- docs-claims: run
- dependency-upgrade: run
- security: skipped. local CLI; URL fetch is user-supplied and guarded by the SDK; no auth or secrets touched

## Findings

- F1: confirmed, fixed. Blank stdin plus images errored Evidence: echo | ai decide -i x failed live
- F2: confirmed, fixed. Flag inventory test missed --images Evidence: gate surfaces
- F3: confirmed, fixed. Docs claimed all http(s) URLs work; SDK rejects localhost and private hosts Evidence: reviewer ran -i http://localhost:1/a.png
- F4: confirmed, fixed. Order, JSON+image and data URL paths untested Evidence: reviewer
- F5: confirmed, fixed. Gateway endpoint moved to /decision-model; custom proxies on the old path break Evidence: gateway 4.0.101 vs 4.0.112 sources

## Gaps

None.

## Limits and provenance

- Author model: claude-opus-5.5
- Reviewer model: claude-sonnet-5.5
- Same family: yes
- Independent challenge: satisfied. Subagent read SDK dist sources and ran tests; no P0-P2, four P3 handled.
