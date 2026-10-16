# Review Gate: crafter-station/badge-studio

Date: 2026-09-18
Repository: crafter-station/badge-studio
Base: `11f7abaed7f2ba6afae621077f2aacc0fce9d0bb`
Head: `11f7abaed7f2ba6afae621077f2aacc0fce9d0bb`
Profile: mechanical
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: pass

## Execution

- Mode: single_context
- Runtime receipt: none
- Degraded from: none
- Schema failures: 0
- Independence gap: Mechanical profile uses one focused self-review; no independent review is claimed or required.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/badge-studio-2026-09-18-noche-catalog/contract.md
- Spec status: pass
- Acceptance reviewed: P1, P2, P3

## Stage receipts

- Test Strength: not_triggered. This slice adds catalog/sample data and guidance; no parser, protocol, lifecycle, or adapter logic changed.
- Resilience Audit: not_triggered. No new external write, storage or cleanup mechanism; the capture script only derives its existing source selection from the gallery list.
- Security Review: missing

## Verified properties

- P1: The approved Noche Abierta composition is discoverable and editable in the local catalog without replacing a visitor identity. Exact saved-document comparison (45 layers), catalog participant assertions, desktop and 390px gallery captures, and editor-state inspection in v20-community.
- P2: The 0.2.1 tarball exposes all 18 styles and three bundled guides without requiring Bun at runtime. catalog-package-final.log: clean npm install, cold npx, alias, 18 create/validate round trips, overwrite rejections, doctor, and loopback preview on Node 24.18.0 with Bun unavailable.
- P3: The bundled design guide describes actual name-fitting behavior and directs the agent to verify both faces and real downloads. design-text.ts reviewed; seven Órbita cases rendered on both faces, seven actual PNG QR decodes; downloads checked on disk. The wide hyphenated surname initially broke inside the word and rendered intact after using a narrower supported font.

## Deterministic checks

- `style`: pass. gate.sh all on 11f7aba includes staged changes.
- `surfaces`: pass. No changed WebMCP contract; all catalog count surfaces inspected.
- `Biome`: pass. 201 files; catalog-final-check-2.log.
- `types and full build`: pass. catalog-build.log and prior typecheck on identical runtime source; later changes only guide and README prose.
- `tests`: pass. 157 tests and 14,380 assertions; final CLI rebuild 8 tests, 183 assertions.
- `cold npm consumer`: pass. catalog-package-final.log on exact final tarball.
- `tree identity`: pass. Staged tree a104073ee2e0766d60282840068cd2d4dbf18ed6; no unstaged or untracked source. Full source archive and patch preserved in /Users/raillyhugo/Programming/crafter-station/badge-studio-artifacts/v20-community.

## Judgment lenses

- Inverse regression surface (promoted): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- New-domain matrix (promoted): run. Focused review and direct browser/package evidence in focused-review.md.
- Resolution-rule consistency across consumers (promoted): run. Focused review and direct browser/package evidence in focused-review.md.
- Shell re-parse append domain (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Emission channel and one-shot latch reachability (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Shim hermeticity (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Deliberate-default check (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Fresh-seam scan (candidate): run. Focused review and direct browser/package evidence in focused-review.md.
- Substrate differential corpus (promoted): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Reference-implementation oracle (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- New-failure-outcome propagation (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Flag-propagation dispatch sweep (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Error-path forcing (promoted): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Non-destructive recovery (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Cancellation and timeout hygiene (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Boundary pipeline trace (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Substrate verification (promoted): run. Focused review and direct browser/package evidence in focused-review.md.
- Dogfood the built artifact (candidate): run. Focused review and direct browser/package evidence in focused-review.md.
- Newly-asserted invariant ownership (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Docs-behavior parity (candidate): run. Focused review and direct browser/package evidence in focused-review.md.
- Demonstrative example (candidate): run. Focused review and direct browser/package evidence in focused-review.md.
- Choice audit (candidate, needs a decision trail to fire): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.
- Complexity budget (candidate): skipped. No corresponding mechanism changes in this mechanical catalog and guide slice.

## Findings

None.

## Gaps

None.

## Limits and provenance

- Author model: gpt-6-astra
- Reviewer model: gpt-6-astra
- Same family: yes
- Independent challenge: not satisfied. Mechanically determined catalog addition; no authority, protocol or persistence mechanism changed.
