# Review Gate: circuitkit

Date: 2026-09-27
Repository: circuitkit
Base: `3ec090185994b6f93d086c5a2f060e7f4ef8fdad`
Head: `327916f472096b07180f049d6d18cd63962096fc`
Profile: high-risk
Skill revision: `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`
Verdict: pass

## Execution

- Mode: sequential_isolated
- Runtime receipt: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/circuitkit/2026-09-27-mcp-images/codex-review-receipt.json
- Degraded from: fx_worker
- Schema failures: 1
- Independence gap: Isolated read-only reviewer is same OpenAI model family after FX auth capability failure. Model cross-family independence is unavailable; independent challenge is instead supplied by the separately maintained official SDK consumer, real browser producer, filesystem fault corpus and explicit contract oracle.

## Contract

- Path: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/circuitkit/2026-09-27-mcp-images/contract.md
- Spec status: pass
- Acceptance reviewed: A1, A2, A3, A4, A5, A6, A7

## Stage receipts

- Test Strength: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Real stdio, installed Node executable and browser producer; 2530 full tests, 27 MCP cases, 30 browser checks. Isolated compiled mutants are killed at the intended assertions.
- Resilience Audit: pass at `git:77fdde3e8d7e13b7c27c7660f7c15619839e38af`. Forced invalid input, dependency refusal, host rejection, cancellation and recovery at actual ownership boundaries. Render tools have no durable writes; optional audit append is caller configured and non-fatal.
- Security Review: pass

## Verified properties

- P1: Default tool returns exactly one PNG and no UI template or widget payload in all negotiated modes. /Users/raillyhugo/Programming/railly/circuitkit-mcp-apps/artifacts/mcp-image-first/installed-package.json
- P2: Explicit explorer advertises resource and falls back to PNG without correct HTML MIME. /Users/raillyhugo/Programming/railly/circuitkit-mcp-apps/artifacts/mcp-image-first/mutations/receipt.json
- P3: Invalid input and PNG failures return clean errors and allow recovery. /Users/raillyhugo/Programming/railly/circuitkit-mcp-apps/artifacts/mcp-image-first/installed-package.json
- P4: Drawing selection emits actual selected identity, and explicit explanation carries it. /Users/raillyhugo/Programming/railly/circuitkit-mcp-apps/artifacts/mcp-image-first/browser/receipt.json
- P5: Image-first host removes widget; cancellation/errors clear stale drawing/context; user can recover. /Users/raillyhugo/Programming/railly/circuitkit-mcp-apps/artifacts/mcp-image-first/browser/receipt.json

## Deterministic checks

- `build`: pass. artifacts/mcp-image-first/build.log
- `typecheck`: pass. artifacts/mcp-image-first/typecheck.log; TS2345 fixed
- `full tests`: pass. 2530 pass, 21 existing skips, 0 fail
- `build:web`: pass. 32 static pages; artifacts/mcp-image-first/web-build.log
- `scoped Biome`: pass. 14 changed code files pass
- `style`: pass. style.log
- `surfaces`: pass. surfaces.log with actual MCP surface map
- `callers`: pass. all prepareCircuit/createCircuitServer callers in diff
- `siblings`: pass. three literal keyword sweeps pass
- `diff check`: pass. git diff --cached --check passed before commit; clean worktree after commit
- `installed package`: pass. 13 consumer checks, including renderer failure/restart
- `global Biome`: acknowledged. Two base errors in brand/mark.svg and public/brand-assets/assets.json, plus existing app/globals.css warning. Byte-identical base/current proof at artifacts/mcp-apps/baseline-lint-files.json.
- `post-mutation browser repeat`: pass. 30 of 30 checks passed again on original built resource; browser-restored/receipt.json
- `remote exact-head CI`: pass. GitHub run 36354651103: Node 20/24 verify pass; Vercel preview and Preview Comments success. Head 327916f472096b07180f049d6d18cd63962096fc.

## Judgment lenses

- Inverse regression surface (promoted): skipped. No existing matcher/parser is replaced.
- New-domain matrix (promoted): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Resolution-rule consistency across consumers (promoted): skipped. No existing resolution rule is deepened.
- Shell re-parse append domain (candidate): skipped. No shell string construction; subprocesses use argument arrays.
- Emission channel and one-shot latch reachability (candidate): skipped. No one-shot latch.
- Shim hermeticity (candidate): skipped. No executable shim.
- Deliberate-default check (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Fresh-seam scan (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Substrate differential corpus (promoted): skipped. No cross-platform detector or filesystem semantics change. Node matrix delegated to repo CI.
- Reference-implementation oracle (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- New-failure-outcome propagation (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Flag-propagation dispatch sweep (candidate): skipped. No new CLI dispatch flag.
- Error-path forcing (promoted): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Non-destructive recovery (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Cancellation and timeout hygiene (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Boundary pipeline trace (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Substrate verification (promoted): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Dogfood the built artifact (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Newly-asserted invariant ownership (candidate): skipped. No takeover of an existing mutable global invariant.
- Docs-behavior parity (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Demonstrative example (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Choice audit (candidate, needs a decision trail to fire): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.
- Complexity budget (candidate): run. Reviewed MCP server, consumer/view ownership, package boundary and docs in isolated reviewer plus applicable proof receipts.

## Findings

- F1: confirmed, fixed. test.each infers readonly MIME arrays incompatible with mutable connect signature Evidence: /Users/raillyhugo/Programming/railly/skills/foundry/runs/review-gate/circuitkit/2026-09-27-mcp-images/codex-review.md; final artifacts/mcp-image-first/typecheck.log

## Gaps

None.

## Limits and provenance

- Author model: GPT-6 Codex
- Reviewer model: openai/gpt-5.5 via isolated Codex CLI (configured model)
- Same family: yes
- Independent challenge: satisfied. The installed Node executable was consumed through a separately maintained official SDK. Protocol decoder and real browser iframe transport observed results and effects. Native PNG and audit writes were refused on disposable filesystem, then repaired and retried. Five server mutants and one actual browser context call-site mutant were rejected by contract assertions. This is reference-consumer evidence, not cross-family reviewer evidence.
